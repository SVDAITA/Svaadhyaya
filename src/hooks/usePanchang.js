import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import dayjs from 'dayjs'

const CACHE_KEY = 'sv_panchang_cache'

// ── COMPUTED FALLBACKS (used if API fields missing) ───────────────────────────

const MASAMS = [
  'Chaitra','Vaisakha','Jyeshtha','Ashadha',
  'Shravana','Bhadrapada','Ashwina','Kartika',
  'Margashirsha','Pushya','Magha','Phalguna',
]
const MASAM_REF  = new Date('2025-03-29T00:00:00Z') // Ugadi 2025 = Chaitra start
const SYNODIC    = 29.53059

function computeMasam() {
  const months = Math.floor((Date.now() - MASAM_REF.getTime()) / 86_400_000 / SYNODIC)
  return MASAMS[((months % 12) + 12) % 12]
}

function computeAyana() {
  const doy = dayjs().diff(dayjs().startOf('year'), 'day')
  return doy >= 14 && doy < 197 ? 'Uttarayana' : 'Dakshinayana'
}

function computeRitu() {
  const m = dayjs().month()
  if (m <= 1)  return 'Shishira'
  if (m <= 3)  return 'Vasanta'
  if (m <= 5)  return 'Grishma'
  if (m <= 7)  return 'Varsha'
  if (m <= 9)  return 'Sharad'
  return 'Hemanta'
}

const SAMVATSARA = [
  'Prabhava','Vibhava','Shukla','Pramoda','Prajapati','Angirasa',
  'Shrimukha','Bhava','Yuva','Dhatri','Ishvara','Bahudhanya',
  'Pramathi','Vikrama','Vrusha','Chitrabhanu','Svabhanu','Tarana',
  'Parthiva','Vyaya','Sarvajit','Sarvadhari','Virodhi','Vikrita',
  'Khara','Nandana','Vijaya','Jaya','Manmatha','Durmukhi',
  'Hevilambi','Vilambi','Vikari','Sharvari','Plava','Shubhakrit',
  'Shobhana','Krodhi','Vishvavasu','Parabhava','Plavanga','Kilaka',
  'Saumya','Sadharana','Virodhikrit','Paridhavi','Pramadicha','Ananda',
  'Rakshasa','Nala','Pingala','Kalayukti','Siddharthi','Raudra',
  'Durmati','Dundubhi','Rudhirodgari','Raktakshi','Krodhana','Akshaya',
]

// Ugadi dates (YYYY-MM-DD) — new samvatsara starts on these days
const UGADI_DATES = {
  2024: '2024-04-09',
  2025: '2025-03-30',
  2026: '2026-03-19',
  2027: '2027-04-07',
  2028: '2028-03-26',
  2029: '2029-04-14',
  2030: '2030-04-04',
}

function computeSamvatsara() {
  // VS 2083 (started Ugadi 2026) = Parabhava (index 39)
  const today = dayjs().format('YYYY-MM-DD')
  const year  = dayjs().year()

  // Count how many Ugadi transitions have passed since 2026
  let vsYear = 2083
  for (let y = 2026; y <= year + 1; y++) {
    const ugadi = UGADI_DATES[y]
    if (ugadi && today >= ugadi && y > 2026) vsYear = 2083 + (y - 2026)
  }

  return SAMVATSARA[((vsYear - 2044) % 60 + 60) % 60]
}

// ── NORMALIZER ────────────────────────────────────────────────────────────────

function normalizeResponse(json) {
  const { tithi, nakshatra, masam, samvat, ayana, ritu, varam } = json

  return {
    tithi:       tithi?.name                            || '—',
    paksha:      tithi?.paksha
                   ? tithi.paksha.charAt(0).toUpperCase() + tithi.paksha.slice(1) + ' Paksha'
                   : '—',
    tithiEnds:   tithi?.completes_at                   || null,

    nakshatra:   nakshatra?.name                       || '—',
    nakshatraEnds: nakshatra?.ends_at                  || null,

    masam:       masam?.lunar_month_name               || computeMasam(),
    masamFull:   masam?.lunar_month_full_name          || null,
    adhikaMasam: masam?.adhika === 1,

    samvatsara:  computeSamvatsara(),
    samvatYear:  samvat?.vikram_chaitradi_number       || null,

    ayana:       ayana?.aayanam                        || computeAyana(),

    ritu:        ritu?.ritu?.name
                   ? ritu.ritu.name.replace(/\s*\(.*?\)/, '') // strip "(Spring)" suffix
                   : computeRitu(),

    varam:       varam?.output?.vedic_weekday_name     || dayjs().format('dddd'),
  }
}

// ── HOOK ──────────────────────────────────────────────────────────────────────

export function usePanchang() {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  useEffect(() => {
    const fetchForDate = async (dateStr) => {
      try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
        if (cached.date === dateStr && cached.data) {
          setData(cached.data)
          setLoading(false)
          return
        }

        // Clear stale cache from a previous day
        if (cached.date && cached.date !== dateStr) {
          localStorage.removeItem(CACHE_KEY)
        }

        const { data: response, error: invokeError } = await supabase.functions.invoke('get-panchang', {
          body: { latitude: 17.3850, longitude: 78.4867 }
        })

        if (invokeError) throw new Error(invokeError.message)
        if (response?.error) throw new Error(response.error)

        const normalized = normalizeResponse(response)
        setData(normalized)
        localStorage.setItem(CACHE_KEY, JSON.stringify({ date: dateStr, data: normalized }))
      } catch (err) {
        console.error('Panchang error:', err.message)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    const today = dayjs().format('YYYY-MM-DD')
    fetchForDate(today)

    // Re-fetch when the tab becomes visible — catches midnight crossovers
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const currentDay = dayjs().format('YYYY-MM-DD')
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
        if (cached.date !== currentDay) {
          setLoading(true)
          fetchForDate(currentDay)
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return { data, loading, error }
}

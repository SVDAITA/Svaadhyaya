import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const BASE = 'https://json.freeastrologyapi.com'
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

let cachedDate = ''
let cachedPayload: unknown = null

// Unwrap { statusCode, output } envelope; output may be single or double JSON-encoded
function unwrap(json: any): any {
  if (!json) return null
  if ('output' in json) {
    let out = json.output
    // Keep parsing while still a string (handles double-encoding)
    while (typeof out === 'string') {
      try { out = JSON.parse(out) } catch { break }
    }
    return out
  }
  return json
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  try {
    const apiKey = Deno.env.get('FREE_ASTROLOGY_API_KEY')
    if (!apiKey) throw new Error('FREE_ASTROLOGY_API_KEY secret not set')

    const { latitude, longitude } = await req.json()

    const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    const todayIST = nowIST.toISOString().slice(0, 10)

    if (cachedDate === todayIST && cachedPayload) {
      return new Response(JSON.stringify(cachedPayload), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      })
    }

    const body = JSON.stringify({
      year:      nowIST.getFullYear(),
      month:     nowIST.getMonth() + 1,
      date:      nowIST.getDate(),
      hours:     nowIST.getHours(),
      minutes:   nowIST.getMinutes(),
      seconds:   nowIST.getSeconds(),
      latitude:  latitude  ?? 17.3850,
      longitude: longitude ?? 78.4867,
      timezone:  5.5,
      config: {
        observation_point: 'topocentric',
        ayanamsha: 'lahiri',
      },
    })

    const hdrs = {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    }

    const post = async (ep: string) => {
      try {
        const r = await fetch(`${BASE}/${ep}`, { method: 'POST', headers: hdrs, body })
        const json = await r.json()
        return unwrap(json)
      } catch {
        return null
      }
    }

    const [tithiRes, nakshatraRes, masamRes, samvatRes, ayanaRes, rituRes, varamRes] =
      await Promise.all([
        post('tithi-durations'),
        post('nakshatra-durations'),
        post('lunarmonthinfo'),
        post('samvatinfo'),
        post('aayanam'),
        post('rituinfo'),
        post('vedicweekday'),
      ])

    const response = {
      tithi: tithiRes ? {
        name:         tithiRes.name         ?? null,
        paksha:       tithiRes.paksha        ?? null,
        completes_at: tithiRes.completes_at  ?? null,
      } : null,
      nakshatra: nakshatraRes ? {
        name:    nakshatraRes.name    ?? null,
        ends_at: nakshatraRes.ends_at ?? null,
      } : null,
      masam: masamRes ? {
        lunar_month_name:      masamRes.lunar_month_name      ?? null,
        lunar_month_full_name: masamRes.lunar_month_full_name ?? null,
        adhika:                masamRes.adhika                ?? 0,
      } : null,
      samvat: samvatRes ? {
        vikram_chaitradi_year_name: samvatRes.vikram_chaitradi_year_name ?? null,
        vikram_chaitradi_number:    samvatRes.vikram_chaitradi_number    ?? null,
      } : null,
      ayana: ayanaRes ? {
        aayanam: ayanaRes.aayanam ?? null,
      } : null,
      ritu: rituRes ? {
        ritu: { name: rituRes.ritu?.name ?? null },
      } : null,
      // After unwrap, vedicweekday output = { weekday_name, vedic_weekday_name, ... }
      varam: varamRes ? {
        output: { vedic_weekday_name: varamRes.vedic_weekday_name ?? null },
      } : null,
    }

    cachedDate = todayIST
    cachedPayload = response

    return new Response(JSON.stringify(response), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})

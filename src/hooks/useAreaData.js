import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import dayjs from 'dayjs'

// Module-level cache keyed by area — survives re-renders and tab switches
// Shape: { [area]: { milestones, lakshyas, weeklyGoals, logs, weekStart } }
const _areaCache = {}

export function useAreaData(area) {
  const { user } = useAuth()
  const weekStart = dayjs().startOf('week').format('YYYY-MM-DD')

  // Check whether cache is warm for this area+week right now (before useState)
  const cached = _areaCache[area]
  const cacheWarm = !!(cached && cached.weekStart === weekStart)

  const [milestones,   setMilestones]   = useState(cached?.milestones  || [])
  const [lakshyas,     setLakshyas]     = useState(cached?.lakshyas    || [])
  const [weeklyGoals,  setWeeklyGoals]  = useState(cached?.weeklyGoals || [])
  const [logs,         setLogs]         = useState(cached?.logs        || [])
  const [loading,      setLoading]      = useState(!cacheWarm)

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return }
    // Early-return when cache is warm for this week — no spinner, no DB round-trip
    const c = _areaCache[area]
    if (c && c.weekStart === weekStart) return
    setLoading(true)

    const [{ data: ms }, { data: lk }, { data: wg }, { data: lg }] = await Promise.all([
      supabase.from('milestones').select('*').eq('user_id', user.id).eq('area', area).eq('active', true).order('created_at'),
      supabase.from('lakshyas').select('*, siddhis(*)').eq('user_id', user.id).eq('pillar', area).eq('status', 'active').order('created_at'),
      supabase.from('weekly_goals').select('*').eq('user_id', user.id).eq('area', area).eq('week_start', weekStart).order('created_at'),
      supabase.from('logs').select('*').eq('user_id', user.id).eq('area', area).order('created_at', { ascending: false }).limit(20),
    ])

    const data = {
      milestones:  ms || [],
      lakshyas:    lk || [],
      weeklyGoals: wg || [],
      logs:        lg || [],
      weekStart,
    }
    _areaCache[area] = data
    setMilestones(data.milestones)
    setLakshyas(data.lakshyas)
    setWeeklyGoals(data.weeklyGoals)
    setLogs(data.logs)
    setLoading(false)
  }, [user, area, weekStart])

  useEffect(() => { load() }, [load])

  // reload() is called after mutations — always busts cache then re-fetches
  const reload = useCallback(() => {
    delete _areaCache[area]
    load()
  }, [area, load])

  return { milestones, lakshyas, weeklyGoals, logs, loading, reload }
}

export function useHabitStreak(habitId) {
  const { user } = useAuth()
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    if (!user || !habitId) return
    const calc = async () => {
      const from = dayjs().subtract(365, 'day').format('YYYY-MM-DD')
      // Use day_date column
      const { data } = await supabase
        .from('days')
        .select('day_date, habits, disrupted')
        .eq('user_id', user.id)
        .gte('day_date', from)
        .order('day_date', { ascending: false })
      if (!data) return
      let s = 0
      for (const d of data) {
        if (d.disrupted || d.habits?.[habitId]) s++
        else break
      }
      setStreak(s)
    }
    calc()
  }, [user, habitId])

  return streak
}

export function useWeekCompletion(habitIds) {
  const { user } = useAuth()
  const [pct, setPct] = useState(0)

  useEffect(() => {
    if (!user || !habitIds?.length) return
    const calc = async () => {
      const from = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
      // Use day_date column
      const { data } = await supabase
        .from('days')
        .select('day_date, habits')
        .eq('user_id', user.id)
        .gte('day_date', from)
      if (!data) return
      let tot = 0, done = 0
      data.forEach(d => {
        habitIds.forEach(hid => {
          tot++
          if (d.habits?.[hid]) done++
        })
      })
      setPct(tot > 0 ? Math.round(done / tot * 100) : 0)
    }
    calc()
  }, [user, habitIds?.join(',')])

  return pct
}

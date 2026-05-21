import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Use functional update so if the same user refreshes their token (TOKEN_REFRESHED),
      // the object reference stays stable → prevents full component tree re-render on tab focus
      setUser(prev => {
        const next = session?.user ?? null;
        if (prev?.id && prev.id === next?.id) return prev;
        return next;
      });
      setLoading(false);
    })
    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); throw error }
    return data
  }

  const signUp = async (email, password, fullName) => {
    setError(null)
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } }
    })
    if (error) { setError(error.message); throw error }
    return data
  }

  const signOut = async () => {
    setError(null)
    const { error } = await supabase.auth.signOut()
    if (error) { setError(error.message); throw error }
  }

  const resetPassword = async (email) => {
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    if (error) { setError(error.message); throw error }
  }

  const updatePassword = async (newPassword) => {
    setError(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) { setError(error.message); throw error }
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, signIn, signUp, signOut, resetPassword, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

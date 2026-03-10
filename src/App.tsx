import { useEffect, useState } from 'react'
import { supabase } from './lib/supabase'
import type { User } from '@supabase/supabase-js'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null)
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="text-slate-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Login />
  }

  return <Dashboard />
}

export default App

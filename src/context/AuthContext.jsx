import { useEffect, useState } from 'react'
import { getAuthServices, isFirebaseConfigured } from '../lib/firebase'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined

    let active = true
    let unsubscribe

    getAuthServices()
      .then(({ auth, onAuthStateChanged }) => {
        if (!active) return
        unsubscribe = onAuthStateChanged(auth, (nextUser) => {
          setUser(nextUser)
          setLoading(false)
        })
      })
      .catch((error) => {
        console.error('Firebase authentication initialization failed:', error)
        if (active) setLoading(false)
      })

    return () => {
      active = false
      unsubscribe?.()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

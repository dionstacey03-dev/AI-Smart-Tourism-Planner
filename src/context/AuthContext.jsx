import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'

const AuthContext = createContext({ user: null, loading: false })

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!auth) return undefined

    return onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)
    })
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

import { signInWithPopup, signOut } from 'firebase/auth'
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase'
import { useAuth } from '../context/AuthContext'
import './AuthButton.css'

export default function AuthButton() {
  const { user, loading } = useAuth()

  async function handleClick() {
    if (!auth) return
    try {
      if (user) await signOut(auth)
      else await signInWithPopup(auth, googleProvider)
    } catch (error) {
      console.error('Authentication failed:', error)
      window.alert(error.message || 'Unable to complete sign-in.')
    }
  }

  return (
    <button
      type="button"
      className="authButton"
      onClick={handleClick}
      disabled={!isFirebaseConfigured || loading}
      title={!isFirebaseConfigured ? 'Configure Firebase to enable sign-in' : undefined}
    >
      {loading ? 'Loading…' : user ? 'Sign out' : 'Sign in'}
    </button>
  )
}

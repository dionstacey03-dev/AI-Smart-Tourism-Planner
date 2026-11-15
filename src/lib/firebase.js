import { getApp, getApps, initializeApp } from 'firebase/app'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const requiredConfig = ['apiKey', 'authDomain', 'projectId', 'appId']
export const isFirebaseConfigured = requiredConfig.every((key) => Boolean(firebaseConfig[key]))

const app = isFirebaseConfigured
  ? (getApps().length ? getApp() : initializeApp(firebaseConfig))
  : null

let authServicesPromise
let firestoreServicesPromise

export function getAuthServices() {
  if (!app) return Promise.reject(new Error('Firebase is not configured yet.'))

  authServicesPromise ??= import('firebase/auth').then((services) => ({
    auth: services.getAuth(app),
    googleProvider: new services.GoogleAuthProvider(),
    onAuthStateChanged: services.onAuthStateChanged,
    signInWithPopup: services.signInWithPopup,
    signOut: services.signOut,
  }))

  return authServicesPromise
}

export function getFirestoreServices() {
  if (!app) return Promise.reject(new Error('Firebase is not configured yet.'))

  firestoreServicesPromise ??= import('firebase/firestore').then((services) => ({
    db: services.getFirestore(app),
    addDoc: services.addDoc,
    collection: services.collection,
    deleteDoc: services.deleteDoc,
    doc: services.doc,
    getDocs: services.getDocs,
    orderBy: services.orderBy,
    query: services.query,
    serverTimestamp: services.serverTimestamp,
    where: services.where,
  }))

  return firestoreServicesPromise
}

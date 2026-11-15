import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

const tripsCollection = 'trips'

function requireDatabase() {
  if (!db) throw new Error('Firebase is not configured yet.')
  return db
}

export async function saveTrip(userId, itinerary) {
  const database = requireDatabase()
  if (!userId) throw new Error('Sign in before saving a trip.')

  const reference = await addDoc(collection(database, tripsCollection), {
    userId,
    itinerary,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return reference.id
}

export async function getSavedTrips(userId) {
  const database = requireDatabase()
  if (!userId) return []

  const tripsQuery = query(
    collection(database, tripsCollection),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(tripsQuery)

  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export async function deleteSavedTrip(userId, tripId) {
  const database = requireDatabase()
  if (!userId || !tripId) throw new Error('A signed-in user and trip are required.')

  await deleteDoc(doc(database, tripsCollection, tripId))
}

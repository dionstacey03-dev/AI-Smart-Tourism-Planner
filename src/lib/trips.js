import { getFirestoreServices } from './firebase'

const tripsCollection = 'trips'

export async function saveTrip(userId, itinerary) {
  if (!userId) throw new Error('Sign in before saving a trip.')

  const {
    db, addDoc, collection, serverTimestamp,
  } = await getFirestoreServices()

  const reference = await addDoc(collection(db, tripsCollection), {
    userId,
    itinerary,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return reference.id
}

export async function getSavedTrips(userId) {
  if (!userId) return []

  const {
    db, collection, getDocs, orderBy, query, where,
  } = await getFirestoreServices()

  const tripsQuery = query(
    collection(db, tripsCollection),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
  )
  const snapshot = await getDocs(tripsQuery)

  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export async function deleteSavedTrip(userId, tripId) {
  if (!userId || !tripId) throw new Error('A signed-in user and trip are required.')

  const { db, deleteDoc, doc } = await getFirestoreServices()
  await deleteDoc(doc(db, tripsCollection, tripId))
}

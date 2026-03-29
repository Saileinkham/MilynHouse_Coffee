// ─────────────────────────────────────────────────────
//  🔥 กรอก Firebase config ของคุณที่นี่
//  สร้างได้ฟรีที่ https://console.firebase.google.com
//  ดูวิธีใน README.md
// ─────────────────────────────────────────────────────
import { getApp, getApps, initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const hasAllConfig = Object.values(firebaseConfig).every(
  (v) => typeof v === 'string' && v.trim().length > 0,
)

function getOrInitApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig)
}

export const auth = (() => {
  if (!hasAllConfig) return null
  try { return getAuth(getOrInitApp()) } catch { return null }
})()

export const db = (() => {
  if (!hasAllConfig) return null
  try { return getDatabase(getOrInitApp()) } catch { return null }
})()

export {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
}

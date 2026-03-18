// ─────────────────────────────────────────────────────
//  🔥 กรอก Firebase config ของคุณที่นี่
//  สร้างได้ฟรีที่ https://console.firebase.google.com
//  ดูวิธีใน README.md
// ─────────────────────────────────────────────────────
import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth'
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

let resolveAuthReady
export const authReady = new Promise((resolve) => {
  resolveAuthReady = resolve
})

export const auth = (() => {
  if (!hasAllConfig) {
    resolveAuthReady(false)
    return null
  }
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    const a = getAuth(app)
    let resolved = false
    const safeResolve = (v) => {
      if (resolved) return
      resolved = true
      resolveAuthReady(v)
    }
    onAuthStateChanged(
      a,
      (user) => safeResolve(Boolean(user)),
      () => safeResolve(false),
    )
    signInAnonymously(a).catch(() => {})
    setTimeout(() => safeResolve(false), 4000)
    return a
  } catch {
    resolveAuthReady(false)
    return null
  }
})()

export const db = (() => {
  if (!hasAllConfig) return null
  try {
    const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
    return getDatabase(app)
  } catch {
    return null
  }
})()

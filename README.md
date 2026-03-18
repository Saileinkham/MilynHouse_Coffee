# 🧋 Milyn House — Drink Shop Management

## วิธี Deploy ขึ้น Vercel (ฟรี) ทีละขั้นตอน

---

## ขั้นที่ 1 — สร้าง Firebase Project (ฟรี)

1. ไปที่ https://console.firebase.google.com
2. กด **"Add project"** → ตั้งชื่อ เช่น `milyn-house` → กด Continue จนเสร็จ
3. ในหน้า Project Overview กด **"Realtime Database"** (เมนูซ้าย)
4. กด **"Create database"** → เลือก **"Start in test mode"** → กด Enable
5. กลับหน้า Project Overview → กดไอคอน **`</>`** (Web app)
6. ตั้งชื่อแอป → กด **"Register app"**
7. จะได้ `firebaseConfig` ที่มีค่าต่างๆ — **คัดลอกเก็บไว้**

---

## ขั้นที่ 2 — ตั้งค่าโปรเจกต์

1. คัดลอกไฟล์ `.env.example` → เปลี่ยนชื่อเป็น `.env`
2. กรอกค่าจาก Firebase config ลงใน `.env`:

```
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=milyn-house.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://milyn-house-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=milyn-house
VITE_FIREBASE_STORAGE_BUCKET=milyn-house.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

---

## ขั้นที่ 3 — ทดสอบในเครื่อง (ไม่บังคับ)

```bash
npm install
npm run dev
```

เปิด http://localhost:5173 ในเบราว์เซอร์

---

## ขั้นที่ 4 — Deploy ขึ้น Vercel

### วิธีที่ 1: ผ่าน GitHub (แนะนำ)

1. สร้าง GitHub repo ใหม่ที่ https://github.com/new
2. Push โค้ดขึ้น GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/milyn-house.git
   git push -u origin main
   ```
3. ไปที่ https://vercel.com → Sign up ด้วย GitHub
4. กด **"Add New Project"** → เลือก repo ที่เพิ่ง push
5. ใน **"Environment Variables"** ใส่ค่าจาก `.env` ทุกตัว
6. กด **"Deploy"** → รอ 1-2 นาที
7. ได้ URL เช่น `https://milyn-house.vercel.app` 🎉

### วิธีที่ 2: Drag & Drop (ง่ายกว่า)

1. รัน `npm run build` → จะได้โฟลเดอร์ `dist/`
2. ไปที่ https://vercel.com → กด **"Add New Project"**
3. ลาก **โฟลเดอร์ `dist`** วางในหน้า Vercel
4. ใส่ Environment Variables → Deploy

---

## ขั้นที่ 5 — แชร์ให้ทีม

ส่ง URL ให้ทีมได้เลย เช่น `https://milyn-house.vercel.app`

ทุกคนที่เปิด URL เดียวกัน → เห็นข้อมูลเดียวกัน ซิงค์ real-time ✅

---

## โครงสร้างโปรเจกต์

```
milyn-house/
├── src/
│   ├── App.jsx        ← แอปหลักทั้งหมด
│   ├── firebase.js    ← Firebase config
│   └── main.jsx       ← Entry point
├── index.html
├── package.json
├── vite.config.js
├── .env               ← กรอก Firebase keys (สร้างจาก .env.example)
└── .env.example       ← ตัวอย่าง
```

---

## Firebase Free Tier ใช้ได้เท่าไหร่?

| สิ่งที่ได้ฟรี | ปริมาณ |
|---|---|
| Realtime Database | 1 GB storage |
| ดาวน์โหลดข้อมูล | 10 GB/เดือน |
| Connections พร้อมกัน | 100 connections |

**→ ใช้งานร้านเครื่องดื่มขนาดเล็ก-กลาง ฟรีได้ตลอด** ✅

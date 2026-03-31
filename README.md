# Food Ordering (Express)

## Run

```bash
npm i
npm start
```

Open:
- Customer: `http://localhost:3000?table=1`
- Chef: `http://localhost:3000/chef.html`

## Firebase (Firestore) for menus

Menus are loaded from Firestore collection `Menus`.

### Option A (recommended): GOOGLE_APPLICATION_CREDENTIALS

Set environment variable `GOOGLE_APPLICATION_CREDENTIALS` to your Firebase service account JSON path.

### Option B: serviceAccountKey.json

1. Download a Firebase service account JSON from Firebase Console.
2. Save it as `serviceAccountKey.json` in the project root (same folder as `index.js`).

Notes:
- `serviceAccountKey.json` is ignored by git (see `.gitignore`).
- Example template: `serviceAccountKey.example.json`

### Deploy (Render และ hosting อื่นที่ไม่มีไฟล์ key ใน repo)

ตั้ง environment variable **`FIREBASE_KEY`** เป็นข้อความ JSON ทั้งไฟล์ของ service account (คัดลอกจากไฟล์ที่โหลดจาก Firebase Console แล้ววางเป็นค่าเดียว หรือ minify เป็นบรรทัดเดียว)

ถ้าไม่ตั้งค่า `/api/menus` จะ error และหน้าแรกจะไม่มีรายการเมนู

### รูปเมนู

วางไฟล์ใน **`public/images/`** ให้ชื่อตรงกับฟิลด์ `image` ใน Firestore (เช่น `padthai.png`)


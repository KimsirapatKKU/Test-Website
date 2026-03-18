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


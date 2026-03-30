const express = require("express");
const admin = require("firebase-admin");
const app = express();
app.use(express.static("public"));
app.use(express.json());   

// Firebase Admin (Firestore) สำหรับเมนู
// - แนะนำให้ตั้ง env `GOOGLE_APPLICATION_CREDENTIALS` ชี้ไปที่ service account json
// - หรือวางไฟล์ไว้ที่ `./serviceAccountKey.json`
try {
  if (admin.apps.length === 0) {
    let credential;

    if (process.env.FIREBASE_KEY) {
      credential = admin.credential.cert(
        JSON.parse(process.env.FIREBASE_KEY)
      );
    } else {
      credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({ credential });
  }
} catch (e) {
  console.error("Firebase init error:", e);
}

console.log("FIREBASE:", process.env.FIREBASE_KEY ? "OK" : "NOT FOUND");

try {
  const parsed = JSON.parse(process.env.FIREBASE_KEY);
  console.log("PROJECT ID:", parsed.project_id);
} catch (e) {
  console.error("JSON ERROR");
}

let db;

try {
  db = admin.firestore();
} catch (e) {
  console.error("Firestore init error:", e);
}

function toIsoMaybeTimestamp(value) {
  if (!value) return value;
  if (typeof value.toDate === "function") {
    try {
      return value.toDate().toISOString();
    } catch (e) {
      return value;
    }
  }
  return value;
}

function serializeOrderDoc(doc) {
  const data = doc.data() || {};
  return {
    _id: doc.id,
    ...data,
    createdAt: toIsoMaybeTimestamp(data.createdAt)
  };
}






app.get("/api/menus", async (req, res) => {
  if (!db) {
    return res.status(500).json({ message: "Database not initialized" });
  }
  try {
    const snap = await db.collection("Menus").get();
    const menus = snap.docs.map((doc) => ({ _id: doc.id, ...doc.data() }));
    res.json(menus);
  } catch (error) {
    res.status(500).json({ message: "Error fetching menus" })
  }
})



// ดึงข้อมูลเมนูแต่ละอัน (สำหรับหน้า product.html)
app.get("/api/menus/:id", async (req, res) => {
  if (!db) {
    return res.status(500).json({ message: "Database not initialized" });
  }

  try {
    const doc = await db.collection("Menus").doc(req.params.id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: "ไม่พบเมนู" });
    }

    res.json({ _id: doc.id, ...doc.data() });

  } catch (error) {
    res.status(500).json({ message: "Error fetching menu" });
  }
});



app.post("/api/orders", async (req, res) => {
  if (!db) {
    return res.status(500).json({ message: "Database not initialized" });
  }

  const { table, items, user } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "ไม่มีรายการอาหาร" });
  }

  try {
    let totalPrice = 0;
    let newItems = [];

    for (const item of items) {
      // 🔥 ดึง menu จาก DB
      const doc = await db.collection("Menus").doc(item.id).get();

      if (!doc.exists) {
        return res.status(400).json({ error: "ไม่พบเมนู" });
      }

      const menu = doc.data();

      // ✅ ใช้ราคาจาก DB เท่านั้น
      const realPrice = menu.price;

      totalPrice += realPrice * item.quantity;

      newItems.push({
        menuId: item.id,
        name: menu.name,
        price: realPrice,
        quantity: item.quantity
      });
    }

    const orderData = {
      table: table || "-",
      items: newItems, // ✅ ใช้ของที่ backend สร้างเอง
      totalPrice,      // ✅ เพิ่มตรงนี้
      user: user || "guest",
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const ref = await db.collection("Orders").add(orderData);
    const snap = await ref.get();

    res.json(serializeOrderDoc(snap));

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error creating order" });
  }
});


app.get("/api/orders", async (req, res) => {
  if (!db) {
    return res.status(500).json({ message: "Database not initialized" });
  }

  const table = req.query.table;

  try {
    let snap;
    if (table) {
      // เลี่ยงปัญหา composite index (where + orderBy) โดย sort ในหน่วยความจำแทน
      snap = await db.collection("Orders").where("table", "==", table).get();
    } else {
      snap = await db.collection("Orders").orderBy("createdAt", "desc").get();
    }

    const orders = snap.docs
      .map(serializeOrderDoc)
      // คง behavior เดิม: ไม่เอา status = done
      .filter((o) => o.status !== "done")
      // ถ้าเป็น table-filter (ไม่มี orderBy) ให้เรียงเอง
      .sort((a, b) => {
        const ta = a.createdAt ? Date.parse(a.createdAt) : 0;
        const tb = b.createdAt ? Date.parse(b.createdAt) : 0;
        return tb - ta;
      });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders" });
  }

});

app.put("/api/orders/:id/status", async (req, res) => {
  if (!db) {
    return res.status(500).json({ message: "Database not initialized" });
  }

  const { status } = req.body;

  if (!status) return res.status(400).json({ error: "ต้องส่ง status" });

  try {
    const ref = db.collection("Orders").doc(req.params.id);
    const before = await ref.get();
    if (!before.exists) return res.status(404).json({ error: "ไม่พบออเดอร์" });

    await ref.update({ status });
    const after = await ref.get();
    res.json(serializeOrderDoc(after));
  } catch (error) {
    res.status(500).json({ message: "Error updating order status" });
  }

});

let alertData = {
  hasAlert: false,
  table: null
};

app.post("/alert", (req, res) => {
  alertData = req.body;
  res.json({ ok: true });
});

app.get("/alert", (req, res) => {
  res.json(alertData);
});

// เคลียร์สถานะแจ้งเตือน (ฝั่งครัวกดรับทราบแล้ว)
app.post("/alert/clear", (req, res) => {
  alertData = {
    hasAlert: false,
    table: null
  };
  res.json({ ok: true });
});

app.get("/api/tarot", async (req,res)=>{
  if (!db) {
    return res.status(500).json({ message: "Database not initialized" });
  }

  try {
    const snap = await db.collection("Tarots").get();
    const cards = snap.docs.map((doc) => ({ _id: doc.id, ...doc.data() }));
    res.json(cards);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tarot" });
  }
})

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
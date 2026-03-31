
const express = require("express");
const admin = require("firebase-admin");
const app = express();
app.use(express.static("public"));
app.use(express.json());

// Firebase Admin (Firestore)
// ลำดับ: 1) env FIREBASE_KEY (JSON เต็ม) เหมาะกับ Render
//        2) ไฟล์ ./serviceAccountKey.json เหมาะกับเครื่อง dev
//        3) applicationDefault() ถ้าตั้ง gcloud ADC ไว้

let db;
let menuCache = [];
let menuCacheUpdatedAt = 0;
try {
  if (admin.apps.length === 0) {
    let credential;
    let source;

    if (process.env.FIREBASE_KEY) {
      const parsed = JSON.parse(process.env.FIREBASE_KEY);
      credential = admin.credential.cert(parsed);
      source = "FIREBASE_KEY";
      if (parsed.project_id) console.log("PROJECT ID:", parsed.project_id);
    } else {
      try {
        const serviceAccount = require("./serviceAccountKey.json");
        credential = admin.credential.cert(serviceAccount);
        source = "serviceAccountKey.json";
        if (serviceAccount.project_id) {
          console.log("PROJECT ID:", serviceAccount.project_id);
        }
      } catch {
        credential = admin.credential.applicationDefault();
        source = "application default credentials";
      }
    }

    admin.initializeApp({ credential });
    console.log("Firebase Admin OK (" + source + ")");
  }
  db = admin.firestore();
} catch (e) {
  console.error("Firebase / Firestore unavailable:", e.message);
  db = null;
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

function normalizeOrderItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const id = Number(item?.id);
      const quantity = Math.max(1, Number(item?.quantity) || 1);
      const note = String(item?.note || "").slice(0, 120);
      const dining = item?.dining === "takeaway" ? "takeaway" : "dinein";
      if (!Number.isFinite(id)) return null;
      // เก็บเฉพาะข้อมูลที่จำเป็นเพื่อลดขนาดเอกสาร Orders
      return {
        id,
        quantity,
        note,
        dining
      };
    })
    .filter(Boolean);
}

async function enrichOrdersWithMenuDetails(orders) {
  const menuSnap = await db.collection("Menus").get();
  const menuById = new Map();
  menuSnap.docs.forEach((doc) => {
    const data = doc.data() || {};
    const menuId = Number(data.id);
    if (Number.isFinite(menuId)) {
      menuById.set(menuId, data);
    }
  });

  return orders.map((order) => {
    const rawItems = Array.isArray(order.items) ? order.items : [];
    const items = rawItems.map((item) => {
      const id = Number(item?.id);
      const menu = menuById.get(id) || {};
      return {
        id,
        name: menu.name || `เมนู #${id}`,
        price: Number(menu.price) || 0,
        image: menu.image || "",
        quantity: Math.max(1, Number(item?.quantity) || 1),
        dining: item?.dining === "takeaway" ? "takeaway" : "dinein",
        note: String(item?.note || "")
      };
    });
    return { ...order, items };
  });
}

app.get("/api/menus", async (req, res) => {
  if (!db) {
    return res.status(500).json({ message: "Database not initialized" });
  }

  if (menuCache.length === 0) {
    await loadMenuFromDB(); // กรณี cache ยังว่าง
  }
  res.json(menuCache);
});



// ดึงข้อมูลเมนูแต่ละอัน (สำหรับหน้า product.html)
app.get("/api/menus/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "id ไม่ถูกต้อง" });

  const menu = menuCache.find(m => Number(m.id) === id);
  if (!menu) return res.status(404).json({ error: "ไม่พบเมนู" });

  res.json(menu);
});


app.post("/api/orders", async (req, res) => {
  if (!db) {
    return res.status(500).json({ message: "Database not initialized" });
  }

  const { table, items, user } = req.body;
  const compactItems = normalizeOrderItems(items);

  if (compactItems.length === 0) {
    return res.status(400).json({ error: "ไม่มีรายการอาหาร" });
  }

  try {
    const orderData = {
      table: table || "-",
      items: compactItems,
      user: user || "guest",
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const ref = await db.collection("Orders").add(orderData);
    const snap = await ref.get();

    const newOrder = serializeOrderDoc(snap);

    const enriched = await enrichOrdersWithMenuDetails([newOrder]);
    // 🔥 ยิงไปหา client ทุกคน (เชฟจะเห็นทันที)
    broadcast({
      type: "NEW_ORDER",
      order: enriched[0]
    });

    res.json(enriched[0]);
  } catch (error) {
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

    // const enrichedOrders = await enrichOrdersWithMenuDetails(orders);
    // res.json(enrichedOrders);
    const enrichedOrders = await enrichOrdersWithMenuDetails(orders);
    res.json(enrichedOrders);
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

  const enriched = await enrichOrdersWithMenuDetails([serializeOrderDoc(after)]);
  // 🔥 เพิ่มตรงนี้
  broadcast({
    type: "UPDATE_ORDER",
    order: enriched[0]
  });

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

app.get("/api/tarot", async (req, res) => {
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

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

const WebSocket = require("ws");
const wss = new WebSocket.Server({ server });
let clients = [];

wss.on("connection", (ws) => {
  console.log("Client connected");
  clients.push(ws);

  ws.on("close", () => {
    clients = clients.filter(c => c !== ws);
  });
});

function broadcast(data) {
  clients.forEach(ws => {
    ws.send(JSON.stringify(data));
  });
}

async function loadMenuFromDB() {
  if (!db) return [];
  try {
    const snap = await db.collection("Menus").get();
    const menus = snap.docs.map(doc => ({ _id: doc.id, ...doc.data() }));
    menuCache = menus;
    menuCacheUpdatedAt = Date.now();
    console.log("Menu cache refreshed:", new Date());
    return menus;
  } catch (err) {
    console.error("Error loading menu:", err);
    return menuCache; // fallback ใช้ cache เก่า
  }
}

setInterval(loadMenuFromDB, 300_000); // 300,000 ms = 5 นาที
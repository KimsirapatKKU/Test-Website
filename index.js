const express = require("express");
const mongoose = require("mongoose");   // เพิ่มตัวนี้
const app = express();
app.use(express.static("public"));
app.use(express.json());   

const Menus = require('./models/menu')
const Taro = require("./models/taro")
const Order = require("./models/order")

mongoose.connect("mongodb://Tonnam:Tonnaem1494@ac-jwxvccx-shard-00-00.jjyarh1.mongodb.net:27017,ac-jwxvccx-shard-00-01.jjyarh1.mongodb.net:27017,ac-jwxvccx-shard-00-02.jjyarh1.mongodb.net:27017/foodDB?ssl=true&replicaSet=atlas-6kn3u1-shard-0&authSource=admin&retryWrites=true")
.then(() => console.log("MongoDB connected"))
.catch(err => console.log(err));




app.get("/api/menus", async (req, res) => {
  try {
    const menus = await Menus.find()
    res.json(menus)
  } catch (error) {
    res.status(500).json({ message: "Error fetching menus" })
  }
})



// ดึงข้อมูลเมนูแต่ละอัน (สำหรับหน้า product.html)
app.get("/api/menus/:id", async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) return res.status(400).json({ error: "id ไม่ถูกต้อง" });
  const menu = await Menus.findOne({ id });
  if (!menu) return res.status(404).json({ error: "ไม่พบเมนู" });
  res.json(menu);
});


app.post("/api/orders", async (req, res) => {

  const { table, items } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: "ไม่มีรายการอาหาร" });
  }

  const order = await Order.create({
    table,
    items
  });

  res.json(order);

});


app.get("/api/orders", async (req, res) => {

  const table = req.query.table;

  let query = {};
  if (table) query.table = table;

  const orders = await Order.find({
    ...query,
    status: { $ne: "done" }
  }).sort({ createdAt: -1 });

  res.json(orders);

});

app.put("/api/orders/:id/status", async (req, res) => {

  const { status } = req.body;

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { returnDocument: "after" }
  );

  res.json(order);

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
  const cards = await Taro.find()
  res.json(cards)
})

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
const express = require("express");
const app = express();

app.use(express.static("public"));
app.use(express.json());

const menus = [
  {
    id: 1,
    name: "ผัดมาม่าขี้เมา",
    price: 65,
    category: "padsen",
    image: "padmama.jpg"
  },
  {
    id: 2,
    name: "สปาเก็ตตี้ผัดขี้เมา",
    price: 65,
    category: "padsen",
    image: "spaghetti.jpg"
  },
  {
    id: 3,
    name: "ราดหน้าเส้นหมี่",
    price: 65,
    category: "padsen",
    image: "radna.jpg"
  },
  {
    id: 4,
    name: "ผัดซีอิ๊ว",
    price: 65,
    category: "padsen",
    image: "padcew.jpg"
  },
  {
    id: 5,
    name: "ผัดหมี่ฮ่องกง",
    price: 139,
    category: "padsen",
    image: "padmhi.jpg"
  },
  {
    id: 6,
    name: "วุ้นเส้นผัดแหนม",
    price: 150,
    category: "padsen",
    image: "woonsennham.jpg"
  },
  {
    id: 7,
    name: "วุ้นเส้นชะอมกุ้ง",
    price: 180,
    category: "padsen",
    image: "woonsenkhong.jpg"
  },
  {
    id: 8,
    name: "ทอดมันกุ้ง",
    price: 200,
    category: "fried",
    image: "shrimp.jpg"
  },
  {
    id: 9,
    name: "กุ้งราดซอสมะขาม",
    price: 259,
    category: "fried",
    image: "shrimpmakham.jpg"
  },
  {
    id: 10,
    name: "หมูแดดเดียว",
    price: 150,
    category: "fried",
    image: "driedpork.jpg"
  },
  {
    id: 11,
    name: "เนื้อแดดเดียว",
    price: 180,
    category: "fried",
    image: "driedbeef.jpg"
  },
  {
    id: 12,
    name: "ลาบหมูทอด",
    price: 150,
    category: "fried",
    image: "larb.jpg"
  },
  {
    id: 13,
    name: "คอหมูทอดเกลือ",
    price: 150,
    category: "fried",
    image: "kormho.jpg"
  },
  {
    id: 14,
    name: "ปีกไก่ทอดน้ำปลา",
    price: 150,
    category: "fried",
    image: "kaitord.jpg"
  },
  {
    id: 15,
    name: "เฟรนด์ฟรายด์",
    price: 129,
    category: "fried",
    image: "frenchfries.jpg"
  },
  {
    id: 16,
    name: "ยำแหนม",
    price: 150,
    category: "yam",
    image: "yamnham.jpg"
  },
  {
    id: 17,
    name: "ยำหมูยอ",
    price: 150,
    category: "yam",
    image: "yammhoyor.jpg"
  },
  {
    id: 18,
    name: "ยำเม็ดมะม่วงหิมพานต์",
    price: 150,
    category: "yam",
    image: "yammedmamuang.jpg"
  },
  {
    id: 19,
    name: "ยำสามกรอบ",
    price: 200,
    category: "yam",
    image: "yamsamkrob.jpg"
  },
  {
    id: 20,
    name: "ยำตะไคร้กุ้งสด",
    price: 180,
    category: "yam",
    image: "yamkongsod.jpg"
  },
  {
    id: 21,
    name: "ยำถั่วพลูกุ้งสด",
    price: 180,
    category: "yam",
    image: "yamtuapru.jpg"
  },
  {
    id: 22,
    name: "เนื้อสันผัดพริกไทยดำ",
    price: 200,
    category: "pad",
    image: "beefpricthai.jpg"
  },
  {
    id: 23,
    name: "เนื้อสันผัดน้ำมันหอย",
    price: 200,
    category: "pad",
    image: "beefnammanhoi.jpg"
  },
  {
    id: 24,
    name: "ผัดฉ่าหมู",
    price: 150,
    category: "pad",
    image: "padchamho.jpg"
  },
  {
    id: 25,
    name: "ผัดคะน้าหมูกรอบ",
    price: 200,
    category: "pad",
    image: "padkana.jpg"
  },
  {
    id: 26,
    name: "กะหล่ำปลีผัดน้ำปลา",
    price: 119,
    category: "pad",
    image: "padkalam.jpg"
  },
  {
    id: 27,
    name: "ผัดพริกแกงหมู",
    price: 150,
    category: "pad",
    image: "padprikkang.jpg"
  },
  {
    id: 28,
    name: "ผัดกระเพราทะเล",
    price: 200,
    category: "pad",
    image: "padkapro.jpg"
  },
  {
    id: 29,
    name: "ผัดผักรวมมิตรกุ้ง",
    price: 180,
    category: "pad",
    image: "padpak.jpg"
  },
  {
    id: 30,
    name: "ข้าวผัดหมู",
    price: 120,
    category: "kao",
    image: "kaopad.jpg"
  },
  {
    id: 31,
    name: "ข้าวราดกระเพราหมู",
    price: 55,
    category: "kao",
    image: "kaokapro.jpg"
  },
  {
    id: 32,
    name: "ข้าวราดหมูทอดกระเทียม",
    price: 55,
    category: "kao",
    image: "kaokratiam.jpg"
  },
  {
    id: 33,
    name: "ข้าวราดเนื้อน้ำมันหอย",
    price: 60,
    category: "kao",
    image: "kaonammanhoi.jpg"
  },
  {
    id: 34,
    name: "ข้าวราดพริกแกงเนื้อ",
    price: 60,
    category: "kao",
    image: "kaoprikkang.jpg"
  },
  {
    id: 35,
    name: "ข้าวราดแกงเขียวหวานไก่",
    price: 55,
    category: "kao",
    image: "kaoradgang.jpg"
  },
  {
    id: 36,
    name: "ผัดหมี่โคราช",
    price: 55,
    category: "kao",
    image: "padmhikorat.jpg"
  },
  {
    id: 37,
    name: "ข้าวเปล่า",
    price: 10,
    category: "kao",
    image: "kao.jpg"
  },

];

// รายการออเดอร์ (เก็บในหน่วยความจำ)
let orderIdCounter = 1;
const orders = [];
// สร้างออเดอร์ใหม่
function createOrder(table, items) {
  const order = {
    id: orderIdCounter++,
    table: table || "-",
    items: items,
    createdAt: new Date().toISOString()
  };
  orders.push(order);
  return order;
}

app.get("/api/menus", (req, res) => {
  res.json(menus);
});

// ดึงข้อมูลเมนูแต่ละอัน (สำหรับหน้า product.html)
app.get("/api/menus/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const menu = menus.find(m => m.id === id);
  if (!menu) return res.status(404).json({ error: "ไม่พบเมนู" });
  res.json(menu);
});

// สร้างออเดอร์ (ลูกค้าสั่ง)
app.post("/api/orders", (req, res) => {
  const { table, items } = req.body || {};
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "ไม่มีรายการอาหาร" });
  }
  const order = createOrder(table, items);
  res.status(201).json(order);
});

// ดึงรายการออเดอร์ (ฝั่งเชฟ: ไม่ส่ง table | ฝั่งลูกค้า: ?table=3 ดูออเดอร์ของโต๊ะ)
app.get("/api/orders", (req, res) => {
  let list = [...orders].reverse();
  const table = req.query.table;
  if (table) list = list.filter(o => String(o.table) === String(table));
  res.json(list);
});

app.listen(3000, () => {
  console.log("Server running at http://localhost:3000");
});
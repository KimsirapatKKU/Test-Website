(function () {
  //ดึงid
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const editKey = params.get("key"); // ใช้ระบุ item เดิมในตะกร้า ตอนกด "แก้ไข"
  if (!id) {
    document.getElementById("backBtn").href = "index.html";
    return;
  }

  let product = null;
  let quantity = 1;

  const productImage = document.getElementById("productImage");
  const productTitle = document.getElementById("productTitle");
  const productPrice = document.getElementById("productPrice");
  const productNote = document.getElementById("productNote");
  const qtyValue = document.getElementById("qtyValue");
  const qtyMinus = document.getElementById("qtyMinus");
  const qtyPlus = document.getElementById("qtyPlus");
  const addCartBtn = document.getElementById("addCartBtn");

  //ปุ่มย้อนกลับ
  function setBackLink() {
    const table = params.get("table");
    const back = document.getElementById("backBtn");
    back.href = table ? "index.html?table=" + table : "index.html";
  }

  //สร้างฟังก์ชันโหลดสินค้าแต่ล่ะอัน
  function loadProduct() {
    fetch("/api/menus/" + id)
      .then((res) => {
        if (!res.ok) throw new Error("ไม่พบเมนู");
        return res.json();
      })
      .then((data) => {
        product = data;
        productImage.src = "images/" + product.image;
        productImage.alt = product.name;
        productTitle.textContent = product.name;

        // ถ้ามาจากปุ่ม "แก้ไข" ในตะกร้า ให้ดึงค่าจาก cart มาเติม
        if (editKey) {
          try {
            const saved = localStorage.getItem("cart");
            if (saved) {
              const cart = JSON.parse(saved);
              const existing = cart.find(i => (i.id + "_" + (i.note || "") + "_" + (i.dining || "dinein")) === editKey);
              if (existing) {
                quantity = existing.quantity || 1;

                // แยก note เดิมออกเป็น checkbox "ไม่ผัก" กับช่องข้อความ
                const note = existing.note || "";
                const noVegEl = document.getElementById("noVegetable");
                const noteEl = productNote;
                if (note.startsWith("ไม่ผัก")) {
                  if (noVegEl) noVegEl.checked = true;
                  const remain = note.replace(/^ไม่ผัก(, )?/, "");
                  if (noteEl) noteEl.value = remain;
                } else if (noteEl) {
                  noteEl.value = note;
                }

                // ตั้งโหมดทานร้าน/ใส่กล่อง ให้ตรงกับของเดิม
                const isTakeaway = existing.dining === "takeaway";
                const optTakeaway = document.getElementById("optTakeaway");
                const optDinein = document.getElementById("optDinein");
                if (optTakeaway) optTakeaway.checked = !!isTakeaway;
                if (optDinein) optDinein.checked = !isTakeaway;
              }
            }
          } catch (e) {}
        }

        updatePriceDisplay();
      })
      .catch(() => {
        productTitle.textContent = "ไม่พบเมนู";
      });
  }
  //อัพเดตราคาตามจำนวน
  function updatePriceDisplay() {
    if (!product) return;
    const total = product.price * quantity;
    productPrice.textContent = "฿ " + product.price.toFixed(2) + "/จาน";
    qtyValue.textContent = quantity;
    addCartBtn.textContent = "เพิ่ม ฿ " + total.toFixed(2);
  }
 //เพิ่มสินค้าไปยังตะกร้า (หรืออัปเดตของเดิม ถ้ามาจากปุ่ม "แก้ไข")
  function addToCart() {
    if (!product) return;
    
    const dining = document.querySelector('input[name="dining"]:checked');
    const noVegetable = document.getElementById("noVegetable").checked;
    const userNote = productNote.value.trim();

    // --- ส่วนที่แก้ไข: รวม "ไม่ผัก" เข้าไปใน note ---
    let finalNote = "";
    if (noVegetable) {
        finalNote = "ไม่ผัก";
    }
    
    // ถ้าผู้ใช้พิมพ์หมายเหตุมาด้วย ให้ต่อท้าย "ไม่ผัก"
    if (userNote) {
        finalNote = finalNote ? finalNote + ", " + userNote : userNote;
    }

    const item = {
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,    // ต้องเพิ่มบรรทัดนี้: เพื่อให้ในตะกร้ามีรูป
      quantity: quantity,
      dining: dining ? dining.value : "dinein",
      note: finalNote         // เก็บค่าที่รวม "ไม่ผัก" แล้วลงใน note
    };

    let cart = [];
    try {
      const saved = localStorage.getItem("cart");
      if (saved) cart = JSON.parse(saved);
    } catch (e) {}

    const newIdentifier = item.id + "_" + (item.note || "") + "_" + (item.dining || "dinein");

    if (editKey) {
      // กรณีแก้ไขจากตะกร้า: แทนที่รายการเดิม ไม่เพิ่มใหม่
      const idx = cart.findIndex(i => (i.id + "_" + (i.note || "") + "_" + (i.dining || "dinein")) === editKey);
      if (idx > -1) {
        cart[idx] = item;
      } else {
        cart.push(item);
      }
    } else {
      // กรณีเพิ่มใหม่: ถ้าเมนู + หมายเหตุ + dining เหมือนเดิม ให้รวมจำนวน
      const idx = cart.findIndex(i => (i.id + "_" + (i.note || "") + "_" + (i.dining || "dinein")) === newIdentifier);
      if (idx > -1) {
        cart[idx].quantity += item.quantity;
      } else {
        cart.push(item);
      }
    }
    localStorage.setItem("cart", JSON.stringify(cart));

    const table = params.get("table");
    const url = table ? "index.html?table=" + table : "index.html";
    window.location.href = url;
  }

  setBackLink();
  loadProduct();

  qtyMinus.addEventListener("click", function () {
    if (quantity <= 1) return;
    quantity--;
    updatePriceDisplay();
  });

  qtyPlus.addEventListener("click", function () {
    quantity++;
    updatePriceDisplay();
  });

  addCartBtn.addEventListener("click", addToCart);
})();

const orderItem = {
    id: menuId,
    name: menuName,
    price: menuPrice,
    image: menuImage,
    quantity: parseInt(quantity),
    note: document.getElementById("noteInput").value // ต้องมีส่วนนี้
};

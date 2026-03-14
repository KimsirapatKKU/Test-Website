(function () {
  //ดึงid
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
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
  //เพิ่มสินค้าไปยังตะกร้า
  function addToCart() {
    if (!product) return;
    const dining = document.querySelector('input[name="dining"]:checked');
    const noVegetable = document.getElementById("noVegetable").checked;
    const note = productNote.value.trim();

    const item = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: quantity,
      dining: dining ? dining.value : "dinein",
      noVegetable: noVegetable,
      note: note
    };

    let cart = [];
    try {
      const saved = localStorage.getItem("cart");
      if (saved) cart = JSON.parse(saved);
    } catch (e) {}
    cart.push(item);
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

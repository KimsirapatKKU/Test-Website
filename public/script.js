document.addEventListener("DOMContentLoaded", function () {

  /* ======================
     แสดงเลขโต๊ะ
  ====================== */
  const params = new URLSearchParams(window.location.search);
  const table = params.get('table');

  function showMenuError(msg) {
    const container = document.getElementById("menuContainer");
    if (!container) return;
    container.innerHTML =
      '<p class="menu-load-error" style="padding:1rem;text-align:center;color:#b42318;">' +
      msg +
      "</p>";
  }

  function renderMenus(menus) {
    const container = document.getElementById("menuContainer");
    container.innerHTML = "";
    const tableQuery = table ? "&table=" + table : "";

    menus.forEach(menu => {
      const card = document.createElement("div");
      card.className = "card";

      card.dataset.cat = menu.category;
      card.innerHTML = `
        <a href="product.html?id=${menu.id}${tableQuery}"><img src="images/${menu.image}" alt="${menu.name}"></a>
        <div class="card-body">
          <div>${menu.name}</div>
          <div class="price">${menu.price} ฿</div>
        </div>
      `;

      container.appendChild(card);
    });
  }

  // โหลดเมนูสำหรับหน้า index.html
  fetch("/api/menus")
    .then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        console.error("/api/menus error:", res.status, data);
        showMenuError(
          data.message ||
            "โหลดเมนูไม่สำเร็จ (" + res.status + ") — บนเซิร์ฟเวอร์อาจยังไม่ตั้งค่า Firebase"
        );
        return;
      }
      if (!Array.isArray(data)) {
        console.error("/api/menus: expected array, got", data);
        showMenuError("ข้อมูลเมนูไม่ถูกต้อง");
        return;
      }
      renderMenus(data);
    })
    .catch((err) => {
      console.error(err);
      showMenuError("เชื่อมต่อเซิร์ฟเวอร์ไม่ได้");
    });

  const tableEl = document.getElementById('tableNo');
  if (tableEl) {
    tableEl.innerText = "โต๊ะ " + (table || "-");
  }

  /* ======================
     เรียกพนักงาน
  ====================== */
  function sendAlert() {
    fetch("/alert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        table: table,
        hasAlert: true
      })
    }).catch(error => {
      console.log(error)
    });
  }
  window.callStaff = function () {
    document.getElementById("callPopup").style.display = "flex";
  }

  window.closeCall = function () {
    document.getElementById("callPopup").style.display = "none";
  }

  window.confirmCall = function () {
    document.getElementById("callPopup").style.display = "none";
    console.log("เรียกพนักงานจากโต๊ะ " + table);
    sendAlert();

  }



  /* ======================
     ค้นหาเมนู
  ====================== */
  window.searchMenu = function () {
    let value = document.getElementById('search').value.toLowerCase();

    document.querySelectorAll('.card').forEach(card => {
      let text = card.innerText.toLowerCase();
      card.style.display = text.includes(value) ? "block" : "none";
    });
  }

  /* ======================
     กรองหมวด (แก้ error ตรงนี้)
  ====================== */
  window.filterCat = function (e, cat) {

    // เปลี่ยนสีปุ่ม
    document.querySelectorAll('.cat').forEach(btn => {
      btn.classList.remove("active");
    });

    e.currentTarget.classList.add("active");

    // กรองเมนู
    document.querySelectorAll('.card').forEach(card => {
      if (cat === "all" || card.dataset.cat === cat) {
        card.style.display = "block";
      } else {
        card.style.display = "none";
      }
    });
  }

  let randomMenus = [];

  fetch("/api/tarot")
    .then(res => res.json())
    .then(data => {
      randomMenus = data;
    });

  /* ======================
     ไพ่สุ่มเมนู
  ====================== */


  const tarot = document.getElementById("tarotBox");
  let selectedTarotMenuId = null;

  if (tarot) {
    /* ===== ลากได้ + แยกจากคลิก ===== */
    let isDragging = false;
    let moved = false;
    let startX = 0;
    let startY = 0;
    let offsetX = 0;
    let offsetY = 0;
    const DRAG_THRESHOLD = 5; // px

    tarot.addEventListener("mousedown", startDrag);
    tarot.addEventListener("touchstart", startDrag, { passive: false });

    function startDrag(e) {
      if (e.type === "touchstart" && e.cancelable) {
        // กันการ scroll หน้า ตอนเริ่มลากบนมือถือ
        e.preventDefault();
      }
      isDragging = true;
      moved = false;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      startX = clientX;
      startY = clientY;
      offsetX = clientX - tarot.offsetLeft;
      offsetY = clientY - tarot.offsetTop;
    }

    document.addEventListener("mousemove", drag);
    document.addEventListener("touchmove", drag, { passive: false });

    function drag(e) {
      if (!isDragging) return;
      if (e.type === "touchmove" && e.cancelable) {
        // ลากเฉพาะปุ่ม ไม่ให้ทั้งหน้าเลื่อนตามนิ้ว
        e.preventDefault();
      }

      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);

      if (!moved) {
        const dx = clientX - startX;
        const dy = clientY - startY;
        if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
          moved = true;
        }
      }

      let x = clientX - offsetX;
      let y = clientY - offsetY;

      tarot.style.left = x + "px";
      tarot.style.top = y + "px";
      tarot.style.right = "auto";
    }

    document.addEventListener("mouseup", () => {
      isDragging = false;
    });
    document.addEventListener("touchend", () => {
      isDragging = false;
    });

    // คลิก (เฉพาะกรณีไม่ลาก)
    tarot.addEventListener("click", function (e) {
      if (e.target.classList.contains("closeTarot")) return;
      if (moved) return; // ถ้าลาก ไม่ต้องทำงานเหมือนคลิก

      let menu = randomMenus[Math.floor(Math.random() * randomMenus.length)];
      // ผูกไพ่ -> เมนู ด้วยฟิลด์ `id` (แนะนำให้ Tarots.id ตรงกับ Menus.id)
      selectedTarotMenuId = (menu && (menu.id ?? menu._id)) ?? null;
      document.getElementById("menuResult").innerHTML =
        `<img src="taroimages/${menu.image}" class="tarot-card">`;
      document.getElementById("tarotPopup").style.display = "flex";
    });
  }

  window.closePopup = function () {
    document.getElementById("tarotPopup").style.display = "none";
  }

  window.closeTarot = function () {
    document.getElementById("tarotBox").style.display = "none";
  }

  // redirect ไปหน้า product.html เพื่อเลือก "ทานร้าน/ใส่กล่อง" และ "ไม่ใส่ผัก"
  window.goToTarotMenu = function () {
    if (!selectedTarotMenuId) {
      alert("กรุณากดไพ่ก่อน");
      return;
    }
    const tableParam = table ? "&table=" + encodeURIComponent(table) : "";
    window.location.href =
      "product.html?id=" + encodeURIComponent(selectedTarotMenuId) + tableParam;
  }

  /* ======================
     ตะกร้า / สั่งอาหาร
  ====================== */
  function getCart() {
    try {
      const s = localStorage.getItem("cart");
      return s ? JSON.parse(s) : [];
    } catch (e) { return []; }
  }

  function renderOrderList() {
    const list = document.getElementById("orderList");
    const totalEl = document.getElementById("orderTotal");
    const badge = document.getElementById("orderBadge");
    const cart = getCart(); // ฟังก์ชันดึงค่าจาก LocalStorage เดิมของคุณ

    if (!list) return;

    if (cart.length === 0) {
      list.innerHTML = '<li class="text-center py-4 text-muted">ยังไม่มีรายการในตะกร้า</li>';
      if (totalEl) totalEl.textContent = "0 ฿";
      if (badge) badge.style.display = "none";
      return;
    }

    const table = new URLSearchParams(window.location.search).get("table");
    const tableQuery = table ? "&table=" + table : "";

    let total = 0;
    list.innerHTML = cart.map(function (item, index) {
      const subtotal = item.price * item.quantity;
      total += subtotal;

      // รวมรายการในตะกร้าด้วย "เมนู + หมายเหตุ + แบบทาน"
      const identifier = item.id + "_" + (item.note || "") + "_" + (item.dining || "dinein");

      // --- แสดงรายละเอียดเพิ่มเติมในตะกร้า ---
      // ทานร้าน / ใส่กล่อง
      const diningLabel = (item.dining === "takeaway") ? "ใส่กล่อง" : "ทานร้าน";
      const diningHtml = `<span class="order-item-note">${diningLabel}</span>`;

      // หมายเหตุ (เช่น ไม่ผัก)
      const noteHtml = item.note ? `<span class="order-item-note">${item.note}</span>` : "";

      // 2. ดึงรูปภาพมาแสดง (ตรวจสอบชื่อ property ให้ตรงกับที่บันทึก)
      const imgPath = item.image ? `images/${item.image}` : 'https://placehold.co/60x60?text=Food';

      return `
            <li class="order-item d-flex align-items-start py-3 border-bottom" style="gap: 12px;">
                <img src="${imgPath}" class="order-item-img" onerror="this.src='https://placehold.co/60x60?text=Food'">
                <div class="flex-grow-1">
                    <div class="fw-bold" style="font-size: 1rem;">${item.name}</div>
                    ${diningHtml}
                    ${noteHtml} 
                    <div class="text-primary fw-bold mt-1">${item.price} ฿</div>
                    <a href="product.html?id=${item.id}&key=${encodeURIComponent(identifier)}${tableQuery}" class="order-edit-link">แก้ไข</a>
                </div>
                <div class="d-flex flex-column align-items-end" style="gap: 8px;">
                    <div class="qty-btn-group">
                        <button class="btn-circle btn-minus" onclick="updateQty('${identifier}', -1)">-</button>
                        <span class="mx-2 fw-bold">${item.quantity}</span>
                        <button class="btn-circle btn-plus" onclick="updateQty('${identifier}', 1)">+</button>
                    </div>
                    <div class="fw-bold">${subtotal} ฿</div>
                </div>
            </li>`;
    }).join("");

    if (totalEl) totalEl.textContent = total + " ฿";
    if (badge) {
      const count = cart.reduce((sum, i) => sum + i.quantity, 0);
      badge.textContent = count > 99 ? "99+" : count;
      badge.style.display = "flex";
    }
  }

  // index.html (inline script) จะเรียก renderOrderCart ก่อนเปิด popup ตะกร้า
  window.renderOrderCart = function () {
    renderOrderList();
  };

  // ฟังก์ชันสำหรับปุ่ม + และ - ในหน้าตะกร้า
  window.updateQty = function (id, delta) {
    let cart = getCart();
    const idx = cart.findIndex(i => 
    (i.id + "_" + (i.note || "") + "_" + (i.dining || "dinein")) === id
  );
    if (idx > -1) {
      cart[idx].quantity += delta;
      if (cart[idx].quantity <= 0) cart.splice(idx, 1);
      localStorage.setItem("cart", JSON.stringify(cart));
      renderOrderList();
    }
  };

  window.openOrderPopup = function () {
    renderOrderList();
    document.getElementById("orderPopup").style.display = "flex";
  };

  window.closeOrderPopup = function () {
    document.getElementById("orderPopup").style.display = "none";
  };

  window.confirmOrder = function () {
    const cart = getCart();
    if (cart.length === 0) {
      alert("ยังไม่มีรายการในตะกร้า");
      return;
    }
    const table = (new URLSearchParams(window.location.search)).get("table") || "-";
    const user = localStorage.getItem("loginUser") || "guest";

    // ส่งข้อมูลแบบเบา เพื่อลดขนาดที่บันทึกลง Firestore (Orders)
    const compactItems = cart.map(function (item) {
      return {
        id: item.id,
        quantity: item.quantity,
        note: item.note || "",
        dining: item.dining || "dinein"
      };
    });
    
    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ table: table, items: compactItems, user: user})
    })
      .then(function (res) {
        if (!res.ok) throw new Error("ส่งออเดอร์ไม่สำเร็จ");
        return res.json();
      })
      .then(function () {
        localStorage.removeItem("cart");
        document.getElementById("orderPopup").style.display = "none";
        renderOrderList();
        alert("สั่งอาหารเรียบร้อย รอครัวทำอาหารนะครับ");
      })
      .catch(function () {
        alert("ส่งออเดอร์ไม่สำเร็จ กรุณาลองใหม่");
      });
  };

  /* ======================
     บิล / รายการที่สั่ง (ลูกค้าดูออเดอร์ของโต๊ะ)
  ====================== */
  function formatBillTime(iso) {
    try {
      var d = new Date(iso);
      return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    } catch (e) { return ""; }
  }

  window.openBillPopup = function () {
    var table = (new URLSearchParams(window.location.search)).get("table");
    var billContent = document.getElementById("billContent");
    if (!billContent) return;
    billContent.innerHTML = "<p class=\"bill-loading\">กำลังโหลด...</p>";
    document.getElementById("billPopup").style.display = "flex";
    if (!table) {
      billContent.innerHTML = "<p class=\"bill-empty\">กรุณาเข้าหน้าด้วยเลขโต๊ะ เช่น <strong>?table=1</strong> เพื่อดูรายการที่สั่ง</p>";
      return;
    }
    fetch("/api/orders?table=" + encodeURIComponent(table))
      .then(function (res) { return res.json(); })
  .then(function (orders) {

    if (!Array.isArray(orders) || orders.length === 0) {
      billContent.innerHTML = "<p class=\"bill-empty\">ยังไม่มีรายการที่สั่งของโต๊ะนี้</p>";
      return;
    }

    var grandTotal = 0;

    var html = orders.map(function (order) {

      var total = 0;

      var itemsHtml = order.items.map(function (item) {

        var price = item.price * item.quantity;
        total += price;
        grandTotal += price;

        var line = item.name + " x" + item.quantity + " = " + price + " ฿";

        if (item.note)
          line += " <span class=\"bill-item-note\">(" + item.note + ")</span>";

        return "<li class=\"bill-item\">" + line + "</li>";

      }).join("");

      return "<div class=\"bill-block\">" +
        "<div class=\"bill-block-head\">สั่งเมื่อ " + formatBillTime(order.createdAt) + "</div>" +
        "<ul class=\"bill-list\">" + itemsHtml + "</ul>" +
        "<div class=\"bill-total\">รวมบิลนี้ " + total + " ฿</div>" +
        "</div>";

    }).join("");

    html += "<div class=\"bill-grand-total\">รวมทั้งหมด " + grandTotal + " ฿</div>";

    billContent.innerHTML = html;

  })
      .catch(function () {
        billContent.innerHTML = "<p class=\"bill-empty\">โหลดรายการไม่สำเร็จ</p>";
      });
  };

  // index.html (inline script) จะเรียก loadBill เพื่อกรอกข้อมูลก่อนแสดง popup
  window.loadBill = window.openBillPopup;

  window.closeBillPopup = function () {
    document.getElementById("billPopup").style.display = "none";
  };

});

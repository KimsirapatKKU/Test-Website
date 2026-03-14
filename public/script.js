fetch("/api/menus")
  .then(res => res.json())
  .then(menus => renderMenus(menus))
  .catch(err => console.error(err));

function renderMenus(menus) {
  const container = document.getElementById("menuContainer");
  container.innerHTML = "";
  const table = new URLSearchParams(window.location.search).get("table");
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

document.addEventListener("DOMContentLoaded", function(){

    /* ======================
       แสดงเลขโต๊ะ
    ====================== */
    const params = new URLSearchParams(window.location.search);
    const table = params.get('table');
    const tableEl = document.getElementById('tableNo');
    if(tableEl){
      tableEl.innerText = "โต๊ะ " + (table || "-");
    }
    
    /* ======================
       เรียกพนักงาน
    ====================== */
    window.callStaff = function(){
      document.getElementById("callPopup").style.display = "flex";
    }
    
    window.closeCall = function(){
      document.getElementById("callPopup").style.display = "none";
    }
    
    window.confirmCall = function(){
      document.getElementById("callPopup").style.display = "none";
      console.log("เรียกพนักงานจากโต๊ะ " + table);
    }
    
    /* ======================
       ค้นหาเมนู
    ====================== */
    window.searchMenu = function(){
      let value = document.getElementById('search').value.toLowerCase();
    
      document.querySelectorAll('.card').forEach(card=>{
        let text = card.innerText.toLowerCase();
        card.style.display = text.includes(value) ? "block" : "none";
      });
    }
    
    /* ======================
       กรองหมวด (แก้ error ตรงนี้)
    ====================== */
    window.filterCat = function(e,cat){
    
      // เปลี่ยนสีปุ่ม
      document.querySelectorAll('.cat').forEach(btn=>{
        btn.classList.remove("active");
      });
    
      e.currentTarget.classList.add("active");
    
      // กรองเมนู
      document.querySelectorAll('.card').forEach(card=>{
        if(cat === "all" || card.dataset.cat === cat){
          card.style.display = "block";
        }else{
          card.style.display = "none";
        }
      });
    }
    
    /* ======================
       ไพ่สุ่มเมนู
    ====================== */
    const randomMenus = [
      "ทอดมันกุ้ง",
      "วุ้นเส้นชะอมกุ้ง",
      "หม้อไฟทะเล"
    ];
    
    const tarot = document.getElementById("tarotBox");
    
    if(tarot){
    
      tarot.addEventListener("click", function(e){
        if(e.target.classList.contains("closeTarot")) return;
    
        let menu = randomMenus[Math.floor(Math.random()*randomMenus.length)];
        document.getElementById("menuResult").innerText = menu;
        document.getElementById("tarotPopup").style.display="flex";
      });
    
      /* ===== ลากได้ ===== */
      let isDragging=false,offsetX,offsetY;
    
      tarot.addEventListener("mousedown", startDrag);
      tarot.addEventListener("touchstart", startDrag);
    
      function startDrag(e){
        isDragging=true;
        offsetX=(e.clientX||e.touches[0].clientX)-tarot.offsetLeft;
        offsetY=(e.clientY||e.touches[0].clientY)-tarot.offsetTop;
      }
    
      document.addEventListener("mousemove", drag);
      document.addEventListener("touchmove", drag);
    
      function drag(e){
        if(!isDragging) return;
    
        let x=(e.clientX||e.touches[0].clientX)-offsetX;
        let y=(e.clientY||e.touches[0].clientY)-offsetY;
    
        tarot.style.left = x + "px";
        tarot.style.top = y + "px";
        tarot.style.right = "auto";
      }
    
      document.addEventListener("mouseup", ()=> isDragging=false);
      document.addEventListener("touchend", ()=> isDragging=false);
    }
    
    window.closePopup = function(){
      document.getElementById("tarotPopup").style.display="none";
    }
    
    window.closeTarot = function(){
      document.getElementById("tarotBox").style.display="none";
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
      const cart = getCart();
      if (!list) return;
      if (cart.length === 0) {
        list.innerHTML = '<li class="order-empty">ยังไม่มีรายการในตะกร้า</li>';
        if (totalEl) totalEl.textContent = "0 ฿";
        if (badge) { badge.style.display = "none"; }
        return;
      }
      let total = 0;
      list.innerHTML = cart.map(function (item) {
        const subtotal = item.price * item.quantity;
        total += subtotal;
        return '<li class="order-item">' +
          '<span class="order-item-name">' + item.name + '</span>' +
          '<span class="order-item-meta">x' + item.quantity + '</span>' +
          '<span class="order-item-price">' + subtotal + ' ฿</span>' +
          '</li>';
      }).join("");
      if (totalEl) totalEl.textContent = total + " ฿";
      if (badge) {
        const count = cart.reduce(function (sum, i) { return sum + i.quantity; }, 0);
        badge.textContent = count > 99 ? "99+" : count;
        badge.style.display = "flex";
      }
    }

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
      fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table: table, items: cart })
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
          var html = orders.map(function (order) {
            var itemsHtml = order.items.map(function (item) {
              var line = item.name + " x" + item.quantity + " = " + (item.price * item.quantity) + " ฿";
              if (item.note) line += " <span class=\"bill-item-note\">(" + item.note + ")</span>";
              return "<li class=\"bill-item\">" + line + "</li>";
            }).join("");
            return "<div class=\"bill-block\">" +
              "<div class=\"bill-block-head\">สั่งเมื่อ " + formatBillTime(order.createdAt) + "</div>" +
              "<ul class=\"bill-list\">" + itemsHtml + "</ul>" +
              "</div>";
          }).join("");
          billContent.innerHTML = html;
        })
        .catch(function () {
          billContent.innerHTML = "<p class=\"bill-empty\">โหลดรายการไม่สำเร็จ</p>";
        });
    };

    window.closeBillPopup = function () {
      document.getElementById("billPopup").style.display = "none";
    };

    });
(function () {
  const socketProtocol = location.protocol === "https:" ? "wss" : "ws";
const socket = new WebSocket(`${socketProtocol}://${location.host}`);

  socket.onmessage = function (event) {
    const data = JSON.parse(event.data);

    if (data.type === "NEW_ORDER") {
      addOrderToUI(data.order);
    }

    if (data.type === "UPDATE_ORDER") {
      updateOrderUI(data.order);
    }
  };

  const orderListEl = document.getElementById("chefOrderList");
  const emptyEl = document.getElementById("chefEmpty");
  const popup = document.getElementById("alertPopup");
  const message = document.getElementById("alertMessage");

  document.getElementById("closePopup").addEventListener("click", function () {
    popup.style.display = "none";
  });

  function formatTime(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "";
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  async function renderAlert() {
    try {
      const res = await fetch("/alert");
      const data = await res.json();

      if (data.hasAlert) {
        message.textContent = `ลูกค้าโต๊ะ ${data.table} เรียกพนักงาน`;
        popup.style.display = "flex";

        await fetch("/alert/clear", { method: "POST" });
      }

    } catch (err) {
      console.log("การแจ้งเตือนผิดพลาด:", err);
    }
  }

  function renderOrders(orders) {

    if (!orders || orders.length === 0) {
      if (emptyEl) emptyEl.style.display = "block";
      return "";
    }
  
    if (emptyEl) emptyEl.style.display = "none";
  
    return orders.map(order => {
  
      const orderItems = Array.isArray(order.items) ? order.items : [];
      const orderTotal = orderItems.reduce((sum, item) => {
        const price = Number(item.price) || 0;
        const qty = Number(item.quantity) || 0;
        return sum + price * qty;
      }, 0);
  
      const itemsHtml = orderItems.map(item => {
  
        const subtotal = (Number(item.price) || 0) * (Number(item.quantity) || 0);
        const pricePerItem = Number(item.price) || 0;
  
        let line = `${item.name} x${item.quantity}`;
        line += ` <span class="chef-item-price">(${pricePerItem} ฿/จาน)</span>`;
        line += ` <span class="chef-item-subtotal">รวม ${subtotal} ฿</span>`;
  
        if (item.note)
          line += ` <span class="chef-item-note">(${escapeHtml(item.note)})</span>`;
  
        return `<li class="chef-order-item">${line}</li>`;
  
      }).join("");
  
      return `
      <div class="chef-card" data-id="${order._id}">
        <div class="chef-card-head">
          <span class="chef-card-table">โต๊ะ ${escapeHtml(order.table)}</span>
          <span class="chef-card-total">รวมสุทธิ ${orderTotal} ฿</span>
          <span class="chef-card-time">${formatTime(order.createdAt)}</span>
        </div>
  
        <ul class="chef-card-items">
          ${itemsHtml}
        </ul>
  
        <button class="chef-done-btn" onclick="finishOrder('${order._id}')">
          เสร็จแล้ว
        </button>
      </div>
      `;
  
    }).join("");
  }
  function addOrderToUI(order) {
    const html = renderOrders([order]); // reuse ของเดิม
  
    // เอา HTML string ออกมา (เพราะ renderOrders ใส่ทั้ง list)
    const temp = document.createElement("div");
    temp.innerHTML = html;
  
    const newCard = temp.firstElementChild;
  
    orderListEl.prepend(newCard);
  }
  function updateOrderUI(order) {
    const card = document.querySelector(`[data-id="${order._id}"]`);
  
    if (card) {
      card.remove(); // ลบเมื่อ status = done
    }
  }

  

  async function fetchOrders() {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
  
      const html = renderOrders(Array.isArray(data) ? data : []);
      orderListEl.innerHTML = html; // 🔥 ต้องมีบรรทัดนี้
  
    } catch {
      orderListEl.innerHTML = `<p class="chef-error">โหลดออเดอร์ไม่สำเร็จ</p>`;
      if (emptyEl) emptyEl.style.display = "none";
    }
  }

  window.finishOrder = async function (id) {

    await fetch(`/api/orders/${id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        status: "done"
      })
    });

    
  };

  fetchOrders();

  
  setInterval(renderAlert, 2000);

})();
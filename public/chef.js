(function () {

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

    if (!orderListEl) return;

    if (orders.length === 0) {
      orderListEl.innerHTML = "";
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }

    if (emptyEl) emptyEl.style.display = "none";

    orderListEl.innerHTML = orders.map(order => {

      const itemsHtml = order.items.map(item => {

        let line = `${item.name} x${item.quantity}`;

        if (item.note)
          line += ` <span class="chef-item-note">(${escapeHtml(item.note)})</span>`;

        if (item.noVegetable)
          line += ` <span class="chef-item-tag">ไม่ใส่ผัก</span>`;

        return `<li class="chef-order-item">${line}</li>`;

      }).join("");

      return `
      <div class="chef-card" data-id="${order._id}">
        <div class="chef-card-head">
          <span class="chef-card-table">โต๊ะ ${escapeHtml(order.table)}</span>
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

  async function fetchOrders() {

    try {

      const res = await fetch("/api/orders");
      const data = await res.json();

      renderOrders(Array.isArray(data) ? data : []);

    } catch {

      orderListEl.innerHTML = `<p class="chef-error">โหลดออเดอร์ไม่สำเร็จ</p>`;

      if (emptyEl)
        emptyEl.style.display = "none";
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

    fetchOrders();
  };

  fetchOrders();

  setInterval(fetchOrders, 5000);
  setInterval(renderAlert, 2000);

})();
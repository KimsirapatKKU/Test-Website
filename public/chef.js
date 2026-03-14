(function () {
  const orderListEl = document.getElementById("chefOrderList");
  const emptyEl = document.getElementById("chefEmpty");

  function formatTime(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "";
    }
  }

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function renderOrders(orders) {
    if (!orderListEl) return;
    if (orders.length === 0) {
      orderListEl.innerHTML = "";
      if (emptyEl) emptyEl.style.display = "block";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    orderListEl.innerHTML = orders.map(function (order) {
      const itemsHtml = order.items.map(function (item) {
        let line = item.name + " x" + item.quantity;
        if (item.note) line += " <span class=\"chef-item-note\">(" + escapeHtml(item.note) + ")</span>";
        if (item.noVegetable) line += " <span class=\"chef-item-tag\">ไม่ใส่ผัก</span>";
        return "<li class=\"chef-order-item\">" + line + "</li>";
      }).join("");

      return "<div class=\"chef-card\" data-id=\"" + order.id + "\">" +
        "<div class=\"chef-card-head\">" +
        "<span class=\"chef-card-table\">โต๊ะ " + escapeHtml(order.table) + "</span>" +
        "<span class=\"chef-card-time\">" + formatTime(order.createdAt) + "</span>" +
        "</div>" +
        "<ul class=\"chef-card-items\">" + itemsHtml + "</ul>" +
        "</div>";
    }).join("");
  }

  function fetchOrders() {
    fetch("/api/orders")
      .then(function (res) { return res.json(); })
      .then(function (data) {
        renderOrders(Array.isArray(data) ? data : []);
      })
      .catch(function () {
        orderListEl.innerHTML = "<p class=\"chef-error\">โหลดออเดอร์ไม่สำเร็จ</p>";
        if (emptyEl) emptyEl.style.display = "none";
      });
  }

  fetchOrders();
  setInterval(fetchOrders, 5000);
})();

import { api, money, showMessage } from "./api.js";

const form = document.querySelector("#admin-product-form");
const message = document.querySelector("#admin-message");
const productList = document.querySelector("#admin-products");
const orderList = document.querySelector("#admin-orders");
const categorySelect = document.querySelector("#admin-category");
const productId = document.querySelector("#admin-product-id");
const title = document.querySelector("#product-form-title");

function resetForm() {
  form.reset();
  productId.value = "";
  title.textContent = "Crear producto";
  document.querySelector("#admin-active").checked = true;
}

function renderProducts(products) {
  productList.replaceChildren();
  for (const product of products) {
    const row = document.createElement("article");
    row.className = "admin-order";
    const name = document.createElement("strong");
    name.textContent = `${product.name} — ${money(product.price)}`;
    const info = document.createElement("p");
    info.textContent = `${product.category_name} · Stock: ${product.stock} · ${product.active ? "Activo" : "Inactivo"}`;
    const edit = document.createElement("button");
    edit.className = "btn";
    edit.type = "button";
    edit.textContent = "Editar";
    edit.addEventListener("click", () => {
      productId.value = product.id;
      document.querySelector("#admin-name").value = product.name;
      document.querySelector("#admin-description").value = product.description || "";
      categorySelect.value = product.category_id;
      document.querySelector("#admin-price").value = product.price;
      document.querySelector("#admin-stock").value = product.stock;
      document.querySelector("#admin-kind").value = product.kind;
      document.querySelector("#admin-image").value = product.image_url || "";
      document.querySelector("#admin-active").checked = Boolean(product.active);
      title.textContent = `Editar: ${product.name}`;
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    const deactivate = document.createElement("button");
    deactivate.className = "btn";
    deactivate.type = "button";
    deactivate.textContent = product.active ? "Desactivar" : "Activar";
    deactivate.addEventListener("click", async () => {
      try {
        await api(`/admin/products/${product.id}`, {
          method: "PUT",
          body: JSON.stringify({ active: !product.active })
        });
        await load();
      } catch (error) {
        showMessage(message, error.message, true);
      }
    });
    row.append(name, info, edit, deactivate);
    productList.append(row);
  }
}

function renderOrders(orders) {
  orderList.replaceChildren();
  if (!orders.length) {
    orderList.textContent = "Aún no hay pedidos.";
    return;
  }
  for (const order of orders) {
    const card = document.createElement("article");
    card.className = "admin-order";
    const heading = document.createElement("strong");
    heading.textContent = `Pedido #${order.id} — ${money(order.total)} (${order.status})`;
    const description = document.createElement("p");
    description.textContent = `${order.customer_name} · ${order.customer_email} · ${order.payment_method} · ${new Date(order.created_at).toLocaleString("es-CO")}`;
    card.append(heading, description);
    orderList.append(card);
  }
}

async function load() {
  const [products, orders] = await Promise.all([
    api("/admin/products"),
    api("/admin/orders")
  ]);
  renderProducts(products);
  renderOrders(orders);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const id = productId.value;
  const payload = {
    name: document.querySelector("#admin-name").value.trim(),
    description: document.querySelector("#admin-description").value.trim(),
    categoryId: Number(categorySelect.value),
    price: Number(document.querySelector("#admin-price").value),
    stock: Number(document.querySelector("#admin-stock").value),
    kind: document.querySelector("#admin-kind").value,
    imageUrl: document.querySelector("#admin-image").value.trim() || null,
    active: document.querySelector("#admin-active").checked
  };
  try {
    await api(id ? `/admin/products/${id}` : "/admin/products", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(payload)
    });
    showMessage(message, "Producto guardado.");
    resetForm();
    await load();
  } catch (error) {
    showMessage(message, error.message, true);
  }
});

document.querySelector("#admin-cancel").addEventListener("click", resetForm);

try {
  const user = await api("/auth/me");
  if (user.role !== "admin") throw new Error("Esta cuenta no tiene permisos de administración.");
  const categories = await api("/categories");
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categorySelect.append(option);
  }
  await load();
} catch (error) {
  showMessage(message, error.message, true);
  form.querySelectorAll("input,textarea,select,button").forEach((element) => { element.disabled = true; });
  if ([401, 403].includes(error.status)) {
    setTimeout(() => { location.href = "index.html"; }, 2500);
  }
}

import { api, money, showMessage } from "./api.js";

const itemsNode = document.querySelector("#cart-items");
const summaryNode = document.querySelector("#cart-summary");
const paymentSelect = document.querySelector("#payment-method");
const message = document.querySelector("#cart-message");
const checkoutButton = document.querySelector("#checkout-button");
let cart = { items: [], total: 0 };

function render() {
  itemsNode.replaceChildren();
  summaryNode.replaceChildren();
  if (!cart.items.length) {
    itemsNode.textContent = "Tu carrito está vacío. Explora el catálogo para agregar artículos.";
    checkoutButton.disabled = true;
    return;
  }
  checkoutButton.disabled = false;
  for (const item of cart.items) {
    const row = document.createElement("div");
    row.className = "cart-item";
    const image = document.createElement("img");
    image.src = item.image_url || "";
    image.alt = item.name;
    const content = document.createElement("div");
    content.className = "cart-item-content";
    const name = document.createElement("div");
    name.className = "name";
    name.textContent = item.name;
    const price = document.createElement("div");
    price.textContent = money(item.unit_price);
    const subtotal = document.createElement("div");
    subtotal.textContent = `Subtotal: ${money(item.subtotal)}`;
    content.append(name, price, subtotal);
    const quantity = document.createElement("input");
    quantity.className = "quantity";
    quantity.type = "number";
    quantity.min = "1";
    quantity.max = item.stock;
    quantity.value = item.quantity;
    quantity.setAttribute("aria-label", `Cantidad de ${item.name}`);
    quantity.addEventListener("change", () => updateQuantity(item.product_id, quantity.value));
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "btn";
    remove.textContent = "Quitar";
    remove.addEventListener("click", () => removeItem(item.product_id));
    row.append(image, content, quantity, remove);
    itemsNode.append(row);
    const line = document.createElement("div");
    line.className = "line";
    const label = document.createElement("span");
    label.textContent = item.name;
    const amount = document.createElement("span");
    amount.textContent = money(item.subtotal);
    line.append(label, amount);
    summaryNode.append(line);
  }
  const total = document.createElement("div");
  total.className = "line total";
  total.textContent = `Total: ${money(cart.total)}`;
  summaryNode.append(total);
}

async function loadCart() {
  cart = await api("/cart");
  render();
}

async function updateQuantity(productId, quantity) {
  try {
    const parsed = Number(quantity);
    if (!Number.isInteger(parsed) || parsed < 1) throw new Error("La cantidad debe ser un entero mayor que cero.");
    await api(`/cart/items/${productId}`, {
      method: "PUT",
      body: JSON.stringify({ quantity: parsed })
    });
    showMessage(message, "");
    await loadCart();
  } catch (error) {
    showMessage(message, error.message, true);
    await loadCart();
  }
}

async function removeItem(productId) {
  try {
    await api(`/cart/items/${productId}`, { method: "DELETE" });
    showMessage(message, "Artículo eliminado del carrito.");
    await loadCart();
  } catch (error) {
    showMessage(message, error.message, true);
  }
}

checkoutButton.addEventListener("click", async () => {
  checkoutButton.disabled = true;
  showMessage(message, "Registrando pedido de prueba...");
  try {
    const order = await api("/orders", {
      method: "POST",
      body: JSON.stringify({ paymentMethodId: Number(paymentSelect.value) })
    });
    showMessage(message, `Pedido #${order.id} confirmado en modo de prueba. No se realizó ningún cobro.`);
    await loadCart();
  } catch (error) {
    showMessage(message, error.message, true);
  } finally {
    checkoutButton.disabled = cart.items.length === 0;
  }
});

try {
  const [methods] = await Promise.all([
    api("/payments/methods"),
    loadCart()
  ]);
  for (const method of methods) {
    const option = document.createElement("option");
    option.value = method.id;
    option.textContent = method.name;
    paymentSelect.append(option);
  }
} catch (error) {
  showMessage(message, error.message, true);
}

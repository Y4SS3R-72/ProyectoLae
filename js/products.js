import { api, money, showMessage } from "./api.js";

const list = document.querySelector("#product-list");
const message = document.querySelector("#products-message");
const search = document.querySelector("#product-search");
const categoryFilter = document.querySelector("#category-filter");
let products = [];

function render() {
  const term = search.value.trim().toLocaleLowerCase();
  const categoryId = categoryFilter.value;
  const matches = products.filter((product) =>
    (!categoryId || String(product.category_id) === categoryId) &&
    (!term || `${product.name} ${product.description || ""}`.toLocaleLowerCase().includes(term))
  );
  list.replaceChildren();
  if (!matches.length) {
    list.textContent = "No hay productos disponibles con esos criterios.";
    return;
  }
  for (const product of matches) {
    const card = document.createElement("article");
    card.className = "product-result";
    const image = document.createElement("img");
    image.alt = product.name;
    image.loading = "lazy";
    if (product.image_url) image.src = product.image_url;
    else image.hidden = true;
    const content = document.createElement("div");
    content.className = "product-result-content";
    const title = document.createElement("h2");
    title.textContent = product.name;
    const category = document.createElement("p");
    category.textContent = product.category_name;
    const details = document.createElement("details");
    const summary = document.createElement("summary");
    summary.textContent = "Ver detalles";
    const description = document.createElement("p");
    description.textContent = product.description || "Sin descripción.";
    details.append(summary, description);
    const price = document.createElement("p");
    price.textContent = money(product.price);
    const stock = document.createElement("p");
    stock.textContent = product.stock > 0 ? `Disponibles: ${product.stock}` : "Sin existencias";
    const button = document.createElement("button");
    button.className = "btn primary full";
    button.type = "button";
    button.textContent = product.stock > 0 ? "Agregar al carrito" : "Agotado";
    button.disabled = product.stock < 1;
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await api("/cart/items", {
          method: "POST",
          body: JSON.stringify({ productId: product.id, quantity: 1 })
        });
        showMessage(message, `${product.name} se agregó al carrito.`);
      } catch (error) {
        showMessage(message, error.message, true);
      } finally {
        button.disabled = product.stock < 1;
      }
    });
    content.append(title, category, details, price, stock, button);
    card.append(image, content);
    list.append(card);
  }
}

try {
  const [categories, result] = await Promise.all([
    api("/categories"),
    api("/products")
  ]);
  products = result;
  for (const category of categories) {
    const option = document.createElement("option");
    option.value = category.id;
    option.textContent = category.name;
    categoryFilter.append(option);
  }
  search.addEventListener("input", render);
  categoryFilter.addEventListener("change", render);
  render();
} catch (error) {
  showMessage(message, error.message, true);
}

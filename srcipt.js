
const STORAGE_PRODUCTS = "productList";
const STORAGE_CART = "cartList";

function readStorage(key) {
  try {
    const data = JSON.parse(localStorage.getItem(key));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

let products = readStorage(STORAGE_PRODUCTS);
let cart = readStorage(STORAGE_CART);
let editingId = null;

const $ = (id) => document.getElementById(id);

function saveData() {
  localStorage.setItem(STORAGE_PRODUCTS, JSON.stringify(products));
  localStorage.setItem(STORAGE_CART, JSON.stringify(cart));
}

function showMessage(id, message) {
  $(id).textContent = message;
}

function validProduct(id, name, quantity) {
  return (
    id.trim() !== "" &&
    name.trim() !== "" &&
    Number.isInteger(quantity) &&
    quantity > 0
  );
}

function createCell(row, value) {
  const cell = row.insertCell();
  cell.textContent = value;
  return cell;
}

function createButton(text, callback, danger = false) {
  const button = document.createElement("button");
  button.textContent = text;

  if (danger) {
    button.classList.add("danger");
  }

  button.addEventListener("click", callback);
  return button;
}

// PREKIŲ ATVAIZDAVIMAS
function renderProducts() {
  const table = $("productTable");
  table.innerHTML = "";

  if (products.length === 0) {
    const row = table.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 4;
    cell.textContent = "Sandėlyje prekių nėra.";
    return;
  }

  products.forEach((product) => {
    const row = table.insertRow();

    createCell(row, product.id);
    createCell(row, product.name);
    createCell(row, product.quantity);

    const actions = row.insertCell();

    actions.appendChild(
      createButton("Redaguoti", () => editProduct(product.id))
    );

    actions.appendChild(
      createButton("Ištrinti", () => deleteProduct(product.id), true)
    );
  });
}

// PREKĖS ĮVEDIMAS IR KOREGAVIMAS
$("productForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const id = $("productId").value.trim();
  const name = $("productName").value.trim();
  const quantityText = $("productQuantity").value.trim();
  const quantity = Number(quantityText);

  if (
    !validProduct(id, name, quantity) ||
    quantityText === ""
  ) {
    showMessage(
      "productMessage",
      "Užpildykite visus laukus. Kiekis turi būti teigiamas sveikasis skaičius."
    );
    return;
  }

  if (editingId !== null) {
    const duplicate = products.some(
      (p) => p.id === id && p.id !== editingId
    );

    if (duplicate) {
      showMessage("productMessage", "Toks prekės ID jau egzistuoja.");
      return;
    }

    const product = products.find((p) => p.id === editingId);

    if (!product) {
      showMessage("productMessage", "Redaguojama prekė nerasta.");
      return;
    }

    // Atnaujinami sandėlio duomenys
    product.id = id;
    product.name = name;
    product.quantity = quantity;

    // Sinchronizuojamas krepšelis
    const cartProduct = cart.find((p) => p.id === editingId);

    if (cartProduct) {
      cartProduct.id = id;
      cartProduct.name = name;
      cartProduct.quantity = Math.min(
        cartProduct.quantity,
        quantity
      );
    }

    showMessage("productMessage", "Prekė sėkmingai atnaujinta.");
  } else {
    if (products.some((p) => p.id === id)) {
      showMessage(
        "productMessage",
        "Prekė su tokiu ID jau egzistuoja!"
      );
      return;
    }

    products.push({ id, name, quantity });
    showMessage("productMessage", "Prekė sėkmingai pridėta.");
  }

  saveData();
  renderProducts();
  renderCart();
  resetForm();
});

function editProduct(id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;

  $("productId").value = product.id;
  $("productName").value = product.name;
  $("productQuantity").value = product.quantity;

  editingId = id;
  $("saveBtn").textContent = "Išsaugoti pakeitimus";

  showMessage("productMessage", "Redaguojama prekė: " + id);
}

function resetForm() {
  $("productForm").reset();
  editingId = null;
  $("saveBtn").textContent = "Pridėti prekę";
}

$("cancelBtn").addEventListener("click", () => {
  resetForm();
  showMessage("productMessage", "");
});

// PREKĖS TRYNIMAS
function deleteProduct(id) {
  if (!confirm("Ar tikrai norite ištrinti šią prekę?")) {
    return;
  }

  products = products.filter((p) => p.id !== id);
  cart = cart.filter((p) => p.id !== id);

  if (editingId === id) resetForm();

  saveData();
  renderProducts();
  renderCart();

  showMessage(
    "productMessage",
    "Prekė pašalinta iš sandėlio ir krepšelio."
  );
}

// PAIEŠKA PAGAL ID
$("searchBtn").addEventListener("click", searchProduct);

function searchProduct() {
  const id = $("searchId").value.trim();
  const product = products.find((p) => p.id === id);
  const result = $("searchResult");

  result.innerHTML = "";

  if (!id) {
    showMessage("searchMessage", "Įveskite prekės ID.");
    return;
  }

  if (!product) {
    showMessage("searchMessage", "Prekė nerasta.");
    return;
  }

  showMessage("searchMessage", "Prekė surasta!");

  const box = document.createElement("div");
  box.className = "found-product";

  const info = document.createElement("p");
  info.textContent =
    `ID: ${product.id} | ${product.name} | Kiekis: ${product.quantity}`;

  const addButton = createButton("Įdėti į krepšelį", () => {
    addToCart(product.id, 1);
  });

  box.append(info, addButton);
  result.appendChild(box);
}

// ĮDĖJIMAS Į KREPŠELĮ
$("cartForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const id = $("cartId").value.trim();
  const quantityText = $("cartQuantity").value.trim();
  const quantity = Number(quantityText);

  if (
    !id ||
    quantityText === "" ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  ) {
    showMessage("cartMessage", "Įveskite teisingą ID ir kiekį.");
    return;
  }

  addToCart(id, quantity);
});

function addToCart(id, quantity) {
  const product = products.find((p) => p.id === id);

  if (!product) {
    showMessage("cartMessage", "Tokios prekės sandėlyje nėra.");
    return;
  }

  const existing = cart.find((p) => p.id === id);
  const currentQuantity = existing ? existing.quantity : 0;

  if (currentQuantity + quantity > product.quantity) {
    showMessage(
      "cartMessage",
      "Nepakanka prekių sandėlyje."
    );
    return;
  }

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      quantity
    });
  }

  saveData();
  renderCart();

  showMessage("cartMessage", "Prekė įdėta į krepšelį.");
  $("cartForm").reset();
}

// KREPŠELIO ATVAIZDAVIMAS
function renderCart() {
  const table = $("cartTable");
  table.innerHTML = "";

  if (cart.length === 0) {
    const row = table.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 4;
    cell.textContent = "Krepšelis tuščias.";
    return;
  }

  cart.forEach((product) => {
    const row = table.insertRow();

    createCell(row, product.id);
    createCell(row, product.name);
    createCell(row, product.quantity);

    const actions = row.insertCell();

    actions.appendChild(
      createButton(
        "Pašalinti",
        () => removeFromCart(product.id),
        true
      )
    );
  });
}

function removeFromCart(id) {
  cart = cart.filter((p) => p.id !== id);

  saveData();
  renderCart();

  showMessage("cartMessage", "Prekė pašalinta iš krepšelio.");
}

// PRADINIS ATVAIZDAVIMAS
renderProducts();
renderCart();

// Cozy Auto — Frontend Vanilla JS Application

// Automatically detect API host: if served from same origin (e.g. FastAPI /app), use relative path, otherwise default to localhost:8000
const API_BASE = (window.location.port === "8000" || window.location.port === "8080")
  ? "" 
  : "http://127.0.0.1:8000";

const STATE = {
  page: 1,
  pageSize: 9,
  brand: "",
  fuel_type: "",
  min_year: "",
  totalPages: 1,
  totalCars: 0,
  cars: [],
  pendingDeleteId: null,
};

// DOM Elements
const carsGrid = document.getElementById("carsGrid");
const resultsCount = document.getElementById("resultsCount");
const apiStatusBadge = document.getElementById("apiStatusBadge");
const pageIndicator = document.getElementById("pageIndicator");
const btnPrevPage = document.getElementById("btnPrevPage");
const btnNextPage = document.getElementById("btnNextPage");

// Filters
const filterBrand = document.getElementById("filterBrand");
const filterFuel = document.getElementById("filterFuel");
const filterMinYear = document.getElementById("filterMinYear");
const pageSizeSelect = document.getElementById("pageSizeSelect");
const btnResetFilters = document.getElementById("btnResetFilters");

// Stats elements
const statTotalCars = document.getElementById("statTotalCars");
const statAvailableCars = document.getElementById("statAvailableCars");
const statAvgPrice = document.getElementById("statAvgPrice");
const statEcoCars = document.getElementById("statEcoCars");

// Modals
const createModal = document.getElementById("createModal");
const editModal = document.getElementById("editModal");
const deleteModal = document.getElementById("deleteModal");
const btnOpenCreate = document.getElementById("btnOpenCreate");
const btnCloseCreate = document.getElementById("btnCloseCreate");
const btnCancelCreate = document.getElementById("btnCancelCreate");
const createCarForm = document.getElementById("createCarForm");

const btnCloseEdit = document.getElementById("btnCloseEdit");
const btnCancelEdit = document.getElementById("btnCancelEdit");
const editCarForm = document.getElementById("editCarForm");
const editSubtitle = document.getElementById("editSubtitle");

const btnCloseDelete = document.getElementById("btnCloseDelete");
const btnCancelDelete = document.getElementById("btnCancelDelete");
const btnConfirmDelete = document.getElementById("btnConfirmDelete");
const deleteCarSummary = document.getElementById("deleteCarSummary");

const toastContainer = document.getElementById("toastContainer");

// Toast Notifications
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}

// Helpers
function formatCurrency(amount) {
  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function escapeHtml(text) {
  if (text === null || text === undefined) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getFuelBadgeClass(fuelType) {
  const f = (fuelType || "").toLowerCase();
  if (f.includes("електр") || f.includes("electric")) return "badge-fuel-electric";
  if (f.includes("гібрид") || f.includes("hybrid")) return "badge-fuel-hybrid";
  if (f.includes("дизел") || f.includes("diesel")) return "badge-fuel-diesel";
  return "badge-fuel-petrol";
}

// Fetch and load cars
async function loadCars() {
  carsGrid.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 60px 0; color: var(--text-muted);">
      <p>Завантаження каталогу автомобілів...</p>
    </div>
  `;

  const params = new URLSearchParams();
  params.append("page", STATE.page);
  params.append("page_size", STATE.pageSize);
  if (STATE.brand.trim()) params.append("brand", STATE.brand.trim());
  if (STATE.fuel_type.trim()) params.append("fuel_type", STATE.fuel_type.trim());
  if (STATE.min_year) params.append("min_year", STATE.min_year);

  try {
    const res = await fetch(`${API_BASE}/cars/?${params.toString()}`);
    if (!res.ok) throw new Error(`HTTP error ${res.status}`);

    const data = await res.json();
    STATE.cars = data.items;
    STATE.totalCars = data.total;
    STATE.totalPages = data.total_pages;

    updateApiStatus(true);
    renderStats();
    renderCarsGrid(data.items);
    renderPagination(data);
  } catch (error) {
    console.error("Помилка завантаження авто:", error);
    updateApiStatus(false);
    carsGrid.innerHTML = `
      <div class="empty-catalog">
        <div class="empty-icon">⚠️</div>
        <div class="empty-title">Не вдалося підключитися до сервера</div>
        <div class="empty-desc">Переконайтеся, що FastAPI сервер запущено на порту 8000 (<code>uv run car-catalog</code>).</div>
        <button class="btn btn-secondary" onclick="loadCars()">Спробувати знову</button>
      </div>
    `;
    resultsCount.textContent = "Помилка зв'язку з API";
  }
}

function updateApiStatus(isConnected) {
  if (isConnected) {
    apiStatusBadge.className = "api-status connected";
    apiStatusBadge.querySelector(".status-text").textContent = "API підключено";
  } else {
    apiStatusBadge.className = "api-status error";
    apiStatusBadge.querySelector(".status-text").textContent = "Сервер недоступний";
  }
}

// Calculate stats across all available items
function renderStats() {
  statTotalCars.textContent = STATE.totalCars;

  if (STATE.cars.length > 0) {
    const available = STATE.cars.filter(c => c.is_available).length;
    const avg = STATE.cars.reduce((sum, c) => sum + c.price, 0) / STATE.cars.length;
    const eco = STATE.cars.filter(c => {
      const f = (c.fuel_type || "").toLowerCase();
      return f.includes("електр") || f.includes("гібрид") || f.includes("electric") || f.includes("hybrid");
    }).length;

    statAvailableCars.textContent = `${available} (на сторінці)`;
    statAvgPrice.textContent = formatCurrency(avg);
    statEcoCars.textContent = eco;
  } else {
    statAvailableCars.textContent = "0";
    statAvgPrice.textContent = "$0";
    statEcoCars.textContent = "0";
  }
}

// Render Cars
function renderCarsGrid(cars) {
  if (!cars || cars.length === 0) {
    carsGrid.innerHTML = `
      <div class="empty-catalog">
        <div class="empty-icon">🚘</div>
        <div class="empty-title">Автомобілів не знайдено</div>
        <div class="empty-desc">Спробуйте змінити критерії пошуку або додайте перше авто до каталогу.</div>
        <button class="btn btn-primary" onclick="openCreateModal()">
          + Додати автомобіль
        </button>
      </div>
    `;
    resultsCount.textContent = "0 автомобілів знайдено";
    return;
  }

  resultsCount.textContent = `Знайдено ${STATE.totalCars} авто (сторінка ${STATE.page} з ${Math.max(1, STATE.totalPages)})`;

  carsGrid.innerHTML = cars.map(car => {
    const fuelClass = getFuelBadgeClass(car.fuel_type);
    const availabilityBadge = car.is_available
      ? `<span class="badge badge-available">● В наявності</span>`
      : `<span class="badge badge-unavailable">Продано / Замовлено</span>`;

    const ratingBadge = car.rating !== null && car.rating !== undefined
      ? `<span class="badge badge-rating">★ ${car.rating.toFixed(1)}</span>`
      : "";

    const engineDisplay = car.engine_capacity
      ? `${car.engine_capacity} л`
      : car.engine_power
      ? `${car.engine_power} к.с.`
      : "—";

    const featuresHtml = (car.features || [])
      .map(f => `<span class="tag-pill">${escapeHtml(f)}</span>`)
      .join("");

    return `
      <article class="car-card" data-car-id="${car.id}">
        <div>
          <div class="card-top">
            <div class="car-title-group">
              <h3 class="car-title">${escapeHtml(car.brand)} ${escapeHtml(car.model)}</h3>
              <span class="car-dealer">${escapeHtml(car.dealer_or_manufacturer)}</span>
            </div>
            <div class="car-price-badge">
              <div class="price-value">${formatCurrency(car.price)}</div>
            </div>
          </div>

          <div class="card-badges">
            <span class="badge badge-year">${car.year} р.</span>
            <span class="badge badge-body">${escapeHtml(car.body_type)}</span>
            <span class="badge ${fuelClass}">${escapeHtml(car.fuel_type)}</span>
            ${ratingBadge}
            ${availabilityBadge}
          </div>

          <div class="specs-row">
            <div class="spec-item">
              <span>Двигун / Тяга</span>
              <strong>${engineDisplay}</strong>
            </div>
            <div class="spec-item">
              <span>Потужність</span>
              <strong>${car.engine_power ? car.engine_power + ' к.с.' : '—'}</strong>
            </div>
            <div class="spec-item">
              <span>Рік випуску</span>
              <strong>${car.year}</strong>
            </div>
          </div>

          <div class="vin-box">
            <span>VIN: <strong>${escapeHtml(car.vin)}</strong></span>
            <button class="btn-copy-vin" title="Копіювати VIN" onclick="copyVin('${escapeHtml(car.vin)}')">
              📋
            </button>
          </div>

          ${car.description ? `<p class="car-description">${escapeHtml(car.description)}</p>` : ""}

          ${featuresHtml ? `<div class="features-tags">${featuresHtml}</div>` : ""}
        </div>

        <div class="card-actions">
          <button class="btn btn-secondary" onclick="openEditModal(${car.id})">
            Редагувати
          </button>
          <button class="btn btn-secondary" style="color: var(--danger-red);" onclick="openDeleteModal(${car.id}, '${escapeHtml(car.brand)} ${escapeHtml(car.model)}')">
            Видалити
          </button>
        </div>
      </article>
    `;
  }).join("");
}

// Pagination logic
function renderPagination(data) {
  const current = data.page;
  const total = data.total_pages || 1;

  pageIndicator.textContent = `Сторінка ${current} з ${total}`;
  btnPrevPage.disabled = !data.has_prev;
  btnNextPage.disabled = !data.has_next;
}

btnPrevPage.addEventListener("click", () => {
  if (STATE.page > 1) {
    STATE.page--;
    loadCars();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

btnNextPage.addEventListener("click", () => {
  if (STATE.page < STATE.totalPages) {
    STATE.page++;
    loadCars();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
});

// Filters handlers
let searchTimeout = null;
filterBrand.addEventListener("input", (e) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    STATE.brand = e.target.value;
    STATE.page = 1;
    loadCars();
  }, 250);
});

filterFuel.addEventListener("change", (e) => {
  STATE.fuel_type = e.target.value;
  STATE.page = 1;
  loadCars();
});

filterMinYear.addEventListener("change", (e) => {
  STATE.min_year = e.target.value ? parseInt(e.target.value, 10) : "";
  STATE.page = 1;
  loadCars();
});

pageSizeSelect.addEventListener("change", (e) => {
  STATE.pageSize = parseInt(e.target.value, 10);
  STATE.page = 1;
  loadCars();
});

btnResetFilters.addEventListener("click", () => {
  filterBrand.value = "";
  filterFuel.value = "";
  filterMinYear.value = "";
  STATE.brand = "";
  STATE.fuel_type = "";
  STATE.min_year = "";
  STATE.page = 1;
  loadCars();
  showToast("Фільтри скинуто", "info");
});

// Copy VIN helper
window.copyVin = function(vin) {
  navigator.clipboard.writeText(vin).then(() => {
    showToast(`VIN-код ${vin} скопійовано!`, "info");
  }).catch(() => {
    showToast("Не вдалося скопіювати", "error");
  });
};

// Create Modal functions
window.openCreateModal = function() {
  createCarForm.reset();
  document.getElementById("createAvailable").checked = true;
  createModal.showModal();
};

btnOpenCreate.addEventListener("click", openCreateModal);
btnCloseCreate.addEventListener("click", () => createModal.close());
btnCancelCreate.addEventListener("click", () => createModal.close());

createCarForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(createCarForm);
  const featuresRaw = document.getElementById("createFeatures").value;
  const features = featuresRaw
    ? featuresRaw.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  const payload = {
    brand: formData.get("brand").trim(),
    model: formData.get("model").trim(),
    dealer_or_manufacturer: formData.get("dealer_or_manufacturer").trim(),
    vin: formData.get("vin").trim().toUpperCase(),
    body_type: formData.get("body_type"),
    fuel_type: formData.get("fuel_type"),
    year: parseInt(formData.get("year"), 10),
    price: parseFloat(formData.get("price")),
    engine_capacity: formData.get("engine_capacity") ? parseFloat(formData.get("engine_capacity")) : null,
    engine_power: formData.get("engine_power") ? parseInt(formData.get("engine_power"), 10) : null,
    rating: formData.get("rating") ? parseFloat(formData.get("rating")) : null,
    is_available: document.getElementById("createAvailable").checked,
    description: formData.get("description").trim() || null,
    features: features,
  };

  try {
    const res = await fetch(`${API_BASE}/cars/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 409) {
      const err = await res.json();
      showToast(err.detail || "Авто з таким VIN вже існує!", "error");
      return;
    }

    if (!res.ok) {
      const err = await res.json();
      const msg = err.detail?.[0]?.msg || err.detail || "Помилка валідації";
      showToast(`Помилка: ${msg}`, "error");
      return;
    }

    createModal.close();
    showToast("Автомобіль успішно додано до каталогу!", "success");
    loadCars();
  } catch (error) {
    showToast("Мережева помилка при створенні", "error");
  }
});

// Edit Modal functions
window.openEditModal = async function(carId) {
  try {
    const res = await fetch(`${API_BASE}/cars/${carId}`);
    if (!res.ok) throw new Error("Car not found");
    const car = await res.json();

    document.getElementById("editCarId").value = car.id;
    document.getElementById("editBrand").value = car.brand;
    document.getElementById("editModel").value = car.model;
    document.getElementById("editDealer").value = car.dealer_or_manufacturer;
    document.getElementById("editVin").value = car.vin;
    document.getElementById("editBodyType").value = car.body_type;
    document.getElementById("editFuelType").value = car.fuel_type;
    document.getElementById("editYear").value = car.year;
    document.getElementById("editPrice").value = car.price;
    document.getElementById("editCapacity").value = car.engine_capacity || "";
    document.getElementById("editPower").value = car.engine_power || "";
    document.getElementById("editRating").value = car.rating || "";
    document.getElementById("editAvailable").checked = car.is_available;
    document.getElementById("editFeatures").value = (car.features || []).join(", ");
    document.getElementById("editDescription").value = car.description || "";

    editSubtitle.textContent = `${car.brand} ${car.model} (${car.year})`;
    editModal.showModal();
  } catch (err) {
    showToast("Не вдалося завантажити дані для редагування", "error");
  }
};

btnCloseEdit.addEventListener("click", () => editModal.close());
btnCancelEdit.addEventListener("click", () => editModal.close());

editCarForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const carId = document.getElementById("editCarId").value;
  const formData = new FormData(editCarForm);

  const featuresRaw = document.getElementById("editFeatures").value;
  const features = featuresRaw
    ? featuresRaw.split(",").map(s => s.trim()).filter(Boolean)
    : [];

  const payload = {
    brand: formData.get("brand").trim(),
    model: formData.get("model").trim(),
    dealer_or_manufacturer: formData.get("dealer_or_manufacturer").trim(),
    vin: formData.get("vin").trim().toUpperCase(),
    body_type: formData.get("body_type"),
    fuel_type: formData.get("fuel_type"),
    year: parseInt(formData.get("year"), 10),
    price: parseFloat(formData.get("price")),
    engine_capacity: formData.get("engine_capacity") ? parseFloat(formData.get("engine_capacity")) : null,
    engine_power: formData.get("engine_power") ? parseInt(formData.get("engine_power"), 10) : null,
    rating: formData.get("rating") ? parseFloat(formData.get("rating")) : null,
    is_available: document.getElementById("editAvailable").checked,
    description: formData.get("description").trim() || null,
    features: features,
  };

  try {
    const res = await fetch(`${API_BASE}/cars/${carId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.status === 409) {
      const err = await res.json();
      showToast(err.detail || "VIN-код конфліктує з іншим авто", "error");
      return;
    }

    if (!res.ok) {
      const err = await res.json();
      const msg = err.detail?.[0]?.msg || err.detail || "Помилка оновлення";
      showToast(`Помилка: ${msg}`, "error");
      return;
    }

    editModal.close();
    showToast("Дані автомобіля успішно оновлено!", "success");
    loadCars();
  } catch (error) {
    showToast("Помилка при збереженні змін", "error");
  }
});

// Delete Modal functions
window.openDeleteModal = function(carId, carName) {
  STATE.pendingDeleteId = carId;
  deleteCarSummary.innerHTML = `Ви впевнені, що хочете видалити <strong>${carName}</strong>? Цю дію неможливо скасувати.`;
  deleteModal.showModal();
};

btnCloseDelete.addEventListener("click", () => deleteModal.close());
btnCancelDelete.addEventListener("click", () => deleteModal.close());

btnConfirmDelete.addEventListener("click", async () => {
  if (!STATE.pendingDeleteId) return;

  try {
    const res = await fetch(`${API_BASE}/cars/${STATE.pendingDeleteId}`, {
      method: "DELETE",
    });

    if (!res.ok) throw new Error("Delete failed");

    deleteModal.close();
    showToast("Автомобіль успішно видалено", "success");
    STATE.pendingDeleteId = null;
    loadCars();
  } catch (err) {
    showToast("Не вдалося видалити авто", "error");
  }
});

// Close dialog on backdrop click
[createModal, editModal, deleteModal].forEach(modal => {
  modal.addEventListener("click", (e) => {
    const rect = modal.getBoundingClientRect();
    const isInDialog = (
      rect.top <= e.clientY &&
      e.clientY <= rect.top + rect.height &&
      rect.left <= e.clientX &&
      e.clientX <= rect.left + rect.width
    );
    if (!isInDialog) {
      modal.close();
    }
  });
});

// Initial boot
document.addEventListener("DOMContentLoaded", () => {
  loadCars();
});

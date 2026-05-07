const burger = document.querySelector(".burger");
const nav = document.querySelector(".nav");

if (burger && nav) {
  burger.addEventListener("click", () => {
    nav.classList.toggle("open");
  });
}

if (nav) {
  nav.innerHTML = `
    <a href="index.html">Главная</a>
    <a href="category.html">Каталог</a>
    <a href="contacts.html">Контакты</a>
    <a href="about.html">О компании</a>
  `;
}

const data = window.PRODUCTS_DATA || { categories: {}, products: [] };
const page = document.body?.dataset?.page;
const FAVORITES_KEY = "bonite-favorites";

const formatPrice = (v) => `${new Intl.NumberFormat("ru-RU").format(v)} ₽`;
const getParam = (k) => new URLSearchParams(window.location.search).get(k);

function getFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function isFavorite(productId) {
  return getFavorites().includes(productId);
}

function saveFavorites(ids) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

function toggleFavorite(productId) {
  const current = getFavorites();
  if (current.includes(productId)) {
    const next = current.filter((id) => id !== productId);
    saveFavorites(next);
    return false;
  }
  const next = [...current, productId];
  saveFavorites(next);
  return true;
}

function renderFavoriteIcon(isActive) {
  return isActive ? "♥" : "♡";
}

function updateFavoritesHeaderLink() {
  const favLink = document.querySelector(".header-icons .icon-btn:nth-child(2)");
  if (!favLink) return;
  favLink.setAttribute("href", "favorites.html");
  favLink.setAttribute("aria-label", "Избранные товары");
}

function normalizeFooterLinks() {
  const footer = document.querySelector(".site-footer");
  if (!footer) return;
  const columns = footer.querySelectorAll(".footer-links");
  if (columns.length < 2) return;

  columns[0].innerHTML = `
    <a href="delivery-payment.html">Доставка и оплата</a>
    <a href="offer-agreement.html">Договор оферты</a>
    <a href="returns.html">Возврат товара</a>
    <a href="review.html">Оставить отзыв</a>
  `;

  columns[1].innerHTML = `
    <a href="copyright.html">Авторские права</a>
    <a href="wearing-rules.html">Правила ношения</a>
    <a href="privacy-policy.html">Политика конфиденциальности</a>
  `;
}

function renderMedia(media, className = "card-media") {
  if (!media) return `<div class="${className}"></div>`;
  if (media.type === "video") {
    return `<video class="${className}" src="${media.path}" muted loop autoplay playsinline controls onerror="this.remove()"></video>`;
  }
  return `<img class="${className}" src="${media.path}" alt="Фото товара" onerror="this.remove()" />`;
}

function renderCatalog() {
  const grid = document.querySelector("#catalog-grid");
  if (!grid) return;
  const searchInput = document.querySelector("#catalog-search");
  const emptyState = document.querySelector("#catalog-empty");
  const cat = getParam("cat");
  const category = data.categories?.[cat];
  const categoryProducts = cat
    ? data.products.filter((p) => p.categoryKey === cat)
    : data.products;

  const title = document.querySelector("#catalog-title");
  const subtitle = document.querySelector("#catalog-subtitle");
  if (title) title.textContent = cat && category ? category.label : "Каталог: все товары";
  if (subtitle) {
    subtitle.textContent = cat && category
      ? `Только товары категории: ${category.label}.`
      : "Полный список товаров BONITE.";
  }

  const renderList = (query = "") => {
    const normalized = query.trim().toLowerCase();
    const products = normalized
      ? categoryProducts.filter((p) => p.name.toLowerCase().includes(normalized))
      : categoryProducts;

    grid.innerHTML = products.map((p) => {
      const cover = p.media.find((m) => m.type === "image") || p.media[0];
      const href = `product.html?id=${encodeURIComponent(p.id)}`;
      const liked = isFavorite(p.id);
      return `<article class="card showcase-card">
        <a class="card-link-wrap" href="${href}" aria-label="Открыть ${p.name}">
          ${renderMedia(cover)}
        </a>
        <div class="card-content">
          <h3><a href="${href}">${p.name}</a></h3>
          <p class="card-meta">${p.categoryLabel}</p>
          <p class="price">${formatPrice(p.price)}</p>
          <button class="btn btn-outline favorite-toggle${liked ? " is-active" : ""}" type="button" data-favorite-id="${p.id}" aria-label="${liked ? "Убрать из избранного" : "Добавить в избранное"}">${renderFavoriteIcon(liked)} ${liked ? "В избранном" : "В избранное"}</button>
        </div>
      </article>`;
    }).join("");

    if (emptyState) {
      emptyState.style.display = products.length ? "none" : "block";
    }
  };

  renderList(searchInput?.value || "");
  grid.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const button = target.closest(".favorite-toggle");
    if (!(button instanceof HTMLButtonElement)) return;
    const productId = button.dataset.favoriteId;
    if (!productId) return;
    const active = toggleFavorite(productId);
    button.classList.toggle("is-active", active);
    button.textContent = `${renderFavoriteIcon(active)} ${active ? "В избранном" : "В избранное"}`;
    button.setAttribute("aria-label", active ? "Убрать из избранного" : "Добавить в избранное");
  });
  if (searchInput) {
    searchInput.addEventListener("input", () => renderList(searchInput.value));
  }
}

function renderCategories() {
  const grid = document.querySelector("#category-grid");
  if (!grid) return;
  grid.innerHTML = Object.values(data.categories).map((cat) => {
    const products = data.products.filter((p) => p.categoryKey === cat.key);
    const allImages = products.flatMap((p) =>
      p.media.filter((m) => m.type === "image")
    );
    const randomImage = allImages[Math.floor(Math.random() * allImages.length)] || cat.cover;

    return `
      <a class="card card-link-card showcase-card" href="catalog.html?cat=${encodeURIComponent(cat.key)}" aria-label="Открыть категорию ${cat.label}">
        ${renderMedia(randomImage)}
        <div class="card-content">
          <h3>${cat.label}</h3>
          <p class="card-meta">Открыть товары категории</p>
        </div>
      </a>
    `;
  }).join("");
}

function renderHomeCollections() {
  const grid = document.querySelector("#home-collections");
  if (!grid) return;

  const cards = Object.values(data.categories).map((cat) => {
    const products = data.products.filter((p) => p.categoryKey === cat.key);
    if (!products.length) return "";

    const allImages = products.flatMap((p) =>
      p.media.filter((m) => m.type === "image")
    );
    const randomImage = allImages[Math.floor(Math.random() * allImages.length)] || cat.cover;
    const minPrice = Math.min(...products.map((p) => p.price));

    return `
      <a class="card card-link-card showcase-card" href="catalog.html?cat=${encodeURIComponent(cat.key)}" aria-label="Открыть категорию ${cat.label}">
        ${renderMedia(randomImage)}
        <div class="card-content">
          <h3>${cat.label}</h3>
          <p class="card-meta">Категория украшений BONITE</p>
          <p class="price">от ${formatPrice(minPrice)}</p>
        </div>
      </a>
    `;
  }).filter(Boolean);

  grid.innerHTML = cards.join("");
}

function renderProduct() {
  const id = getParam("id");
  const product = data.products.find((p) => p.id === id) || data.products[0];
  if (!product) return;
  const mediaList = (product.media || []).filter((m) => m && m.path);

  const main = document.querySelector("#product-main-media");
  const thumbs = document.querySelector("#product-thumbs");
  const name = document.querySelector("#product-name");
  const price = document.querySelector("#product-price");
  const desc = document.querySelector("#product-description");
  const category = document.querySelector("#product-category");

  if (name) name.textContent = product.name;
  if (price) price.textContent = formatPrice(product.price);
  if (desc) {
    desc.textContent = "Тут будет описание товара, его размеры, материалы и другие важные характеристики.";
  }
  if (category) category.innerHTML = `<strong>Категория:</strong> ${product.categoryLabel}`;

  const actionsBlock = document.querySelector(".product-panel");
  if (actionsBlock) {
    const existingButton = actionsBlock.querySelector(".favorite-toggle-product");
    if (existingButton) existingButton.remove();
    const liked = isFavorite(product.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = `btn btn-outline favorite-toggle favorite-toggle-product${liked ? " is-active" : ""}`;
    button.dataset.favoriteId = product.id;
    button.setAttribute("aria-label", liked ? "Убрать из избранного" : "Добавить в избранное");
    button.textContent = `${renderFavoriteIcon(liked)} ${liked ? "В избранном" : "В избранное"}`;
    const cartBtn = actionsBlock.querySelector(".btn.btn-gold");
    if (cartBtn) {
      cartBtn.classList.add("product-cart-btn");
      cartBtn.insertAdjacentElement("beforebegin", button);
    } else {
      actionsBlock.appendChild(button);
    }
    button.addEventListener("click", () => {
      const active = toggleFavorite(product.id);
      button.classList.toggle("is-active", active);
      button.textContent = `${renderFavoriteIcon(active)} ${active ? "В избранном" : "В избранное"}`;
      button.setAttribute("aria-label", active ? "Убрать из избранного" : "Добавить в избранное");
    });
  }

  if (main) {
    const preferred = mediaList.find((m) => m.type === "image") || mediaList[0];
    main.innerHTML = renderMedia(preferred, "card-media");
    if (preferred) attachMainMediaClick(product, preferred);
  }

  if (thumbs) {
    thumbs.innerHTML = mediaList.map((m, i) => {
      const thumb = m.type === "video"
        ? `<video class="card-media" src="${m.path}" muted playsinline></video>`
        : `<img class="card-media" src="${m.path}" alt="Медиа ${i + 1}" />`;
      return `<button class="panel interactive media-thumb" data-index="${i}" type="button">${thumb}</button>`;
    }).join("");

    thumbs.querySelectorAll(".media-thumb").forEach((btn) => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.index || 0);
        if (main) {
          const selected = mediaList[i];
          if (!selected) return;
          main.innerHTML = renderMedia(selected, "card-media");
          attachMainMediaClick(product, selected);
        }
      });
    });
  }
}

function renderFavorites() {
  const grid = document.querySelector("#favorites-grid");
  const emptyState = document.querySelector("#favorites-empty");
  if (!grid) return;

  const favorites = getFavorites();
  const products = data.products.filter((p) => favorites.includes(p.id));

  if (!products.length) {
    grid.innerHTML = "";
    if (emptyState) emptyState.style.display = "block";
    return;
  }

  if (emptyState) emptyState.style.display = "none";
  grid.innerHTML = products.map((p) => {
    const cover = p.media.find((m) => m.type === "image") || p.media[0];
    const href = `product.html?id=${encodeURIComponent(p.id)}`;
    return `<article class="card showcase-card">
      <a class="card-link-wrap" href="${href}" aria-label="Открыть ${p.name}">
        ${renderMedia(cover)}
      </a>
      <div class="card-content">
        <h3><a href="${href}">${p.name}</a></h3>
        <p class="card-meta">${p.categoryLabel}</p>
        <p class="price">${formatPrice(p.price)}</p>
        <button class="btn btn-outline favorite-toggle is-active" type="button" data-favorite-id="${p.id}" aria-label="Убрать из избранного">♥ Убрать</button>
      </div>
    </article>`;
  }).join("");

  if (!grid.dataset.favoritesBound) {
    grid.addEventListener("click", (event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const button = target.closest(".favorite-toggle");
      if (!(button instanceof HTMLButtonElement)) return;
      const productId = button.dataset.favoriteId;
      if (!productId) return;
      toggleFavorite(productId);
      renderFavorites();
    });
    grid.dataset.favoritesBound = "1";
  }
}

function ensureLightbox() {
  let modal = document.querySelector("#media-lightbox");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "media-lightbox";
  modal.className = "media-lightbox";
  modal.innerHTML = `
    <div class="media-lightbox-backdrop" data-close="1"></div>
    <div class="media-lightbox-content">
      <button type="button" class="lightbox-close" data-close="1" aria-label="Закрыть">✕</button>
      <div class="lightbox-controls">
        <button type="button" class="btn btn-outline" id="zoom-out">−</button>
        <button type="button" class="btn btn-outline" id="zoom-in">+</button>
      </div>
      <div id="lightbox-media-slot" class="lightbox-media-slot"></div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener("click", (e) => {
    const target = e.target;
    if (target instanceof HTMLElement && target.dataset.close === "1") {
      modal.classList.remove("open");
    }
  });

  return modal;
}

function attachMainMediaClick(product, media) {
  const container = document.querySelector("#product-main-media");
  if (!container) return;
  const node = container.querySelector("img, video");
  if (!node) return;

  node.classList.add("zoomable-media");
  node.addEventListener("click", () => openLightbox(product, media));
}

function openLightbox(product, media) {
  const modal = ensureLightbox();
  const slot = modal.querySelector("#lightbox-media-slot");
  const zoomIn = modal.querySelector("#zoom-in");
  const zoomOut = modal.querySelector("#zoom-out");
  if (!slot || !zoomIn || !zoomOut) return;

  let scale = 1;
  const setScale = (next) => {
    scale = Math.max(1, Math.min(4, next));
    const img = slot.querySelector("img");
    if (img) img.style.transform = `scale(${scale})`;
  };

  if (media.type === "video") {
    slot.innerHTML = `<video class="lightbox-video" src="${media.path}" controls autoplay playsinline></video>`;
    zoomIn.style.display = "none";
    zoomOut.style.display = "none";
  } else {
    slot.innerHTML = `<img class="lightbox-image" src="${media.path}" alt="${product.name}" />`;
    zoomIn.style.display = "inline-flex";
    zoomOut.style.display = "inline-flex";
    setScale(1);
    slot.onwheel = (e) => {
      e.preventDefault();
      setScale(scale + (e.deltaY < 0 ? 0.2 : -0.2));
    };
  }

  zoomIn.onclick = () => setScale(scale + 0.25);
  zoomOut.onclick = () => setScale(scale - 0.25);
  modal.classList.add("open");
}

function initMouseGradientZone(zone, defaultX = "50%", defaultY = "50%") {
  if (!zone) return;
  if (!window.matchMedia("(pointer:fine)").matches) return;
  let lastSparkleAt = 0;

  const spawnSparkles = (event) => {
    const now = performance.now();
    if (now - lastSparkleAt < 36) return;
    lastSparkleAt = now;

    const rect = zone.getBoundingClientRect();
    const baseX = event.clientX - rect.left;
    const baseY = event.clientY - rect.top;
    const count = 2;

    for (let i = 0; i < count; i += 1) {
      const sparkle = document.createElement("span");
      sparkle.className = "cursor-sparkle";
      const offsetX = (Math.random() - 0.5) * 24;
      const offsetY = (Math.random() - 0.5) * 18;
      sparkle.style.left = `${baseX + offsetX}px`;
      sparkle.style.top = `${baseY + offsetY}px`;
      sparkle.style.width = `${5 + Math.random() * 5}px`;
      sparkle.style.height = sparkle.style.width;
      zone.appendChild(sparkle);
      sparkle.addEventListener("animationend", () => sparkle.remove(), { once: true });
    }
  };

  zone.addEventListener("mouseenter", (event) => {
    const rect = zone.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    zone.style.setProperty("--mx", `${x}%`);
    zone.style.setProperty("--my", `${y}%`);
    zone.classList.add("is-glow-active");
  });

  zone.addEventListener("mousemove", (event) => {
    const rect = zone.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    const tiltX = ((x - 50) / 50).toFixed(3);
    const tiltY = ((y - 50) / 50).toFixed(3);
    zone.style.setProperty("--mx", `${x}%`);
    zone.style.setProperty("--my", `${y}%`);
    zone.style.setProperty("--tiltX", tiltX);
    zone.style.setProperty("--tiltY", tiltY);
    spawnSparkles(event);
  });

  zone.addEventListener("mouseleave", () => {
    zone.classList.remove("is-glow-active");
    zone.style.setProperty("--mx", defaultX);
    zone.style.setProperty("--my", defaultY);
    zone.style.setProperty("--tiltX", "0");
    zone.style.setProperty("--tiltY", "0");
  });
}

function initHomeMouseGradients() {
  const homeGlowZone = document.querySelector(".home-glow-zone");
  initMouseGradientZone(homeGlowZone, "50%", "45%");
}

function initPageMouseGradient() {
  const section = document.querySelector(".section");
  if (!section) return;
  section.classList.add("page-glow-zone");
  initMouseGradientZone(section, "50%", "45%");
}

if (page === "catalog") renderCatalog();
if (page === "category") renderCategories();
if (page === "product") renderProduct();
if (page === "favorites") renderFavorites();
if (page === "home") {
  renderHomeCollections();
  initHomeMouseGradients();
}
if (page !== "home") {
  initPageMouseGradient();
}
updateFavoritesHeaderLink();
normalizeFooterLinks();

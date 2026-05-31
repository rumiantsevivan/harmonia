/**
 * Рендеринг лендинга из window.SITE_CONFIG.
 * Связывает HTML-разметку с значениями конфига через data-bind атрибуты.
 *
 * data-bind="ключ"           — заменить textContent элемента значением SITE_CONFIG[ключ]
 * data-bind-attr="attr:ключ" — установить атрибут (например href)
 * data-bind-style="prop:ключ" — установить инлайн-стиль
 * data-bind-show="ключ"      — скрыть элемент, если значение пустое
 */
(function () {
  const cfg = window.SITE_CONFIG || {};

  // === 1) CSS-переменные из палитры ===
  if (cfg.colors) {
    const root = document.documentElement;
    if (cfg.colors.accent)      root.style.setProperty("--accent", cfg.colors.accent);
    if (cfg.colors.accent_dark) root.style.setProperty("--accent-dark", cfg.colors.accent_dark);
    if (cfg.colors.ink)         root.style.setProperty("--ink", cfg.colors.ink);
    if (cfg.colors.paper)       root.style.setProperty("--paper", cfg.colors.paper);
    if (cfg.colors.paper_dark)  root.style.setProperty("--paper-dark", cfg.colors.paper_dark);
  }

  // === 2) Производные значения, используемые в связках ===
  const phoneTel = cfg.phone_link ? `tel:${cfg.phone_link}` : "#";
  const waUrl = cfg.whatsapp ? `https://wa.me/${cfg.whatsapp.replace(/\D/g, "")}` : "";
  const igUrl = cfg.instagram ? `https://instagram.com/${cfg.instagram}` : "";
  const tgUrl = cfg.telegram ? `https://t.me/${cfg.telegram}` : "";
  const heroBg = cfg.hero_image ? `url("${cfg.hero_image}")` : "";

  const derived = {
    phone_tel: phoneTel,
    whatsapp_url: waUrl,
    instagram_url: igUrl,
    telegram_url: tgUrl,
    hero_image_css: heroBg,
    title: cfg.name ? `${cfg.name} · ${cfg.tagline || "Барбершоп"}` : "Барбершоп",
    meta_description: cfg.offer || "",
  };
  const value = (key) => (key in derived ? derived[key] : cfg[key]);

  // === 3) Простые подстановки текста ===
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const key = el.getAttribute("data-bind");
    const v = value(key);
    if (v != null && v !== "") {
      if (el.tagName === "TITLE") el.textContent = v;
      else el.textContent = v;
    }
  });

  // === 4) Атрибуты: data-bind-attr="href:phone_tel" ===
  document.querySelectorAll("[data-bind-attr]").forEach((el) => {
    const [attr, key] = el.getAttribute("data-bind-attr").split(":");
    const v = value(key);
    if (v) el.setAttribute(attr, v);
    if (!v && (attr === "href")) el.removeAttribute("href");
  });

  // === 5) Стили ===
  document.querySelectorAll("[data-bind-style]").forEach((el) => {
    const [prop, key] = el.getAttribute("data-bind-style").split(":");
    const v = value(key);
    if (v) {
      const cssProp = prop.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
      el.style.setProperty(cssProp, v);
    }
  });

  // === 6) Скрытие/показ ===
  document.querySelectorAll("[data-bind-show]").forEach((el) => {
    const key = el.getAttribute("data-bind-show");
    const v = cfg[key];
    if (!v) el.style.display = "none";
  });

  // === 7) Meta description ===
  const metaEl = document.querySelector('meta[name="description"]');
  if (metaEl && cfg.offer) {
    metaEl.setAttribute("content", `${cfg.name} — ${cfg.tagline || ""}. ${cfg.offer.split("\n")[0]}`);
  }

  // === 8) Список услуг ===
  // Поддерживаются 2 формата:
  //   массив                                → плоский список (как в Lucky fox)
  //   { tabs: [{ name, groups: [...] }] }   → табы по уровню мастера, внутри группы
  const servicesEl = document.getElementById("services-list");
  if (servicesEl) {
    if (Array.isArray(cfg.services)) {
      servicesEl.classList.add("services-root--flat");
      servicesEl.innerHTML = `<ol class="services">${cfg.services
        .map(
          (s, i) => `
          <li class="services__item">
            <span class="services__num">№ ${String(i + 1).padStart(2, "0")}</span>
            <div>
              <div class="services__title">${escapeHtml(s.title || "")}</div>
              ${s.note ? `<div class="services__note">${escapeHtml(s.note)}</div>` : ""}
            </div>
            <span class="services__price">${escapeHtml(s.price || "")}</span>
          </li>`
        )
        .join("")}</ol>`;
    } else if (cfg.services && Array.isArray(cfg.services.tabs)) {
      const tabs = cfg.services.tabs;
      servicesEl.classList.add("services-root--tabs");
      const navHTML = tabs
        .map(
          (t, i) => `
          <button type="button" class="srv-tab ${i === 0 ? "is-active" : ""}" data-tab="${i}">
            <span class="srv-tab__name">${escapeHtml(t.name || "")}</span>
            ${t.subtitle ? `<span class="srv-tab__sub">${escapeHtml(t.subtitle)}</span>` : ""}
          </button>`
        )
        .join("");
      const panelsHTML = tabs
        .map(
          (t, i) => `
          <div class="srv-panel ${i === 0 ? "is-active" : ""}" data-panel="${i}">
            <div class="srv-groups">
              ${(t.groups || [])
                .map(
                  (g) => `
                  <section class="srv-group">
                    <h3 class="srv-group__title">${escapeHtml(g.title || "")}</h3>
                    <ul class="srv-list">
                      ${(g.items || [])
                        .map(
                          (it) => `
                          <li class="srv-row">
                            <span class="srv-row__title">
                              ${escapeHtml(it.title || "")}
                              ${it.note ? `<span class="srv-row__note">${escapeHtml(it.note)}</span>` : ""}
                            </span>
                            <span class="srv-row__dots" aria-hidden="true"></span>
                            <span class="srv-row__price">${escapeHtml(it.price || "")}</span>
                          </li>`
                        )
                        .join("")}
                    </ul>
                  </section>`
                )
                .join("")}
            </div>
          </div>`
        )
        .join("");
      servicesEl.innerHTML = `
        <div class="srv-nav" role="tablist">${navHTML}</div>
        <div class="srv-panels">${panelsHTML}</div>`;
      // Переключение табов
      const tabBtns = servicesEl.querySelectorAll(".srv-tab");
      const panels = servicesEl.querySelectorAll(".srv-panel");
      tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = btn.dataset.tab;
          tabBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
          panels.forEach((p) => p.classList.toggle("is-active", p.dataset.panel === idx));
        });
      });
    }
  }

  // === 9) Галерея ===
  const galleryEl = document.getElementById("gallery-grid");
  if (galleryEl && Array.isArray(cfg.gallery)) {
    galleryEl.innerHTML = cfg.gallery
      .map(
        (src) => `
        <figure class="gallery__item">
          <img class="gallery__img" src="${escapeAttr(src)}" alt="" loading="lazy" />
        </figure>`
      )
      .join("");
  }

  // === 10) Отзывы ===
  const reviewsEl = document.getElementById("reviews-list");
  if (reviewsEl && Array.isArray(cfg.reviews)) {
    reviewsEl.innerHTML = cfg.reviews
      .map(
        (r) => `
        <article class="review">
          <span class="review__mark">“</span>
          <p class="review__text">${escapeHtml(r.text || "")}</p>
          <div class="review__author">${escapeHtml(r.author || "")}</div>
          ${r.source ? `<div class="review__source">${escapeHtml(r.source)}</div>` : ""}
        </article>`
      )
      .join("");
  }

  // === 11) Мастера ===
  const mastersSection = document.querySelector('[data-section="masters"]');
  const mastersEl = document.getElementById("masters-list");
  if (mastersEl && Array.isArray(cfg.masters) && cfg.masters.length > 0) {
    mastersEl.innerHTML = cfg.masters
      .map(
        (m) => `
        <figure class="master">
          <div class="master__photo-wrap">
            <img class="master__photo" src="${escapeAttr(m.photo || "")}" alt="${escapeAttr(m.name || "")}" loading="lazy" />
          </div>
          <figcaption>
            <h3 class="master__name">${escapeHtml(m.name || "")}</h3>
            ${m.role ? `<div class="master__role">${escapeHtml(m.role)}</div>` : ""}
          </figcaption>
        </figure>`
      )
      .join("");
  } else if (mastersSection) {
    mastersSection.style.display = "none";
    // и спрятать ссылку «Мастера» в шапке, чтобы не вела в никуда
    const navMasters = document.querySelector('.topbar__nav a[href="#masters"]');
    if (navMasters) navMasters.style.display = "none";
  }

  // === 11b) Авто-перенумерация «01 / …» по видимым секциям ===
  // Если какая-то секция скрыта (например, «Мастера» без фото),
  // номера у оставшихся идут подряд, без пропусков.
  const visibleEyebrows = Array.from(document.querySelectorAll(".section .eyebrow"))
    .filter((el) => {
      const sec = el.closest(".section");
      return sec && getComputedStyle(sec).display !== "none";
    });
  visibleEyebrows.forEach((el, i) => {
    const num = String(i + 1).padStart(2, "0");
    el.textContent = el.textContent.replace(/^\s*\d+\s*\/\s*/, `${num} / `);
  });

  // === 12) Часы работы ===
  const hoursEl = document.getElementById("hours-list");
  if (hoursEl && Array.isArray(cfg.hours)) {
    hoursEl.innerHTML = cfg.hours
      .map(
        (h) => `<li><span>${escapeHtml(h.days || "")}</span><span>${escapeHtml(h.time || "")}</span></li>`
      )
      .join("");
  }

  // === 13) Соцсети в контактах ===
  const socialsEl = document.getElementById("contacts-socials");
  if (socialsEl) {
    const links = [];
    if (cfg.telegram)  links.push(`<a href="https://t.me/${escapeAttr(cfg.telegram)}" target="_blank" rel="noopener">Telegram</a>`);
    if (cfg.whatsapp)  links.push(`<a href="https://wa.me/${escapeAttr(cfg.whatsapp.replace(/\D/g, ""))}" target="_blank" rel="noopener">WhatsApp</a>`);
    if (cfg.vk)        links.push(`<a href="https://vk.com/${escapeAttr(cfg.vk)}" target="_blank" rel="noopener">ВКонтакте</a>`);
    if (cfg.instagram) links.push(`<a href="https://instagram.com/${escapeAttr(cfg.instagram)}" target="_blank" rel="noopener">Instagram</a>`);
    socialsEl.innerHTML = links.join("");
  }

  // === 13b) Trust badge на hero ===
  const trustEl = document.getElementById("hero-trust");
  if (trustEl && cfg.trust) {
    const parts = [];
    if (cfg.trust.rating) {
      parts.push(`<span class="hero__trust-rating"><span class="hero__trust-star">★</span> <strong>${escapeHtml(cfg.trust.rating)}</strong></span>`);
    }
    if (cfg.trust.review_count) {
      const label = cfg.trust.review_label || "отзывов";
      parts.push(`<span class="hero__trust-reviews">${escapeHtml(cfg.trust.review_count)} ${escapeHtml(label)}</span>`);
    }
    if (cfg.trust.award) {
      parts.push(`<span class="hero__trust-award">${escapeHtml(cfg.trust.award)}</span>`);
    }
    if (parts.length) {
      trustEl.innerHTML = parts.join('<span class="hero__trust-sep" aria-hidden="true">·</span>');
    }
  }

  // === 14) Карта (iframe) ===
  const mapEl = document.getElementById("map");
  if (mapEl && cfg.map_embed_src) {
    mapEl.innerHTML = `<iframe src="${escapeAttr(cfg.map_embed_src)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>`;
  }

  // === 15) Год в футере ===
  const yearEl = document.getElementById("footer-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // === 15b) ФОРМА ЗАПИСИ =================================
  setupBookingForm(cfg);

  // === 16) Тень шапки при скролле ===
  const topbar = document.getElementById("topbar");
  const onScroll = () => {
    if (window.scrollY > 24) topbar.classList.add("is-scrolled");
    else topbar.classList.remove("is-scrolled");
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- утилиты ----
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // =====================================================
  // === BOOKING FORM ====================================
  // =====================================================
  function setupBookingForm(cfg) {
    const form = document.getElementById("booking-form");
    const successEl = document.getElementById("booking-success");
    if (!form || !successEl) return;

    // 1) Заполняем dropdown'ы из конфига
    const serviceSelect = form.querySelector("#b-service");
    if (serviceSelect) {
      // Сплющиваем услуги в плоский список (поддержка и массива, и табов)
      const flat = [];
      if (Array.isArray(cfg.services)) {
        cfg.services.forEach((s) => flat.push(s));
      } else if (cfg.services && Array.isArray(cfg.services.tabs)) {
        cfg.services.tabs.forEach((tab) => {
          (tab.groups || []).forEach((g) => {
            (g.items || []).forEach((it) =>
              flat.push({ ...it, tab: tab.name })
            );
          });
        });
      }
      flat.forEach((s) => {
        const opt = document.createElement("option");
        const label = s.tab ? `${s.title} (${s.tab})` : s.title;
        opt.value = label;
        opt.textContent = `${label} — ${s.price}`;
        serviceSelect.appendChild(opt);
      });
    }
    const masterSelect = form.querySelector("#b-master");
    if (masterSelect && Array.isArray(cfg.masters)) {
      cfg.masters.forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m.name;
        opt.textContent = m.role ? `${m.name} — ${m.role}` : m.name;
        masterSelect.appendChild(opt);
      });
    }

    // 2) Дата по умолчанию — завтра, минимум — сегодня
    const dateInput = form.querySelector("#b-date");
    if (dateInput) {
      const today = new Date();
      const tomorrow = new Date(today.getTime() + 24 * 3600 * 1000);
      dateInput.min = today.toISOString().slice(0, 10);
      dateInput.value = tomorrow.toISOString().slice(0, 10);
    }

    // 3) Маска телефона +7 (XXX) XXX-XX-XX
    const phoneInput = form.querySelector("#b-phone");
    if (phoneInput) attachPhoneMask(phoneInput);

    // 4) Снятие подсветки ошибок при правке поля
    form.querySelectorAll("input,select").forEach((el) => {
      el.addEventListener("input", () => clearFieldError(el));
      el.addEventListener("change", () => clearFieldError(el));
    });

    // 5) Submit
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = collectFormData(form);
      const errors = validate(data);
      if (errors.length) {
        applyErrors(form, errors);
        // прокрутить к первой ошибке
        const firstErr = form.querySelector(".field--invalid input, .field--invalid select");
        if (firstErr) firstErr.focus({ preventScroll: false });
        return;
      }

      const btn = document.getElementById("booking-submit");
      btn.classList.add("is-loading");

      try {
        await sendBooking(data, cfg.booking || {});
        showSuccess();
      } catch (err) {
        console.error("Не удалось отправить заявку:", err);
        alert("Не удалось отправить заявку. Позвони, пожалуйста, по телефону — мы запишем вручную.");
      } finally {
        btn.classList.remove("is-loading");
      }
    });

    // 6) «Записаться ещё раз»
    const againBtn = document.getElementById("booking-again");
    if (againBtn) {
      againBtn.addEventListener("click", () => {
        successEl.hidden = true;
        form.hidden = false;
        form.reset();
        // dateInput надо переинициализировать
        if (dateInput) {
          const tomorrow = new Date(Date.now() + 24 * 3600 * 1000);
          dateInput.value = tomorrow.toISOString().slice(0, 10);
        }
        form.querySelectorAll(".field--invalid").forEach((f) => f.classList.remove("field--invalid"));
        form.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    function showSuccess() {
      form.hidden = true;
      successEl.hidden = false;
      successEl.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function attachPhoneMask(input) {
    const format = (digits) => {
      // digits — только цифры, всегда стартующие с 7
      let out = "+7";
      if (digits.length > 1) out += " (" + digits.slice(1, 4);
      if (digits.length >= 4) out += digits.length === 4 ? "" : ") " + digits.slice(4, 7);
      if (digits.length >= 7) out += "-" + digits.slice(7, 9);
      if (digits.length >= 9) out += "-" + digits.slice(9, 11);
      return out;
    };
    const sanitize = (raw) => {
      let d = raw.replace(/\D/g, "");
      if (d.startsWith("8")) d = "7" + d.slice(1);
      if (!d.startsWith("7")) d = "7" + d;
      return d.slice(0, 11);
    };
    input.addEventListener("focus", () => {
      if (!input.value) input.value = "+7 (";
    });
    input.addEventListener("blur", () => {
      if (input.value === "+7 (" || input.value === "+7") input.value = "";
    });
    input.addEventListener("input", () => {
      const digits = sanitize(input.value);
      input.value = format(digits);
    });
    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text") || "";
      const digits = sanitize(text);
      input.value = format(digits);
    });
  }

  function collectFormData(form) {
    const get = (n) => form.elements[n]?.value?.trim() || "";
    return {
      name: get("name"),
      phone: get("phone"),
      phoneDigits: get("phone").replace(/\D/g, ""),
      service: get("service"),
      master: get("master"),
      date: get("date"),
      time: get("time"),
    };
  }

  function validate(d) {
    const errors = [];
    if (d.name.length < 2) errors.push(["name", "Имя минимум 2 буквы"]);
    if (d.phoneDigits.length !== 11) errors.push(["phone", "Полный номер: +7 и 10 цифр"]);
    if (!d.service) errors.push(["service", "Выбери услугу"]);
    if (!d.date) errors.push(["date", "Укажи дату"]);
    else {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const picked = new Date(d.date);
      if (picked < today) errors.push(["date", "Дата уже прошла"]);
    }
    if (!d.time) errors.push(["time", "Укажи время"]);
    return errors;
  }

  function applyErrors(form, errors) {
    // сначала очистить
    form.querySelectorAll(".field--invalid").forEach((f) => f.classList.remove("field--invalid"));
    errors.forEach(([name, msg]) => {
      const el = form.elements[name];
      if (!el) return;
      const field = el.closest(".field");
      if (field) field.classList.add("field--invalid");
      const errEl = form.querySelector(`[data-error-for="${name}"]`);
      if (errEl) errEl.textContent = msg;
    });
  }

  function clearFieldError(el) {
    const field = el.closest(".field");
    if (field) field.classList.remove("field--invalid");
  }

  // -------- Отправка --------
  async function sendBooking(data, booking) {
    const msg = formatTelegramMessage(data);
    // 1) Telegram, если настроено
    if (booking.telegram_bot_token && booking.telegram_chat_id) {
      const r = await fetch(`https://api.telegram.org/bot${booking.telegram_bot_token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: booking.telegram_chat_id,
          text: msg,
          parse_mode: "HTML",
        }),
      });
      if (!r.ok) throw new Error(`Telegram ${r.status}`);
      return;
    }
    // 2) Formspree, если задан endpoint
    if (booking.formspree_endpoint) {
      const r = await fetch(booking.formspree_endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error(`Formspree ${r.status}`);
      return;
    }
    // 3) Демо-режим — ничего не отправляем, только лог
    console.warn(
      "%c[Booking] Демо-режим: интеграция не настроена.\n" +
      "Заявка НЕ ушла никуда. Чтобы заявки приходили — заполни блок booking в config.js.",
      "color:#B8835A;font-weight:bold;"
    );
    console.log("Заявка:\n" + msg);
    // имитируем сетевой запрос для реалистичности UX
    await new Promise((res) => setTimeout(res, 600));
  }

  function formatTelegramMessage(d) {
    const lines = [
      "<b>🪒 Новая заявка на запись</b>",
      "",
      `<b>Имя:</b> ${d.name}`,
      `<b>Телефон:</b> ${d.phone}`,
      `<b>Услуга:</b> ${d.service}`,
      d.master ? `<b>Мастер:</b> ${d.master}` : `<b>Мастер:</b> любой`,
      `<b>Когда:</b> ${formatDateRu(d.date)}, ${d.time}`,
      "",
      "<i>Свяжись для подтверждения.</i>",
    ];
    return lines.join("\n");
  }

  function formatDateRu(iso) {
    if (!iso) return "";
    try {
      const dt = new Date(iso + "T00:00:00");
      return dt.toLocaleDateString("ru-RU", { day: "2-digit", month: "long", weekday: "short" });
    } catch { return iso; }
  }
})();

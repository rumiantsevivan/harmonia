/* Странично-специфичные рендеры (запускается после partials:loaded).
   Маршрутизация по body[data-page]. Любая страница может использовать любой блок. */
(function () {
  function init() {
    const cfg = window.SITE_CONFIG || {};
    fillFooterHours(cfg);
    fillFooterSocial(cfg);
    fillMastersFull(cfg);
    fillGalleryFull(cfg);
    fillServicesTables(cfg);
    fillContactsPage(cfg);
    fillFeaturePreviews(cfg);
  }

  // ---------- ФУТЕР: часы ----------
  function fillFooterHours(cfg) {
    const el = document.getElementById("footerHoursList");
    if (!el || !Array.isArray(cfg.hours)) return;
    el.innerHTML = cfg.hours
      .map((h) => `<li><span>${esc(h.days || "")}</span><span>${esc(h.time || "")}</span></li>`)
      .join("");
  }

  // ---------- ФУТЕР: соцсети ----------
  function fillFooterSocial(cfg) {
    const el = document.getElementById("footerSocialList");
    if (!el) return;
    const items = [];
    if (cfg.phone_link) items.push(`<li><a href="tel:${esc(cfg.phone_link)}">Позвонить</a></li>`);
    if (cfg.whatsapp)   items.push(`<li><a href="https://wa.me/${esc(cfg.whatsapp.replace(/\D/g, ""))}" target="_blank" rel="noopener">WhatsApp</a></li>`);
    if (cfg.telegram) {
      const tg = /^https?:/.test(cfg.telegram) ? cfg.telegram : `https://t.me/${cfg.telegram}`;
      items.push(`<li><a href="${esc(tg)}" target="_blank" rel="noopener">Telegram</a></li>`);
    }
    if (cfg.vk) {
      const vk = /^https?:/.test(cfg.vk) ? cfg.vk : `https://vk.com/${cfg.vk}`;
      items.push(`<li><a href="${esc(vk)}" target="_blank" rel="noopener">ВКонтакте</a></li>`);
    }
    if (cfg.instagram) items.push(`<li><a href="https://instagram.com/${esc(cfg.instagram)}" target="_blank" rel="noopener">Instagram</a></li>`);
    el.innerHTML = items.join("");
  }

  // ---------- MASTERS.HTML: полные карточки ----------
  function fillMastersFull(cfg) {
    const el = document.getElementById("mastersFull");
    if (!el || !Array.isArray(cfg.masters)) return;
    el.innerHTML = cfg.masters
      .map(
        (m) => `
        <article class="master-card">
          <div class="master-card__photo-wrap">
            <img class="master-card__photo" src="${esc(m.photo || "")}" alt="${esc(m.name || "")}" loading="lazy" />
          </div>
          <div class="master-card__body">
            <h2 class="master-card__name">${esc(m.name || "")}</h2>
            ${m.role ? `<div class="master-card__role">${esc(m.role)}</div>` : ""}
            <p class="master-card__bio">
              <!-- TODO: опыт и био от клиента -->
              Опыт работы, специализация и история — уточняются.
            </p>
            <button class="btn btn--solid btn--sm" type="button" data-modal-open="booking" data-prefill-master="${esc(m.name || "")}">Записаться к мастеру</button>
          </div>
        </article>`
      )
      .join("");
  }

  // ---------- GALLERY.HTML: полная сетка ----------
  function fillGalleryFull(cfg) {
    const el = document.getElementById("lightboxGallery");
    if (!el || !Array.isArray(cfg.gallery)) return;
    el.innerHTML = cfg.gallery
      .map(
        (src) => `
        <figure class="lightbox-gallery__item">
          <img src="${esc(src)}" data-full="${esc(src.replace(/w=\d+/, "w=1600"))}" alt="" loading="lazy" />
        </figure>`
      )
      .join("");
  }

  // ---------- SERVICES.HTML: категории → группы-карточки с фото + список ----------
  // Фото подставляются по порядку групп: img/services/svc-01.jpg … svc-19.jpg
  // Если фото не хватает (брови/ресницы/сертификаты) — остаётся placeholder.
  const SERVICE_PHOTOS_COUNT = 0;
  function fillServicesTables(cfg) {
    const el = document.getElementById("servicesTables");
    if (!el || !cfg.services || !Array.isArray(cfg.services.tabs)) return;

    let groupIdx = 0;
    el.innerHTML = cfg.services.tabs
      .map((tab) => {
        const groups = (tab.groups || [])
          .map((g) => {
            groupIdx++;
            const items = (g.items || [])
              .map((it) => {
                const note = it.note ? `<div class="svc-group__row-note">${esc(it.note)}</div>` : "";
                return `<li class="svc-group__row">
                  <div class="svc-group__row-name">${esc(it.title || "")}${note}</div>
                  <div class="svc-group__row-price">${esc(it.price || "")}</div>
                </li>`;
              })
              .join("");
            const sub = g.subtitle ? `<p class="svc-group__sub">${esc(g.subtitle)}</p>` : "";
            const fullName = `${tab.name} · ${g.title || ""}`;

            const pad = String(groupIdx).padStart(2, "0");
            const photoBlock = groupIdx <= SERVICE_PHOTOS_COUNT
              ? `<div class="svc-group__photo"><img src="img/services/svc-${pad}.jpg" alt="${esc(g.title || "")}" loading="lazy" /></div>`
              : ``;

            return `
              <article class="svc-group${photoBlock ? "" : " svc-group--nopic"}" id="grp-${slug(fullName)}">
                ${photoBlock}
                <div class="svc-group__body">
                  <h3 class="svc-group__title">${esc(g.title || "")}</h3>
                  ${sub}
                  <ul class="svc-group__list">${items}</ul>
                  <div class="svc-group__cta">
                    <button class="btn btn--solid btn--sm" type="button"
                            data-modal-open="booking"
                            data-prefill-service="${esc(fullName)}">
                      Записаться
                    </button>
                  </div>
                </div>
              </article>`;
          })
          .join("");

        return `
          <section class="svc-cat" id="cat-${slug(tab.name)}">
            <header class="svc-cat__head">
              <h2 class="svc-cat__name">${esc(tab.name)}</h2>
              ${tab.subtitle ? `<span class="svc-cat__sub">${esc(tab.subtitle)}</span>` : ""}
            </header>
            <div class="svc-cat__groups">${groups}</div>
          </section>`;
      })
      .join("");
  }

  // ---------- CONTACTS.HTML: быстрые кнопки + карта ----------
  function fillContactsPage(cfg) {
    const map = document.getElementById("contactsMap");
    if (map && cfg.map_embed_src) {
      map.innerHTML = `<iframe src="${esc(cfg.map_embed_src)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen title="Карта"></iframe>`;
    }
    const quick = document.getElementById("contactsQuick");
    if (quick) {
      const items = [];
      if (cfg.phone_link) items.push(`<a class="quick-btn quick-btn--phone" href="tel:${esc(cfg.phone_link)}">Позвонить</a>`);
      if (cfg.whatsapp)   items.push(`<a class="quick-btn quick-btn--wa" href="https://wa.me/${esc(cfg.whatsapp.replace(/\D/g, ""))}" target="_blank" rel="noopener">WhatsApp</a>`);
      if (cfg.telegram) {
        const tg = /^https?:/.test(cfg.telegram) ? cfg.telegram : `https://t.me/${cfg.telegram}`;
        items.push(`<a class="quick-btn quick-btn--tg" href="${esc(tg)}" target="_blank" rel="noopener">Telegram</a>`);
      }
      if (cfg.vk) {
        const vk = /^https?:/.test(cfg.vk) ? cfg.vk : `https://vk.com/${cfg.vk}`;
        items.push(`<a class="quick-btn quick-btn--vk" href="${esc(vk)}" target="_blank" rel="noopener">ВКонтакте</a>`);
      }
      quick.innerHTML = items.join("");
    }
  }

  // ---------- INDEX.HTML: превью услуг (топ-6) ----------
  function fillFeaturePreviews(cfg) {
    const el = document.getElementById("servicesPreview");
    if (el && cfg.services && Array.isArray(cfg.services.tabs)) {
      // Берём первый item каждой категории (≤6)
      const picks = cfg.services.tabs.slice(0, 6).map((tab) => {
        const firstItem =
          (tab.groups && tab.groups[0] && tab.groups[0].items && tab.groups[0].items[0]) || null;
        return firstItem ? { name: tab.name, price: firstItem.price, title: firstItem.title } : null;
      }).filter(Boolean);

      el.innerHTML = picks
        .map(
          (p) => `
          <a class="preview-service" href="services.html#cat-${slug(p.name)}">
            <div class="preview-service__cat">${esc(p.name)}</div>
            <div class="preview-service__price">
              <span class="preview-service__price-prefix">от</span>
              ${esc(p.price)}
            </div>
            <div class="preview-service__example">например · ${esc(p.title)}</div>
            <span class="preview-service__cta">Посмотреть прайс →</span>
          </a>`
        )
        .join("");
    }

    // Превью мастеров (3)
    const mEl = document.getElementById("mastersPreview");
    if (mEl && Array.isArray(cfg.masters)) {
      mEl.innerHTML = cfg.masters
        .slice(0, 4)
        .map(
          (m) => `
          <a class="preview-master" href="masters.html">
            <div class="preview-master__photo-wrap">
              <img class="preview-master__photo" src="${esc(m.photo || "")}" alt="${esc(m.name || "")}" loading="lazy" />
            </div>
            <div class="preview-master__name">${esc(m.name || "")}</div>
            ${m.role ? `<div class="preview-master__role">${esc(m.role)}</div>` : ""}
          </a>`
        )
        .join("");
    }

    // Превью работ (6)
    const gEl = document.getElementById("galleryPreview");
    if (gEl && Array.isArray(cfg.gallery)) {
      gEl.innerHTML = cfg.gallery
        .slice(0, 6)
        .map(
          (src) => `
          <a class="preview-gallery__item" href="gallery.html">
            <img src="${esc(src)}" alt="" loading="lazy" />
          </a>`
        )
        .join("");
    }

    // Превью отзывов (3)
    const rEl = document.getElementById("reviewsPreview");
    if (rEl && Array.isArray(cfg.reviews)) {
      rEl.innerHTML = cfg.reviews
        .slice(0, 3)
        .map(
          (r) => `
          <article class="review">
            <span class="review__mark">“</span>
            <p class="review__text">${esc(r.text || "")}</p>
            <div class="review__author">${esc(r.author || "")}</div>
            ${r.source ? `<div class="review__source">${esc(r.source)}</div>` : ""}
          </article>`
        )
        .join("");
    }

    // Контактный блок на главной (карта + адрес + телефон)
    const cMap = document.getElementById("homeMap");
    if (cMap && cfg.map_embed_src) {
      cMap.innerHTML = `<iframe src="${esc(cfg.map_embed_src)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen title="Карта"></iframe>`;
    }
    const cHours = document.getElementById("homeHoursList");
    if (cHours && Array.isArray(cfg.hours)) {
      cHours.innerHTML = cfg.hours
        .map((h) => `<li><span>${esc(h.days || "")}</span><span>${esc(h.time || "")}</span></li>`)
        .join("");
    }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }
  function slug(s) {
    return String(s)
      .toLowerCase()
      .replace(/[ёе]/g, "e").replace(/[й]/g, "i").replace(/[\s.,·]+/g, "-")
      .replace(/[^a-zа-я0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
  }

  window.addEventListener("partials:loaded", init, { once: true });
})();

/* Модалка записи: услуга → длительность/вариант, мастер из config, даты на 14 дней, время слотами */
(function () {
  function init() {
    const modal = document.getElementById("bookingModal");
    if (!modal) return;

    const formWrap = document.getElementById("bookingFormWrap");
    const form = document.getElementById("bookingForm");
    const success = document.getElementById("bookingSuccess");

    const serviceSel = document.getElementById("b-service");
    const variantSel = document.getElementById("b-variant");
    const masterSel = document.getElementById("b-master");
    const dateSel = document.getElementById("b-date");
    const timeSel = document.getElementById("b-time");

    const cfg = window.SITE_CONFIG || {};

    // ========== Услуга → группы ==========
    // value = "TabName|GroupTitle" — служит ключом для variant
    const groupMap = new Map(); // key → array of items
    if (serviceSel && serviceSel.options.length <= 1 && cfg.services?.tabs) {
      cfg.services.tabs.forEach((tab) => {
        (tab.groups || []).forEach((g) => {
          const key = `${tab.name}|${g.title || ""}`;
          const label = `${tab.name} · ${g.title || ""}`;
          groupMap.set(key, g.items || []);
          const opt = document.createElement("option");
          opt.value = key;
          opt.textContent = label;
          serviceSel.appendChild(opt);
        });
      });
    }

    // На смену услуги — пересобираем варианты
    serviceSel?.addEventListener("change", () => {
      rebuildVariants(serviceSel.value);
    });

    function rebuildVariants(key) {
      if (!variantSel) return;
      variantSel.innerHTML = '<option value="" disabled selected hidden style="display:none">— выберите вариант —</option>';
      const items = groupMap.get(key) || [];
      if (!items.length) {
        variantSel.disabled = true;
        variantSel.innerHTML = '<option value="" disabled selected hidden style="display:none">— сначала выберите услугу —</option>';
        return;
      }
      items.forEach((it) => {
        const opt = document.createElement("option");
        opt.value = it.title;
        opt.textContent = `${it.title} — ${it.price}`;
        variantSel.appendChild(opt);
      });
      variantSel.disabled = false;
    }

    // ========== Мастер ==========
    if (masterSel && masterSel.options.length <= 1 && Array.isArray(cfg.masters)) {
      cfg.masters.forEach((m) => {
        const opt = document.createElement("option");
        opt.value = m.name;
        opt.textContent = m.role ? `${m.name} — ${m.role}` : m.name;
        masterSel.appendChild(opt);
      });
    }

    // ========== Дата (на 14 дней вперёд, сегодня — только если ещё есть слоты) ==========
    const [workStart, workEnd] = parseHours(cfg.hours);

    function minSlotForToday(buffer = 30) {
      // Ближайший 30-минутный слот ≥ (сейчас + buffer)
      const now = new Date();
      const cur = now.getHours() * 60 + now.getMinutes();
      return Math.max(workStart, Math.ceil((cur + buffer) / 30) * 30);
    }
    function isoOf(d) {
      return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    }

    if (dateSel && dateSel.options.length <= 1) {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const fmt = new Intl.DateTimeFormat("ru-RU", { weekday: "short", day: "2-digit", month: "long" });
      // Если на сегодня уже не осталось слотов — начинаем с завтра
      const startOffset = (minSlotForToday() <= workEnd - 30) ? 0 : 1;
      for (let i = startOffset; i < startOffset + 14; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const opt = document.createElement("option");
        opt.value = isoOf(d);
        opt.textContent = i === 0 ? `Сегодня · ${fmt.format(d)}`
                       : i === 1 ? `Завтра · ${fmt.format(d)}`
                       : fmt.format(d);
        dateSel.appendChild(opt);
      }
    }

    // ========== Время (слоты по 30 мин, фильтр на «сегодня + сейчас») ==========
    function rebuildTimes(dateISO) {
      if (!timeSel) return;
      timeSel.innerHTML = '<option value="" disabled selected hidden style="display:none">— выберите время —</option>';
      if (!dateISO) return;
      const todayISO = isoOf(new Date());
      const minSlot = (dateISO === todayISO) ? minSlotForToday() : workStart;
      let added = 0;
      for (let m = minSlot; m <= workEnd - 30; m += 30) {
        const h = Math.floor(m / 60), mm = m % 60;
        const txt = `${pad2(h)}:${pad2(mm)}`;
        const opt = document.createElement("option");
        opt.value = txt;
        opt.textContent = txt;
        timeSel.appendChild(opt);
        added++;
      }
      if (added === 0) {
        timeSel.innerHTML = '<option value="" disabled selected hidden style="display:none">— на эту дату запись закрыта —</option>';
      }
    }
    dateSel?.addEventListener("change", () => rebuildTimes(dateSel.value));

    // ========== Открытие / закрытие ==========
    function open(prefillService, prefillMaster) {
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      requestAnimationFrame(() => modal.classList.add("is-open"));
      // Префилл услуги, если кнопка пришла с data-prefill-service
      if (prefillService && serviceSel) {
        const opt = [...serviceSel.options].find((o) => o.value === prefillService || o.textContent === prefillService);
        if (opt) {
          serviceSel.value = opt.value;
          rebuildVariants(serviceSel.value);
        }
      }
      // Префилл мастера, если кнопка пришла с data-prefill-master
      if (prefillMaster && masterSel) {
        const opt = [...masterSel.options].find((o) => o.value === prefillMaster);
        if (opt) masterSel.value = opt.value;
      }
      setTimeout(() => document.getElementById("b-name")?.focus(), 200);
    }
    function close() {
      modal.classList.remove("is-open");
      setTimeout(() => {
        modal.hidden = true;
        modal.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
        if (formWrap && success) {
          formWrap.hidden = false;
          success.hidden = true;
        }
        if (form) form.reset();
        rebuildVariants("");
        rebuildTimes("");
        modal.querySelectorAll(".field--invalid").forEach((el) => el.classList.remove("field--invalid"));
        modal.querySelectorAll(".field__error").forEach((el) => (el.textContent = ""));
      }, 250);
    }

    document.addEventListener("click", (e) => {
      const trig = e.target.closest("[data-modal-open='booking']");
      if (trig) {
        e.preventDefault();
        open(trig.dataset.prefillService || null, trig.dataset.prefillMaster || null);
        return;
      }
      if (e.target.closest("[data-modal-close]")) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !modal.hidden) close();
    });

    // ========== Маска телефона ==========
    const phoneInput = document.getElementById("b-phone");
    if (phoneInput) {
      phoneInput.addEventListener("input", () => {
        const d = phoneInput.value.replace(/\D/g, "").slice(0, 11);
        if (!d) { phoneInput.value = ""; return; }
        let out = "+7";
        if (d.length > 1) out += " (" + d.slice(1, 4);
        if (d.length >= 4) out += ") " + d.slice(4, 7);
        if (d.length >= 7) out += "-" + d.slice(7, 9);
        if (d.length >= 9) out += "-" + d.slice(9, 11);
        phoneInput.value = out;
      });
    }

    // ========== Сабмит ==========
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const errors = validate(form);
        applyErrors(form, errors);
        if (errors.length) return;

        const btn = document.getElementById("bookingSubmit");
        if (btn) btn.disabled = true;
        try {
          await fetch("/submit", { method: "POST", body: new FormData(form) }).catch(() => {});
        } finally {
          if (btn) btn.disabled = false;
        }
        formWrap.hidden = true;
        success.hidden = false;
      });
    }

    function validate(form) {
      const errs = [];
      const name = form.elements.name.value.trim();
      const phoneDigits = form.elements.phone.value.replace(/\D/g, "");
      const service = form.elements.service.value;
      const variant = form.elements.variant.value;
      const date = form.elements.date.value;
      const time = form.elements.time.value;
      if (name.length < 2) errs.push(["name", "Минимум 2 буквы"]);
      if (phoneDigits.length !== 11) errs.push(["phone", "Полный номер: +7 и 10 цифр"]);
      if (!service) errs.push(["service", "Выберите услугу"]);
      if (!variant) errs.push(["variant", "Выберите вариант"]);
      if (!date) errs.push(["date", "Выберите дату"]);
      if (!time) errs.push(["time", "Выберите время"]);
      return errs;
    }
    function applyErrors(form, errs) {
      form.querySelectorAll(".field--invalid").forEach((f) => f.classList.remove("field--invalid"));
      form.querySelectorAll(".field__error").forEach((el) => (el.textContent = ""));
      errs.forEach(([n, m]) => {
        const el = form.elements[n]?.closest(".field");
        if (el) el.classList.add("field--invalid");
        const er = form.querySelector(`[data-error-for="${n}"]`);
        if (er) er.textContent = m;
      });
    }
  }

  function pad2(n) { return String(n).padStart(2, "0"); }
  function parseHours(hours) {
    // По умолчанию 10:00 — 22:00
    let start = 10 * 60, end = 22 * 60;
    if (Array.isArray(hours) && hours[0]?.time) {
      const m = hours[0].time.match(/(\d{1,2}):(\d{2})\s*[–\-—]\s*(\d{1,2}):(\d{2})/);
      if (m) {
        start = (+m[1]) * 60 + (+m[2]);
        end   = (+m[3]) * 60 + (+m[4]);
      }
    }
    return [start, end];
  }

  window.addEventListener("partials:loaded", init, { once: true });
})();

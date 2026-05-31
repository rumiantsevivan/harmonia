/* Загрузка партиалов: <div data-include="header"></div> → partials/header.html */
(async function () {
  const slots = [...document.querySelectorAll("[data-include]")];

  await Promise.all(
    slots.map(async (slot) => {
      const name = slot.getAttribute("data-include");
      try {
        const res = await fetch(`partials/${name}.html`);
        if (!res.ok) throw new Error(res.status);
        const html = (await res.text()).trim();
        const tmpl = document.createElement("template");
        tmpl.innerHTML = html;
        slot.replaceWith(...tmpl.content.childNodes);
      } catch (e) {
        console.error(`[include] partials/${name}.html — ${e}`);
      }
    })
  );

  // Подсветка активного пункта меню по body[data-page]
  const page = document.body.dataset.page;
  if (page) {
    document.querySelectorAll(`[data-nav="${page}"]`).forEach((a) => a.classList.add("is-active"));
  }

  // Год в футере
  const y = document.getElementById("footerYear");
  if (y) y.textContent = new Date().getFullYear();

  // Бургер-меню (мобила)
  const burger = document.getElementById("burgerBtn");
  const nav = document.getElementById("siteNav");
  const siteHeader = document.querySelector(".site-header");
  function setMenuState(open) {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    // На главной шапка прозрачна над hero — при открытии меню
    // временно делаем её solid, чтобы меню и шапка слились
    if (siteHeader) siteHeader.classList.toggle("is-menu-open", open);
  }
  if (burger && nav) {
    burger.addEventListener("click", () => {
      setMenuState(!nav.classList.contains("is-open"));
    });
    // Закрытие по клику на ссылку
    nav.addEventListener("click", (e) => {
      if (e.target.tagName === "A") setMenuState(false);
    });
  }

  window.dispatchEvent(new Event("partials:loaded"));
})();

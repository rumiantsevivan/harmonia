/* Мини-лайтбокс для галереи: клик по img внутри #lightboxGallery, навигация ←/→, Esc */
(function () {
  function init() {
    const root = document.getElementById("lightboxGallery");
    if (!root) return;

    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = `
      <button class="lightbox__close" type="button" aria-label="Закрыть">×</button>
      <button class="lightbox__nav lightbox__prev" type="button" aria-label="Предыдущее">‹</button>
      <button class="lightbox__nav lightbox__next" type="button" aria-label="Следующее">›</button>
      <div class="lightbox__stage">
        <img class="lightbox__img" alt="" />
      </div>
      <div class="lightbox__counter" aria-live="polite"></div>
    `;
    document.body.appendChild(lb);

    const imgEl = lb.querySelector(".lightbox__img");
    const counter = lb.querySelector(".lightbox__counter");

    let images = [];
    let current = 0;

    function refresh() {
      images = [...root.querySelectorAll("img")];
    }
    function show(i) {
      if (!images.length) return;
      current = (i + images.length) % images.length;
      const img = images[current];
      const full = img.dataset.full || img.src;
      imgEl.src = full;
      imgEl.alt = img.alt || "";
      counter.textContent = `${current + 1} / ${images.length}`;
      lb.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
    function hide() {
      lb.classList.remove("is-open");
      imgEl.src = "";
      document.body.style.overflow = "";
    }

    root.addEventListener("click", (e) => {
      const img = e.target.closest("img");
      if (!img) return;
      refresh();
      const i = images.indexOf(img);
      if (i >= 0) show(i);
    });
    lb.querySelector(".lightbox__close").addEventListener("click", hide);
    lb.querySelector(".lightbox__prev").addEventListener("click", () => show(current - 1));
    lb.querySelector(".lightbox__next").addEventListener("click", () => show(current + 1));
    lb.addEventListener("click", (e) => { if (e.target === lb) hide(); });

    document.addEventListener("keydown", (e) => {
      if (!lb.classList.contains("is-open")) return;
      if (e.key === "Escape") hide();
      else if (e.key === "ArrowLeft") show(current - 1);
      else if (e.key === "ArrowRight") show(current + 1);
    });
  }

  window.addEventListener("partials:loaded", init, { once: true });
})();

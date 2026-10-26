/* ============================================================
   精选作品：筛选 / 画廊 / 详情弹窗
   ============================================================ */

(() => {
  "use strict";

  const works = window.PORTFOLIO_WORKS || [];
  const gallery = document.querySelector("[data-gallery]");
  const filterBox = document.querySelector("[data-filters]");
  const emptyHint = document.querySelector("[data-empty]");
  const dialog = document.querySelector("[data-work-dialog]");
  if (!gallery) return;

  const ui = {
    image: dialog?.querySelector("[data-work-image]"),
    imageFrame: dialog?.querySelector("[data-work-media]"),
    cat: dialog?.querySelector("[data-work-cat]"),
    title: dialog?.querySelector("[data-work-title]"),
    en: dialog?.querySelector("[data-work-en]"),
    year: dialog?.querySelector("[data-work-year]"),
    model: dialog?.querySelector("[data-work-model]"),
    params: dialog?.querySelector("[data-work-params]"),
    desc: dialog?.querySelector("[data-work-desc]"),
    prompt: dialog?.querySelector("[data-work-prompt]"),
    note: dialog?.querySelector("[data-work-note]"),
    tags: dialog?.querySelector("[data-work-tags]"),
    count: dialog?.querySelector("[data-work-count]"),
    copy: dialog?.querySelector("[data-work-copy]"),
    close: dialog?.querySelector("[data-work-close]"),
    prev: dialog?.querySelector("[data-work-prev]"),
    next: dialog?.querySelector("[data-work-next]")
  };

  let activeList = works.slice();
  let currentIndex = 0;

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text != null) node.textContent = text;
    return node;
  };

  const pad = (number) => String(number).padStart(2, "0");

  /* ---------- 画廊 ---------- */

  function buildCard(work, index) {
    const card = el("button", "work-card");
    card.type = "button";
    card.setAttribute("aria-label", `查看作品：${work.title}`);
    card.style.setProperty("--card-delay", `${Math.min(index * 45, 360)}ms`);

    const media = el("span", "work-card__media");
    media.style.aspectRatio = `${work.w || 4} / ${work.h || 5}`;

    const img = el("img");
    img.src = work.image;
    img.alt = `${work.title} · ${work.category}`;
    img.width = work.w || 1200;
    img.height = work.h || 1500;
    img.loading = index < 3 ? "eager" : "lazy";
    img.decoding = "async";
    media.appendChild(img);
    media.appendChild(el("span", "work-card__index", pad(works.indexOf(work) + 1)));
    media.appendChild(el("span", "work-card__peek", "查看详情"));

    const body = el("span", "work-card__body");
    const meta = el("span", "work-card__meta");
    meta.appendChild(el("span", "work-card__cat", work.category));
    meta.appendChild(el("span", "work-card__year", work.year));
    body.appendChild(meta);

    const titleRow = el("span", "work-card__title-row");
    titleRow.appendChild(el("span", "work-card__title", work.title));
    titleRow.appendChild(el("span", "work-card__arrow", "↗"));
    body.appendChild(titleRow);
    body.appendChild(el("span", "work-card__en", work.en || ""));

    card.appendChild(media);
    card.appendChild(body);
    card.addEventListener("click", () => openAt(index));

    return card;
  }

  function render(list) {
    activeList = list.slice();
    gallery.innerHTML = "";
    list.forEach((work, index) => {
      gallery.appendChild(buildCard(work, index));
    });
    if (emptyHint) emptyHint.hidden = list.length !== 0;
    requestAnimationFrame(() => gallery.classList.add("is-rendered"));
  }

  function buildFilters() {
    if (!filterBox) return;

    const categories = ["全部"];
    works.forEach((work) => {
      if (!categories.includes(work.category)) categories.push(work.category);
    });

    categories.forEach((category, index) => {
      const button = el("button", "filter-chip", category);
      button.type = "button";
      button.setAttribute("aria-pressed", index === 0 ? "true" : "false");
      button.addEventListener("click", () => {
        filterBox.querySelectorAll(".filter-chip").forEach((chip) => {
          chip.setAttribute("aria-pressed", "false");
        });
        button.setAttribute("aria-pressed", "true");
        gallery.classList.remove("is-rendered");
        render(category === "全部" ? works.slice() : works.filter((work) => work.category === category));
      });
      filterBox.appendChild(button);
    });
  }

  /* ---------- 详情弹窗 ---------- */

  function fill(index) {
    if (!dialog || !activeList.length) return;
    currentIndex = (index + activeList.length) % activeList.length;
    const work = activeList[currentIndex];

    if (ui.image) {
      ui.imageFrame?.classList.add("is-loading");
      ui.image.src = work.image;
      ui.image.alt = `${work.title} · ${work.category}`;
      ui.image.onload = () => ui.imageFrame?.classList.remove("is-loading");
      if (ui.image.complete) ui.imageFrame?.classList.remove("is-loading");
    }

    if (ui.cat) ui.cat.textContent = work.category;
    if (ui.title) ui.title.textContent = work.title;
    if (ui.en) ui.en.textContent = work.en || "";
    if (ui.year) ui.year.textContent = work.year || "—";
    if (ui.model) ui.model.textContent = work.model || "—";
    if (ui.params) ui.params.textContent = work.params || "—";
    if (ui.desc) ui.desc.textContent = work.desc || "";
    if (ui.prompt) ui.prompt.textContent = work.prompt || "—";
    if (ui.note) ui.note.textContent = work.note || "";
    if (ui.count) ui.count.textContent = `${pad(currentIndex + 1)} / ${pad(activeList.length)}`;

    if (ui.tags) {
      ui.tags.innerHTML = "";
      (work.tags || []).forEach((tag) => {
        ui.tags.appendChild(el("span", "work-tag", tag));
      });
    }

    if (ui.copy) {
      ui.copy.classList.remove("is-copied");
      ui.copy.textContent = "复制提示词";
    }
  }

  function openAt(index) {
    if (!dialog) return;
    fill(index);
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
    document.body.classList.add("is-modal-open");
    if (ui.close) window.setTimeout(() => ui.close.focus(), 50);
    const work = activeList[currentIndex];
    if (work && history.replaceState) history.replaceState(null, "", `#${work.id}`);
  }

  function closeDialog() {
    if (!dialog) return;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function step(direction) {
    fill(currentIndex + direction);
    const work = activeList[currentIndex];
    if (work && history.replaceState) history.replaceState(null, "", `#${work.id}`);
  }

  function openFromHash() {
    const id = (location.hash || "").replace(/^#/, "");
    if (!id) return;
    const index = works.findIndex((work) => work.id === id);
    if (index < 0) return;
    activeList = works.slice();
    window.setTimeout(() => openAt(index), 120);
  }

  if (dialog) {
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeDialog();
    });

    dialog.addEventListener("close", () => {
      document.body.classList.remove("is-modal-open");
      if (/^#w\d+$/.test(location.hash) && history.replaceState) {
        history.replaceState(null, "", `${location.pathname}${location.search}#works`);
      }
    });

    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        step(-1);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        step(1);
      }
    });

    ui.close?.addEventListener("click", closeDialog);
    ui.prev?.addEventListener("click", () => step(-1));
    ui.next?.addEventListener("click", () => step(1));

    ui.copy?.addEventListener("click", async () => {
      const text = ui.prompt?.textContent || "";
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        try { document.execCommand("copy"); } catch {}
        textarea.remove();
      }
      ui.copy.classList.add("is-copied");
      ui.copy.textContent = "已复制 ✓";
      window.setTimeout(() => {
        ui.copy.classList.remove("is-copied");
        ui.copy.textContent = "复制提示词";
      }, 1800);
    });
  }

  /* ---------- 进场 ---------- */

  function setupReveal() {
    const targets = document.querySelectorAll(".works-section .reveal-up");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-in"));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    targets.forEach((target) => observer.observe(target));
  }

  buildFilters();
  render(activeList);
  setupReveal();
  openFromHash();

  const totalEl = document.querySelector("[data-work-total]");
  const directionsEl = document.querySelector("[data-work-directions]");
  if (totalEl) totalEl.textContent = String(works.length);
  if (directionsEl) directionsEl.textContent = String(new Set(works.map((work) => work.category)).size);
})();

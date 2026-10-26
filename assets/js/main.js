(() => {
  "use strict";

  const body = document.body;
  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const staticPreview = new URLSearchParams(window.location.search).has("static");

  const character = document.querySelector("[data-character]");
  const portal = document.querySelector("[data-portal]");
  const speech = document.querySelector("[data-speech]");
  const speechText = document.querySelector("[data-speech-text]");
  const depthLine = document.querySelector("[data-depth-line]");
  const depthValue = document.querySelector("[data-depth]");
  const primaryButton = document.querySelector(".button--primary");

  body.classList.add("is-loading");
  if (staticPreview) root.classList.add("is-static-preview");

  /* ---------------------------------------------------------
     loader
     --------------------------------------------------------- */

  let hasStarted = false;

  const start = () => {
    if (hasStarted) return;
    hasStarted = true;
    body.classList.remove("is-loading");
    body.classList.add("is-ready");
  };

  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  if (staticPreview) {
    start();
    root.style.setProperty("--static-preview", "1");
  } else {
    Promise.race([
      Promise.all([fontsReady, new Promise((resolve) => window.addEventListener("load", resolve, { once: true }))]),
      new Promise((resolve) => window.setTimeout(resolve, 1300))
    ]).then(() => window.setTimeout(start, reduceMotion ? 0 : 220));

    window.setTimeout(start, 2600);
  }

  /* ---------------------------------------------------------
     eye tracking
     --------------------------------------------------------- */

  if (character && !reduceMotion) {
    const state = { x: 0, y: 0, tx: 0, ty: 0 };
    let visible = true;
    let lastMove = 0;

    const clamp = (value, min = -1, max = 1) => Math.min(max, Math.max(min, value));

    const setTargetFromPoint = (clientX, clientY) => {
      const rect = character.getBoundingClientRect();
      if (!rect.width) return;

      const faceX = rect.left + rect.width * 0.45;
      const faceY = rect.top + rect.height * 0.44;
      const horizontalRange = Math.max(260, window.innerWidth * 0.32);
      const verticalRange = Math.max(210, window.innerHeight * 0.32);

      state.tx = clamp((clientX - faceX) / horizontalRange);
      state.ty = clamp((clientY - faceY) / verticalRange);
      lastMove = performance.now();
    };

    const onPointerMove = (event) => {
      if (!visible || event.pointerType === "touch") return;
      setTargetFromPoint(event.clientX, event.clientY);
    };

    const onPointerLeave = () => {
      state.tx = 0;
      state.ty = 0;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "touch") setTargetFromPoint(event.clientX, event.clientY);
    }, { passive: true });
    document.addEventListener("mouseleave", onPointerLeave);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
      }, { threshold: 0.05 }).observe(character);
    }

    const tick = (now) => {
      if (visible) {
        const idle = now - lastMove > 4200;
        if (idle) {
          const t = now * 0.00042;
          state.tx = Math.sin(t) * 0.44;
          state.ty = Math.sin(t * 1.7 + 1.4) * 0.22;
        }

        state.x += (state.tx - state.x) * 0.11;
        state.y += (state.ty - state.y) * 0.11;

        root.style.setProperty("--gx", state.x.toFixed(4));
        root.style.setProperty("--gy", state.y.toFixed(4));
      }

      requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------
     speech / greeting
     --------------------------------------------------------- */

  const idleLines = [
    "你终于来啦。",
    "嗯，看见你了。",
    "眼睛跟着你走呢。",
    "别急，慢慢看。"
  ];
  const greetLines = [
    "嗨，找到你啦。",
    "在看我吗？",
    "欢迎下潜。",
    "要一起去看作品吗？"
  ];

  let idleIndex = 0;
  let greetIndex = 0;
  let speechTimer = 0;

  const say = (text, hold = 4200) => {
    if (!speechText) return;
    window.clearTimeout(speechTimer);
    speechText.textContent = text;
    speech.classList.remove("is-speaking");
    // restart the tiny typing lift
    void speech.offsetWidth;
    speech.classList.add("is-speaking");
    if (hold) {
      speechTimer = window.setTimeout(() => {
        idleIndex = (idleIndex + 1) % idleLines.length;
        speechText.textContent = idleLines[idleIndex];
      }, hold);
    }
  };

  const popBubble = (x, y) => {
    if (reduceMotion) return;
    for (let i = 0; i < 5; i += 1) {
      const bubble = document.createElement("span");
      bubble.className = "pop-bubble";
      const size = 5 + Math.random() * 11;
      bubble.style.cssText = `
        left:${x + (Math.random() - 0.5) * 60}px;
        top:${y + (Math.random() - 0.5) * 28}px;
        width:${size}px;
        height:${size}px;
        --dx:${(Math.random() - 0.5) * 95}px;
        --dy:${-40 - Math.random() * 100}px;
        --delay:${Math.random() * 0.16}s;
      `;
      document.body.appendChild(bubble);
      bubble.addEventListener("animationend", () => bubble.remove(), { once: true });
      window.setTimeout(() => bubble.remove(), 2400);
    }
  };

  const greet = (x, y) => {
    if (character && !reduceMotion) {
      character.classList.remove("is-greeting");
      void character.offsetWidth;
      character.classList.add("is-greeting");
      window.setTimeout(() => character.classList.remove("is-greeting"), 950);
    }

    greetIndex = (greetIndex + 1) % greetLines.length;
    say(greetLines[greetIndex], 5200);

    const rect = character?.getBoundingClientRect();
    popBubble(x ?? (rect ? rect.left + rect.width * 0.45 : window.innerWidth / 2),
      y ?? (rect ? rect.top + rect.height * 0.35 : window.innerHeight / 2));
  };

  character?.addEventListener("click", (event) => greet(event.clientX, event.clientY));
  character?.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const rect = character.getBoundingClientRect();
      greet(rect.left + rect.width * 0.5, rect.top + rect.height * 0.4);
    }
  });

  primaryButton?.addEventListener("mouseenter", () => say("往下，就是我的海。", 0));
  primaryButton?.addEventListener("focus", () => say("往下，就是我的海。", 0));
  primaryButton?.addEventListener("mouseleave", () => say(idleLines[idleIndex], 0));
  primaryButton?.addEventListener("blur", () => say(idleLines[idleIndex], 0));

  /* ---------------------------------------------------------
     depth gauge
     --------------------------------------------------------- */

  if (depthLine && depthValue) {
    let railHeight = 1;
    const measure = () => { railHeight = depthLine.getBoundingClientRect().height || 1; };
    measure();
    window.addEventListener("resize", measure, { passive: true });

    const updateDepth = () => {
      const maxScroll = window.innerHeight * 0.65;
      const progress = Math.min(1, Math.max(0, window.scrollY / maxScroll));
      const travel = Math.max(0, railHeight - 8);
      depthLine.style.setProperty("--scroll-depth", (progress * travel).toFixed(1));
      depthValue.textContent = String(Math.round(progress * 42)).padStart(3, "0");
    };

    updateDepth();
    window.addEventListener("scroll", updateDepth, { passive: true });
  }

  /* ---------------------------------------------------------
     gentle portal parallax
     --------------------------------------------------------- */

  if (portal && !reduceMotion) {
    let frame = 0;
    window.addEventListener("pointermove", (event) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const nx = event.clientX / window.innerWidth - 0.5;
        const ny = event.clientY / window.innerHeight - 0.5;
        portal.style.translate = `${(nx * -5).toFixed(2)}px ${(ny * -4).toFixed(2)}px`;
      });
    }, { passive: true });
  }

  /* ---------------------------------------------------------
     year
     --------------------------------------------------------- */

  const year = new Date().getFullYear();
  document.querySelectorAll("[data-year]").forEach((node) => { node.textContent = year; });
})();

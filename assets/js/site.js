const pageConfig = window.PAGE_CONFIG || {};

function ready(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

ready(() => {
  const body = document.body;
  const header = document.querySelector(".site-header");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const touchCapable =
    window.matchMedia("(hover: none), (pointer: coarse)").matches ||
    navigator.maxTouchPoints > 0;

  if (touchCapable) {
    body.classList.add("is-touch");
  }

  initNavigation();
  initStaggerGroups();
  initPremiumCardMarkup();

  const revealObserver = initRevealObserver(reduceMotion);
  initFaqPolish();
  initPremiumCards({ hoverCapable, touchCapable });

  const timelineSections = [...document.querySelectorAll("[data-scroll-progress]")];
  const timelineSteps = [...document.querySelectorAll("[data-timeline-step]")];
  const heroSections = !reduceMotion ? [...document.querySelectorAll("[data-hero-depth]")] : [];
  const galleries = initGalleryIndicators();
  initOverlayCta();

  highlightHashTarget();
  window.addEventListener("hashchange", highlightHashTarget);

  let lastScrollY = window.scrollY;
  let ticking = false;

  const updateTimelineProgress = () => {
    timelineSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const total = rect.height + window.innerHeight * 0.45;
      const progress = Math.max(
        0,
        Math.min(1, (window.innerHeight * 0.72 - rect.top) / total)
      );
      section.style.setProperty("--progress", progress.toFixed(3));
    });
  };

  const updateTimelineStates = () => {
    if (!timelineSteps.length) {
      return;
    }

    const activeTop = window.innerHeight * 0.56;
    const activeBottom = window.innerHeight * 0.34;

    timelineSteps.forEach((step) => {
      const rect = step.getBoundingClientRect();
      const isActive = rect.top <= activeTop && rect.bottom >= activeBottom;
      const isPast = rect.top < activeBottom && !isActive;
      step.classList.toggle("is-active", isActive);
      step.classList.toggle("is-past", isPast);
    });
  };

  const updateHeroDepth = () => {
    heroSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const raw = Math.max(
        0,
        Math.min(1, (window.innerHeight - rect.top) / (window.innerHeight + rect.height))
      );
      const mobileScale = window.matchMedia("(max-width: 47.99rem)").matches ? 0.62 : 1;
      section.style.setProperty("--hero-progress", (raw * mobileScale).toFixed(3));
    });
  };

  const updateHeaderState = () => {
    const isScrolled = window.scrollY > 8;
    body.classList.toggle("has-scrolled", isScrolled);
    if (header) {
      header.classList.toggle("is-scrolled", isScrolled);
    }
  };

  const syncGalleries = () => {
    galleries.forEach((gallery) => gallery.sync());
  };

  const onFrame = () => {
    updateHeaderState();
    updateHeroDepth();
    updateTimelineProgress();
    updateTimelineStates();
    syncGalleries();
    lastScrollY = window.scrollY;
    ticking = false;
  };

  const requestTick = () => {
    if (ticking) {
      return;
    }

    ticking = true;
    window.requestAnimationFrame(onFrame);
  };

  updateHeaderState();
  updateHeroDepth();
  updateTimelineProgress();
  updateTimelineStates();
  syncGalleries();

  window.addEventListener("scroll", requestTick, { passive: true });
  window.addEventListener("resize", requestTick);

  function initNavigation() {
    const navPanel = document.querySelector("[data-nav-panel]");
    const navToggle = document.querySelector("[data-nav-toggle]");
    const navLinks = document.querySelectorAll("[data-nav-link]");

    if (navToggle && navPanel) {
      const closeNavigation = () => {
        navPanel.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      };

      navToggle.addEventListener("click", () => {
        const isOpen = !navPanel.classList.contains("is-open");
        navPanel.classList.toggle("is-open", isOpen);
        navToggle.setAttribute("aria-expanded", String(isOpen));
      });

      navPanel.addEventListener("click", (event) => {
        if (event.target.matches("a")) {
          closeNavigation();
        }
      });

      window.addEventListener("scroll", closeNavigation, { passive: true });

      document.addEventListener("pointerdown", (event) => {
        if (!navPanel.classList.contains("is-open")) {
          return;
        }

        const target = event.target;
        if (navPanel.contains(target) || navToggle.contains(target)) {
          return;
        }

        closeNavigation();
      });

      document.addEventListener("focusin", (event) => {
        if (!navPanel.classList.contains("is-open")) {
          return;
        }

        const target = event.target;
        if (navPanel.contains(target) || navToggle.contains(target)) {
          return;
        }

        closeNavigation();
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
          closeNavigation();
        }
      });
    }

    const currentPath = window.location.pathname.replace(/index\.html$/, "");
    navLinks.forEach((link) => {
      const linkPath = new URL(link.href, window.location.href).pathname.replace(
        /index\.html$/,
        ""
      );
      if (currentPath === linkPath) {
        link.classList.add("is-active");
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function initStaggerGroups() {
    const groups = document.querySelectorAll(
      "[data-stagger], .section-head, .hero__content, .card-grid, .fact-grid, .checklist, .faq-list, .photo-rail, .author-box__grid, .definition-grid"
    );

    groups.forEach((group) => {
      if (!group.hasAttribute("data-stagger")) {
        group.setAttribute("data-stagger", "");
      }

      const step = Number(group.dataset.staggerDelay || 70);
      const items = [...group.children].filter(
        (child) => child.nodeType === Node.ELEMENT_NODE && !child.matches("script, style")
      );

      items.forEach((item, index) => {
        item.setAttribute("data-stagger-item", "");
        if (!item.hasAttribute("data-reveal")) {
          item.setAttribute("data-reveal", "");
        }
        item.style.setProperty("--stagger-delay", `${index * step}ms`);
      });
    });
  }

  function initPremiumCardMarkup() {
    const pressableSelectors = [
      ".button",
      ".header-cta",
      ".overlay-cta",
      ".pill",
      ".story-card",
      ".info-card",
      ".fact-card",
      ".figure-card",
      ".video-card",
      ".checklist__item",
      ".table-card",
      ".recommendation",
      ".quote-card",
      ".author-box",
      "details[data-accordion] summary"
    ];

    document.querySelectorAll(pressableSelectors.join(", ")).forEach((node) => {
      node.setAttribute("data-pressable", "");
    });

    document
      .querySelectorAll(".story-card, .info-card, .fact-card, .figure-card, .video-card, .recommendation")
      .forEach((node) => {
        node.setAttribute("data-sheen", "");
      });

    document.querySelectorAll(".timeline-step").forEach((node) => {
      node.setAttribute("data-timeline-step", "");
    });
  }

  function initRevealObserver(disabled) {
    const revealTargets = [...document.querySelectorAll("[data-reveal]")];

    if (!revealTargets.length) {
      return null;
    }

    if (!("IntersectionObserver" in window) || disabled) {
      revealTargets.forEach((node) => node.classList.add("is-visible"));
      return null;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.16 }
    );

    revealTargets.forEach((node) => observer.observe(node));
    return observer;
  }

  function initPremiumCards({ hoverCapable: canHover, touchCapable: canTouch }) {
    const sheenCards = document.querySelectorAll("[data-sheen]");
    sheenCards.forEach((card) => {
      if (!canHover) {
        return;
      }

      card.addEventListener("pointermove", (event) => {
        const rect = card.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty("--pointer-x", `${x.toFixed(2)}%`);
        card.style.setProperty("--pointer-y", `${y.toFixed(2)}%`);
      });
    });

    if (canHover) {
      document.querySelectorAll("[data-tilt]").forEach((card) => {
        card.addEventListener("pointermove", (event) => {
          const rect = card.getBoundingClientRect();
          const offsetX = (event.clientX - rect.left) / rect.width - 0.5;
          const offsetY = (event.clientY - rect.top) / rect.height - 0.5;
          const rotateY = offsetX * 4.2;
          const rotateX = offsetY * -4.2;
          card.classList.add("is-tilting");
          card.style.setProperty("--pointer-x", `${((offsetX + 0.5) * 100).toFixed(2)}%`);
          card.style.setProperty("--pointer-y", `${((offsetY + 0.5) * 100).toFixed(2)}%`);
          card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(
            2
          )}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-2px)`;
        });

        card.addEventListener("pointerleave", () => {
          card.classList.remove("is-tilting");
          card.style.transform = "";
        });
      });
    }

    if (!canTouch) {
      return;
    }

    const pressTargets = document.querySelectorAll("[data-pressable]");
    pressTargets.forEach((target) => {
      const release = () => target.classList.remove("is-pressed");

      target.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse") {
          return;
        }
        target.classList.add("is-pressed");
      });

      target.addEventListener("pointerup", release);
      target.addEventListener("pointercancel", release);
      target.addEventListener("pointerleave", release);
    });
  }

  function initFaqPolish() {
    const accordions = document.querySelectorAll("details[data-accordion]");

    accordions.forEach((accordion) => {
      const trigger = accordion.querySelector("[data-accordion-trigger]");
      if (trigger) {
        trigger.setAttribute("aria-expanded", accordion.open ? "true" : "false");
      }

      accordion.addEventListener("toggle", () => {
        accordion.classList.add("is-opening");
        window.setTimeout(() => accordion.classList.remove("is-opening"), 280);

        if (trigger) {
          trigger.setAttribute("aria-expanded", accordion.open ? "true" : "false");
        }

        const scope = accordion.closest("[data-accordion-scope]");
        if (!scope) {
          return;
        }

        if (accordion.open) {
          scope.querySelectorAll("details[data-accordion]").forEach((sibling) => {
            if (sibling !== accordion) {
              sibling.open = false;
            }
          });
        }

        const hasOpenItem = [...scope.querySelectorAll("details[data-accordion]")].some(
          (item) => item.open
        );
        scope.classList.toggle("has-open-item", hasOpenItem);
      });
    });
  }

  function initGalleryIndicators() {
    const rails = document.querySelectorAll("[data-gallery-snap]");
    const galleryEntries = [];

    rails.forEach((rail, railIndex) => {
      const items = [...rail.children].filter((child) => child.nodeType === Node.ELEMENT_NODE);
      if (!items.length) {
        return;
      }

      let indicators = rail.parentElement?.querySelector(
        `:scope > [data-gallery-indicators="${railIndex}"]`
      );

      if (!indicators) {
        indicators = document.createElement("div");
        indicators.className = "gallery-indicators";
        indicators.setAttribute("data-gallery-indicators", String(railIndex));
        indicators.setAttribute("data-hint", "Wischen");
        indicators.setAttribute("aria-hidden", "true");
        rail.insertAdjacentElement("afterend", indicators);
      }

      indicators.innerHTML = "";

      const dots = items.map((_, index) => {
        const dot = document.createElement("span");
        dot.className = "gallery-indicators__dot";
        dot.dataset.galleryDot = String(index);
        indicators.appendChild(dot);
        return dot;
      });

      const sync = () => {
        const railRect = rail.getBoundingClientRect();
        const railCenter = railRect.left + railRect.width / 2;
        let activeIndex = 0;
        let bestDistance = Number.POSITIVE_INFINITY;

        items.forEach((item, index) => {
          const rect = item.getBoundingClientRect();
          const itemCenter = rect.left + rect.width / 2;
          const distance = Math.abs(itemCenter - railCenter);
          if (distance < bestDistance) {
            bestDistance = distance;
            activeIndex = index;
          }
        });

        items.forEach((item, index) => {
          item.classList.toggle("is-active", index === activeIndex);
        });
        dots.forEach((dot, index) => {
          dot.classList.toggle("is-active", index === activeIndex);
        });
      };

      let rafId = 0;
      const requestGallerySync = () => {
        if (rafId) {
          return;
        }

        rafId = window.requestAnimationFrame(() => {
          sync();
          rafId = 0;
        });
      };

      const markInteracted = () => {
        indicators.classList.add("has-interacted");
        indicators.setAttribute("data-hint", "");
      };

      rail.addEventListener("scroll", requestGallerySync, { passive: true });
      rail.addEventListener("pointerdown", markInteracted, { passive: true });
      rail.addEventListener("touchstart", markInteracted, { passive: true });

      galleryEntries.push({ sync });
    });

    return galleryEntries;
  }

  function initOverlayCta() {
    const overlayCta = document.querySelector("[data-overlay-cta]");
    if (!overlayCta) {
      return;
    }

    overlayCta.classList.add("is-visible");
    overlayCta.classList.remove("is-mobile-expanded");
  }

  function highlightHashTarget() {
    const targetId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!targetId) {
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) {
      return;
    }

    target.classList.remove("is-anchor-target");
    void target.offsetWidth;
    target.classList.add("is-anchor-target");
  }
});

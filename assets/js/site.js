const pageConfig = window.PAGE_CONFIG || {};

function ready(fn) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", fn, { once: true });
  } else {
    fn();
  }
}

ready(() => {
  const header = document.querySelector(".site-header");
  const navPanel = document.querySelector("[data-nav-panel]");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const navLinks = document.querySelectorAll("[data-nav-link]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (navToggle && navPanel) {
    navToggle.addEventListener("click", () => {
      const isOpen = navPanel.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    navPanel.addEventListener("click", (event) => {
      if (event.target.matches("a")) {
        navPanel.classList.remove("is-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const currentPath = window.location.pathname.replace(/index\.html$/, "");
  navLinks.forEach((link) => {
    const linkPath = new URL(link.href, window.location.href).pathname.replace(/index\.html$/, "");
    if (currentPath === linkPath) {
      link.classList.add("is-active");
      link.setAttribute("aria-current", "page");
    }
  });

  const revealTargets = document.querySelectorAll("[data-reveal]");
  if (revealTargets.length) {
    if (!("IntersectionObserver" in window) || reduceMotion) {
      revealTargets.forEach((node) => node.classList.add("is-visible"));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.16 }
      );

      revealTargets.forEach((node) => revealObserver.observe(node));
    }
  }

  const accordions = document.querySelectorAll("details[data-accordion]");
  accordions.forEach((accordion) => {
    const trigger = accordion.querySelector("[data-accordion-trigger]");
    if (trigger) {
      trigger.setAttribute("aria-expanded", accordion.open ? "true" : "false");
    }

    accordion.addEventListener("toggle", () => {
      if (trigger) {
        trigger.setAttribute("aria-expanded", accordion.open ? "true" : "false");
      }

      if (!accordion.open) {
        return;
      }

      const scope = accordion.closest("[data-accordion-scope]");
      if (!scope) {
        return;
      }

      scope.querySelectorAll("details[data-accordion]").forEach((sibling) => {
        if (sibling !== accordion) {
          sibling.open = false;
        }
      });
    });
  });

  const trackedSections = document.querySelectorAll("[data-scroll-progress]");
  const updateTimelineProgress = () => {
    trackedSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const total = rect.height + window.innerHeight * 0.45;
      const progress = Math.max(0, Math.min(1, (window.innerHeight * 0.72 - rect.top) / total));
      section.style.setProperty("--progress", progress.toFixed(3));
    });
  };

  const overlayCta = document.querySelector("[data-overlay-cta]");
  const endCta = document.querySelector("[data-end-cta]");
  let lastScrollY = window.scrollY;
  let overlayBlocked = false;

  if (endCta && "IntersectionObserver" in window) {
    const endObserver = new IntersectionObserver(
      (entries) => {
        overlayBlocked = entries.some((entry) => entry.isIntersecting);
        updateOverlayState();
      },
      { threshold: 0.18 }
    );
    endObserver.observe(endCta);
  }

  function updateOverlayState() {
    if (!overlayCta || pageConfig.showStickyCta === false) {
      return;
    }

    const maxScrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
    const progress = window.scrollY / maxScrollable;
    const isMobile = window.matchMedia("(max-width: 47.99rem)").matches;
    const scrollingDown = window.scrollY > lastScrollY;

    if (isMobile) {
      const shouldShow = window.scrollY > 120 && scrollingDown && !overlayBlocked;
      overlayCta.classList.toggle("is-visible", shouldShow);
    } else {
      const shouldShow = progress > 0.24 && !overlayBlocked;
      overlayCta.classList.toggle("is-visible", shouldShow);
    }
  }

  const tiltTargets = window.matchMedia("(hover: hover) and (pointer: fine)").matches
    ? document.querySelectorAll("[data-tilt]")
    : [];

  tiltTargets.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 6;
      const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -6;
      card.classList.add("is-tilting");
      card.style.transform = `perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`;
    });

    card.addEventListener("pointerleave", () => {
      card.classList.remove("is-tilting");
      card.style.transform = "";
    });
  });

  const onScroll = () => {
    if (header) {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    updateTimelineProgress();
    updateOverlayState();
    lastScrollY = window.scrollY;
  };

  updateTimelineProgress();
  updateOverlayState();
  onScroll();

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    updateTimelineProgress();
    updateOverlayState();
  });
});

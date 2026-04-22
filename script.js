const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const navAnchors = document.querySelectorAll('a[href^="#"]');
const revealItems = document.querySelectorAll(".reveal");
const sectionLinks = document.querySelectorAll(".nav-links a");
const mediaImages = document.querySelectorAll("[data-media-wrapper] img");
const fallbackImages = document.querySelectorAll("img[data-fallback-src]");
const videoCards = document.querySelectorAll("[data-video-card]");

const closeNavigation = () => {
  if (!navToggle || !navLinks) {
    return;
  }

  navToggle.setAttribute("aria-expanded", "false");
  navLinks.classList.remove("is-open");
  document.body.classList.remove("nav-open");
};

if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const expanded = navToggle.getAttribute("aria-expanded") === "true";
    navToggle.setAttribute("aria-expanded", String(!expanded));
    navLinks.classList.toggle("is-open", !expanded);
    document.body.classList.toggle("nav-open", !expanded);
  });
}

navAnchors.forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const href = anchor.getAttribute("href");

    if (!href || !href.startsWith("#")) {
      closeNavigation();
      return;
    }

    const target = document.querySelector(href);

    if (!target) {
      closeNavigation();
      return;
    }

    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion.matches ? "auto" : "smooth", block: "start" });
    closeNavigation();
  });
});

window.addEventListener("resize", () => {
  if (window.innerWidth >= 760) {
    closeNavigation();
  }
});

if (!reduceMotion.matches && "IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: 0.14,
      rootMargin: "0px 0px -8% 0px"
    }
  );

  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}

if ("IntersectionObserver" in window) {
  const activeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        sectionLinks.forEach((link) => {
          const isActive = link.getAttribute("href") === `#${entry.target.id}`;
          link.classList.toggle("is-active", isActive);
        });
      });
    },
    {
      threshold: 0.45,
      rootMargin: "-20% 0px -35% 0px"
    }
  );

  sectionLinks.forEach((link) => {
    const id = link.getAttribute("href");
    const section = id ? document.querySelector(id) : null;

    if (section) {
      activeObserver.observe(section);
    }
  });
}

fallbackImages.forEach((image) => {
  image.addEventListener("error", () => {
    const fallback = image.dataset.fallbackSrc;

    if (fallback && image.getAttribute("src") !== fallback) {
      image.setAttribute("src", fallback);
    }
  });
});

mediaImages.forEach((image) => {
  image.addEventListener("error", () => {
    const fallback = image.dataset.fallbackSrc;

    if (fallback && image.getAttribute("src") !== fallback) {
      image.setAttribute("src", fallback);
      return;
    }

    const wrapper = image.closest("[data-media-wrapper]");

    if (wrapper) {
      wrapper.classList.add("is-missing");
    }
  });
});

videoCards.forEach((card) => {
  const video = card.querySelector("[data-hover-video]");
  const source = video ? video.querySelector("source") : null;

  if (!video || !source) {
    return;
  }

  const showFallback = () => {
    card.classList.add("is-missing");
  };

  const markReady = () => {
    card.classList.remove("is-missing");
  };

  const playVideo = () => {
    if (reduceMotion.matches || card.classList.contains("is-missing")) {
      return;
    }

    const playPromise = video.play();

    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        // Keep layout stable if autoplay is blocked.
      });
    }
  };

  const pauseVideo = () => {
    video.pause();
  };

  let isReady = false;
  const sourceType = source.getAttribute("type") || "";
  const sourcePath = source.getAttribute("src") || "";
  const isQuickTime = /quicktime/i.test(sourceType) || /\.mov($|\?)/i.test(sourcePath);
  const canPlaySource = sourceType ? video.canPlayType(sourceType) : "";

  if (isQuickTime && !canPlaySource) {
    showFallback();
    return;
  }

  video.muted = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;

  video.addEventListener("loadeddata", () => {
    isReady = true;
    markReady();
  });

  video.addEventListener("canplay", () => {
    isReady = true;
    markReady();
  });

  video.addEventListener("error", showFallback);
  source.addEventListener("error", showFallback);

  window.setTimeout(() => {
    if (!isReady) {
      showFallback();
    }
  }, 2200);

  if ("IntersectionObserver" in window && !reduceMotion.matches) {
    const videoObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            playVideo();
          } else {
            pauseVideo();
          }
        });
      },
      {
        threshold: 0.35
      }
    );

    videoObserver.observe(card);
  } else {
    playVideo();
  }

  card.addEventListener("mouseenter", playVideo);
  card.addEventListener("mouseleave", pauseVideo);
  card.addEventListener("focusin", playVideo);
  card.addEventListener("focusout", pauseVideo);
  card.addEventListener("click", () => {
    if (video.paused) {
      playVideo();
    } else {
      pauseVideo();
    }
  });
});

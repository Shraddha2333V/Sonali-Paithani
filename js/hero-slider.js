/**
 * SONALI PAITHANI — hero background rotation
 * -------------------------------------------------------------
 * Rotates the homepage hero background every 10 seconds, on a
 * continuous loop, crossfading between slides. Two DOM layers are
 * enough — we just repaint the "next" one behind the scenes before
 * swapping which is on top, so there's no flash.
 *
 * PHOTO NOTE: this site does not ship with real product photography
 * (see /assets/hero/README.txt for exactly what to add and where).
 * Each slide below tries to load a real photo first; if that photo
 * isn't there yet, it automatically falls back to a generated
 * Paithani colour look instead — so the site always works, and it
 * quietly upgrades to real photography the moment files are added,
 * with no code changes needed.
 * -------------------------------------------------------------
 */
(function () {
  const SLIDES = [
    {
      label: "Bridal Collection",
      image: "assets/hero/hero-1.jpg",
      fallback:
        "radial-gradient(60% 90% at 8% 55%, rgba(232,184,75,0.10), transparent 60%), linear-gradient(115deg, #3B0F1A 0%, #6B1E2B 46%, #164A42 100%)",
      drape: ["#C9972C", "#8A2E3E", "#164A42"],
    },
    {
      label: "Formal Portraits",
      image: "assets/hero/hero-2.jpg",
      fallback:
        "radial-gradient(60% 90% at 90% 20%, rgba(232,184,75,0.14), transparent 60%), linear-gradient(120deg, #0E3630 0%, #1F6E63 50%, #6B1E2B 100%)",
      drape: ["#E8B84B", "#1F6E63", "#6B1E2B"],
    },
    {
      label: "Heritage Collection",
      image: "assets/hero/hero-3.jpg",
      fallback:
        "radial-gradient(55% 85% at 15% 75%, rgba(232,184,75,0.12), transparent 60%), linear-gradient(120deg, #1E2A4A 0%, #33517F 45%, #6B1E2B 100%)",
      drape: ["#C9972C", "#33517F", "#3B0F1A"],
    },
    {
      label: "Festive Gatherings",
      image: "assets/hero/hero-4.jpg",
      fallback:
        "radial-gradient(55% 85% at 85% 80%, rgba(232,184,75,0.12), transparent 60%), linear-gradient(120deg, #241417 0%, #5B1420 50%, #3B0F1A 100%)",
      drape: ["#E8B84B", "#8A2E3E", "#241417"],
    },
    {
      label: "Getting-Ready Moments",
      image: "assets/hero/hero-5.jpg",
      fallback:
        "radial-gradient(55% 85% at 50% 100%, rgba(232,184,75,0.12), transparent 60%), linear-gradient(120deg, #4A1E14 0%, #8A2E3E 50%, #164A42 100%)",
      drape: ["#E8B84B", "#C9972C", "#164A42"],
    },
  ];

  const ROTATE_MS = 10000;
  const SCRIM =
    "linear-gradient(100deg, rgba(36,15,20,0.15) 0%, rgba(59,15,26,0.45) 50%, rgba(59,15,26,0.8) 100%)";

  // Cache of which slides have a real photo available, filled in as
  // images finish loading (or fail to).
  const photoAvailable = {};

  function preload(slide, index) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        photoAvailable[index] = true;
        resolve();
      };
      img.onerror = () => {
        photoAvailable[index] = false;
        resolve();
      };
      img.src = slide.image;
    });
  }

  function backgroundFor(slide, index) {
    if (photoAvailable[index]) {
      return `${SCRIM}, url('${slide.image}') center / cover no-repeat`;
    }
    return slide.fallback;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const hero = document.getElementById("hero");
    if (!hero) return; // this module only runs on the home page

    const layers = hero.querySelectorAll(".hero-bg-slide");
    const tag = document.getElementById("hero-slide-tag");
    const drapeLines = hero.querySelectorAll(".drape-line");
    const stop1 = hero.querySelector(".drape-stop-1");
    const stop2 = hero.querySelector(".drape-stop-2");
    const stop3 = hero.querySelector(".drape-stop-3");
    if (!layers.length) return;

    let current = 0; // index into SLIDES currently shown
    let topLayer = 0; // which DOM layer (0 or 1) is currently visible

    function applyDrape([c1, c2, c3]) {
      if (stop1) stop1.setAttribute("stop-color", c1);
      if (stop2) stop2.setAttribute("stop-color", c2);
      if (stop3) stop3.setAttribute("stop-color", c3);
      drapeLines.forEach((l) => l.setAttribute("stroke", c1));
    }

    // Preload every slide's photo once up front so the crossfade never
    // has to wait mid-rotation — a missing photo just resolves to
    // "not available" and that slide uses its fallback look instead.
    Promise.all(SLIDES.map(preload)).then(() => {
      layers[topLayer].style.background = backgroundFor(SLIDES[0], 0);
      layers[topLayer].classList.add("is-active");
      applyDrape(SLIDES[0].drape);
      if (tag) {
        tag.textContent = SLIDES[0].label;
        tag.classList.add("is-active");
      }
    });

    function goToNext() {
      const nextIndex = (current + 1) % SLIDES.length; // loops forever
      const nextSlide = SLIDES[nextIndex];
      const hiddenLayer = topLayer === 0 ? 1 : 0;
      const layerToHide = topLayer; // capture now — `topLayer` gets reassigned
                                     // below, and the rAF callback runs on a
                                     // later frame, so it must not read the
                                     // live outer variable or it ends up
                                     // hiding the layer it just showed.

      layers[hiddenLayer].style.background = backgroundFor(nextSlide, nextIndex);
      requestAnimationFrame(() => {
        layers[hiddenLayer].classList.add("is-active");
        layers[layerToHide].classList.remove("is-active");
      });

      if (tag) {
        tag.classList.remove("is-active");
        setTimeout(() => {
          tag.textContent = nextSlide.label;
          tag.classList.add("is-active");
        }, 350);
      }

      applyDrape(nextSlide.drape);
      current = nextIndex;
      topLayer = hiddenLayer;
    }

    // Respect users who've asked for reduced motion — keep the first
    // look static instead of auto-rotating.
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) {
      setInterval(goToNext, ROTATE_MS); // runs indefinitely — the loop never stops
    }
  });
})();

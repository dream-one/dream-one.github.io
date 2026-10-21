(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const header = document.getElementById("site-header");
  const menuToggle = document.querySelector(".menu-toggle");
  const menuLabel = document.querySelector(".menu-label");
  const primaryNav = document.getElementById("primary-nav");
  const main = document.getElementById("main");
  const progressBar = document.getElementById("scroll-progress-bar");
  const mobileQuery = window.matchMedia("(max-width: 920px)");

  /* Mobile navigation */
  let menuOpen = false;

  const getHeaderFocusables = () =>
    Array.from(header.querySelectorAll("a[href], button:not([disabled])")).filter(
      (element) => element.getClientRects().length > 0
    );

  const setMenu = (open, returnFocus = false) => {
    menuOpen = Boolean(open && mobileQuery.matches);

    header.classList.toggle("nav-open", menuOpen);
    document.body.classList.toggle("menu-open", menuOpen);
    menuToggle.setAttribute("aria-expanded", String(menuOpen));
    menuLabel.textContent = menuOpen ? "关闭" : "菜单";

    if (main) {
      main.inert = menuOpen;
    }

    if (menuOpen) {
      window.setTimeout(() => {
        primaryNav.querySelector("a")?.focus({ preventScroll: true });
      }, 40);
    } else if (returnFocus) {
      menuToggle.focus({ preventScroll: true });
    }
  };

  if (menuToggle && primaryNav) {
    menuToggle.addEventListener("click", () => setMenu(!menuOpen, menuOpen));

    document.querySelector(".menu-scrim")?.addEventListener("click", () => {
      setMenu(false, true);
    });

    primaryNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => setMenu(false, false));
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menuOpen) {
        setMenu(false, true);
        return;
      }

      if (event.key !== "Tab" || !menuOpen) {
        return;
      }

      const focusables = getHeaderFocusables();
      if (!focusables.length) {
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;

      if (!focusables.includes(current)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && current === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first.focus();
      }
    });

    const handleBreakpointChange = (event) => {
      if (!event.matches && menuOpen) {
        setMenu(false, false);
      }
    };

    if (mobileQuery.addEventListener) {
      mobileQuery.addEventListener("change", handleBreakpointChange);
    } else {
      mobileQuery.addListener(handleBreakpointChange);
    }
  }

  /* Scroll progress, header state and active navigation */
  const navLinks = Array.from(document.querySelectorAll('.primary-nav a[href^="#"]'));
  const sections = navLinks
    .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
    .filter(Boolean);

  let scrollTicking = false;

  const updateOnScroll = () => {
    const scrollTop = window.scrollY || window.pageYOffset;
    const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollableHeight > 0 ? Math.min(scrollTop / scrollableHeight, 1) : 0;

    header?.classList.toggle("is-scrolled", scrollTop > 12);

    if (progressBar) {
      progressBar.style.transform = `scaleX(${progress})`;
    }

    const marker = window.innerHeight * 0.36;
    let activeId = "";

    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= marker) {
        activeId = section.id;
      }
    });

    navLinks.forEach((link) => {
      if (link.getAttribute("href") === `#${activeId}`) {
        link.setAttribute("aria-current", "location");
      } else {
        link.removeAttribute("aria-current");
      }
    });

    scrollTicking = false;
  };

  const requestScrollUpdate = () => {
    if (scrollTicking) {
      return;
    }

    scrollTicking = true;
    window.requestAnimationFrame(updateOnScroll);
  };

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate, { passive: true });
  updateOnScroll();

  /* Reveal sections */
  const revealItems = document.querySelectorAll("[data-reveal]");

  if (revealItems.length) {
    if (!("IntersectionObserver" in window) || reduceMotion.matches) {
      revealItems.forEach((item) => item.classList.add("is-inview"));
    } else {
      const revealObserver = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) {
              return;
            }

            entry.target.classList.add("is-inview");
            observer.unobserve(entry.target);
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
      );

      revealItems.forEach((item) => revealObserver.observe(item));
    }
  }

  /* Signal console */
  const plotWidth = 620;
  const twoPi = Math.PI * 2;

  const buildWavePath = (valueAt, baseline, amplitude, samples = 600) => {
    const points = [];

    for (let index = 0; index <= samples; index += 1) {
      const t = index / samples;
      const x = t * plotWidth;
      const y = baseline - valueAt(t) * amplitude;
      points.push(`${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
    }

    return points.join(" ");
  };

  const respiratoryFlow = (t) => {
    const cycle = (t * 2) % 1;
    const inspiration = Math.exp(-Math.pow((cycle - 0.24) / 0.15, 2));
    const expiration = -0.6 * Math.exp(-Math.pow((cycle - 0.68) / 0.22, 2));
    return inspiration + expiration + 0.03 * Math.sin(cycle * twoPi * 3);
  };

  const respiratoryPressure = (t) => {
    const cycle = (t * 2) % 1;
    return (
      0.35 * Math.exp(-Math.pow((cycle - 0.19) / 0.17, 2)) +
      0.08 * Math.sin(cycle * twoPi) -
      0.04
    );
  };

  const vibrationSignal = (t) => {
    const envelope =
      Math.exp(-Math.pow((t - 0.26) / 0.055, 2)) +
      0.8 * Math.exp(-Math.pow((t - 0.585) / 0.06, 2)) +
      0.45 * Math.exp(-Math.pow((t - 0.84) / 0.04, 2));

    return (
      envelope *
      (Math.sin(t * twoPi * 52) * 0.62 +
        Math.sin(t * twoPi * 91 + 1.1) * 0.27 +
        Math.sin(t * twoPi * 143 + 0.4) * 0.11)
    );
  };

  const vibrationEnvelope = (t) =>
    0.25 +
    0.55 * Math.exp(-Math.pow((t - 0.26) / 0.09, 2)) +
    0.4 * Math.exp(-Math.pow((t - 0.59) / 0.1, 2)) +
    0.2 * Math.exp(-Math.pow((t - 0.84) / 0.06, 2));

  const buildStepSignal = (t, steps) => {
    const count = steps.length;
    const position = t * count;
    const index = Math.min(Math.floor(position), count - 1);
    const nextIndex = Math.min(index + 1, count - 1);
    const blend = Math.min((position - index) / 0.12, 1);
    return steps[index] + (steps[nextIndex] - steps[index]) * blend;
  };

  const burnInState = (t) => {
    const steps = [0.08, 0.82, 0.42, 0.72, 0.28, 0.6];
    const spark = Math.exp(-Math.pow((t - 0.485) / 0.009, 2)) * 0.7;
    return buildStepSignal(t, steps) + spark + 0.012 * Math.sin(t * twoPi * 44);
  };

  const burnInProcess = (t) => {
    const steps = [0.12, 0.12, 0.26, 0.26, 0.5, 0.66];
    return buildStepSignal(t, steps) + 0.02 * Math.sin(t * twoPi * 8);
  };

  const presets = {
    resp: {
      mode: "VENTILATOR / 7 CHANNEL",
      channels: ["FLOW / 流量", "PAW / 压力"],
      axis: ["0 s", "6 s", "12 s"],
      labels: ["CHANNELS", "RENDER", "IMPORT"],
      values: ["07 CH", "60 FPS", "120→40 s"],
      paths: [
        buildWavePath(respiratoryFlow, 90, 42),
        buildWavePath(respiratoryPressure, 210, 36)
      ]
    },
    vibration: {
      mode: "BEARING / 64 kHz",
      channels: ["VIB / 振动", "ENVELOPE / 包络"],
      axis: ["0 ms", "50 ms", "100 ms"],
      labels: ["SAMPLE RATE", "FFT BATCH", "RUNTIME"],
      values: ["64 kHz", "~10 ms", "12 h"],
      paths: [
        buildWavePath(vibrationSignal, 90, 46),
        buildWavePath(vibrationEnvelope, 214, 38)
      ]
    },
    burnin: {
      mode: "BURN-IN / CLOSED LOOP",
      channels: ["STATE / 状态", "PROCESS / 工艺"],
      axis: ["T0", "T1", "T2"],
      labels: ["LOOP MODE", "RESPONSE", "AUDIT"],
      values: ["AUTO", "−60%", "ON"],
      paths: [
        buildWavePath(burnInState, 90, 42),
        buildWavePath(burnInProcess, 210, 92)
      ]
    }
  };

  const signalTabs = Array.from(document.querySelectorAll(".signal-tab"));
  const signalPanel = document.getElementById("signal-panel");
  const signalPlot = document.querySelector(".signal-plot");
  const signalPathA = document.getElementById("signal-path-a");
  const signalPathB = document.getElementById("signal-path-b");
  const signalMode = document.getElementById("signal-mode");

  let activePreset = "resp";
  let presetTimer = 0;

  const applyPreset = (key) => {
    const preset = presets[key];
    if (!preset) {
      return;
    }

    if (signalPathA) {
      signalPathA.setAttribute("d", preset.paths[0]);
    }

    if (signalPathB) {
      signalPathB.setAttribute("d", preset.paths[1]);
    }

    if (signalMode) {
      signalMode.textContent = preset.mode;
    }

    const channelA = document.getElementById("signal-channel-a");
    const channelB = document.getElementById("signal-channel-b");
    if (channelA && channelB) {
      channelA.textContent = preset.channels[0];
      channelB.textContent = preset.channels[1];
    }

    preset.axis.forEach((value, index) => {
      const axis = document.getElementById(`signal-axis-${["a", "b", "c"][index]}`);
      if (axis) {
        axis.textContent = value;
      }
    });

    preset.labels.forEach((label, index) => {
      const labelElement = document.getElementById(`signal-label-${index + 1}`);
      const valueElement = document.getElementById(`signal-value-${index + 1}`);
      if (labelElement) {
        labelElement.textContent = label;
      }
      if (valueElement) {
        valueElement.textContent = preset.values[index];
      }
    });

    if (signalPlot) {
      signalPlot.setAttribute("aria-label", `${preset.mode} 技术示意波形`);
    }
  };

  const activateTab = (tab, moveFocus = false) => {
    if (!tab || !signalPanel) {
      return;
    }

    const key = tab.dataset.preset;
    if (!presets[key]) {
      return;
    }

    signalTabs.forEach((item) => {
      const isSelected = item === tab;
      item.setAttribute("aria-selected", String(isSelected));
      item.tabIndex = isSelected ? 0 : -1;
    });

    signalPanel.setAttribute("aria-labelledby", tab.id);

    if (moveFocus) {
      tab.focus();
    }

    if (key === activePreset) {
      return;
    }

    activePreset = key;
    window.clearTimeout(presetTimer);

    if (reduceMotion.matches) {
      applyPreset(key);
      return;
    }

    signalPanel.classList.add("is-changing");
    presetTimer = window.setTimeout(() => {
      applyPreset(key);
      signalPanel.classList.remove("is-changing");
    }, 140);
  };

  if (signalTabs.length && signalPanel) {
    signalTabs.forEach((tab, index) => {
      tab.addEventListener("click", () => activateTab(tab));

      tab.addEventListener("keydown", (event) => {
        let nextIndex = null;

        if (event.key === "ArrowRight") {
          nextIndex = (index + 1) % signalTabs.length;
        } else if (event.key === "ArrowLeft") {
          nextIndex = (index - 1 + signalTabs.length) % signalTabs.length;
        } else if (event.key === "Home") {
          nextIndex = 0;
        } else if (event.key === "End") {
          nextIndex = signalTabs.length - 1;
        }

        if (nextIndex === null) {
          return;
        }

        event.preventDefault();
        activateTab(signalTabs[nextIndex], true);
      });
    });

    applyPreset("resp");
  }

  /* Copy contact details */
  const copyStatus = document.getElementById("copy-status");

  const announce = (message) => {
    if (!copyStatus) {
      return;
    }

    copyStatus.textContent = "";
    window.setTimeout(() => {
      copyStatus.textContent = message;
    }, 20);
  };

  const fallbackCopy = (text) => {
    const field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.top = "-1000px";
    field.style.opacity = "0";
    document.body.appendChild(field);
    field.select();
    const copied = document.execCommand("copy");
    field.remove();

    if (!copied) {
      throw new Error("Copy command failed");
    }
  };

  document.querySelectorAll("[data-copy]").forEach((button) => {
    let resetTimer = 0;

    button.addEventListener("click", async () => {
      const value = button.getAttribute("data-copy");
      if (!value) {
        return;
      }

      const originalLabel = button.textContent;
      const fieldName = value.includes("@") ? "邮箱" : "电话号码";

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(value);
        } else {
          fallbackCopy(value);
        }

        button.textContent = "已复制";
        button.classList.add("is-copied");
        announce(`${fieldName}已复制到剪贴板`);
        window.clearTimeout(resetTimer);
        resetTimer = window.setTimeout(() => {
          button.textContent = originalLabel;
          button.classList.remove("is-copied");
        }, 1800);
      } catch (error) {
        announce("复制失败，请手动选择联系方式");
      }
    });
  });
})();

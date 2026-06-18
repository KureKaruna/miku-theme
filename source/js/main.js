/* ============================================
   miku-theme — Main JavaScript
   Theme toggle, mobile nav, TOC, back-to-top,
   kinetic typography, smooth scroll
   ============================================ */

(function () {
  'use strict';

  // ============================================
  // Theme Toggle (Light / Dark)
  // ============================================

  var THEME_KEY = 'miku-theme-pref';

  function getTheme() {
    var stored = localStorage.getItem(THEME_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    // Skip if already at target — avoids redundant DOM mutations that can
    // retrigger CSS transitions on the theme toggle icons.
    if (document.documentElement.getAttribute('data-theme') === theme) return;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeToggle(theme);
  }

  function updateThemeToggle(theme) {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    // Drive the sun/moon cross-fade from CSS via a single class instead of
    // swapping the icon markup. The two SVGs live in the button permanently.
    var shouldBeDark = theme === 'dark';
    if (toggle.classList.contains('is-dark') !== shouldBeDark) {
      toggle.classList.toggle('is-dark', shouldBeDark);
    }
    var lang = document.documentElement.lang || 'zh-CN';
    var pack = (window.MIKU_I18N && window.MIKU_I18N[lang]) ? window.MIKU_I18N[lang].theme : null;
    if (theme === 'dark') {
      toggle.setAttribute('aria-label', pack ? pack.switch_light : 'Switch to light mode');
      toggle.setAttribute('title', pack ? pack.switch_light : 'Switch to light mode');
    } else {
      toggle.setAttribute('aria-label', pack ? pack.switch_dark : 'Switch to dark mode');
      toggle.setAttribute('title', pack ? pack.switch_dark : 'Switch to dark mode');
    }
  }

  var toggleBtn = document.getElementById('themeToggle');
  if (toggleBtn) {
    setTheme(getTheme());
    toggleBtn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme');
      setTheme(current === 'dark' ? 'light' : 'dark');
    });
  }

  // ============================================
  // Language Toggle (zh-CN / en)
  // ============================================

  var LANG_KEY = 'miku-lang-pref';

  function getLang() {
    var stored = localStorage.getItem(LANG_KEY);
    if (stored === 'zh-CN' || stored === 'en') return stored;
    return document.documentElement.lang || 'zh-CN';
  }

  function setLang(lang) {
    document.documentElement.lang = lang;
    localStorage.setItem(LANG_KEY, lang);
    updateLangUI(lang);
    applyLangStrings(lang);
  }

  function updateLangUI(lang) {
    var toggle = document.getElementById('langToggle');
    if (!toggle) return;
    var txt = toggle.querySelector('.lang-toggle-text');
    // Show what the OTHER language is called in the CURRENT language pack
    var currentPack = window.MIKU_I18N && window.MIKU_I18N[lang];
    if (txt && currentPack) {
      txt.textContent = currentPack['lang.switch_to'];
    }
    toggle.setAttribute('aria-label', currentPack ? currentPack['lang.switch_to'] : 'Switch language');
  }

  function applyLangStrings(lang) {
    if (!window.MIKU_I18N || !window.MIKU_I18N[lang]) return;
    var pack = window.MIKU_I18N[lang];

    // Swap text content for all [data-i18n] elements
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (pack[key]) el.textContent = pack[key];
    });

    // Swap attributes for all [data-i18n-attrs] elements
    document.querySelectorAll('[data-i18n-attrs]').forEach(function (el) {
      var attrs = el.getAttribute('data-i18n-attrs').split(' ');
      attrs.forEach(function (attr) {
        // Find the matching key: look for data-i18n on the element itself,
        // or use the attr name to find the right translation key
        var key = el.getAttribute('data-i18n');
        if (!key) key = el.getAttribute('data-i18n-' + attr);
        // Fallback: for search input, use known mapping
        if (!key && attr === 'placeholder' && el.id === 'searchInput') key = 'search.placeholder';
        if (!key && attr === 'aria-label') {
          // Try to find from parent or use element-specific logic
          if (el.classList.contains('theme-toggle')) {
            key = document.documentElement.getAttribute('data-theme') === 'dark' ? 'theme.switch_light' : 'theme.switch_dark';
          }
        }
        if (key && pack[key]) el.setAttribute(attr, pack[key]);
      });
    });

    // Update theme toggle aria-label specifically
    var themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
      var currentTheme = document.documentElement.getAttribute('data-theme');
      var themeKey = currentTheme === 'dark' ? 'theme.switch_light' : 'theme.switch_dark';
      themeToggle.setAttribute('aria-label', pack[themeKey]);
      themeToggle.setAttribute('title', pack[themeKey]);
    }

    // Update back-to-top
    var btt = document.getElementById('backToTop');
    if (btt) btt.setAttribute('aria-label', pack['a11y.back_to_top']);

    // Trigger search UI update
    var evt = new Event('langchange');
    document.dispatchEvent(evt);
  }

  var langToggle = document.getElementById('langToggle');
  if (langToggle) {
    var currentLang = getLang();
    setLang(currentLang);

    langToggle.addEventListener('click', function () {
      var lang = document.documentElement.lang;
      var nextLang = lang === 'zh-CN' ? 'en' : 'zh-CN';
      setLang(nextLang);
    });
  }

  // ============================================
  // Mobile Nav Toggle
  // ============================================

  var navToggle = document.getElementById('navbarToggle');
  var navLinks = document.getElementById('navbarLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.innerHTML = open ? '&#10005;' : '&#9776;';
    });
  }

  // ============================================
  // Back to Top Button
  // ============================================

  function ensureBackToTop() {
    var btn = document.getElementById('backToTop');
    if (btn) return btn;
    btn = document.createElement('button');
    btn.id = 'backToTop';
    btn.className = 'back-to-top';
    btn.setAttribute('aria-label', 'Back to top');
    btn.innerHTML = '&#8593;';
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
    document.body.appendChild(btn);
    return btn;
  }

  var btt = ensureBackToTop();
  var ticking = false;
  window.addEventListener('scroll', function () {
    if (!ticking) {
      requestAnimationFrame(function () {
        if (window.scrollY > 400) {
          btt.classList.add('visible');
        } else {
          btt.classList.remove('visible');
        }
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // ============================================
  // Table of Contents Generator
  // ============================================

  function buildTOC() {
    var toc = document.getElementById('toc');
    var tocList = document.getElementById('tocList');
    var content = document.querySelector('.post-content');
    if (!toc || !tocList || !content) return;

    var headings = content.querySelectorAll('h2, h3');
    if (headings.length < 2) return;

    var tocItems = [];

    function setActiveTOC(link) {
      tocList.querySelectorAll('a').forEach(function (a) {
        a.classList.remove('active');
      });
      if (link) link.classList.add('active');
    }

    function typesetTOCMath() {
      var mathJax = window.MathJax;
      if (!mathJax || !tocList) return;

      function typeset() {
        if (typeof mathJax.typesetPromise === 'function') {
          mathJax.typesetPromise([tocList]).catch(function (err) {
            if (window.console && console.warn) {
              console.warn('TOC MathJax rendering failed.', err);
            }
          });
        } else if (typeof mathJax.typeset === 'function') {
          mathJax.typeset([tocList]);
        }
      }

      if (mathJax.startup && mathJax.startup.promise) {
        mathJax.startup.promise.then(typeset);
      } else {
        typeset();
      }
    }

    function appendTOCHeadingContent(target, heading) {
      var allowedInline = {
        ABBR: true,
        B: true,
        BR: true,
        CODE: true,
        EM: true,
        I: true,
        KBD: true,
        MARK: true,
        S: true,
        SMALL: true,
        SPAN: true,
        STRONG: true,
        SUB: true,
        SUP: true,
        U: true
      };

      function appendNode(parent, node) {
        if (node.nodeType === Node.TEXT_NODE) {
          parent.appendChild(document.createTextNode(node.nodeValue));
          return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;

        var tag = node.tagName;
        if (tag === 'A') {
          Array.prototype.forEach.call(node.childNodes, function (child) {
            appendNode(parent, child);
          });
          return;
        }

        if (tag === 'MJX-CONTAINER') {
          parent.appendChild(node.cloneNode(true));
          return;
        }

        if (!allowedInline[tag]) {
          parent.appendChild(document.createTextNode(node.textContent || ''));
          return;
        }

        var clone = document.createElement(tag.toLowerCase());
        var className = node.getAttribute('class');
        if (className) clone.setAttribute('class', className);
        if (tag === 'ABBR' && node.getAttribute('title')) {
          clone.setAttribute('title', node.getAttribute('title'));
        }

        if (tag !== 'BR') {
          Array.prototype.forEach.call(node.childNodes, function (child) {
            appendNode(clone, child);
          });
        }
        parent.appendChild(clone);
      }

      Array.prototype.forEach.call(heading.childNodes, function (node) {
        appendNode(target, node);
      });

      if (!target.textContent.trim()) {
        target.textContent = heading.textContent;
      }
    }

    headings.forEach(function (h, i) {
      var id = h.id || ('heading-' + i);
      h.id = id;

      var li = document.createElement('li');
      li.className = h.tagName === 'H3' ? 'toc-h3' : 'toc-h2';

      var a = document.createElement('a');
      a.href = '#' + id;
      appendTOCHeadingContent(a, h);
      a.setAttribute('aria-label', h.textContent.trim());
      a.setAttribute('data-target', id);

      // Intercept click: scroll via JS + replaceState to avoid history pollution
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var targetId = this.getAttribute('data-target');
        var target = document.getElementById(targetId);
        if (target) {
          // Immediately update highlight — don't wait for IntersectionObserver
          setActiveTOC(this);

          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', '#' + targetId);
        }
      });

      li.appendChild(a);
      tocList.appendChild(li);
      tocItems.push({ heading: h, link: a });
    });

    // Show TOC
    toc.classList.add('visible');
    typesetTOCMath();

    // Scroll-position based tracking handles final headings that cannot reach
    // an IntersectionObserver trigger zone before the document bottoms out.
    var tocTicking = false;
    var bottomThreshold = 8;

    function getDocumentHeight() {
      return Math.max(
        document.documentElement.scrollHeight,
        document.body ? document.body.scrollHeight : 0
      );
    }

    function updateActiveTOC() {
      var scrollPad = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop, 10) || 0;
      var scanLine = window.scrollY + scrollPad + 12;
      var docHeight = getDocumentHeight();
      var atBottom = window.scrollY + window.innerHeight >= docHeight - bottomThreshold;
      var activeItem = tocItems[0];

      if (atBottom) {
        activeItem = tocItems[tocItems.length - 1];
      } else {
        tocItems.forEach(function (item) {
          var headingTop = item.heading.getBoundingClientRect().top + window.scrollY;
          if (headingTop <= scanLine) activeItem = item;
        });
      }

      setActiveTOC(activeItem ? activeItem.link : null);
      tocTicking = false;
    }

    function requestTOCUpdate() {
      if (tocTicking) return;
      tocTicking = true;
      requestAnimationFrame(updateActiveTOC);
    }

    window.addEventListener('scroll', requestTOCUpdate, { passive: true });
    window.addEventListener('resize', requestTOCUpdate);
    requestTOCUpdate();

    // Handle page load hash — scroll with navbar offset + highlight TOC link
    if (window.location.hash) {
      var hashId = window.location.hash.slice(1);
      var hashTarget = document.getElementById(hashId);
      if (hashTarget) {
        setTimeout(function () {
          hashTarget.scrollIntoView({ block: 'start' });
          var hashLink = tocList.querySelector('a[data-target="' + hashId + '"]');
          if (hashLink) {
            setActiveTOC(hashLink);
          }
          requestTOCUpdate();
        }, 100);
      }
    }
  }

  // ============================================
  // Tag Cloud — click interception & scroll highlight
  // ============================================

  function initTagCloud() {
    var cloud = document.querySelector('.tag-cloud');
    if (!cloud) return;

    // --- Intercept clicks to avoid browser history pollution ---
    cloud.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var href = this.getAttribute('href');
        if (!href || href.charAt(0) !== '#') return;
        var target = document.getElementById(href.slice(1));
        if (!target) return;

        // Immediately update active state
        cloud.querySelectorAll('a').forEach(function (a) {
          a.classList.remove('active');
        });
        this.classList.add('active');

        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', href);
      });
    });

    // --- IntersectionObserver for scroll-based highlighting ---
    var sections = document.querySelectorAll('.tag-section');
    if (sections.length === 0) return;

    var scrollPad = parseInt(
      getComputedStyle(document.documentElement).scrollPaddingTop, 10
    ) || 0;
    var rootMargin = '-' + (scrollPad + 6) + 'px 0px -60% 0px';

    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var sectionId = entry.target.id;
          cloud.querySelectorAll('a').forEach(function (a) {
            a.classList.remove('active');
          });
          var active = cloud.querySelector('a[href="#' + sectionId + '"]');
          if (active) active.classList.add('active');
        }
      });
    }, { rootMargin: rootMargin });

    sections.forEach(function (s) { sectionObserver.observe(s); });
  }

  // ============================================
  // Code Copy Buttons
  // ============================================

  function initCodeCopyButtons() {
    var blocks = document.querySelectorAll('.post-content figure.highlight');
    if (!blocks.length) return;

    function fallbackCopy(text) {
      var textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.top = '-9999px';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();

      var ok = false;
      try {
        ok = document.execCommand('copy');
      } finally {
        document.body.removeChild(textarea);
      }
      return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
    }

    blocks.forEach(function (figure) {
      if (figure.querySelector('.code-copy-btn')) return;

      var codePre = figure.querySelector('.code pre');
      if (!codePre) return;

      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'code-copy-btn';
      button.textContent = '\u590D\u5236';
      button.setAttribute('aria-label', '\u590D\u5236\u4EE3\u7801');

      button.addEventListener('click', function () {
        var text = codePre.innerText || codePre.textContent || '';
        text = text.replace(/\n$/, '');

        if (!text) return;

        var copyTask = navigator.clipboard && navigator.clipboard.writeText
          ? navigator.clipboard.writeText(text)
          : fallbackCopy(text);

        copyTask.then(function () {
          button.textContent = '\u5DF2\u590D\u5236';
          button.classList.add('is-copied');
          button.classList.remove('is-error');
        }).catch(function () {
          button.textContent = '\u590D\u5236\u5931\u8D25';
          button.classList.add('is-error');
          button.classList.remove('is-copied');
        }).finally(function () {
          setTimeout(function () {
            button.textContent = '\u590D\u5236';
            button.classList.remove('is-copied', 'is-error');
          }, 1500);
        });
      });

      figure.appendChild(button);
    });
  }

  // ============================================
  // Spotlight surfaces
  // ----------------------------------------------
  // Pointer-tracked radial-gradient overlay. Stays
  // pure DOM: no animation library, just writes the
  // --spot-x/--spot-y CSS vars coalesced to one rAF.
  // ============================================

  function initSpotlightSurfaces() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    var selector = '.article-card, .search-result-item, .about-card, figure.highlight, .post-nav-item, .search-tag-panel';
    document.querySelectorAll(selector).forEach(function (surface) {
      if (surface.classList.contains('spotlight-surface')) return;
      surface.classList.add('spotlight-surface');

      var pendingEvent = null;
      var scheduled = false;

      function applySpot() {
        scheduled = false;
        var event = pendingEvent;
        if (!event) return;
        var rect = surface.getBoundingClientRect();
        surface.style.setProperty('--spot-x', ((event.clientX - rect.left) / rect.width * 100).toFixed(2) + '%');
        surface.style.setProperty('--spot-y', ((event.clientY - rect.top) / rect.height * 100).toFixed(2) + '%');
      }

      surface.addEventListener('pointermove', function (event) {
        pendingEvent = event;
        if (!scheduled) {
          scheduled = true;
          requestAnimationFrame(applySpot);
        }
      }, { passive: true });
    });
  }

  // ============================================
  // Motion controller
  // ----------------------------------------------
  // Single cohesive motion layer. No GSAP/ScrollTrigger.
  //   - Entrance reveals: one IntersectionObserver flips
  //     .is-visible; CSS does the actual animation.
  //   - Scroll-driven effects (progress bar, hero &
  //     post-cover parallax, timeline lighting) share one
  //     passive scroll listener + one rAF loop.
  //   - Hover/focus lift is pure CSS (.lift-on-hover).
  // TIMING mirrors the CSS tokens (variables.css) so the
  // two layers never drift.
  // ============================================

  var TIMING = {
    revealStagger: 35,   // ms per step  (== --reveal-stagger)
    revealSettle: 600,   // ms to keep .will-animate before clearing
    scrollLerp: 0.12,    // smoothing factor for parallax/progress
    markGlowDuration: 800
  };

  // ============================================
  // Ambient effects (sakura petals / rain drops)
  // Light theme → sakura.  Dark theme → rain.
  // Togglable via the effects-toggle button.
  // Respects reduced-motion; pauses on hidden tabs.
  // ============================================

  var EFFECTS_PREF_KEY = 'miku-effects-pref';

  var SAKURA_CONFIG = {
    maxParticles: 25,
    spawnIntervalMin: 350,
    spawnIntervalMax: 700,
    colors: [
      'rgba(255, 182, 193, 0.70)',
      'rgba(255, 155, 170, 0.65)',
      'rgba(255, 200, 210, 0.60)',
      'rgba(240, 140, 160, 0.68)',
      'rgba(255, 215, 225, 0.55)'
    ],
    sizeMin: 8,
    sizeMax: 16,
    speedYMin: 0.3,
    speedYMax: 0.8,
    speedXMin: -0.15,
    speedXMax: -0.45,
    swayAmpMin: 18,
    swayAmpMax: 45,
    swayFreqMin: 0.012,
    swayFreqMax: 0.032,
    rotSpeedMin: 0.004,
    rotSpeedMax: 0.018
  };

  var RAIN_CONFIG = {
    maxParticles: 50,
    spawnIntervalMin: 60,
    spawnIntervalMax: 150,
    colors: [
      'rgba(57, 197, 187, 0.48)',
      'rgba(57, 197, 187, 0.38)',
      'rgba(120, 220, 210, 0.44)',
      'rgba(40, 180, 170, 0.40)',
      'rgba(90, 210, 200, 0.36)'
    ],
    lengthMin: 10,
    lengthMax: 22,
    speedYMin: 2.0,
    speedYMax: 4.5,
    speedXMin: -0.6,
    speedXMax: -1.2
  };

  var effectsState = {
    canvas: null,
    ctx: null,
    particles: [],
    enabled: true,
    activeType: null,   // 'sakura' | 'rain' | null
    rafId: null,
    lastSpawn: 0,
    nextSpawnIn: 0,
    lastTime: 0,
    frame: 0,
    width: 0,
    height: 0
  };

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  // --- Sakura particle helpers ---

  function spawnSakuraPetal() {
    var s = effectsState;
    var cfg = SAKURA_CONFIG;
    return {
      type: 'sakura',
      x: randomRange(s.width * 0.62, s.width),
      y: randomRange(-20, s.height * 0.15),
      size: randomRange(cfg.sizeMin, cfg.sizeMax),
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: randomRange(cfg.rotSpeedMin, cfg.rotSpeedMax) * (Math.random() > 0.5 ? 1 : -1),
      speedX: randomRange(cfg.speedXMin, cfg.speedXMax),
      speedY: randomRange(cfg.speedYMin, cfg.speedYMax),
      swayAmp: randomRange(cfg.swayAmpMin, cfg.swayAmpMax),
      swayFreq: randomRange(cfg.swayFreqMin, cfg.swayFreqMax),
      swayOffset: Math.random() * Math.PI * 2,
      color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)]
    };
  }

  function updateSakuraPetal(p, dt) {
    var scale = dt * 60;
    p.x += p.speedX + Math.sin(effectsState.frame * p.swayFreq + p.swayOffset) * p.swayAmp * dt;
    p.y += p.speedY * scale;
    p.rotation += p.rotationSpeed * scale;
  }

  function isSakuraOffScreen(p) {
    return p.y > effectsState.height + 30 || p.x < -30;
  }

  function drawSakuraPetal(ctx, p) {
    var size = p.size;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.48, -size * 0.5, size * 0.52, size * 0.15, 0, size);
    ctx.bezierCurveTo(-size * 0.52, size * 0.15, -size * 0.48, -size * 0.5, 0, -size);
    ctx.fill();
    ctx.restore();
  }

  // --- Rain particle helpers ---

  function spawnRainDrop() {
    var s = effectsState;
    var cfg = RAIN_CONFIG;
    return {
      type: 'rain',
      x: randomRange(-20, s.width + 20),
      y: randomRange(-35, -5),
      length: randomRange(cfg.lengthMin, cfg.lengthMax),
      speedX: randomRange(cfg.speedXMin, cfg.speedXMax),
      speedY: randomRange(cfg.speedYMin, cfg.speedYMax),
      color: cfg.colors[Math.floor(Math.random() * cfg.colors.length)]
    };
  }

  function updateRainDrop(d, dt) {
    var scale = dt * 60;
    d.x += d.speedX * scale;
    d.y += d.speedY * scale;
  }

  function isRainDropOffScreen(d) {
    return d.y > effectsState.height + 30 || d.x < -30 || d.x > effectsState.width + 30;
  }

  function drawRainDrop(ctx, d) {
    ctx.save();
    ctx.strokeStyle = d.color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    // Slanted top-right → bottom-left
    ctx.lineTo(d.x - d.length * 0.4, d.y + d.length);
    ctx.stroke();
    ctx.restore();
  }

  // --- Unified effects loop ---

  function effectsLoop(timestamp) {
    if (!effectsState.enabled || !effectsState.activeType) return;

    var s = effectsState;
    var isSakura = s.activeType === 'sakura';

    var dt = s.lastTime ? Math.min((timestamp - s.lastTime) / 1000, 0.1) : 0.016;
    s.lastTime = timestamp;
    s.frame++;

    var cfg = isSakura ? SAKURA_CONFIG : RAIN_CONFIG;

    // Spawn
    if (timestamp - s.lastSpawn >= s.nextSpawnIn && s.particles.length < cfg.maxParticles) {
      s.particles.push(isSakura ? spawnSakuraPetal() : spawnRainDrop());
      s.lastSpawn = timestamp;
      s.nextSpawnIn = randomRange(cfg.spawnIntervalMin, cfg.spawnIntervalMax);
    }

    // Update
    for (var i = s.particles.length - 1; i >= 0; i--) {
      var p = s.particles[i];
      if (isSakura) {
        updateSakuraPetal(p, dt);
        if (isSakuraOffScreen(p)) s.particles.splice(i, 1);
      } else {
        updateRainDrop(p, dt);
        if (isRainDropOffScreen(p)) s.particles.splice(i, 1);
      }
    }

    // Draw
    s.ctx.clearRect(0, 0, s.width, s.height);
    for (var j = 0; j < s.particles.length; j++) {
      if (isSakura) drawSakuraPetal(s.ctx, s.particles[j]);
      else drawRainDrop(s.ctx, s.particles[j]);
    }

    s.rafId = requestAnimationFrame(effectsLoop);
  }

  function startEffects() {
    if (!effectsState.enabled) return;
    var theme = document.documentElement.getAttribute('data-theme');
    var type = theme === 'dark' ? 'rain' : 'sakura';

    if (effectsState.activeType === type && effectsState.rafId) return; // already running

    stopEffectsLoop();
    effectsState.activeType = type;
    effectsState.particles = [];
    effectsState.lastTime = 0;
    effectsState.lastSpawn = 0;
    effectsState.nextSpawnIn = 0;
    effectsState.frame = 0;
    effectsState.rafId = requestAnimationFrame(effectsLoop);
  }

  function stopEffectsLoop() {
    if (effectsState.rafId) {
      cancelAnimationFrame(effectsState.rafId);
      effectsState.rafId = null;
    }
    effectsState.activeType = null;
    effectsState.particles = [];
  }

  function stopEffects() {
    effectsState.enabled = false;
    stopEffectsLoop();
    var ctx = effectsState.ctx;
    if (ctx) ctx.clearRect(0, 0, effectsState.width, effectsState.height);
  }

  function resizeEffectsCanvas() {
    var s = effectsState;
    var dpr = window.devicePixelRatio || 1;
    s.width = window.innerWidth;
    s.height = window.innerHeight;
    s.canvas.width = s.width * dpr;
    s.canvas.height = s.height * dpr;
    s.canvas.style.width = s.width + 'px';
    s.canvas.style.height = s.height + 'px';
    s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  // --- Persistence & toggle UI ---

  function getEffectsPref() {
    var stored = localStorage.getItem(EFFECTS_PREF_KEY);
    return stored === 'off' ? 'off' : 'on'; // default on
  }

  function setEffectsPref(state) {
    localStorage.setItem(EFFECTS_PREF_KEY, state);
    updateEffectsToggle(state);
    if (state === 'off') {
      stopEffects();
    } else {
      effectsState.enabled = true;
      startEffects();
    }
  }

  function updateEffectsToggle(state) {
    var toggle = document.getElementById('effectsToggle');
    if (!toggle) return;
    toggle.classList.toggle('is-off', state === 'off');
    var lang = document.documentElement.lang || 'zh-CN';
    var pack = (window.MIKU_I18N && window.MIKU_I18N[lang]) ? window.MIKU_I18N[lang].effects : null;
    if (state === 'off') {
      toggle.setAttribute('aria-label', pack ? pack.turn_on : 'Enable ambient effects');
      toggle.setAttribute('title', pack ? pack.turn_on : 'Enable ambient effects');
    } else {
      toggle.setAttribute('aria-label', pack ? pack.turn_off : 'Disable ambient effects');
      toggle.setAttribute('title', pack ? pack.turn_off : 'Disable ambient effects');
    }
  }

  function initEffects() {
    var canvas = document.getElementById('sakuraCanvas');
    if (!canvas) return;

    effectsState.canvas = canvas;
    effectsState.ctx = canvas.getContext('2d');
    resizeEffectsCanvas();

    // Respect stored preference
    var pref = getEffectsPref();
    effectsState.enabled = pref === 'on';
    updateEffectsToggle(pref);

    if (effectsState.enabled) {
      // Respect reduced motion
      if (!document.documentElement.classList.contains('motion-off')) {
        startEffects();
      }
    }

    // Effects toggle button
    var toggleBtn = document.getElementById('effectsToggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        var current = getEffectsPref();
        setEffectsPref(current === 'off' ? 'on' : 'off');
      });
    }

    // Theme change → switch effect
    var themeObserver = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (mutation.attributeName === 'data-theme') {
          if (effectsState.enabled && !document.documentElement.classList.contains('motion-off')) {
            startEffects();
          }
        }
      });
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Pause when hidden
    document.addEventListener('visibilitychange', function () {
      if (!effectsState.enabled) return;
      if (document.hidden) {
        stopEffectsLoop();
      } else {
        if (!document.documentElement.classList.contains('motion-off')) {
          startEffects();
        }
      }
    });

    // Resize
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (effectsState.rafId) {
          resizeEffectsCanvas();
        }
      }, 200);
    });
  }

  var REVEAL_SELECTOR = '.reveal, .reveal-stagger, .reveal-subtle';

  function initMotionController() {
    var docEl = document.documentElement;
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Light up interactive elements with the CSS lift hook (was JS quickTo).
    document.querySelectorAll(
      '.post-nav-item, .tag-pill, .pagination:not(.archive-pagination) a, ' +
      '.theme-toggle, .lang-toggle, .navbar-toggle, .search-clear-filters, ' +
      '.category-list-item a, .tag-cloud-item'
    ).forEach(function (el) {
      if (el.classList.contains('lift-on-hover')) return;
      el.classList.add('lift-on-hover');
    });

    // Tag the dynamic post-content children as reveals at runtime.
    document.querySelectorAll('.post-content > *').forEach(function (node, i) {
      if (!node.classList.contains('reveal')) {
        node.classList.add('reveal');
        node.style.setProperty('--i', String(Math.min(i, 8)));
      }
    });

    // Assign per-child stagger indices to grouped containers once.
    document.querySelectorAll('.reveal-stagger').forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty('--i', String(i));
      });
    });

    // Index standalone .reveal siblings that share a parent (e.g. an article
    // card grid) so they cascade instead of all firing at once. Children that
    // already carry an explicit --i (set above) keep it.
    document.querySelectorAll('.article-cards, .post-nav').forEach(function (group) {
      var idx = 0;
      Array.prototype.forEach.call(group.children, function (child) {
        if (!child.classList.contains('reveal')) return;
        if (!child.style.getPropertyValue('--i')) {
          child.style.setProperty('--i', String(Math.min(idx, 8)));
        }
        idx++;
      });
    });

    // Reduced motion / no-JS-safe: force everything visible and light the
    // timeline, then bail — no observers, no rAF loop.
    if (prefersReduced) {
      docEl.classList.add('motion-off');
      forceVisible();
      lightTimeline();
      exposeAnimateApi(null, null);
      return;
    }

    docEl.classList.add('motion-on');

    var observer = createRevealObserver();
    observeReveals(observer);

    var loop = createScrollLoop();
    loop.start();

    triggerHeroIntro();
    triggerNavIntro();
    lightTimeline();

    document.addEventListener('miku:search-rendered', function () {
      initSpotlightSurfaces();
      observeReveals(observer);
      refreshSearchMotion();
    });

    exposeAnimateApi(observer, loop);
  }

  function createRevealObserver() {
    return new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        revealElement(entry.target);
        // 'once' behavior: stop observing after first reveal.
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
  }

  function observeReveals(observer) {
    if (!observer) return;
    document.querySelectorAll(REVEAL_SELECTOR).forEach(function (el) {
      if (el.classList.contains('is-visible')) return;
      observer.observe(el);
    });
  }

  function revealElement(el) {
    if (el.classList.contains('is-visible')) return;
    el.classList.add('will-animate', 'is-visible');
    // Drop the layer-promotion hint once the transition has settled so we
    // don't leave a promoted layer sitting idle.
    window.setTimeout(function () {
      el.classList.remove('will-animate');
    }, TIMING.revealSettle);
  }

  function forceVisible() {
    document.querySelectorAll(REVEAL_SELECTOR).forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  function lightTimeline() {
    // Archive/category timelines light via scroll when supported; otherwise lit
    // immediately so the rail/years are never stuck invisible.
    var containers = document.querySelectorAll('.archive-container, .category-container');
    var years = document.querySelectorAll('.archive-year');
    if (!('IntersectionObserver' in window)) {
      containers.forEach(function (c) { c.classList.add('timeline-lit'); });
      years.forEach(function (y) { y.classList.add('is-lit'); });
      return;
    }
    var tlo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('timeline-lit');
        tlo.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -18% 0px' });
    containers.forEach(function (c) { tlo.observe(c); });

    var ylo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-lit');
        ylo.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -14% 0px' });
    years.forEach(function (y) { ylo.observe(y); });
  }

  function createScrollLoop() {
    // Single passive scroll listener drives a single rAF pass for every
    // scroll-driven effect. We interpolate (lerp) the raw scrollY toward the
    // target each frame so parallax/progress feel as smoothed as the old
    // ScrollTrigger 'scrub' without the dependency.
    var progressEl = ensureScrollProgress();
    var hero = document.getElementById('parallaxHero');
    var fgLayer = document.getElementById('parallaxForeground');
    var postCover = document.getElementById('postCoverImage');

    var rawScroll = window.scrollY;
    var smoothScroll = window.scrollY;
    var ticking = false;
    var rafId = null;
    var heroHeight = hero ? hero.offsetHeight : 0;

    function recalc() {
      heroHeight = hero ? hero.offsetHeight : 0;
    }

    function frame() {
      ticking = false;
      // Exponential smoothing toward the latest scroll position.
      smoothScroll += (rawScroll - smoothScroll) * TIMING.scrollLerp;

      updateProgress(progressEl, smoothScroll);
      if (hero) updateHeroParallax(smoothScroll, heroHeight, fgLayer);
      if (postCover) updatePostCover(postCover, smoothScroll);

      // Keep iterating until the smoothed value is effectively settled; this
      // gives a single self-stopping rAF chain instead of a perpetual loop.
      if (Math.abs(rawScroll - smoothScroll) > 0.4) {
        rafId = requestAnimationFrame(frame);
      } else {
        smoothScroll = rawScroll;
        rafId = null;
      }
    }

    function onScroll() {
      rawScroll = window.scrollY;
      if (!ticking) {
        ticking = true;
        if (rafId === null) rafId = requestAnimationFrame(frame);
      }
    }

    function start() {
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', debounce(recalc, 200));
      onScroll();
    }

    function stop() {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
    }

    return { start: start, stop: stop, refresh: recalc };
  }

  function ensureScrollProgress() {
    var existing = document.querySelector('.scroll-progress');
    if (existing) return existing;
    var progress = document.createElement('div');
    progress.className = 'scroll-progress';
    progress.setAttribute('aria-hidden', 'true');
    progress.style.transformOrigin = 'left center';
    progress.style.transform = 'scaleX(0)';
    document.body.appendChild(progress);
    return progress;
  }

  function updateProgress(el, scroll) {
    if (!el) return;
    var doc = document.documentElement;
    var max = doc.scrollHeight - window.innerHeight;
    var amount = max > 0 ? scroll / max : 0;
    if (amount < 0) amount = 0;
    else if (amount > 1) amount = 1;
    el.style.transform = 'scaleX(' + amount.toFixed(4) + ')';
  }

  function updateHeroParallax(scroll, heroHeight, fgLayer) {
    if (scroll >= heroHeight) return;
    if (fgLayer) {
      fgLayer.style.transform = 'translate3d(0,' + (scroll * 0.04).toFixed(2) + 'px,0)';
      fgLayer.style.opacity = Math.max(0.15, 1 - scroll / (heroHeight * 0.7));
    }
  }

  function updatePostCover(cover, scroll) {
    var rect = cover.getBoundingClientRect();
    if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
    var offset = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
    cover.style.transform = 'translate3d(0,' + (offset * 20).toFixed(2) + 'px,0) scale(1.02)';
  }

  // ============================================
  // Intro choreography hooks
  // ----------------------------------------------
  // The actual motion lives in CSS (keyframe ladders);
  // JS only adds the trigger class once. Keeps timing
  // in the stylesheet where it belongs.
  // ============================================

  function triggerHeroIntro() {
    var hero = document.getElementById('parallaxHero');
    if (!hero) return;
    // Tag the fixed homepage footer copyright so the CSS ladder can target it.
    var footer = document.querySelector('.is-home .footer-copyright');
    if (footer) footer.classList.add('hero-enter-target');
    requestAnimationFrame(function () {
      hero.classList.add('hero-enter');
    });
  }

  function triggerNavIntro() {
    var nav = document.querySelector('.navbar');
    if (!nav) return;
    // Simple staggered fade/slide via the reveal mechanism: tag each nav item
    // with a step index so the shared .reveal stagger drives them together.
    var items = nav.querySelectorAll('.navbar-brand, .navbar-links > li');
    items.forEach(function (item, i) {
      item.classList.add('reveal');
      item.style.setProperty('--i', String(i));
      revealElement(item);
    });
  }

  function refreshSearchMotion() {
    // Re-stagger fresh search results so they rise in order, and re-fire the
    // highlight-glow transition that draws the eye to matched terms. Results are
    // driven through the same .reveal vocabulary as everything else.
    var results = document.querySelectorAll('.search-result-item');
    results.forEach(function (item, i) {
      item.classList.remove('is-visible', 'will-animate');
      item.classList.add('reveal');
      item.style.setProperty('--i', String(Math.min(i, 10)));
      // Defer to the next frame so the .reveal hidden state applies first,
      // then flip to visible to trigger the CSS transition.
      requestAnimationFrame(function () { revealElement(item); });
    });

    var marks = document.querySelectorAll('.search-result-excerpt mark, .search-result-title mark');
    marks.forEach(function (mark) {
      mark.style.setProperty('--mark-glow', '1');
      mark.style.transition = 'box-shadow ' + TIMING.markGlowDuration + 'ms var(--ease-out)';
      // Force reflow so the transition runs from the glowing state.
      void mark.offsetWidth;
      mark.style.setProperty('--mark-glow', '0');
    });
  }

  function exposeAnimateApi(observer, loop) {
    window.MIKU_ANIMATE = {
      refresh: function () {
        if (loop) loop.refresh();
        if (observer) observeReveals(observer);
      },
      revert: function () {
        // Disconnect everything and snap to the visible/static state.
        if (observer) observer.disconnect();
        if (loop) loop.stop();
        forceVisible();
        lightTimeline();
      }
    };
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      clearTimeout(t);
      var args = arguments;
      t = setTimeout(function () { fn.apply(null, args); }, wait);
    };
  }

  function initThemeFeatures() {
    buildTOC();
    initTagCloud();
    initCodeCopyButtons();
    initSpotlightSurfaces();
    initEffects();

    try {
      initMotionController();
    } catch (err) {
      document.documentElement.classList.remove('motion-on');
      document.documentElement.classList.add('motion-off');
      forceVisible();
      lightTimeline();
      if (window.console && console.error) {
        console.error('Motion initialization failed; falling back to static content.', err);
      }
    }
  }

  initThemeFeatures();

  // ============================================
  // Keyboard navigation
  // ============================================

  document.addEventListener('keydown', function (e) {
    // Escape closes mobile nav
    if (e.key === 'Escape' && navLinks && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.innerHTML = '&#9776;';
    }
  });

})();

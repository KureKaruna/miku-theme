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
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
    updateThemeToggle(theme);
  }

  function updateThemeToggle(theme) {
    var toggle = document.getElementById('themeToggle');
    if (!toggle) return;
    var icon = toggle.querySelector('.theme-toggle-icon');
    var lang = document.documentElement.lang || 'zh-CN';
    var pack = (window.MIKU_I18N && window.MIKU_I18N[lang]) ? window.MIKU_I18N[lang].theme : null;
    if (theme === 'dark') {
      icon.innerHTML = '&#9788;';
      toggle.setAttribute('aria-label', pack ? pack.switch_light : 'Switch to light mode');
    } else {
      icon.innerHTML = '&#9789;';
      toggle.setAttribute('aria-label', pack ? pack.switch_dark : 'Switch to dark mode');
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

    headings.forEach(function (h, i) {
      var id = h.id || ('heading-' + i);
      h.id = id;

      var li = document.createElement('li');
      li.className = h.tagName === 'H3' ? 'toc-h3' : 'toc-h2';

      var a = document.createElement('a');
      a.href = '#' + id;
      a.textContent = h.textContent;
      a.setAttribute('data-target', id);

      // Intercept click: scroll via JS + replaceState to avoid history pollution
      a.addEventListener('click', function (e) {
        e.preventDefault();
        var targetId = this.getAttribute('data-target');
        var target = document.getElementById(targetId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', '#' + targetId);
        }
      });

      li.appendChild(a);
      tocList.appendChild(li);
    });

    // Show TOC
    toc.classList.add('visible');

    // Active heading tracking via IntersectionObserver
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          tocList.querySelectorAll('a').forEach(function (a) {
            // Remove all active first, then set only the current one
            a.classList.remove('active');
          });
          var activeLink = tocList.querySelector('a[data-target="' + id + '"]');
          if (activeLink) activeLink.classList.add('active');
        }
      });
    }, { rootMargin: '-80px 0px -60% 0px' });

    headings.forEach(function (h) { observer.observe(h); });
  }

  buildTOC();

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

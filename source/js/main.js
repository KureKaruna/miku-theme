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
          // Immediately update highlight — don't wait for IntersectionObserver
          tocList.querySelectorAll('a').forEach(function (link) {
            link.classList.remove('active');
          });
          this.classList.add('active');

          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.replaceState(null, '', '#' + targetId);
        }
      });

      li.appendChild(a);
      tocList.appendChild(li);
    });

    // Show TOC
    toc.classList.add('visible');

    // Read scroll-padding-top from CSS to keep rootMargin in sync with --navbar-height
    var scrollPad = parseInt(getComputedStyle(document.documentElement).scrollPaddingTop, 10) || 0;
    var rootMargin = '-' + (scrollPad + 6) + 'px 0px -60% 0px';

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
    }, { rootMargin: rootMargin });

    headings.forEach(function (h) { observer.observe(h); });

    // Handle page load hash — scroll with navbar offset + highlight TOC link
    if (window.location.hash) {
      var hashId = window.location.hash.slice(1);
      var hashTarget = document.getElementById(hashId);
      if (hashTarget) {
        setTimeout(function () {
          hashTarget.scrollIntoView({ block: 'start' });
          var hashLink = tocList.querySelector('a[data-target="' + hashId + '"]');
          if (hashLink) {
            tocList.querySelectorAll('a').forEach(function (l) { l.classList.remove('active'); });
            hashLink.classList.add('active');
          }
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

  buildTOC();
  initTagCloud();
  initCodeCopyButtons();

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

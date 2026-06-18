/* ============================================
   miku-theme — Search + tag filters
   Fetches search.xml and performs client-side search
   ============================================ */

(function () {
  'use strict';

  var searchInput = document.getElementById('searchInput');
  var searchResults = document.getElementById('searchResults');
  var searchCount = document.getElementById('searchCount');
  var activeFilter = document.getElementById('searchActiveFilter');
  var clearFilters = document.getElementById('searchClearFilters');
  var tagFilters = Array.from(document.querySelectorAll('.tag-filter'));
  if (!searchInput || !searchResults) return;

  var posts = [];
  var searchIndex = [];
  var loaded = false;
  var state = {
    query: '',
    tag: ''
  };

  var searchPath = (window.MIKU_THEME && window.MIKU_THEME.searchPath) || '/search.xml';

  function loadSearchData() {
    if (loaded) return Promise.resolve();
    return fetch(searchPath)
      .then(function (res) {
        if (!res.ok) throw new Error('Search data not available');
        return res.text();
      })
      .then(function (xmlStr) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(xmlStr, 'text/xml');
        var entries = doc.querySelectorAll('entry');
        entries.forEach(function (entry) {
          var title = entry.querySelector('title');
          var url = entry.querySelector('url');
          var content = entry.querySelector('content');
          var date = entry.querySelector('date');
          var tags = entry.querySelectorAll('tag');

          var post = {
            title: title ? title.textContent : '',
            url: url ? url.textContent : '',
            content: content ? content.textContent : '',
            date: date ? date.textContent : '',
            tags: Array.from(tags).map(function (t) { return t.textContent; })
          };
          posts.push(post);
          searchIndex.push({
            text: (post.title + ' ' + post.content + ' ' + post.tags.join(' ')).toLowerCase(),
            post: post
          });
        });
        loaded = true;
      })
      .catch(function (err) {
        console.error('Failed to load search index:', err);
        var pack = getPack();
        searchResults.innerHTML = '<p class="search-empty">' + (pack ? pack['search.index_missing'] : 'Search index not found. Run <code>hexo generate</code> first.') + '</p>';
      });
  }

  function getPack() {
    var lang = document.documentElement.lang || 'zh-CN';
    return (window.MIKU_I18N && window.MIKU_I18N[lang]) ? window.MIKU_I18N[lang] : null;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str || ''));
    return div.innerHTML;
  }

  function getHighlightRegex(query) {
    if (!query) return null;
    var terms = query.trim().split(/\s+/).filter(Boolean).map(function (term) {
      return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    });
    return terms.length ? new RegExp('(' + terms.join('|') + ')', 'gi') : null;
  }

  function highlight(text, query) {
    var regex = getHighlightRegex(query);
    if (!regex) return text;
    return text.replace(regex, '<mark>$1</mark>');
  }

  function highlightTextNodes(root, query) {
    var regex = getHighlightRegex(query);
    if (!regex) return;

    function shouldSkip(node) {
      if (!node || node.nodeType !== Node.ELEMENT_NODE) return false;
      return node.tagName === 'MARK'
        || node.tagName === 'MJX-CONTAINER'
        || node.classList.contains('math-inline')
        || node.classList.contains('math-display');
    }

    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        var text = node.nodeValue;
        regex.lastIndex = 0;
        if (!regex.test(text)) return;

        regex.lastIndex = 0;
        var fragment = document.createDocumentFragment();
        var lastIndex = 0;
        var match;
        while ((match = regex.exec(text)) !== null) {
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
          }
          var mark = document.createElement('mark');
          mark.textContent = match[0];
          fragment.appendChild(mark);
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        node.parentNode.replaceChild(fragment, node);
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE || shouldSkip(node)) return;
      Array.prototype.slice.call(node.childNodes).forEach(walk);
    }

    walk(root);
  }

  function renderExcerpt(content, query) {
    var source = document.createElement('div');
    var target = document.createElement('div');
    var state = { remaining: 180 };
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

    source.innerHTML = content || '';

    function appendText(parent, text) {
      if (!state.remaining) return;
      var normalized = (text || '').replace(/\s+/g, ' ');
      if (!normalized.trim()) return;

      var slice = normalized.slice(0, state.remaining);
      parent.appendChild(document.createTextNode(slice));
      state.remaining -= slice.length;
    }

    function appendMath(parent, node, className) {
      if (!state.remaining) return;
      var text = node.textContent || '';
      if (!text.trim()) return;

      var clone = document.createElement(className === 'math-display' ? 'div' : 'span');
      clone.className = className;
      clone.textContent = text;
      parent.appendChild(clone);
      state.remaining = Math.max(0, state.remaining - text.length);
    }

    function appendNode(parent, node) {
      if (!state.remaining) return;

      if (node.nodeType === Node.TEXT_NODE) {
        appendText(parent, node.nodeValue);
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      var tag = node.tagName;
      if (tag === 'A' && node.classList.contains('headerlink')) return;
      if (node.classList.contains('math-inline')) {
        appendMath(parent, node, 'math-inline');
        return;
      }
      if (node.classList.contains('math-display')) {
        appendMath(parent, node, 'math-display');
        return;
      }

      if (allowedInline[tag]) {
        var clone = document.createElement(tag.toLowerCase());
        if (tag === 'ABBR' && node.getAttribute('title')) {
          clone.setAttribute('title', node.getAttribute('title'));
        }
        if (tag !== 'BR') {
          Array.prototype.forEach.call(node.childNodes, function (child) {
            appendNode(clone, child);
          });
        }
        if (clone.childNodes.length || tag === 'BR') parent.appendChild(clone);
        return;
      }

      Array.prototype.forEach.call(node.childNodes, function (child) {
        appendNode(parent, child);
      });
      appendText(parent, ' ');
    }

    Array.prototype.forEach.call(source.childNodes, function (node) {
      appendNode(target, node);
    });

    highlightTextNodes(target, query);
    return target.innerHTML.trim();
  }

  function typesetSearchMath() {
    var mathJax = window.MathJax;
    if (!mathJax || !searchResults) return;

    function typeset() {
      if (typeof mathJax.typesetPromise === 'function') {
        mathJax.typesetPromise([searchResults]).catch(function (err) {
          if (window.console && console.warn) {
            console.warn('Search MathJax rendering failed.', err);
          }
        });
      } else if (typeof mathJax.typeset === 'function') {
        mathJax.typeset([searchResults]);
      }
    }

    if (mathJax.startup && mathJax.startup.promise) {
      mathJax.startup.promise.then(typeset);
    } else {
      typeset();
    }
  }

  function readStateFromUrl() {
    var params = new URLSearchParams(window.location.search);
    state.query = (params.get('q') || '').trim();
    state.tag = (params.get('tag') || '').trim();
    searchInput.value = state.query;
  }

  function writeStateToUrl() {
    var params = new URLSearchParams();
    if (state.tag) params.set('tag', state.tag);
    if (state.query) params.set('q', state.query);
    var nextUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    window.history.replaceState(null, '', nextUrl);
  }

  function updateTagButtons() {
    tagFilters.forEach(function (button) {
      var isActive = (button.getAttribute('data-tag') || '') === state.tag;
      button.classList.toggle('active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
  }

  function updateActiveFilter() {
    if (!activeFilter) return;

    var pack = getPack();
    var currentTagText = pack ? pack['search.current_tag'] : 'Tag: %s';

    if (state.tag) {
      activeFilter.innerHTML = currentTagText.replace('%s', '<strong>' + escapeHtml(state.tag) + '</strong>');
    } else {
      activeFilter.textContent = '';
    }

    if (clearFilters) {
      clearFilters.hidden = !state.tag && !state.query;
    }
  }

  function renderResults() {
    var query = state.query;
    var q = query.toLowerCase().trim();
    var terms = q ? q.split(/\s+/) : [];
    var selectedTag = state.tag.toLowerCase();

    updateTagButtons();
    updateActiveFilter();

    if (!q && !selectedTag) {
      searchResults.innerHTML = '';
      searchCount.textContent = '';
      notifySearchRendered();
      return;
    }

    var results = searchIndex
      .filter(function (item) {
        var matchesQuery = !terms.length || terms.every(function (term) {
          return item.text.indexOf(term) !== -1;
        });
        var matchesTag = !selectedTag || item.post.tags.some(function (tag) {
          return tag.toLowerCase() === selectedTag;
        });
        return matchesQuery && matchesTag;
      })
      .map(function (item) { return item.post; });

    var pack = getPack();
    var resultsText = pack ? (state.tag ? pack['search.tag_results'] : pack['search.results']) : '%d results';
    searchCount.textContent = resultsText
      .replace('%d', results.length)
      .replace('%s', state.tag);

    if (!results.length) {
      var noResultsText = pack ? pack['search.no_results'] : 'No posts found for “%s”.';
      var emptyLabel = state.tag && !query ? state.tag : (query || state.tag);
      searchResults.innerHTML = '<p class="search-empty">' + noResultsText.replace('%s', escapeHtml(emptyLabel)) + '</p>';
      notifySearchRendered();
      return;
    }

    var html = '';
    results.forEach(function (post) {
      var excerpt = renderExcerpt(post.content, query);
      html += '<div class="search-result-item">'
        + '<div class="search-result-title"><a href="' + escapeHtml(post.url) + '">' + highlight(escapeHtml(post.title), query) + '</a></div>'
        + '<div class="search-result-tags">' + post.tags.map(function (tag) {
          return '<span class="tag-pill">' + escapeHtml(tag) + '</span>';
        }).join('') + '</div>'
        + '<div class="search-result-excerpt">' + excerpt + '&hellip;</div>'
        + '</div>';
    });
    searchResults.innerHTML = html;
    typesetSearchMath();
    notifySearchRendered();
  }

  function notifySearchRendered() {
    document.dispatchEvent(new CustomEvent('miku:search-rendered'));
  }

  function runSearch(updateUrl) {
    if (updateUrl) writeStateToUrl();
    loadSearchData().then(renderResults);
  }

  var debounceTimer;
  searchInput.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    state.query = searchInput.value.trim();
    debounceTimer = setTimeout(function () {
      runSearch(true);
    }, 200);
  });

  tagFilters.forEach(function (button) {
    button.addEventListener('click', function () {
      state.tag = button.getAttribute('data-tag') || '';
      runSearch(true);
    });
  });

  if (clearFilters) {
    clearFilters.addEventListener('click', function () {
      state.query = '';
      state.tag = '';
      searchInput.value = '';
      runSearch(true);
      searchInput.focus();
    });
  }

  document.addEventListener('langchange', function () {
    renderResults();
  });

  window.addEventListener('popstate', function () {
    readStateFromUrl();
    runSearch(false);
  });

  readStateFromUrl();
  runSearch(false);
})();

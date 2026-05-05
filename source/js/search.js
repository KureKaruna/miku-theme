/* ============================================
   miku-theme — Search (hexo-generator-searchdb)
   Fetches search.xml and performs client-side search
   ============================================ */

(function () {
  'use strict';

  var searchInput = document.getElementById('searchInput');
  var searchResults = document.getElementById('searchResults');
  var searchCount = document.getElementById('searchCount');
  if (!searchInput || !searchResults) return;

  var posts = [];
  var searchIndex = [];
  var loaded = false;

  // Get search data path from config
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
        var lang = document.documentElement.lang || 'zh-CN';
        var pack = (window.MIKU_I18N && window.MIKU_I18N[lang]) ? window.MIKU_I18N[lang].search : null;
        searchResults.innerHTML = '<p class="search-empty">' + (pack ? pack.index_missing : 'Search index not found. Run <code>hexo generate</code> first.') + '</p>';
      });
  }

  function highlight(text, query) {
    var regex = new RegExp('(' + query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    return text.replace(regex, '<mark>$1</mark>');
  }

  function search(query) {
    if (!query.trim()) {
      searchResults.innerHTML = '';
      searchCount.textContent = '';
      return;
    }

    var q = query.toLowerCase().trim();
    var terms = q.split(/\s+/);

    var results = searchIndex
      .filter(function (item) {
        return terms.every(function (term) { return item.text.indexOf(term) !== -1; });
      })
      .map(function (item) { return item.post; });

    var lang = document.documentElement.lang || 'zh-CN';
    var pack = (window.MIKU_I18N && window.MIKU_I18N[lang]) ? window.MIKU_I18N[lang].search : null;
    var resultsText = pack ? pack.results : '%d results';
    searchCount.textContent = resultsText.replace('%d', results.length);

    if (!results.length) {
      var noResultsText = pack ? pack.no_results : 'No posts found for &ldquo;%s&rdquo;.';
      searchResults.innerHTML = '<p class="search-empty">' + noResultsText.replace('%s', escapeHtml(query)) + '</p>';
      return;
    }

    var html = '';
    results.forEach(function (post) {
      var excerpt = post.content.replace(/<[^>]+>/g, '').substring(0, 180);
      html += '<div class="search-result-item">'
        + '<div class="search-result-title"><a href="' + post.url + '">' + highlight(post.title, q) + '</a></div>'
        + '<div class="search-result-excerpt">' + highlight(escapeHtml(excerpt), q) + '&hellip;</div>'
        + '</div>';
    });
    searchResults.innerHTML = html;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  var debounceTimer;
  searchInput.addEventListener('input', function () {
    clearTimeout(debounceTimer);
    var query = searchInput.value;
    debounceTimer = setTimeout(function () {
      loadSearchData().then(function () { search(query); });
    }, 200);
  });

  // Load index eagerly
  loadSearchData();

  // Re-search on language change to update UI strings
  document.addEventListener('langchange', function () {
    if (searchInput.value.trim()) {
      searchInput.dispatchEvent(new Event('input'));
    }
  });
})();

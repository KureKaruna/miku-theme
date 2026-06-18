'use strict';

const { escapeHTML } = require('hexo-util');

hexo.extend.filter.register('marked:extensions', function(extensions) {
  extensions.push({
    name: 'mathBlock',
    level: 'block',
    start(src) {
      const match = src.match(/(^|\n)\s*\$\$/);
      return match ? match.index + match[1].length : undefined;
    },
    tokenizer(src) {
      const match = /^( {0,3})\$\$\s*\n?([\s\S]+?)\n?\s*\$\$(?=\n|$)/.exec(src);
      if (!match) return;

      return {
        type: 'mathBlock',
        raw: match[0],
        text: match[2]
      };
    },
    renderer(token) {
      return `<div class="math-display">$$\n${escapeHTML(token.text)}\n$$</div>`;
    }
  });

  extensions.push({
    name: 'mathInline',
    level: 'inline',
    start(src) {
      const index = src.indexOf('$');
      return index === -1 ? undefined : index;
    },
    tokenizer(src) {
      const match = /^\$(?!\$)((?:\\.|[^\\\n$])+?)\$/.exec(src);
      if (!match) return;

      return {
        type: 'mathInline',
        raw: match[0],
        text: match[1]
      };
    },
    renderer(token) {
      return `<span class="math-inline">$${escapeHTML(token.text)}$</span>`;
    }
  });
});

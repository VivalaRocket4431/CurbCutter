import { h, icon } from '../ui/dom.js';
import { pageHead, sourceList, notice, button } from '../ui/components.js';
import { ARTICLES, article } from '../data/rights.js';
import { CONTENT_CHECKED } from '../data/sources.js';
import { longDate } from '../lib/dates.js';

export async function renderRights() {
  const node = h('div', { class: 'screen' },
    pageHead({ title: 'Know your rights', lede: 'Short, plain answers, each with links to the official rules.' }),
    h('ul', { class: 'article-list' }, ARTICLES.map((a) => h('li', null,
      h('a', { href: `#/rights/${a.id}`, class: 'article-card' },
        h('span', { class: 'article-title' }, a.title),
        h('span', { class: 'article-sum' }, a.summary),
        icon('right', { size: 18 }),
      ),
    ))),
    h('p', { class: 'fine' }, `Checked ${longDate(CONTENT_CHECKED)}. General information, not legal advice.`),
  );
  return { title: 'Know your rights', node };
}

function renderBlock(b) {
  if (typeof b === 'string') return h('p', null, b);
  if (b.list) return h('ul', { class: 'prose-list' }, b.list.map((t) => h('li', null, t)));
  if (b.note) return notice({ tone: 'info', body: b.note });
  if (b.table) {
    return h('div', { class: 'table-wrap' },
      h('table', null,
        h('caption', null, b.table.caption),
        h('thead', null, h('tr', null, b.table.head.map((x) => h('th', { scope: 'col' }, x)))),
        h('tbody', null, b.table.rows.map((r) => h('tr', null, h('th', { scope: 'row' }, r[0]), ...r.slice(1).map((x) => h('td', null, x))))),
      ),
    );
  }
  return null;
}

export async function renderArticle(params) {
  const a = article(params.article);
  if (!a) {
    return { title: 'Not found', node: h('section', { class: 'screen' }, h('h1', { id: 'page-title', tabindex: '-1' }, 'We could not find that page'), button({ label: 'Back to Know your rights', href: '#/rights', variant: 'primary' })) };
  }
  const idx = ARTICLES.indexOf(a);
  const nextA = ARTICLES[idx + 1];
  const node = h('div', { class: 'screen article' },
    h('p', { class: 'back' }, h('a', { href: '#/rights' }, icon('left', { size: 18 }), 'Know your rights')),
    pageHead({ title: a.title, lede: a.summary }),
    h('div', { class: 'prose' }, a.blocks.map(renderBlock)),
    sourceList(a.cites),
    nextA ? h('p', { class: 'next-article' }, 'Next: ', h('a', { href: `#/rights/${nextA.id}` }, nextA.title)) : null,
  );
  return { title: a.title, node };
}

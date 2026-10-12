// Reusable interface pieces. Each returns a DOM node.

import { h, icon, uid } from './dom.js';
import { SOURCES } from '../data/sources.js';
import { STRENGTHS } from '../data/barriers.js';
import { telHref } from '../data/contacts.js';
import { copyText } from '../lib/share.js';
import { shortDate, longDate } from '../lib/dates.js';

export function visuallyHidden(text) {
  return h('span', { class: 'vh' }, text);
}

export function pageHead({ eyebrow, title, lede, id = 'page-title' }) {
  return h('header', { class: 'page-head' },
    eyebrow ? h('p', { class: 'eyebrow' }, eyebrow) : null,
    h('h1', { id, tabindex: '-1' }, title),
    lede ? h('p', { class: 'lede' }, lede) : null,
  );
}

export function button({ label, iconName, variant = 'secondary', onClick, href, type = 'button', block = false, attrs = {}, external = false, iconAfter = false }) {
  const cls = ['btn', `btn-${variant}`, block ? 'btn-block' : ''].filter(Boolean).join(' ');
  const inner = [
    iconName && !iconAfter ? icon(iconName) : null,
    h('span', { class: 'btn-label' }, label),
    iconName && iconAfter ? icon(iconName) : null,
    external ? visuallyHidden(' (opens in a new tab)') : null,
  ];
  if (href) {
    const a = h('a', { class: cls, href, ...attrs }, ...inner);
    if (external) {
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
    }
    if (onClick) a.addEventListener('click', onClick);
    return a;
  }
  return h('button', { class: cls, type, onclick: onClick, ...attrs }, ...inner);
}

export function externalLink(href, text, attrs = {}) {
  return h('a', { href, target: '_blank', rel: 'noopener noreferrer', class: 'ext', ...attrs },
    text, icon('external', { size: 16 }), visuallyHidden(' (opens in a new tab)'));
}

export function field({ id, label, hint, error, input, optional = false }) {
  const hintId = hint ? `${id}-hint` : null;
  const errId = error ? `${id}-error` : null;
  const describedBy = [hintId, errId].filter(Boolean).join(' ');
  if (describedBy) input.setAttribute('aria-describedby', describedBy);
  if (error) input.setAttribute('aria-invalid', 'true');
  return h('div', { class: `field${error ? ' field-error' : ''}` },
    h('label', { for: id, class: 'label' }, label, optional ? h('span', { class: 'optional' }, ' (optional)') : null),
    hint ? h('p', { id: hintId, class: 'hint' }, hint) : null,
    error ? h('p', { id: errId, class: 'error-text' }, icon('alert', { size: 18 }), error) : null,
    input,
  );
}

export function textInput({ id, value = '', onInput, type = 'text', autocomplete, inputmode, maxlength, attrs = {} }) {
  return h('input', {
    id, name: id, type, class: 'input', value: value ?? '',
    autocomplete: autocomplete || 'off', inputmode, maxlength,
    oninput: onInput ? (e) => onInput(e.target.value, e) : null,
    ...attrs,
  });
}

export function textArea({ id, value = '', onInput, rows = 4, maxlength, attrs = {} }) {
  const ta = h('textarea', {
    id, name: id, class: 'textarea', rows: String(rows), maxlength,
    oninput: onInput ? (e) => onInput(e.target.value, e) : null,
    ...attrs,
  });
  ta.value = value ?? '';
  return ta;
}

// Big tappable choices. options: [{ value, label, hint, icon, badge }]
// variant: 'tiles' (big cards with hints), 'compact' (one line each), or 'segmented' (a row of buttons).
export function choiceGroup({ name, legend, hint, options, value, multiple = false, onChange, columns = 1, legendClass = 'legend', variant = 'tiles', describedBy }) {
  const hintId = hint ? uid('hint') : null;
  const selected = new Set(multiple ? value || [] : value != null ? [value] : []);
  const fs = h('fieldset', { class: `choices cols-${columns}${variant === 'tiles' ? '' : ` choices-${variant}`}`, 'aria-describedby': [hintId, describedBy].filter(Boolean).join(' ') || null });
  fs.append(h('legend', { class: legendClass }, legend));
  if (hint) fs.append(h('p', { id: hintId, class: 'hint' }, hint));
  const list = h('div', { class: 'choice-list' });
  for (const opt of options) {
    const id = uid(`${name}`);
    const input = h('input', {
      id, type: multiple ? 'checkbox' : 'radio', name, value: String(opt.value), class: 'choice-input',
      checked: selected.has(opt.value),
    });
    input.addEventListener('change', () => {
      if (multiple) {
        if (input.checked) selected.add(opt.value); else selected.delete(opt.value);
        onChange?.([...selected]);
      } else if (input.checked) {
        onChange?.(opt.value);
      }
    });
    list.append(h('div', { class: 'choice' },
      input,
      h('label', { for: id, class: 'choice-label' },
        opt.icon && variant === 'tiles' ? h('span', { class: 'choice-icon' }, icon(opt.icon, { size: 28 })) : null,
        h('span', { class: 'choice-text' },
          h('span', { class: 'choice-title' }, opt.label),
          opt.hint && variant === 'tiles' ? h('span', { class: 'choice-hint' }, opt.hint) : null,
          variant === 'tiles' ? opt.badge || null : null,
        ),
        variant === 'segmented' ? null : h('span', { class: 'choice-mark', 'aria-hidden': 'true' }, icon('check', { size: 20 })),
      ),
    ));
  }
  fs.append(list);
  return fs;
}

// A section that stays closed until it's needed, so each screen shows one thing at a time.
export function fold({ title, sub, open = false, id, className = '' }, ...content) {
  return h('details', { class: `fold${className ? ` ${className}` : ''}`, open: open || null, id: id || null },
    h('summary', null,
      h('span', { class: 'fold-text' },
        h('span', { class: 'fold-title' }, title),
        sub ? h('span', { class: 'fold-sub' }, sub) : null,
      ),
      icon('right', { size: 20 }),
    ),
    h('div', { class: 'fold-body' }, ...content.flat().filter(Boolean)),
  );
}

// One tappable row in a plain list: a title, an optional line under it, and an arrow.
export function rowLink({ href, title, sub, iconName, external = false, attrs = {} }) {
  const a = h('a', { href, class: 'row-link', ...attrs },
    iconName ? h('span', { class: 'row-icon' }, icon(iconName, { size: 22 })) : null,
    h('span', { class: 'row-text' },
      h('span', { class: 'row-title' }, title),
      sub ? h('span', { class: 'row-sub' }, sub) : null,
    ),
    icon(external ? 'external' : 'right', { size: 18 }),
    external ? visuallyHidden(' (opens in a new tab)') : null,
  );
  if (external) {
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
  }
  return a;
}

let toastRegion = null;
export function setToastRegion(el) {
  toastRegion = el;
}

export function toast(message, { tone = 'info', timeout = 4500 } = {}) {
  if (!toastRegion) return;
  const t = h('div', { class: `toast toast-${tone}` }, icon(tone === 'good' ? 'check' : tone === 'bad' ? 'alert' : 'info', { size: 20 }), h('span', null, message));
  toastRegion.append(t);
  setTimeout(() => {
    t.classList.add('toast-out');
    setTimeout(() => t.remove(), 400);
  }, timeout);
}

// Replaces a destructive button with an inline "Are you sure?" panel. Browser dialogs are avoided on purpose.
export function confirmButton({ label, iconName = 'trash', confirmText, confirmLabel, onConfirm, variant = 'danger' }) {
  const wrap = h('div', { class: 'confirm-wrap' });
  const show = () => {
    wrap.replaceChildren(h('div', { class: 'confirm', role: 'group', 'aria-label': confirmText },
      h('p', { class: 'confirm-text' }, icon('alert', { size: 20 }), confirmText),
      h('div', { class: 'btn-row' },
        button({ label: confirmLabel, variant: 'danger', iconName, onClick: async () => { await onConfirm(); } }),
        button({ label: 'Cancel', variant: 'quiet', onClick: reset }),
      ),
    ));
    wrap.querySelector('.btn-danger')?.focus();
  };
  const reset = () => {
    const b = button({ label, iconName, variant, onClick: show });
    wrap.replaceChildren(b);
    b.focus();
  };
  wrap.append(button({ label, iconName, variant, onClick: show }));
  return wrap;
}

export function copyButton(getText, { label = 'Copy', copiedLabel = 'Copied', variant = 'secondary' } = {}) {
  const b = button({ label, iconName: 'copy', variant });
  b.addEventListener('click', async () => {
    const ok = await copyText(typeof getText === 'function' ? getText() : getText);
    const span = b.querySelector('.btn-label');
    span.textContent = ok ? copiedLabel : 'Select and copy the text above';
    toast(ok ? 'Copied. You can paste it now.' : 'Copy did not work here. Press and hold the text to select it.', { tone: ok ? 'good' : 'bad' });
    setTimeout(() => { span.textContent = label; }, 2500);
  });
  return b;
}

export function strengthBadge(strength) {
  const s = STRENGTHS[strength];
  if (!s) return null;
  return h('span', { class: `strength strength-${strength}` }, s.label);
}

export function statusChip({ label, tone }) {
  return h('span', { class: `chip chip-${tone}` }, label);
}

export function notice({ tone = 'info', title, body, iconName }) {
  return h('div', { class: `notice notice-${tone}`, role: tone === 'bad' ? 'alert' : null },
    icon(iconName || (tone === 'warn' ? 'alert' : tone === 'good' ? 'check' : 'info')),
    h('div', { class: 'notice-body' },
      title ? h('p', { class: 'notice-title' }, title) : null,
      ...(Array.isArray(body) ? body : [body]).map((b) => (typeof b === 'string' ? h('p', null, b) : b)),
    ),
  );
}

function telLine(label, number) {
  return h('p', { class: 'contact-line' },
    icon('phone', { size: 18 }),
    h('a', { href: telHref(number), class: 'contact-tel' }, number),
    label ? h('span', { class: 'contact-sub' }, ` ${label}`) : null,
  );
}

function emailLine(label, address) {
  return h('p', { class: 'contact-line' },
    icon('mail', { size: 18 }),
    h('a', { href: `mailto:${address}`, class: 'contact-email' }, address),
    label ? h('span', { class: 'contact-sub' }, ` ${label}`) : null,
  );
}

export function contactCard(c, { headingLevel = 3 } = {}) {
  const H = `h${headingLevel}`;
  const card = h('article', { class: 'contact' },
    h(H, { class: 'contact-name' }, c.name),
    c.what ? h('p', { class: 'contact-what' }, c.what) : null,
  );
  if (c.phone) card.append(telLine(c.phoneLabel, c.phone));
  if (c.email) card.append(emailLine(c.emailLabel, c.email));
  for (const x of c.extra || []) {
    if (x.type === 'tel') card.append(telLine(x.label, x.value));
    else if (x.type === 'email') card.append(emailLine(x.label, x.value));
  }
  if (c.app) card.append(h('p', { class: 'contact-line' }, icon('phone', { size: 18 }), h('span', null, `App: ${c.app}`)));
  if (c.hours) card.append(h('p', { class: 'contact-line' }, icon('clock', { size: 18 }), h('span', null, c.hours)));
  if (c.url) card.append(h('p', { class: 'contact-line' }, externalLink(c.url, c.urlLabel || 'Website')));
  if (c.notes?.length) card.append(h('ul', { class: 'contact-notes' }, c.notes.map((n) => h('li', null, n))));
  return card;
}

export function sourceList(ids, { title = 'Sources' } = {}) {
  const unique = [...new Set(ids)].filter((id) => SOURCES[id]);
  if (!unique.length) return null;
  return h('details', { class: 'sources' },
    h('summary', null, icon('scale', { size: 18 }), `${title} (${unique.length})`),
    h('ul', null, unique.map((id) => {
      const s = SOURCES[id];
      return h('li', null,
        externalLink(s.url, s.title),
        h('span', { class: 'source-meta' }, `${s.publisher}. ${s.kind}. Checked ${longDate(s.checked)}.`),
      );
    })),
  );
}

export function dueLine(iso) {
  if (!iso) return null;
  return h('p', { class: 'due' }, icon('calendar', { size: 18 }), `Check back ${shortDate(iso)}`);
}

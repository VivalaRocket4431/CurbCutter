// Tiny DOM helpers. Text is always inserted as text (never as HTML), so user input can't inject markup.

export function h(tag, attrs, ...children) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else if (k === 'value' && 'value' in el) el.value = v;
      else if (k === 'checked' && 'checked' in el) el.checked = !!v;
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, String(v));
    }
  }
  append(el, children);
  return el;
}

export function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false || c === '') continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export function clear(el) {
  while (el.firstChild) el.firstChild.remove();
  return el;
}

const SVG_NS = 'http://www.w3.org/2000/svg';

const ICONS = {
  home: 'M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z',
  cases: 'M9 3.5h6a1 1 0 0 1 1 1V6H8V4.5a1 1 0 0 1 1-1z M8 5H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2 M9 11h6 M9 15h4',
  book: 'M5 4h11a3 3 0 0 1 3 3v14H8a3 3 0 0 1-3-3z M5 18a3 3 0 0 1 3-3h11 M9 8h6',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M3 20a6 6 0 0 1 12 0 M16 11a2.5 2.5 0 1 0 0-5 M17 14a5 5 0 0 1 4 5',
  settings: 'M4 6h9 M17 6h3 M4 12h3 M11 12h9 M4 18h11 M19 18h1 M15 4v4 M9 10v4 M17 16v4',
  speaker: 'M4 9h4l5-4v14l-5-4H4z M16.5 9.5a3.5 3.5 0 0 1 0 5 M18.8 7a7 7 0 0 1 0 10',
  stop: 'M7 7h10v10H7z',
  camera: 'M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  image: 'M4 5h16v14H4z M4 16l5-5 4 4 3-3 4 4 M15.5 9.5h.01',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6',
  check: 'M5 12.5l4.5 4.5L19 7',
  left: 'M15 5l-7 7 7 7',
  right: 'M9 5l7 7-7 7',
  mail: 'M3 6h18v12H3z M3 7l9 7 9-7',
  share: 'M12 3v12 M7 8l5-5 5 5 M5 13v7h14v-7',
  copy: 'M9 9h11v11H9z M15 9V4H4v11h5',
  printer: 'M7 9V3h10v6 M6 18H4v-7h16v7h-2 M7 14h10v7H7z',
  calendar: 'M4 6h16v15H4z M4 10h16 M8 3v5 M16 3v5',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z',
  external: 'M14 4h6v6 M20 4l-9 9 M18 14v6H4V6h6',
  pin: 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  parking: 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z M9 17V7h4a3 3 0 0 1 0 6H9',
  door: 'M6 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17 M3 21h18 M14.5 12h.01',
  store: 'M4 9l1.5-5h13L20 9 M4 9v11h16V9 M4 9h16 M9.5 20v-6h5v6',
  path: 'M3 21h18 M3 17h5l5-5h8',
  plus: 'M12 5v14 M5 12h14',
  alert: 'M12 3l9.5 17h-19z M12 10v4.5 M12 17.5h.01',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 11v6 M12 7.5h.01',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  edit: 'M4 20h4L19 9l-4-4L4 16z M14 6l4 4',
  download: 'M12 3v12 M7 10l5 5 5-5 M5 21h14',
  upload: 'M12 15V3 M7 8l5-5 5 5 M5 21h14',
  locate: 'M12 19a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M12 2v3 M12 19v3 M2 12h3 M19 12h3 M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  close: 'M6 6l12 12 M18 6L6 18',
  megaphone: 'M4 10v4l3 .6L17 18V6L7 9.4z M7.5 14.7l1.2 4.8h3l-1-4.1',
  scale: 'M12 4v16 M7 20h10 M5 8h14 M7 8l-3 6a3 3 0 0 0 6 0z M17 8l-3 6a3 3 0 0 0 6 0z',
  building: 'M3 21h18 M5 21v-9 M19 21v-9 M9.5 21v-9 M14.5 21v-9 M3 10.5h18 M12 3l9 5H3z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  ruler: 'M3 16L16 3l5 5L8 21z M7 12l2 2 M10 9l2 2 M13 6l2 2',
};

export function icon(name, { size = 24, label } = {}) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('focusable', 'false');
  svg.classList.add('icon');
  if (label) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', label);
  } else {
    svg.setAttribute('aria-hidden', 'true');
  }
  const path = document.createElementNS(SVG_NS, 'path');
  path.setAttribute('d', ICONS[name] || ICONS.info);
  svg.append(path);
  return svg;
}

let idCounter = 0;
export function uid(prefix = 'f') {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

export function debounce(fn, ms) {
  let t;
  const wrapped = (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  wrapped.flush = (...args) => {
    clearTimeout(t);
    fn(...args);
  };
  return wrapped;
}

// Getting words out of the app: email, the phone's share sheet, copy, download, and print.

export function mailtoHref({ to = '', subject = '', body = '' }) {
  const params = [];
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body.replace(/\r?\n/g, '\r\n'))}`);
  return `mailto:${encodeURIComponent(to).replace(/%40/g, '@')}${params.length ? `?${params.join('&')}` : ''}`;
}

// Some email apps cut off very long links. Past this length we suggest Copy or Share instead.
export const MAILTO_SAFE_LENGTH = 1900;

export function canShareText() {
  return typeof navigator.share === 'function';
}

export function canShareFiles(files) {
  try {
    return typeof navigator.canShare === 'function' && navigator.canShare({ files });
  } catch (e) {
    return false;
  }
}

// Returns 'shared', 'cancelled', or 'unsupported'.
export async function shareContent({ title, text, files }) {
  if (typeof navigator.share !== 'function') return 'unsupported';
  const data = {};
  if (title) data.title = title;
  if (text) data.text = text;
  if (files && files.length && canShareFiles(files)) data.files = files;
  if (!data.title && !data.text && !data.files) return 'unsupported';
  try {
    await navigator.share(data);
    return 'shared';
  } catch (e) {
    if (e && e.name === 'AbortError') return 'cancelled';
    return 'unsupported';
  }
}

export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    /* fall through */
  }
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.className = 'offscreen';
  document.body.append(ta);
  ta.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch (e) {
    ok = false;
  }
  ta.remove();
  return ok;
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export function downloadText(text, filename, type = 'text/plain') {
  downloadBlob(new Blob([text], { type: `${type};charset=utf-8` }), filename);
}

export function safeFilename(s) {
  return String(s || 'curbcutter').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'curbcutter';
}

// Prints only the element marked .print-target.
export function printElement(el) {
  el.classList.add('print-target');
  document.documentElement.classList.add('printing');
  const done = () => {
    el.classList.remove('print-target');
    document.documentElement.classList.remove('printing');
    window.removeEventListener('afterprint', done);
  };
  window.addEventListener('afterprint', done);
  window.print();
  setTimeout(done, 1000);
}

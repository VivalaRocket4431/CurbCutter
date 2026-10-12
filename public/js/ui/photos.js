// A case's photos: thumbnails for reviewing them, and ways to get them out of CurbCutter
// (the phone's photo library, a share sheet, or a download). Photos taken inside CurbCutter are not in
// the phone's photo library, and email links can't attach files, so this is how people attach photos
// to emails and complaint forms.

import { h } from './dom.js';
import { button, toast } from './components.js';
import { listPhotos } from '../lib/store.js';
import { canShareFiles, shareContent, downloadBlob, safeFilename } from '../lib/share.js';

async function casePhotos(c) {
  const ids = c.photos || [];
  const photos = (await listPhotos(c.id)).filter((p) => ids.includes(p.id));
  photos.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  return photos;
}

// A full-screen view of one photo. Add .node to the page once, then call open().
export function photoViewer() {
  const img = h('img', { alt: '' });
  const close = button({ label: 'Close', iconName: 'close', variant: 'secondary' });
  const dlg = h('dialog', { class: 'viewer', 'aria-label': 'Photo' }, img, close);
  close.addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  return {
    node: dlg,
    open(src, alt) {
      img.src = src;
      img.alt = alt;
      if (typeof dlg.showModal === 'function') dlg.showModal();
      else dlg.setAttribute('open', '');
    },
  };
}

// Small photos that open full size when tapped. Returns null when the case has no photos.
// Call cleanup() when the screen closes to free the photo memory.
export async function photoThumbs(c, viewer) {
  const photos = await casePhotos(c);
  if (!photos.length) return null;
  const urls = [];
  const items = photos.map((p, i) => {
    const url = URL.createObjectURL(p.blob);
    urls.push(url);
    const alt = `Photo ${i + 1} of ${c.place?.name || 'the barrier'}`;
    return h('li', null, h('button', { type: 'button', class: 'thumb', onclick: () => viewer.open(url, alt) }, h('img', { src: url, alt })));
  });
  return {
    node: h('ul', { class: 'photo-grid small' }, items),
    count: photos.length,
    cleanup: () => urls.forEach((u) => URL.revokeObjectURL(u)),
  };
}

export async function casePhotoFiles(c) {
  const photos = await casePhotos(c);
  return photos.map((p, i) => new File([p.blob], `${safeFilename(c.place?.name)}-photo-${i + 1}.jpg`, { type: 'image/jpeg' }));
}

// On phones this opens the share sheet with only the photos, which offers "Save Images" (iPhone)
// or "Save to device" (Android). Elsewhere the photos download as files.
export function savePhotosButton(c, { variant = 'secondary' } = {}) {
  const n = (c.photos || []).length;
  if (!n) return null;
  const b = button({ label: n === 1 ? 'Save the photo to my phone' : `Save the ${n} photos to my phone`, iconName: 'download', variant, attrs: { 'data-needs-app': '' } });
  b.addEventListener('click', async () => {
    const files = await casePhotoFiles(c);
    if (!files.length) {
      toast('No photos found for this case.', { tone: 'bad' });
      return;
    }
    if (canShareFiles(files)) {
      const result = await shareContent({ files });
      if (result !== 'unsupported') return;
    }
    files.forEach((f) => downloadBlob(f, f.name));
    toast(files.length === 1 ? 'Photo downloaded.' : `${files.length} photos downloaded.`, { tone: 'good' });
  });
  return b;
}

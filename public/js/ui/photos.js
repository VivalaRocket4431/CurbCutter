// Getting a case's photos out of CurbCutter: to the phone's photo library, a share sheet, or a download.
// Photos taken inside CurbCutter are not in the phone's photo library, and email links can't attach files,
// so this is how people attach photos to emails and complaint forms.

import { button, toast } from './components.js';
import { listPhotos } from '../lib/store.js';
import { canShareFiles, shareContent, downloadBlob, safeFilename } from '../lib/share.js';

export async function casePhotoFiles(c) {
  const ids = c.photos || [];
  const photos = (await listPhotos(c.id)).filter((p) => ids.includes(p.id));
  photos.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
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

// Shrinks photos before saving. Re-drawing the image also removes hidden location data (EXIF/GPS).

const MAX_SIDE = 1600;
const QUALITY = 0.82;

// Why a photo couldn't be added, in plain words, each with what to do next.
export const PHOTO_PROBLEMS = {
  notPhoto: 'That file isn\'t a photo. Choose a photo instead.',
  notDownloaded: 'This photo hasn\'t finished downloading to your phone. Open it in your photos app, wait for it to load, then try again.',
  heic: 'This photo is saved in HEIC format, which this browser can\'t open. Tap "Take a photo" to take a new one. To avoid this, turn off "high efficiency" or HEIF photos in your camera settings.',
  unreadable: 'This photo couldn\'t be opened. Choose it again, pick a different photo, or tap "Take a photo."',
  noSpace: 'Your phone is out of space for photos. Free up some space, then try again.',
  notSaved: 'This photo couldn\'t be saved. Try again.',
};

export class PhotoProblem extends Error {
  constructor(code) {
    super(PHOTO_PROBLEMS[code]);
    this.code = code;
  }
}

// The words to show for any error from compressPhoto() or from saving a photo.
export function photoProblemText(err) {
  if (err?.code && PHOTO_PROBLEMS[err.code]) return PHOTO_PROBLEMS[err.code];
  if (err?.name === 'QuotaExceededError') return PHOTO_PROBLEMS.noSpace;
  return PHOTO_PROBLEMS.notSaved;
}

// Many Android cameras can save HEIC/HEIF photos, which Chrome can't open. Safari can.
export function isHeic(file) {
  return /hei[cf]/i.test(file?.type || '') || /\.(heic|heif)$/i.test(file?.name || '');
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('This file could not be opened as a photo.'));
    };
    img.src = url;
  });
}

async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return { source: bmp, width: bmp.width, height: bmp.height, done: () => bmp.close?.() };
    } catch (e) {
      /* fall back to <img> */
    }
  }
  const { img, url } = await loadImage(file);
  return { source: img, width: img.naturalWidth, height: img.naturalHeight, done: () => URL.revokeObjectURL(url) };
}

export async function compressPhoto(file) {
  if (!file) throw new PhotoProblem('notPhoto');
  if (file.type && !/^image\//.test(file.type) && !isHeic(file)) throw new PhotoProblem('notPhoto');
  // Photos stored only in the cloud can arrive empty until the phone downloads them.
  if (!file.size) throw new PhotoProblem('notDownloaded');
  let d;
  try {
    d = await decode(file);
  } catch (e) {
    throw new PhotoProblem(isHeic(file) ? 'heic' : 'unreadable');
  }
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(d.width, d.height));
    const w = Math.max(1, Math.round(d.width * scale));
    const h = Math.max(1, Math.round(d.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(d.source, 0, 0, w, h);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    if (!blob) throw new PhotoProblem('notSaved');
    return { blob, width: w, height: h };
  } finally {
    d.done();
  }
}

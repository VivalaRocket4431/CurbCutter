// Shrinks photos before saving. Re-drawing the image also removes hidden location data (EXIF/GPS).

const MAX_SIDE = 1600;
const QUALITY = 0.82;

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
  if (!file || !/^image\//.test(file.type || 'image/')) throw new Error('Please choose a photo.');
  const d = await decode(file);
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
    if (!blob) throw new Error('This photo could not be saved.');
    return { blob, width: w, height: h };
  } finally {
    d.done();
  }
}

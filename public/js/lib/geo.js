// Suggests the metro area from a location, entirely on the device (no map service involved).

const CENTERS = [
  { metro: 'dfw', lat: 32.7767, lng: -96.797 }, // Dallas
  { metro: 'dfw', lat: 32.7555, lng: -97.3308 }, // Fort Worth
  { metro: 'houston', lat: 29.7604, lng: -95.3698 },
  { metro: 'sanantonio', lat: 29.4241, lng: -98.4936 },
  { metro: 'austin', lat: 30.2672, lng: -97.7431 },
];

const RADIUS_KM = 90;

export function distanceKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

// Rough box around Texas. Good enough to tell "Texas" from "not Texas" for a suggestion.
export function inTexas({ lat, lng }) {
  return lat >= 25.8 && lat <= 36.6 && lng >= -106.7 && lng <= -93.5;
}

export function metroFor(point) {
  if (!point || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) return null;
  let best = null;
  for (const c of CENTERS) {
    const d = distanceKm(point, c);
    if (d <= RADIUS_KM && (!best || d < best.d)) best = { metro: c.metro, d };
  }
  if (best) return best.metro;
  return inTexas(point) ? 'other' : 'outside';
}

export function currentPosition(timeout = 12000) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This device cannot share its location.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => reject(new Error(err && err.code === 1 ? 'Location permission was turned off. You can type the address instead.' : 'Your location could not be found. You can type the address instead.')),
      { enableHighAccuracy: true, timeout, maximumAge: 60000 },
    );
  });
}

export function mapsLink({ lat, lng }) {
  return `https://maps.google.com/?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
}

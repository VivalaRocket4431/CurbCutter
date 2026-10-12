// Read-aloud using the voices built into the phone. Long text is read in short pieces,
// because some browsers stop speaking partway through long passages.

let speaking = false;
const stateListeners = new Set();

export function speechSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function';
}

export function onSpeechState(fn) {
  stateListeners.add(fn);
  return () => stateListeners.delete(fn);
}

function setSpeaking(v) {
  speaking = v;
  for (const fn of stateListeners) fn(v);
}

export function isSpeaking() {
  return speaking;
}

function pickVoice() {
  const voices = window.speechSynthesis.getVoices();
  return voices.find((v) => /^en[-_]US/i.test(v.lang) && v.localService) || voices.find((v) => /^en/i.test(v.lang)) || null;
}

export function chunks(text, max = 220) {
  const sentences = String(text).replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*\s*/g) || [];
  const out = [];
  let cur = '';
  for (const s of sentences) {
    if ((cur + s).length > max && cur) {
      out.push(cur.trim());
      cur = '';
    }
    if (s.length > max) {
      for (let i = 0; i < s.length; i += max) out.push(s.slice(i, i + max).trim());
    } else {
      cur += s;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function speak(text, rate = 1) {
  if (!speechSupported()) return false;
  stop();
  const parts = chunks(text);
  if (!parts.length) return false;
  const voice = pickVoice();
  setSpeaking(true);
  parts.forEach((part, i) => {
    const u = new SpeechSynthesisUtterance(part);
    u.rate = rate;
    u.lang = 'en-US';
    if (voice) u.voice = voice;
    if (i === parts.length - 1) {
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
    }
    window.speechSynthesis.speak(u);
  });
  return true;
}

export function stop() {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
  setSpeaking(false);
}

// The readable text of an element, skipping anything marked data-noread.
export function readableText(root) {
  const clone = root.cloneNode(true);
  clone.querySelectorAll('[data-noread], script, style, svg, .visually-hidden-noread').forEach((n) => n.remove());
  clone.querySelectorAll('input, textarea, select').forEach((n) => {
    const label = n.getAttribute('aria-label');
    n.replaceWith(document.createTextNode(label ? ` ${label}. ` : ' '));
  });
  return clone.textContent.replace(/\s+/g, ' ').trim();
}

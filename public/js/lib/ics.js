// Calendar reminders as .ics files (RFC 5545). Opens in Apple Calendar, Google Calendar, and Outlook.

function escapeText(s) {
  return String(s ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

// Lines longer than 75 octets are folded with CRLF + space.
function fold(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out = [];
  let current = '';
  let currentBytes = 0;
  for (const ch of line) {
    const size = new TextEncoder().encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (currentBytes + size > limit) {
      out.push(current);
      current = '';
      currentBytes = 0;
    }
    current += ch;
    currentBytes += size;
  }
  out.push(current);
  return out.join('\r\n ');
}

function stamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

// A 15-minute reminder at 10:00 local time on the given date, with an alert.
export function reminderICS({ uid, dateISO, title, description, now = new Date() }) {
  const day = dateISO.replace(/-/g, '');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CurbCutter//Accessibility advocacy//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}@curbcutter.org`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${day}T100000`,
    `DTEND:${day}T101500`,
    `SUMMARY:${escapeText(title)}`,
    `DESCRIPTION:${escapeText(description)}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapeText(title)}`,
    'TRIGGER:-PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

// Link that opens Google Calendar with the reminder filled in. Keeps personal details out of the URL.
export function googleCalendarURL({ dateISO, title }) {
  const day = dateISO.replace(/-/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${day}T100000/${day}T101500`,
    details: 'Open CurbCutter to see your case and the next step.',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

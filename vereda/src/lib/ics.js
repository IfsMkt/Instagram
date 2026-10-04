// Gera um arquivo de calendário (.ics) com um lembrete diário. É a alternativa
// honesta enquanto o app não envia notificações próprias.
export function buildReminderIcs({ time = '20:00', timeZone = 'America/Sao_Paulo', minutes = 5, url }) {
  const [hh, mm] = time.split(':').map((n) => n.padStart(2, '0'));
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  const end = new Date(2000, 0, 1, Number(hh), Number(mm) + Number(minutes));
  const endStr = `${String(end.getHours()).padStart(2, '0')}${String(end.getMinutes()).padStart(2, '0')}00`;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Vereda//Lembrete//PT-BR',
    'BEGIN:VEVENT',
    `UID:vereda-lembrete-${stamp}@vereda`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${timeZone}:${ymd}T${hh}${mm}00`,
    `DTEND;TZID=${timeZone}:${ymd}T${endStr}`,
    'RRULE:FREQ=DAILY',
    'SUMMARY:Vereda — um passo por dia',
    `DESCRIPTION:Hora de uma lição curta no Vereda.${url ? ` ${url}` : ''}`,
    'BEGIN:VALARM',
    'ACTION:DISPLAY',
    'DESCRIPTION:Vereda — um passo por dia',
    'TRIGGER:PT0M',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.join('\r\n');
}

export function downloadFile(name, content, type = 'text/calendar') {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// =============================================================================
// iCalendar Export Utility
// Generates RFC 5545-compliant .ics files for appointment downloads.
// No external dependencies - pure TypeScript/DOM only.
// =============================================================================

/**
 * Minimal appointment shape required for iCal generation.
 * Intentionally narrower than the full Appointment domain model so this
 * utility remains usable from any context without importing the full model.
 */
export interface ICalAppointment {
  id: string;
  appointmentType: string;
  providerName: string;
  locationName: string;
  locationAddress: string;
  date: Date;
  startTime: string;
  endTime: string;
  telehealth: boolean;
  telehealthUrl?: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Parses a time string that is either 12-hour ("10:00 AM", "2:30 PM") or
 * 24-hour ("10:00", "14:30") format and returns { hours, minutes } in
 * 24-hour values.
 *
 * Throws a descriptive error when the string cannot be parsed so callers
 * receive actionable feedback during development.
 */
function parseTime(timeStr: string): { hours: number; minutes: number } {
  const trimmed = timeStr.trim();

  // 12-hour format: "10:00 AM", "2:30 PM", "12:00 PM", "12:00 AM"
  const twelveHour = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(trimmed);
  if (twelveHour !== null) {
    let hours = parseInt(twelveHour[1], 10);
    const minutes = parseInt(twelveHour[2], 10);
    const period = twelveHour[3].toUpperCase();

    if (period === 'AM') {
      // 12:xx AM is 00:xx in 24-hour time
      if (hours === 12) {
        hours = 0;
      }
    } else {
      // 12:xx PM stays as 12:xx; all other PM hours get +12
      if (hours !== 12) {
        hours += 12;
      }
    }

    return { hours, minutes };
  }

  // 24-hour format: "10:00", "14:30"
  const twentyFourHour = /^(\d{1,2}):(\d{2})$/.exec(trimmed);
  if (twentyFourHour !== null) {
    return {
      hours: parseInt(twentyFourHour[1], 10),
      minutes: parseInt(twentyFourHour[2], 10),
    };
  }

  throw new Error(
    `exportToICal: Cannot parse time string "${timeStr}". ` +
      'Expected "HH:MM AM/PM" (12-hour) or "HH:MM" (24-hour).'
  );
}

/**
 * Combines a calendar date with parsed hours/minutes and returns a new Date
 * object without mutating the original.
 */
function combineDateAndTime(
  date: Date,
  hours: number,
  minutes: number
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hours,
    minutes,
    0,
    0
  );
}

/**
 * Formats a Date to the iCalendar local datetime value format:
 * YYYYMMDDTHHMMSS  (no trailing Z — local floating time)
 *
 * Using local time is the correct choice for patient-facing calendar events
 * because the appointment was scheduled in the patient's local timezone and
 * calendar apps should display it without conversion.
 */
function formatICalDateTime(date: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Produces the UTC timestamp used for DTSTAMP (the moment the iCal object
 * was created, not the event time).  RFC 5545 requires DTSTAMP to be in UTC.
 */
function formatICalUtcNow(): string {
  const now = new Date();
  const pad = (n: number): string => String(n).padStart(2, '0');

  const year = now.getUTCFullYear();
  const month = pad(now.getUTCMonth() + 1);
  const day = pad(now.getUTCDate());
  const hours = pad(now.getUTCHours());
  const minutes = pad(now.getUTCMinutes());
  const seconds = pad(now.getUTCSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escapes special characters in iCal text property values per RFC 5545 §3.3.11.
 * Commas, semicolons, and backslashes must be escaped; newlines become \n.
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')   // backslash first to avoid double-escaping
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Folds long content lines to satisfy the RFC 5545 §3.1 requirement that
 * lines must not exceed 75 octets.  Continuation lines begin with a single
 * SPACE character.
 */
function foldLine(line: string): string {
  const MAX_LINE_OCTETS = 75;

  if (line.length <= MAX_LINE_OCTETS) {
    return line;
  }

  const segments: string[] = [];
  let remaining = line;

  // First segment: full 75 characters
  segments.push(remaining.slice(0, MAX_LINE_OCTETS));
  remaining = remaining.slice(MAX_LINE_OCTETS);

  // Continuation segments: 74 characters each (1 taken by the leading space)
  while (remaining.length > 0) {
    segments.push(' ' + remaining.slice(0, MAX_LINE_OCTETS - 1));
    remaining = remaining.slice(MAX_LINE_OCTETS - 1);
  }

  return segments.join('\r\n');
}

/**
 * Builds a single iCal property line, folding it if necessary.
 * Returns the folded line terminated with CRLF.
 */
function prop(name: string, value: string): string {
  return foldLine(`${name}:${value}`) + '\r\n';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generates a valid RFC 5545 iCalendar (.ics) file from the supplied
 * appointment data and triggers a browser file download.
 *
 * Time strings are accepted in either 12-hour ("10:00 AM") or 24-hour
 * ("10:00") format.  The event is written as a local floating time so it
 * displays correctly in the patient's calendar regardless of timezone.
 *
 * For telehealth appointments the LOCATION and DESCRIPTION fields include
 * the video visit URL.  For in-person appointments the physical address is
 * used as the LOCATION.
 *
 * The download is triggered by programmatically clicking a temporary anchor
 * element which is removed from the DOM immediately after the click.
 */
export function exportToICal(appointment: ICalAppointment): void {
  // --- Parse and combine date + times -----------------------------------------
  const startParsed = parseTime(appointment.startTime);
  const endParsed = parseTime(appointment.endTime);

  const dtStart = combineDateAndTime(
    appointment.date,
    startParsed.hours,
    startParsed.minutes
  );
  const dtEnd = combineDateAndTime(
    appointment.date,
    endParsed.hours,
    endParsed.minutes
  );

  // --- Build LOCATION and DESCRIPTION based on visit modality -----------------
  const location = appointment.telehealth
    ? (appointment.telehealthUrl ?? 'Video Visit')
    : `${appointment.locationName}, ${appointment.locationAddress}`;

  const descriptionParts: string[] = [
    `Appointment Type: ${appointment.appointmentType}`,
    `Provider: ${appointment.providerName}`,
  ];

  if (appointment.telehealth) {
    descriptionParts.push('Visit Mode: Telehealth (Video)');
    if (appointment.telehealthUrl !== undefined && appointment.telehealthUrl !== '') {
      descriptionParts.push(`Join URL: ${appointment.telehealthUrl}`);
    }
  } else {
    descriptionParts.push(`Location: ${appointment.locationName}`);
    descriptionParts.push(`Address: ${appointment.locationAddress}`);
  }

  const description = descriptionParts.join('\\n');

  // --- Assemble the iCal content string (CRLF line endings per RFC 5545) ------
  const lines: string[] = [
    'BEGIN:VCALENDAR\r\n',
    prop('VERSION', '2.0'),
    prop('PRODID', '-//GoHealth Patient Portal//EN'),
    prop('CALSCALE', 'GREGORIAN'),
    prop('METHOD', 'PUBLISH'),
    'BEGIN:VEVENT\r\n',
    prop('UID', `${appointment.id}@gohealth-patient-portal`),
    prop('DTSTAMP', formatICalUtcNow()),
    prop('DTSTART', formatICalDateTime(dtStart)),
    prop('DTEND', formatICalDateTime(dtEnd)),
    prop('SUMMARY', escapeICalText(appointment.appointmentType)),
    prop('LOCATION', escapeICalText(location)),
    prop('DESCRIPTION', escapeICalText(description)),
    prop('STATUS', 'CONFIRMED'),
    prop('TRANSP', 'OPAQUE'),
    'END:VEVENT\r\n',
    'END:VCALENDAR\r\n',
  ];

  const icsContent = lines.join('');

  // --- Create Blob, generate object URL, trigger download, clean up ----------
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const objectUrl = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = objectUrl;

  // Sanitise the filename: replace characters that are invalid in most
  // filesystems with underscores and collapse consecutive underscores.
  const safeType = appointment.appointmentType
    .replace(/[^a-zA-Z0-9\-]/g, '_')
    .replace(/_+/g, '_');
  const safeDate = formatICalDateTime(dtStart).slice(0, 8); // YYYYMMDD
  anchor.download = `appointment_${safeDate}_${safeType}.ics`;

  // The anchor must be in the DOM for Firefox to honour the download attribute.
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  // Release the object URL and remove the anchor on the next tick so the
  // browser has time to initiate the download before cleanup.
  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
    document.body.removeChild(anchor);
  }, 100);
}

import type { SolarDate } from "./amlich.ts";

export type IcsEvent = {
  uid: string;
  dtstamp: string;
  start: SolarDate;
  summary: string;
  description?: string;
};

export function escapeText(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r\n|\r|\n/g, "\\n");
}

export function foldLine(line: string): string {
  const physicalLines: string[] = [];
  let physicalLine = "";
  let octets = 0;

  for (const character of line) {
    const characterOctets = Buffer.byteLength(character, "utf8");
    if (octets + characterOctets > 75) {
      physicalLines.push(physicalLine);
      physicalLine = ` ${character}`;
      octets = 1 + characterOctets;
    } else {
      physicalLine += character;
      octets += characterOctets;
    }
  }

  physicalLines.push(physicalLine);
  return physicalLines.join("\r\n");
}

function formatDate(date: SolarDate): string {
  return `${String(date.year).padStart(4, "0")}${String(date.month).padStart(2, "0")}${String(date.day).padStart(2, "0")}`;
}

function nextDate(date: SolarDate): SolarDate {
  const next = new Date(Date.UTC(date.year, date.month - 1, date.day + 1));
  return {
    day: next.getUTCDate(),
    month: next.getUTCMonth() + 1,
    year: next.getUTCFullYear(),
  };
}

export function buildEvent(e: IcsEvent): string {
  const lines = [
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${e.dtstamp}`,
    `DTSTART;VALUE=DATE:${formatDate(e.start)}`,
    `DTEND;VALUE=DATE:${formatDate(nextDate(e.start))}`,
    `SUMMARY:${escapeText(e.summary)}`,
  ];
  if (e.description !== undefined) {
    lines.push(`DESCRIPTION:${escapeText(e.description)}`);
  }
  lines.push("TRANSP:TRANSPARENT", "END:VEVENT");
  return lines.map(foldLine).join("\r\n");
}

export function buildCalendar(opts: {
  name: string;
  timezone: string;
  prodId: string;
  events: IcsEvent[];
}): string {
  const calendarLines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${escapeText(opts.prodId)}`,
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${escapeText(opts.name)}`,
    `X-WR-TIMEZONE:${escapeText(opts.timezone)}`,
  ];
  const lines = [
    ...calendarLines.map(foldLine),
    ...opts.events.map(buildEvent),
    foldLine("END:VCALENDAR"),
  ];
  return `${lines.join("\r\n")}\r\n`;
}

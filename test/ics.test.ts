import assert from "node:assert/strict";
import test from "node:test";

import { buildCalendar, buildEvent, escapeText, foldLine } from "../src/ics.ts";

test("foldLine folds UTF-8 text without splitting multibyte characters", () => {
  const line = "Rằm tháng Tám — Tết Trung Thu, năm Ất Tỵ ".repeat(4);
  const folded = foldLine(line);
  const physicalLines = folded.split("\r\n");

  for (const [index, physicalLine] of physicalLines.entries()) {
    assert.ok(Buffer.byteLength(physicalLine, "utf8") <= 75);
    if (index > 0) {
      assert.ok(physicalLine.startsWith(" "));
    }
    assert.ok(!Buffer.from(physicalLine, "utf8").toString("utf8").includes("�"));
  }

  assert.equal(folded.replace(/\r\n /g, ""), line);
});

test("escapeText escapes RFC 5545 text characters in the required order", () => {
  assert.equal(escapeText("a,b;c\\d\ne"), "a\\,b\\;c\\\\d\\ne");
  assert.equal(escapeText("\\,"), String.raw`\\\,`);
});

test("buildEvent emits all-day DTSTART, exclusive DTEND, and transparent availability", () => {
  const event = buildEvent({
    uid: "tet-2025@example.test",
    dtstamp: "20260101T000000Z",
    start: { day: 29, month: 1, year: 2025 },
    summary: "Tết, Ất Tỵ",
    description: "a,b;c\\d\ne",
  });

  assert.ok(event.includes("DTSTART;VALUE=DATE:20250129"));
  assert.ok(event.includes("DTEND;VALUE=DATE:20250130"));
  assert.ok(event.includes("SUMMARY:Tết\\, Ất Tỵ"));
  assert.ok(event.includes("DESCRIPTION:a\\,b\\;c\\\\d\\ne"));
  assert.ok(event.includes("TRANSP:TRANSPARENT"));
  assert.doesNotMatch(event, /(?:^|\r\n)DTEND:(?!VALUE=DATE)/);
});

test("buildEvent calculates all-day exclusive end dates across boundaries", () => {
  const yearEnd = buildEvent({
    uid: "year-end@example.test",
    dtstamp: "20260101T000000Z",
    start: { day: 31, month: 12, year: 2025 },
    summary: "Year end",
  });
  const leapDay = buildEvent({
    uid: "leap-day@example.test",
    dtstamp: "20260101T000000Z",
    start: { day: 28, month: 2, year: 2028 },
    summary: "Leap day boundary",
  });

  assert.ok(yearEnd.includes("DTEND;VALUE=DATE:20260101"));
  assert.ok(leapDay.includes("DTEND;VALUE=DATE:20280229"));
  assert.doesNotMatch(yearEnd, /DESCRIPTION:/);
});

test("buildCalendar emits a CRLF iCalendar without METHOD or a BOM", () => {
  const output = buildCalendar({
    name: "Âm lịch",
    timezone: "Asia/Ho_Chi_Minh",
    prodId: "-//amlich-ical//EN",
    events: [
      {
        uid: "tet-2025@example.test",
        dtstamp: "20260101T000000Z",
        start: { day: 29, month: 1, year: 2025 },
        summary: "Tết Nguyên Đán",
      },
    ],
  });

  assert.ok(output.startsWith("BEGIN:VCALENDAR\r\n"));
  assert.ok(output.includes("VERSION:2.0\r\n"));
  assert.ok(output.includes("PRODID:-//amlich-ical//EN\r\n"));
  assert.ok(
    output.split("\r\n").includes("DTSTART;VALUE=DATE:20250129"),
  );
  assert.doesNotMatch(output, /METHOD:/);
  assert.ok(output.includes("\r\n"));
  assert.doesNotMatch(output, /(^|[^\r])\n/);
  assert.ok(output.endsWith("END:VCALENDAR\r\n"));
  assert.notDeepEqual(
    Buffer.from(output, "utf8").subarray(0, 3),
    Buffer.from([0xef, 0xbb, 0xbf]),
  );
});

test("buildCalendar escapes and folds dynamic calendar properties", () => {
  const output = buildCalendar({
    name: `${"Rằm tháng Tám — Tết Trung Thu, năm Ất Tỵ ".repeat(4)}\r\nMETHOD:PUBLISH`,
    timezone: "Asia/Ho_Chi_Minh",
    prodId: "-//amlich-ical//EN",
    events: [],
  });
  const physicalLines = output.split("\r\n");

  for (const physicalLine of physicalLines) {
    assert.ok(Buffer.byteLength(physicalLine, "utf8") <= 75);
  }

  assert.ok(physicalLines.some((physicalLine) => physicalLine.startsWith(" ")));
  assert.ok(!physicalLines.includes("METHOD:PUBLISH"));
});

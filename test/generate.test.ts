import assert from "node:assert/strict";
import test from "node:test";

import { jdFromDate, lunarMonthName, lunarToSolar } from "../src/amlich.ts";
import { buildEvents } from "../src/generate.ts";

function hasStart(
  event: { start: { day: number; month: number; year: number } },
  date: { day: number; month: number; year: number },
): boolean {
  return (
    event.start.day === date.day &&
    event.start.month === date.month &&
    event.start.year === date.year
  );
}

test("Tết 2025 block has the expected four dates", () => {
  const events = buildEvents();
  const expected = [
    ["Giao thừa", { day: 28, month: 1, year: 2025 }],
    ["Mùng 1 Tết", { day: 29, month: 1, year: 2025 }],
    ["Mùng 2 Tết", { day: 30, month: 1, year: 2025 }],
    ["Mùng 3 Tết", { day: 31, month: 1, year: 2025 }],
  ] as const;

  for (const [summary, date] of expected) {
    assert.ok(
      events.some((event) => event.summary === summary && hasStart(event, date)),
      `${summary} should be on ${date.year}-${date.month}-${date.day}`,
    );
  }
});

test("Tết supersedes the generic Mùng 1 tháng Giêng event", () => {
  assert.ok(buildEvents().every((event) => event.summary !== "Mùng 1 tháng Giêng"));
});

test("day-15 festivals merge into their Rằm events without duplicates", () => {
  const events = buildEvents();
  const festivals = [
    { month: 1, name: "Tết Nguyên Tiêu (Rằm tháng Giêng)" },
    { month: 4, name: "Đại lễ Phật Đản" },
    { month: 7, name: "Lễ Vu Lan" },
    { month: 8, name: "Tết Trung Thu" },
  ] as const;

  for (const festival of festivals) {
    const solar = lunarToSolar(15, festival.month, 2025, false);
    assert.ok(solar);

    const eventsOnFestivalDay = events.filter((event) => hasStart(event, solar));
    assert.equal(eventsOnFestivalDay.length, 1, festival.name);
    assert.equal(
      eventsOnFestivalDay[0].summary,
      `Rằm tháng ${lunarMonthName(festival.month, false)} — ${festival.name}`,
    );
    assert.ok(
      !events.some((event) => hasStart(event, solar) && event.summary === festival.name),
      `${festival.name} must not be a standalone event`,
    );
  }
});

test("Giỗ Tổ Hùng Vương is emitted on its lunar-to-solar date", () => {
  const gioTo = lunarToSolar(10, 3, 2025, false);
  assert.ok(gioTo);

  assert.ok(
    buildEvents().some((event) => event.summary === "Giỗ Tổ Hùng Vương" && hasStart(event, gioTo)),
  );
});

test("all generated events are inside the configured Gregorian window", () => {
  const first = jdFromDate(1, 1, 2025);
  const last = jdFromDate(31, 12, 2055);

  for (const event of buildEvents()) {
    const jd = jdFromDate(event.start.day, event.start.month, event.start.year);
    assert.ok(jd >= first && jd <= last, event.uid);
  }
});

test("the 2025 leap sixth month has exact Mùng 1 and Rằm labels", () => {
  const events = buildEvents();
  const first = jdFromDate(1, 1, 2025);
  const last = jdFromDate(31, 12, 2055);
  const expected = [
    [1, "Mùng 1 tháng 6 (nhuận)"],
    [15, "Rằm tháng 6 (nhuận)"],
  ] as const;

  for (const [lunarDay, summary] of expected) {
    const solar = lunarToSolar(lunarDay, 6, 2025, true);
    assert.ok(solar);
    const jd = jdFromDate(solar.day, solar.month, solar.year);
    assert.ok(jd >= first && jd <= last, summary);
    assert.ok(
      events.some((event) => event.summary === summary && hasStart(event, solar)),
      summary,
    );
  }
});

test("Tết-boundary descriptions retain the event's lunar year", () => {
  const events = buildEvents();
  const giaoThua = events.find(
    (event) => event.summary === "Giao thừa" && hasStart(event, { day: 28, month: 1, year: 2025 }),
  );
  const mung1Tet = events.find(
    (event) => event.summary === "Mùng 1 Tết" && hasStart(event, { day: 29, month: 1, year: 2025 }),
  );

  assert.ok(giaoThua);
  assert.match(giaoThua.description ?? "", /Âm lịch: 29\/12 năm Giáp Thìn/);
  assert.ok(mung1Tet);
  assert.match(mung1Tet.description ?? "", /Âm lịch: 1\/1 năm Ất Tỵ/);
});

test("generated event UIDs are unique", () => {
  const events = buildEvents();
  assert.equal(new Set(events.map((event) => event.uid)).size, events.length);
});

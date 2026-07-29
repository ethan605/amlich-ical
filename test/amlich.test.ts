import assert from "node:assert/strict";
import test from "node:test";

import {
  dayCanChi,
  jdFromDate,
  jdToDate,
  lunarMonthName,
  lunarToSolar,
  monthCanChi,
  solarToLunar,
  yearCanChi,
} from "../src/amlich.ts";

test("Julian day conversions round-trip Gregorian dates", () => {
  const dates = [
    { day: 1, month: 1, year: 2025 },
    { day: 29, month: 1, year: 2025 },
    { day: 28, month: 2, year: 2026 },
    { day: 29, month: 2, year: 2028 },
    { day: 31, month: 12, year: 2030 },
    { day: 15, month: 7, year: 2040 },
    { day: 31, month: 12, year: 2055 },
  ];

  for (const date of dates) {
    assert.deepEqual(jdToDate(jdFromDate(date.day, date.month, date.year)), date);
  }
});

test("known Tết dates convert from lunar to solar", () => {
  const tetDates = [
    [2025, { day: 29, month: 1, year: 2025 }],
    [2026, { day: 17, month: 2, year: 2026 }],
    [2027, { day: 6, month: 2, year: 2027 }],
    [2028, { day: 26, month: 1, year: 2028 }],
    [2029, { day: 13, month: 2, year: 2029 }],
    [2030, { day: 2, month: 2, year: 2030 }],
  ] as const;

  for (const [lunarYear, solarDate] of tetDates) {
    assert.deepEqual(lunarToSolar(1, 1, lunarYear, false), solarDate);
  }
});

test("known Tết dates convert from solar to lunar", () => {
  const tetDates = [
    [2025, { day: 29, month: 1, year: 2025 }],
    [2026, { day: 17, month: 2, year: 2026 }],
    [2027, { day: 6, month: 2, year: 2027 }],
    [2028, { day: 26, month: 1, year: 2028 }],
    [2029, { day: 13, month: 2, year: 2029 }],
    [2030, { day: 2, month: 2, year: 2030 }],
  ] as const;

  for (const [lunarYear, solarDate] of tetDates) {
    assert.deepEqual(solarToLunar(solarDate.day, solarDate.month, solarDate.year), {
      day: 1,
      month: 1,
      year: lunarYear,
      isLeap: false,
    });
  }
});

test("lunar leap-month conversions distinguish leap months and reject invalid leap placements", () => {
  const regularSixthMonth = lunarToSolar(1, 6, 2025, false);
  const leapSixthMonth = lunarToSolar(1, 6, 2025, true);

  assert.notEqual(leapSixthMonth, null);
  assert.notDeepEqual(leapSixthMonth, regularSixthMonth);
  assert.notEqual(lunarToSolar(1, 5, 2028, true), null);
  assert.equal(lunarToSolar(1, 5, 2025, true), null);
});

test("non-leap lunar years reject leap requests for every month", () => {
  for (let month = 1; month <= 12; month++) {
    assert.equal(lunarToSolar(1, month, 2026, true), null);
  }
});

test("solar and lunar date conversions round-trip sampled dates", () => {
  const solarDates = [
    { day: 29, month: 1, year: 2025 },
    { day: 23, month: 8, year: 2025 },
    { day: 17, month: 2, year: 2026 },
    { day: 8, month: 8, year: 2027 },
    { day: 26, month: 1, year: 2028 },
    { day: 31, month: 12, year: 2030 },
  ];

  for (const solarDate of solarDates) {
    const lunarDate = solarToLunar(solarDate.day, solarDate.month, solarDate.year);
    assert.deepEqual(
      lunarToSolar(
        lunarDate.day,
        lunarDate.month,
        lunarDate.year,
        lunarDate.isLeap,
      ),
      solarDate,
    );
  }
});

test("the final day of lunar month 3 in 2054 converts to its solar date", () => {
  assert.deepEqual(lunarToSolar(30, 3, 2054, false), {
    day: 7,
    month: 5,
    year: 2054,
  });
  assert.deepEqual(solarToLunar(7, 5, 2054), {
    day: 30,
    month: 3,
    year: 2054,
    isLeap: false,
  });
});

test("solar and lunar conversions round-trip every date from 2024 through 2056", () => {
  const firstJd = jdFromDate(1, 1, 2024);
  const lastJd = jdFromDate(31, 12, 2056);

  for (let jd = firstJd; jd <= lastJd; jd++) {
    const solarDate = jdToDate(jd);
    const lunarDate = solarToLunar(solarDate.day, solarDate.month, solarDate.year);

    assert.ok(lunarDate.day >= 1 && lunarDate.day <= 30, `invalid lunar day for JDN ${jd}`);
    assert.ok(lunarDate.month >= 1 && lunarDate.month <= 12, `invalid lunar month for JDN ${jd}`);
    assert.ok(lunarDate.year > 0, `invalid lunar year for JDN ${jd}`);
    assert.deepEqual(
      lunarToSolar(
        lunarDate.day,
        lunarDate.month,
        lunarDate.year,
        lunarDate.isLeap,
      ),
      solarDate,
      `round-trip failed for JDN ${jd}`,
    );
  }
});

test("Can-Chi names and lunar month names match Vietnamese conventions", () => {
  assert.equal(yearCanChi(2025), "Ất Tỵ");
  assert.equal(yearCanChi(2026), "Bính Ngọ");
  assert.equal(yearCanChi(2027), "Đinh Mùi");
  assert.equal(yearCanChi(2028), "Mậu Thân");
  assert.equal(yearCanChi(2029), "Kỷ Dậu");
  assert.equal(yearCanChi(2030), "Canh Tuất");
  assert.equal(monthCanChi(3, 2004), "Mậu Thìn");
  assert.equal(dayCanChi(2451545), "Mậu Ngọ");
  assert.equal(lunarMonthName(1, false), "Giêng");
  assert.equal(lunarMonthName(12, false), "Chạp");
  assert.equal(lunarMonthName(6, true), "6 (nhuận)");
});

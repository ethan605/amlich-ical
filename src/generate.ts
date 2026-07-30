import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  VN_TIMEZONE,
  dayCanChi,
  jdFromDate,
  jdToDate,
  getNewMoonDay,
  lunarMonthName,
  lunarToSolar,
  monthCanChi,
  solarToLunar,
  yearCanChi,
} from "./amlich.ts";
import { FESTIVALS } from "./festivals.ts";
import { buildCalendar } from "./ics.ts";
import type { IcsEvent } from "./ics.ts";
import type { SolarDate } from "./amlich.ts";

const DTSTAMP = "20250101T000000Z";
const jdStart = jdFromDate(1, 1, 2025);
const jdEnd = jdFromDate(31, 12, 2055);
const inWindow = (d: SolarDate) => {
  const j = jdFromDate(d.day, d.month, d.year);
  return j >= jdStart && j <= jdEnd;
};

const formatDate = (date: SolarDate): string =>
  `${String(date.year).padStart(4, "0")}${String(date.month).padStart(2, "0")}${String(date.day).padStart(2, "0")}`;

const slug = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function descriptionFor(date: SolarDate): string {
  const lunar = solarToLunar(date.day, date.month, date.year);
  const jd = jdFromDate(date.day, date.month, date.year);

  return [
    `Âm lịch: ${lunar.day}/${lunar.month} năm ${yearCanChi(lunar.year)}`,
    `Ngày ${dayCanChi(jd)}, tháng ${monthCanChi(lunar.month, lunar.year)}, năm ${yearCanChi(lunar.year)}`,
  ].join("\n");
}

export function buildEvents(): IcsEvent[] {
  const events: IcsEvent[] = [];
  const addEvent = (uidPrefix: string, start: SolarDate, summary: string): void => {
    if (!inWindow(start)) {
      return;
    }

    events.push({
      uid: `${uidPrefix}-${formatDate(start)}@amlich.ethanify.me`,
      dtstamp: DTSTAMP,
      start,
      summary,
      description: descriptionFor(start),
    });
  };

  let k = Math.floor((jdStart - 2415021.076998695) / 29.530588853) - 2;
  while (true) {
    const nm = getNewMoonDay(k, VN_TIMEZONE);
    if (nm > jdEnd + 20) {
      break;
    }

    const m1 = jdToDate(nm);
    const lab = solarToLunar(m1.day, m1.month, m1.year);
    if (lab.month !== 1) {
      addEvent("mung1", m1, `Mùng 1 tháng ${lunarMonthName(lab.month, lab.isLeap)}`);
    }

    const ram = jdToDate(nm + 14);
    const festival = !lab.isLeap
      ? FESTIVALS.find(
          (entry) => entry.lunarMonth === lab.month && entry.lunarDay === 15,
        )
      : undefined;
    const festivalSuffix = festival === undefined ? "" : ` — ${festival.name}`;
    addEvent("ram", ram, `Rằm tháng ${lunarMonthName(lab.month, lab.isLeap)}${festivalSuffix}`);
    k++;
  }

  for (let year = 2024; year <= 2056; year++) {
    const tet = lunarToSolar(1, 1, year, false)!;
    const tetJd = jdFromDate(tet.day, tet.month, tet.year);
    addEvent("tet-giaothua", jdToDate(tetJd - 1), "Giao thừa");
    addEvent("tet-mung1", tet, "Mùng 1 Tết");
    addEvent("tet-mung2", jdToDate(tetJd + 1), "Mùng 2 Tết");
    addEvent("tet-mung3", jdToDate(tetJd + 2), "Mùng 3 Tết");
  }

  for (let year = 2024; year <= 2056; year++) {
    for (const festival of FESTIVALS) {
      if (
        festival.lunarDay === 15 ||
        (festival.lunarMonth === 1 && festival.lunarDay === 1)
      ) {
        continue;
      }

      const solar = lunarToSolar(
        festival.lunarDay,
        festival.lunarMonth,
        year,
        false,
      );
      if (solar !== null) {
        addEvent(`festival-${slug(festival.name)}`, solar, festival.name);
      }
    }
  }

  events.sort(
    (a, b) =>
      jdFromDate(a.start.day, a.start.month, a.start.year) -
      jdFromDate(b.start.day, b.start.month, b.start.year),
  );
  return events;
}

function main(): void {
  const output = buildCalendar({
    name: "Lịch Âm Việt Nam",
    timezone: "Asia/Ho_Chi_Minh",
    prodId: "-//amlich-ical//VN Lunar//VI",
    events: buildEvents(),
  });
  const docsDirectory = new URL("../docs/", import.meta.url);

  mkdirSync(docsDirectory, { recursive: true });
  writeFileSync(new URL("amlich.ics", docsDirectory), output, "utf8");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}

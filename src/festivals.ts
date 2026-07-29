export type Festival = { lunarMonth: number; lunarDay: number; name: string };

export const FESTIVALS: Festival[] = [
  { lunarMonth: 1, lunarDay: 1, name: "Tết Nguyên Đán" },
  { lunarMonth: 1, lunarDay: 15, name: "Tết Nguyên Tiêu (Rằm tháng Giêng)" },
  { lunarMonth: 3, lunarDay: 3, name: "Tết Hàn Thực" },
  { lunarMonth: 3, lunarDay: 10, name: "Giỗ Tổ Hùng Vương" },
  { lunarMonth: 4, lunarDay: 15, name: "Đại lễ Phật Đản" },
  { lunarMonth: 5, lunarDay: 5, name: "Tết Đoan Ngọ" },
  { lunarMonth: 7, lunarDay: 15, name: "Lễ Vu Lan" },
  { lunarMonth: 8, lunarDay: 15, name: "Tết Trung Thu" },
  { lunarMonth: 9, lunarDay: 9, name: "Tết Trùng Cửu" },
  { lunarMonth: 12, lunarDay: 23, name: "Tết Ông Công Ông Táo" },
];

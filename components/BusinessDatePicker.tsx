
import React, { useState, useMemo } from 'react';

// 日本の祝日（2024年〜2026年）
// 春分の日・秋分の日は国立天文台の算出に基づく
const JAPANESE_HOLIDAYS = [
  // 2024
  "2024-01-01", "2024-01-08", "2024-02-11", "2024-02-12", "2024-02-23", "2024-03-20", "2024-04-29", "2024-05-03", "2024-05-04", "2024-05-05", "2024-05-06", "2024-07-15", "2024-08-11", "2024-08-12", "2024-09-16", "2024-09-22", "2024-09-23", "2024-10-14", "2024-11-03", "2024-11-04", "2024-11-23",
  // 2025
  "2025-01-01", "2025-01-13", "2025-02-11", "2025-02-23", "2025-02-24", "2025-03-20", "2025-04-29", "2025-05-03", "2025-05-04", "2025-05-05", "2025-05-06", "2025-07-21", "2025-08-11", "2025-09-15", "2025-09-23", "2025-10-13", "2025-11-03", "2025-11-23", "2025-11-24",
  // 2026
  "2026-01-01", "2026-01-12", "2026-02-11", "2026-02-23", "2026-03-20", "2026-04-29", "2026-05-03", "2026-05-04", "2026-05-05", "2026-05-06", "2026-07-20", "2026-08-11", "2026-09-21", "2026-09-22", "2026-09-23", "2026-10-12", "2026-11-03", "2026-11-23"
];

/**
 * タイムゾーンの影響を避けて現地時間の YYYY-MM-DD 文字列を取得
 */
const toLocalDateString = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

interface BusinessDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  label: string;
  colorClass: string;
}

export const BusinessDatePicker: React.FC<BusinessDatePickerProps> = ({ value, onChange, label, colorClass }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState(new Date());

  // 14営業日後の日付を計算（本日を含まず、翌日からカウント）
  const minDate = useMemo(() => {
    let d = new Date();
    d.setHours(0, 0, 0, 0);
    let businessDaysAdded = 0;
    while (businessDaysAdded < 14) {
      d.setDate(d.getDate() + 1);
      const day = d.getDay();
      const dateStr = toLocalDateString(d);
      // 土日および祝日を除外
      if (day !== 0 && day !== 6 && !JAPANESE_HOLIDAYS.includes(dateStr)) {
        businessDaysAdded++;
      }
    }
    return d;
  }, []);

  const isSelectable = (date: Date) => {
    const day = date.getDay();
    const dateStr = toLocalDateString(date);
    if (day === 0 || day === 6) return false;
    if (JAPANESE_HOLIDAYS.includes(dateStr)) return false;
    
    // 14営業日判定
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    if (checkDate < minDate) return false;
    
    return true;
  };

  const generateCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const handleDateSelect = (date: Date) => {
    onChange(toLocalDateString(date));
    setIsOpen(false);
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        <span className={`text-[10px] font-bold text-white ${colorClass} px-2 py-0.5 rounded whitespace-nowrap`}>{label}</span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full border rounded px-2 py-1 bg-white font-medium text-left hover:bg-gray-50 focus:ring-1 focus:ring-blue-500 outline-none text-sm min-h-[32px] flex items-center justify-between"
        >
          <span className={value ? "text-gray-900" : "text-gray-400"}>
            {value || "選択してください"}
          </span>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[200]" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-[201] bg-white border rounded-xl shadow-2xl p-4 w-[280px] animate-in fade-in zoom-in duration-200">
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg text-[11px] font-bold whitespace-nowrap animate-bounce z-[210]">
              14営業日以降でお願いします
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-600 rotate-45"></div>
            </div>

            <div className="flex justify-between items-center mb-4">
              <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <span className="font-bold text-gray-800">
                {viewDate.getFullYear()}年 {viewDate.getMonth() + 1}月
              </span>
              <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {["日", "月", "火", "水", "木", "金", "土"].map((d, i) => (
                <span key={d} className={`text-[10px] font-bold ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-400"}`}>
                  {d}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {generateCalendarDays().map((date, i) => {
                if (!date) return <div key={`empty-${i}`} className="h-8" />;
                
                const selectable = isSelectable(date);
                const day = date.getDay();
                const dStr = toLocalDateString(date);
                const isToday = dStr === toLocalDateString(new Date());
                const isSelected = value === dStr;
                const isHoliday = JAPANESE_HOLIDAYS.includes(dStr);

                return (
                  <button
                    key={date.getTime()}
                    disabled={!selectable}
                    onClick={() => handleDateSelect(date)}
                    className={`
                      h-8 w-full rounded flex items-center justify-center text-xs font-medium transition-colors
                      ${!selectable ? "text-gray-200 cursor-not-allowed" : "hover:bg-blue-50 text-gray-700"}
                      ${isSelected ? "bg-blue-600 text-white hover:bg-blue-700" : ""}
                      ${isToday && !isSelected ? "border border-blue-200" : ""}
                      ${(day === 0 || day === 6 || isHoliday) && selectable === false ? "bg-gray-50" : ""}
                    `}
                  >
                    {date.getDate()}
                  </button>
                );
              })}
            </div>
            <div className="mt-4 pt-2 border-t text-[9px] text-gray-400 leading-tight">
              ※ 土日祝および、本日より14営業日以内の日付はご指定いただけません。
            </div>
          </div>
        </>
      )}
    </div>
  );
};

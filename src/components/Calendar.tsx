import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { ko } from 'date-fns/locale';

interface CalendarProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  getEntriesForMonth: (year: number, month: number) => Set<number>;
}

export const Calendar = ({
  selectedDate,
  onSelectDate,
  getEntriesForMonth,
}: CalendarProps) => {
  const [currentMonth, setCurrentMonth] = useState(parseISO(selectedDate));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const entriesThisMonth = getEntriesForMonth(
    currentMonth.getFullYear(),
    currentMonth.getMonth()
  );

  const weekdays = ['\uC77C', '\uC6D4', '\uD654', '\uC218', '\uBAA9', '\uAE08', '\uD1A0'];

  const days: JSX.Element[] = [];
  let day = startDate;

  while (day <= endDate) {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayNum = day.getDate();
    const isCurrentMonth = isSameMonth(day, monthStart);
    const isSelected = dayStr === selectedDate;
    const isTodayDay = isToday(day);
    const hasEntry = isCurrentMonth && entriesThisMonth.has(dayNum);

    const currentDay = day; // Capture for closure

    days.push(
      <button
        key={dayStr}
        className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${
          isSelected ? 'selected' : ''
        } ${isTodayDay ? 'today' : ''} ${hasEntry ? 'has-entry' : ''}`}
        onClick={() => onSelectDate(format(currentDay, 'yyyy-MM-dd'))}
      >
        {dayNum}
      </button>
    );

    day = addDays(day, 1);
  }

  return (
    <div className="calendar-mini">
      <div className="calendar-header">
        <span className="calendar-month">
          {format(currentMonth, 'yyyy\uB144 M\uC6D4', { locale: ko })}
        </span>
        <div className="calendar-nav">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <i className="ri-arrow-left-s-line"></i>
          </button>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <i className="ri-arrow-right-s-line"></i>
          </button>
        </div>
      </div>

      <div className="calendar-weekdays">
        {weekdays.map((day) => (
          <span key={day} className="calendar-weekday">
            {day}
          </span>
        ))}
      </div>

      <div className="calendar-days">{days}</div>
    </div>
  );
};

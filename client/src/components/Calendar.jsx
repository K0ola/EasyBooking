import { useState, useMemo } from 'react';
import './Calendar.css';

export default function Calendar({ selectedDate, onDateSelect, minDate, bookedDates = new Set() }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      return new Date(selectedDate);
    }
    return new Date();
  });

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    // Get the day of week (0 = Sunday, 6 = Saturday)
    // We need to adjust so Monday = 0
    let firstDayOfWeek = firstDay.getDay() - 1;
    if (firstDayOfWeek < 0) firstDayOfWeek = 6;

    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];

    // Previous month days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        date: new Date(year, month - 1, daysInPrevMonth - i)
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(year, month, i)
      });
    }

    // Next month days to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i)
      });
    }

    return days;
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const isDateDisabled = (date) => {
    if (!minDate) return false;
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < min;
  };

  const isDateSelected = (date) => {
    if (!selectedDate) return false;
    const selected = new Date(selectedDate);
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isDateBooked = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return bookedDates.has(dateStr);
  };

  const handleDateClick = (date, isCurrentMonth) => {
    if (!isCurrentMonth || isDateDisabled(date)) return;

    // Format as YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onDateSelect(`${year}-${month}-${day}`);
  };

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button type="button" onClick={goToPreviousMonth} className="calendar-nav-btn">
          ‹
        </button>
        <div className="calendar-title">
          <span className="calendar-month">{monthNames[currentMonth.getMonth()]}</span>
          <span className="calendar-year">{currentMonth.getFullYear()}</span>
        </div>
        <button type="button" onClick={goToNextMonth} className="calendar-nav-btn">
          ›
        </button>
      </div>

      <button type="button" onClick={goToToday} className="calendar-today-btn">
        Aujourd'hui
      </button>

      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {dayNames.map((day) => (
            <div key={day} className="calendar-weekday">
              {day}
            </div>
          ))}
        </div>

        <div className="calendar-days">
          {daysInMonth.map((dayObj, index) => {
            const disabled = isDateDisabled(dayObj.date);
            const selected = isDateSelected(dayObj.date);
            const today = isToday(dayObj.date);
            const booked = isDateBooked(dayObj.date);

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleDateClick(dayObj.date, dayObj.isCurrentMonth)}
                disabled={disabled}
                className={`calendar-day ${
                  !dayObj.isCurrentMonth ? 'other-month' : ''
                } ${selected ? 'selected' : ''} ${today ? 'today' : ''} ${
                  disabled ? 'disabled' : ''
                } ${booked && dayObj.isCurrentMonth ? 'has-booking' : ''}`}
                title={booked && dayObj.isCurrentMonth ? 'Cette date a des réservations' : ''}
              >
                {dayObj.day}
                {booked && dayObj.isCurrentMonth && <span className="booking-indicator">●</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

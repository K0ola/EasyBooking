import { useState, useMemo } from 'react';
import './TimeSlotPicker.css';

export default function TimeSlotPicker({ startTime, endTime, onStartTimeChange, onEndTimeChange, selectedDate, existingBookings = [] }) {
  const [isSelectingStart, setIsSelectingStart] = useState(true);

  console.log('🕐 [TimeSlotPicker] Rendered with:', {
    selectedDate,
    bookingsCount: existingBookings.length,
    bookings: existingBookings
  });

  // Generate time slots from 8:00 to 20:00 in 30-minute intervals
  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 8; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        // Don't add 20:30 if hour is 20
        if (hour === 20 && minute > 0) break;

        const timeString = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    return slots;
  }, []);

  const handleTimeClick = (time) => {
    if (isSelectingStart) {
      onStartTimeChange(time);
      // Automatically switch to selecting end time
      setIsSelectingStart(false);

      // If end time is already set and is before the new start time, clear it
      if (endTime && endTime <= time) {
        onEndTimeChange('');
      }
    } else {
      // Only allow selecting end time if it's after start time
      if (startTime && time > startTime) {
        onEndTimeChange(time);
      }
    }
  };

  const isTimeDisabled = (time) => {
    // First check if the time slot is already booked
    if (isTimeBooked(time)) {
      return true;
    }

    if (isSelectingStart) {
      // When selecting start time, disable times that are after the end time
      if (endTime) {
        return time >= endTime;
      }
      return false;
    } else {
      // When selecting end time, disable times before or equal to start time
      if (startTime) {
        return time <= startTime;
      }
      return true; // Disable all if no start time
    }
  };

  const isTimeSelected = (time) => {
    if (isSelectingStart) {
      return time === startTime;
    } else {
      return time === endTime;
    }
  };

  const isTimeInRange = (time) => {
    if (startTime && endTime) {
      return time > startTime && time < endTime;
    }
    return false;
  };

  // Check if a time slot is already booked for the selected date
  const isTimeBooked = (time) => {
    if (!selectedDate || !existingBookings.length) {
      console.log(`❌ No date selected or no bookings`);
      return false;
    }

    // Parse the slot start and end times (each slot is 30 minutes)
    const slotStart = new Date(`${selectedDate}T${time}:00`);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    console.log(`🔍 Checking slot ${time} for date ${selectedDate}`);
    console.log(`   Slot range: ${slotStart.toISOString()} to ${slotEnd.toISOString()}`);

    const isBooked = existingBookings.some(booking => {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);

      // Get the date part only for comparison
      const bookingDateStr = bookingStart.toISOString().split('T')[0];

      console.log(`  📋 Comparing with booking:`, {
        bookingDate: bookingDateStr,
        selectedDate: selectedDate,
        bookingStart: bookingStart.toISOString(),
        bookingEnd: bookingEnd.toISOString()
      });

      // Only check bookings for the selected date
      if (bookingDateStr !== selectedDate) {
        console.log(`  ⏭️ Different date, skipping`);
        return false;
      }

      // Check if the slot overlaps with an existing booking
      // Two time ranges overlap if: slotStart < bookingEnd AND slotEnd > bookingStart
      const isOverlapping = slotStart < bookingEnd && slotEnd > bookingStart;

      if (isOverlapping) {
        console.log(`  ✅ SLOT ${time} OVERLAPS WITH BOOKING!`);
      } else {
        console.log(`  ⭕ Slot ${time} doesn't overlap`);
      }

      return isOverlapping;
    });

    console.log(`🎯 Final result for ${time}: ${isBooked ? 'BOOKED' : 'FREE'}`);
    return isBooked;
  };

  const formatTimeDisplay = (time) => {
    if (!time) return '--:--';
    return time;
  };

  const resetSelection = () => {
    onStartTimeChange('');
    onEndTimeChange('');
    setIsSelectingStart(true);
  };

  return (
    <div className="time-slot-picker">
      <div className="time-picker-header">
        <div className="time-display-container">
          <div
            className={`time-display ${isSelectingStart ? 'active' : ''}`}
            onClick={() => setIsSelectingStart(true)}
          >
            <span className="time-label">Début</span>
            <span className="time-value">{formatTimeDisplay(startTime)}</span>
          </div>

          <div className="time-separator">→</div>

          <div
            className={`time-display ${!isSelectingStart ? 'active' : ''}`}
            onClick={() => !isSelectingStart || startTime ? setIsSelectingStart(false) : null}
          >
            <span className="time-label">Fin</span>
            <span className="time-value">{formatTimeDisplay(endTime)}</span>
          </div>
        </div>

        {(startTime || endTime) && (
          <button
            type="button"
            onClick={resetSelection}
            className="reset-btn"
            title="Réinitialiser"
          >
            ✕
          </button>
        )}
      </div>

      <div className="time-selection-hint">
        {isSelectingStart
          ? "Sélectionnez l'heure de début"
          : "Sélectionnez l'heure de fin"}
      </div>

      <div className="time-slots-grid">
        {timeSlots.map((time) => {
          const disabled = isTimeDisabled(time);
          const selected = isTimeSelected(time);
          const inRange = isTimeInRange(time);
          const booked = isTimeBooked(time);

          return (
            <button
              key={time}
              type="button"
              onClick={() => !disabled && handleTimeClick(time)}
              disabled={disabled}
              className={`time-slot ${selected ? 'selected' : ''} ${
                inRange ? 'in-range' : ''
              } ${disabled ? 'disabled' : ''} ${booked ? 'booked' : ''}`}
              title={booked ? 'Ce créneau est déjà réservé' : ''}
            >
              {time}
              {booked && <span className="booked-mark">✕</span>}
            </button>
          );
        })}
      </div>

      <div className="time-picker-footer">
        <div className="time-legend">
          <div className="legend-item">
            <span className="legend-color selected"></span>
            <span>Sélectionné</span>
          </div>
          <div className="legend-item">
            <span className="legend-color in-range"></span>
            <span>Plage horaire</span>
          </div>
          <div className="legend-item">
            <span className="legend-color booked"></span>
            <span>Déjà réservé</span>
          </div>
        </div>
      </div>
    </div>
  );
}

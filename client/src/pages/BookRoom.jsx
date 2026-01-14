import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { roomsAPI, bookingsAPI } from '../lib/api';
import Calendar from '../components/Calendar';
import TimeSlotPicker from '../components/TimeSlotPicker';
import './BookRoom.css';

export default function BookRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
  });
  const [existingBookings, setExistingBookings] = useState([]);
  const [bookedDates, setBookedDates] = useState(new Set());

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const response = await roomsAPI.getById(roomId);
        if (response.error) {
          setError(response.error);
        } else {
          setRoom(response.room);
        }
      } catch (error) {
        setError('Erreur lors du chargement de la salle');
      } finally {
        setLoading(false);
      }
    };

    const fetchExistingBookings = async () => {
      try {
        const response = await bookingsAPI.getAll({ room_id: roomId });
        console.log('📋 [BookRoom] Fetched bookings:', response);
        if (response.bookings) {
          console.log('✅ [BookRoom] Number of bookings:', response.bookings.length);
          console.log('📅 [BookRoom] Bookings details:', response.bookings);
          setExistingBookings(response.bookings);

          // Extract unique dates that have bookings
          const dates = new Set();
          response.bookings.forEach(booking => {
            const date = new Date(booking.start_time);
            const dateStr = date.toISOString().split('T')[0];
            dates.add(dateStr);
            console.log('📆 [BookRoom] Added booked date:', dateStr);
          });
          setBookedDates(dates);
          console.log('🗓️ [BookRoom] All booked dates:', Array.from(dates));
        }
      } catch (error) {
        console.error('Error fetching existing bookings:', error);
      }
    };

    fetchRoom();
    fetchExistingBookings();
  }, [roomId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🎯 [BookRoom] Form submitted!');
    console.log('📝 [BookRoom] Form data:', formData);

    setError('');
    setSubmitting(true);

    // Validate all required fields
    if (!formData.date || !formData.startTime || !formData.endTime) {
      console.log('⚠️ [BookRoom] Validation error: missing fields');
      setError('Veuillez sélectionner une date et des horaires');
      setSubmitting(false);
      return;
    }

    // Validate times
    if (formData.startTime >= formData.endTime) {
      console.log('⚠️ [BookRoom] Validation error: end time before start time');
      setError("L'heure de fin doit être après l'heure de début");
      setSubmitting(false);
      return;
    }

    // Construct ISO datetime strings
    const startDateTime = new Date(`${formData.date}T${formData.startTime}:00`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}:00`);

    // Validate that the dates are valid
    if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
      console.log('⚠️ [BookRoom] Validation error: invalid date/time format');
      setError('Format de date ou heure invalide');
      setSubmitting(false);
      return;
    }

    const bookingData = {
      room_id: roomId,
      start_time: startDateTime.toISOString(),
      end_time: endDateTime.toISOString(),
    };

    console.log('📤 [BookRoom] Sending booking data:', bookingData);

    try {
      const response = await bookingsAPI.create(bookingData);

      if (response.error) {
        console.log('❌ [BookRoom] Response contains error:', response.error);
        setError(response.error);
        setSubmitting(false);
      } else {
        console.log('✅ [BookRoom] Booking successful!');
        setSuccess(true);
        setTimeout(() => {
          navigate('/my-bookings');
        }, 2000);
      }
    } catch (error) {
      console.error('❌ [BookRoom] Caught error:', error);
      setError('Erreur lors de la création de la réservation');
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!room) {
    return (
      <div className="book-room-page">
        <div className="error-page">
          <h2>Salle non trouvée</h2>
          <button onClick={() => navigate('/rooms')} className="btn btn-primary">
            Retour aux salles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="book-room-page">
      <div className="book-container">
        <button onClick={() => navigate('/rooms')} className="back-button">
          ← Retour aux salles
        </button>

        <div className="book-content">
          <div className="room-summary">
            <h1>Réserver: {room.name}</h1>
            <p>{room.description}</p>
            <div className="room-info-box">
              <p>
                <strong>Capacité:</strong> {room.capacity} personnes
              </p>
              {room.equipment && room.equipment.length > 0 && (
                <div>
                  <strong>Équipements:</strong>
                  <ul>
                    {room.equipment.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="booking-form-container">
            <h2>Détails de la réservation</h2>

            {error && <div className="error-message">{error}</div>}
            {success && (
              <div className="success-message">
                Réservation créée avec succès! Redirection...
              </div>
            )}

            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-group">
                <label>Date *</label>
                <Calendar
                  selectedDate={formData.date}
                  onDateSelect={(date) => setFormData((prev) => ({ ...prev, date, startTime: '', endTime: '' }))}
                  minDate={new Date().toISOString().split('T')[0]}
                  bookedDates={bookedDates}
                />
              </div>

              <div className="form-group">
                <label>Créneaux horaires *</label>
                <TimeSlotPicker
                  startTime={formData.startTime}
                  endTime={formData.endTime}
                  onStartTimeChange={(time) => setFormData((prev) => ({ ...prev, startTime: time }))}
                  onEndTimeChange={(time) => setFormData((prev) => ({ ...prev, endTime: time }))}
                  selectedDate={formData.date}
                  existingBookings={existingBookings}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={submitting || success || !formData.date || !formData.startTime || !formData.endTime}
              >
                {submitting ? 'Réservation...' : 'Confirmer la réservation'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

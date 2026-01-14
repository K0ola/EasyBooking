import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import './MyBookings.css';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyBookings();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const response = await bookingsAPI.getMyBookings();
      if (response.error) {
        setError(response.error);
      } else {
        setBookings(response.bookings || []);
      }
    } catch (error) {
      setError('Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      return;
    }

    try {
      const response = await bookingsAPI.cancel(bookingId);
      if (response.error) {
        alert('Erreur: ' + response.error);
      } else {
        // Remove the booking from the list
        setBookings(bookings.filter((b) => b.id !== bookingId));
      }
    } catch (error) {
      alert('Erreur lors de l\'annulation de la réservation');
    }
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = (dateString) => {
    return new Date(dateString) > new Date();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="loading">Chargement de vos réservations...</div>;
  }

  return (
    <div className="my-bookings-page">
      <header className="bookings-header">
        <div className="header-content">
          <h1>EasyBooking</h1>
          <div className="header-actions">
            <button onClick={() => navigate('/rooms')} className="btn btn-secondary">
              Voir les salles
            </button>
            <span className="user-email">{user?.email}</span>
            <button onClick={handleLogout} className="btn btn-outline">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="bookings-container">
        <div className="bookings-content">
          <h2>Mes réservations</h2>

          {error && <div className="error-message">{error}</div>}

          {bookings.length === 0 && !error && (
            <div className="no-bookings">
              <p>Vous n'avez aucune réservation.</p>
              <button onClick={() => navigate('/rooms')} className="btn btn-primary">
                Réserver une salle
              </button>
            </div>
          )}

          <div className="bookings-list">
            {bookings.map((booking) => {
              const upcoming = isUpcoming(booking.start_time);
              return (
                <div
                  key={booking.id}
                  className={`booking-card ${!upcoming ? 'past' : ''}`}
                >
                  <div className="booking-header">
                    <div>
                      <h3>{booking.title}</h3>
                      <p className="booking-room">{booking.rooms?.name}</p>
                    </div>
                    {upcoming && (
                      <span className="badge badge-upcoming">À venir</span>
                    )}
                    {!upcoming && (
                      <span className="badge badge-past">Passée</span>
                    )}
                  </div>

                  <div className="booking-details">
                    <div className="booking-info">
                      <div className="info-item">
                        <strong>Date:</strong> {formatDate(booking.start_time)}
                      </div>
                      <div className="info-item">
                        <strong>Horaire:</strong> {formatTime(booking.start_time)} -{' '}
                        {formatTime(booking.end_time)}
                      </div>
                      {booking.description && (
                        <div className="info-item">
                          <strong>Description:</strong> {booking.description}
                        </div>
                      )}
                      {booking.rooms?.capacity && (
                        <div className="info-item">
                          <strong>Capacité:</strong> {booking.rooms.capacity} personnes
                        </div>
                      )}
                    </div>
                  </div>

                  {upcoming && (
                    <div className="booking-actions">
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="btn btn-danger"
                      >
                        Annuler la réservation
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

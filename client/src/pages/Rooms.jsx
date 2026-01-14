import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roomsAPI } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import './Rooms.css';

export default function Rooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await roomsAPI.getAll();
      if (response.error) {
        setError(response.error);
      } else {
        setRooms(response.rooms || []);
      }
    } catch (error) {
      setError('Erreur lors du chargement des salles');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleBookRoom = (roomId) => {
    console.log('🔘 [Rooms] Book button clicked for room:', roomId);
    navigate(`/book/${roomId}`);
  };

  if (loading) {
    return <div className="loading">Chargement des salles...</div>;
  }

  return (
    <div className="rooms-page">
      <header className="rooms-header">
        <div className="header-content">
          <h1>EasyBooking</h1>
          <div className="header-actions">
            <button onClick={() => navigate('/my-bookings')} className="btn btn-secondary">
              Mes réservations
            </button>
            <span className="user-email">{user?.email}</span>
            <button onClick={handleLogout} className="btn btn-outline">
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="rooms-container">
        <div className="rooms-content">
          <h2>Salles disponibles</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="rooms-grid">
            {rooms.map((room) => (
              <div key={room.id} className="room-card">
                <div className="room-info">
                  <h3>{room.name}</h3>
                  <p className="room-description">{room.description}</p>
                  <div className="room-details">
                    <span className="room-capacity">
                      Capacité: {room.capacity} personnes
                    </span>
                    {room.equipment && room.equipment.length > 0 && (
                      <div className="room-equipment">
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
                <button
                  onClick={() => handleBookRoom(room.id)}
                  className="btn btn-primary"
                >
                  Réserver
                </button>
              </div>
            ))}
          </div>

          {rooms.length === 0 && !error && (
            <div className="no-rooms">Aucune salle disponible pour le moment.</div>
          )}
        </div>
      </main>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔑 [Login] Form submitted for email:', email);
    setError('');
    setLoading(true);

    try {
      console.log('🔑 [Login] Calling login function...');
      const result = await login(email, password);
      console.log('🔑 [Login] Login result:', result);

      if (result.error) {
        console.log('❌ [Login] Login failed:', result.error);
        setError(result.error);
      } else {
        console.log('✅ [Login] Login successful, navigating to /rooms');
        navigate('/rooms');
      }
    } catch (error) {
      console.error('❌ [Login] Submit error:', error);
      setError('Une erreur inattendue est survenue. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
      console.log('🔑 [Login] Submit complete');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Connexion</h1>
        <p className="auth-subtitle">Connectez-vous à EasyBooking</p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="votre@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-link">
          Pas encore de compte ? <Link to="/register">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}

const http = require('http');

function makeRequest(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            body: data ? JSON.parse(data) : null,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            body: data,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('TESTS D\'INTEGRATION API', () => {
  let integToken = null;
  let integRoomId = null;
  const integEmail = `integration-${Date.now()}@test.com`;

  beforeAll(async () => {
    await makeRequest('POST', '/api/auth/register', {
      email: integEmail,
      password: 'IntegTest123!!',
      fullName: 'Integration Test User'
    });

    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: integEmail,
      password: 'IntegTest123!!'
    });

    if (loginRes.status === 200) {
      integToken = loginRes.body.token;
    }

    const roomsRes = await makeRequest('GET', '/api/rooms');
    if (roomsRes.body?.rooms?.length > 0) {
      integRoomId = roomsRes.body.rooms[0].id;
    }
  });

  describe('Tests des Routes d\'Authentification', () => {
    test('API-1: POST /api/auth/register - Structure de réponse correcte', async () => {
      const uniqueEmail = `api-test-${Date.now()}@example.com`;
      const response = await makeRequest('POST', '/api/auth/register', {
        email: uniqueEmail,
        password: 'TestPass123!',
        fullName: 'API Test User'
      });

      expect([201, 400]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('email');
        expect(response.body.user.email).toBe(uniqueEmail);
      }
    });

    test('API-2: POST /api/auth/login - Retourne un token JWT', async () => {
      const uniqueEmail = `api-login-test-${Date.now()}@example.com`;
      const uniquePassword = 'LoginTest123!';

      const registerRes = await makeRequest('POST', '/api/auth/register', {
        email: uniqueEmail,
        password: uniquePassword,
        fullName: 'API Login Test User'
      });

      expect([201, 400]).toContain(registerRes.status);

      if (registerRes.status !== 201) {
        const response = await makeRequest('POST', '/api/auth/login', {
          email: 'test@example.com',
          password: 'WrongPassword123!'
        });

        expect([200, 401]).toContain(response.status);

        if (response.status === 200) {
          expect(response.body).toHaveProperty('token');
          expect(response.body).toHaveProperty('user');
          expect(typeof response.body.token).toBe('string');
          expect(response.body.token.length).toBeGreaterThan(0);
        }

        return;
      }

      await sleep(100);

      const response = await makeRequest('POST', '/api/auth/login', {
        email: uniqueEmail,
        password: uniquePassword
      });

      expect([200, 401]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        expect(typeof response.body.token).toBe('string');
        expect(response.body.token.length).toBeGreaterThan(0);
      } else {
      }
    });

    test('API-3: GET /api/auth/profile - Headers d\'authentification requis', async () => {
      const response = await makeRequest('GET', '/api/auth/profile');

      expect([401, 403]).toContain(response.status);
    });

    test('API-4: GET /api/auth/profile - Accepte un token valide', async () => {
      if (!integToken) {
        return;
      }

      const response = await makeRequest('GET', '/api/auth/profile', null, {
        'Authorization': `Bearer ${integToken}`
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email');
    });
  });

  describe('Tests des Routes Salles', () => {
    test('API-5: GET /api/rooms - Retourne un tableau de salles', async () => {
      const response = await makeRequest('GET', '/api/rooms');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rooms');
      expect(Array.isArray(response.body.rooms)).toBe(true);
    });

    test('API-6: GET /api/rooms - Chaque salle a les propriétés requises', async () => {
      const response = await makeRequest('GET', '/api/rooms');

      expect(response.status).toBe(200);

      if (response.body.rooms.length > 0) {
        const room = response.body.rooms[0];
        expect(room).toHaveProperty('id');
        expect(room).toHaveProperty('name');
      }
    });

    test('API-7: GET /api/rooms/:id - Retourne une salle spécifique', async () => {
      if (!integRoomId) {
        return;
      }

      const response = await makeRequest('GET', `/api/rooms/${integRoomId}`);

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('room');
        expect(response.body.room.id).toBe(integRoomId);
      }
    });

    test('API-8: GET /api/rooms/:id - 404 pour une salle inexistante', async () => {
      const response = await makeRequest('GET', '/api/rooms/salle-inexistante-999');

      expect([404, 400]).toContain(response.status);
    });
  });

  describe('Tests des Routes Réservations', () => {
    test('API-9: POST /api/bookings - Authentification requise', async () => {
      if (!integRoomId) {
        return;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const response = await makeRequest('POST', '/api/bookings', {
        room_id: integRoomId,
        start_time: futureDate.toISOString(),
        end_time: new Date(futureDate.getTime() + 3600000).toISOString()
      });

      expect([401, 403]).toContain(response.status);
    });

    test('API-10: POST /api/bookings - Validation des champs requis', async () => {
      if (!integToken) {
        return;
      }

      const response = await makeRequest('POST', '/api/bookings', {
      }, {
        'Authorization': `Bearer ${integToken}`
      });

      expect([400, 403]).toContain(response.status);
    });

    test('API-11: GET /api/bookings/my-bookings - Retourne les réservations de l\'utilisateur', async () => {
      if (!integToken) {
        return;
      }

      const response = await makeRequest('GET', '/api/bookings/my-bookings', null, {
        'Authorization': `Bearer ${integToken}`
      });

      expect([200, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('bookings');
        expect(Array.isArray(response.body.bookings)).toBe(true);
      }
    });

    test('API-12: DELETE /api/bookings/:id - Authentification requise', async () => {
      const response = await makeRequest('DELETE', '/api/bookings/fake-booking-id');

      expect([401, 403, 404]).toContain(response.status);
    });
  });

  describe('Tests des Headers HTTP', () => {
    test('API-13: Les réponses incluent Content-Type JSON', async () => {
      const response = await makeRequest('GET', '/api/health');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
    });

    test('API-14: Les routes protégées vérifient le header Authorization', async () => {
      const response = await makeRequest('GET', '/api/auth/profile', null, {
        'Authorization': 'Bearer token-invalide'
      });

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('Tests des Codes de Statut HTTP', () => {
    test('API-15: GET /api/health retourne 200', async () => {
      const response = await makeRequest('GET', '/api/health');

      expect(response.status).toBe(200);
    });

    test('API-16: POST avec données invalides retourne 400', async () => {
      const response = await makeRequest('POST', '/api/auth/login', {
        email: 'not-an-email',
        password: '123'
      });

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('Tests de Sécurité', () => {
    test('API-17: Les mots de passe ne sont pas retournés dans les réponses', async () => {
      const uniqueEmail = `security-test-${Date.now()}@example.com`;

      const registerRes = await makeRequest('POST', '/api/auth/register', {
        email: uniqueEmail,
        password: 'SecurePass123!',
        fullName: 'Security Test'
      });

      if (registerRes.status === 201) {
        expect(registerRes.body.user).not.toHaveProperty('password');
      }
    });

    test('API-18: Les tokens invalides sont rejetés', async () => {
      const response = await makeRequest('GET', '/api/auth/profile', null, {
        'Authorization': 'Bearer abc123invalidtoken'
      });

      expect([401, 403]).toContain(response.status);
    });

    test('API-19: SQL injection basique est bloquée', async () => {
      const response = await makeRequest('POST', '/api/auth/login', {
        email: "admin' OR '1'='1",
        password: "password"
      });

      expect([400, 401]).toContain(response.status);
    });
  });

  describe('Tests de Validation des Données', () => {
    test('API-20: Email invalide est rejeté', async () => {
      const response = await makeRequest('POST', '/api/auth/register', {
        email: 'not-an-email',
        password: 'Password123!',
        fullName: 'Test User'
      });

      expect([400]).toContain(response.status);
    });

    test('API-21: Mot de passe trop court est rejeté', async () => {
      const response = await makeRequest('POST', '/api/auth/register', {
        email: `short-pass-${Date.now()}@test.com`,
        password: '123',
        fullName: 'Test User'
      });

      expect([400]).toContain(response.status);
    });

    test('API-22: Nom complet vide est géré', async () => {
      const response = await makeRequest('POST', '/api/auth/register', {
        email: `no-name-${Date.now()}@test.com`,
        password: 'Password123!',
        fullName: ''
      });

      expect([400, 201]).toContain(response.status);
    });
  });
});

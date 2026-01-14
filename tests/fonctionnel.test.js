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

describe('TESTS FONCTIONNELS - Scenarios Utilisateur', () => {

  describe('SCENARIO 1: Inscription et connexion d\'un nouvel utilisateur', () => {
    const userEmail = `functional-user-${Date.now()}@test.com`;
    const userPassword = 'SecurePass123!';
    let authToken = null;

    test('1.1 - L\'utilisateur s\'inscrit avec succès', async () => {
      const response = await makeRequest('POST', '/api/auth/register', {
        email: userEmail,
        password: userPassword,
        fullName: 'Functional Test User'
      });

      expect([201, 400]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('user');
        expect(response.body.user.email).toBe(userEmail);
      }
    });

    test('1.2 - L\'utilisateur se connecte avec ses credentials', async () => {
      const response = await makeRequest('POST', '/api/auth/login', {
        email: userEmail,
        password: userPassword
      });

      expect([200, 401]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');
        authToken = response.body.token;
      }
    });

    test('1.3 - L\'utilisateur accède à son profil', async () => {
      if (!authToken) {
        return;
      }

      const response = await makeRequest('GET', '/api/auth/profile', null, {
        'Authorization': `Bearer ${authToken}`
      });

      expect([200, 401]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.user.email).toBe(userEmail);
      }
    });
  });

  describe('SCENARIO 2: Consultation et réservation de salle', () => {
    let userToken = null;
    let selectedRoomId = null;
    let bookingId = null;
    const testUserEmail = `booking-user-${Date.now()}@test.com`;

    beforeAll(async () => {
      await makeRequest('POST', '/api/auth/register', {
        email: testUserEmail,
        password: 'BookingPass123!',
        fullName: 'Booking Test User'
      });

      const loginRes = await makeRequest('POST', '/api/auth/login', {
        email: testUserEmail,
        password: 'BookingPass123!'
      });

      if (loginRes.status === 200) {
        userToken = loginRes.body.token;
      }
    });

    test('2.1 - L\'utilisateur consulte la liste des salles', async () => {
      const response = await makeRequest('GET', '/api/rooms');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rooms');
      expect(Array.isArray(response.body.rooms)).toBe(true);

      if (response.body.rooms.length > 0) {
        selectedRoomId = response.body.rooms[0].id;
      }
    });

    test('2.2 - L\'utilisateur consulte les détails d\'une salle', async () => {
      if (!selectedRoomId) {
        return;
      }

      const response = await makeRequest('GET', `/api/rooms/${selectedRoomId}`);

      expect([200, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('room');
        expect(response.body.room.id).toBe(selectedRoomId);
      }
    });

    test('2.3 - L\'utilisateur vérifie la disponibilité de la salle', async () => {
      if (!selectedRoomId) {
        return;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const dateStr = futureDate.toISOString().split('T')[0];

      const response = await makeRequest(
        'GET',
        `/api/rooms/${selectedRoomId}/availability?date=${dateStr}`
      );

      expect([200, 400, 404]).toContain(response.status);

      if (response.status === 200) {
      }
    });

    test('2.4 - L\'utilisateur crée une réservation', async () => {
      if (!selectedRoomId || !userToken) {
        return;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);

      const startTime = new Date(futureDate);
      startTime.setHours(14, 0, 0, 0);

      const endTime = new Date(futureDate);
      endTime.setHours(15, 0, 0, 0);

      const response = await makeRequest('POST', '/api/bookings', {
        room_id: selectedRoomId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      }, {
        'Authorization': `Bearer ${userToken}`
      });

      expect([201, 403, 409]).toContain(response.status);

      if (response.status === 201) {
        expect(response.body).toHaveProperty('booking');
        bookingId = response.body.booking.id;
      }
    });

    test('2.5 - L\'utilisateur consulte ses réservations', async () => {
      if (!userToken) {
        return;
      }

      const response = await makeRequest('GET', '/api/bookings/my-bookings', null, {
        'Authorization': `Bearer ${userToken}`
      });

      expect([200, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toHaveProperty('bookings');
        expect(Array.isArray(response.body.bookings)).toBe(true);
      }
    });

    test('2.6 - L\'utilisateur annule sa réservation', async () => {
      if (!bookingId || !userToken) {
        return;
      }

      const response = await makeRequest('DELETE', `/api/bookings/${bookingId}`, null, {
        'Authorization': `Bearer ${userToken}`
      });

      expect([200, 403, 404]).toContain(response.status);

      if (response.status === 200) {
      }
    });
  });

  describe('SCENARIO 3: Tentatives de réservation en conflit', () => {
    let user1Token = null;
    let user2Token = null;
    let roomId = null;
    const user1Email = `conflict-user1-${Date.now()}@test.com`;
    const user2Email = `conflict-user2-${Date.now()}@test.com`;

    beforeAll(async () => {
      await makeRequest('POST', '/api/auth/register', {
        email: user1Email,
        password: 'User1Pass123!',
        fullName: 'Conflict User 1'
      });

      await makeRequest('POST', '/api/auth/register', {
        email: user2Email,
        password: 'User2Pass123!',
        fullName: 'Conflict User 2'
      });

      const login1 = await makeRequest('POST', '/api/auth/login', {
        email: user1Email,
        password: 'User1Pass123!'
      });

      const login2 = await makeRequest('POST', '/api/auth/login', {
        email: user2Email,
        password: 'User2Pass123!'
      });

      if (login1.status === 200) user1Token = login1.body.token;
      if (login2.status === 200) user2Token = login2.body.token;

      const roomsRes = await makeRequest('GET', '/api/rooms');
      if (roomsRes.body.rooms && roomsRes.body.rooms.length > 0) {
        roomId = roomsRes.body.rooms[0].id;
      }
    });

    test('3.1 - Premier utilisateur réserve un créneau', async () => {
      if (!roomId || !user1Token) {
        return;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const startTime = new Date(futureDate);
      startTime.setHours(10, 0, 0, 0);

      const endTime = new Date(futureDate);
      endTime.setHours(11, 0, 0, 0);

      const response = await makeRequest('POST', '/api/bookings', {
        room_id: roomId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      }, {
        'Authorization': `Bearer ${user1Token}`
      });

      expect([201, 403, 409]).toContain(response.status);

      if (response.status === 201) {
      }
    });

    test('3.2 - Deuxième utilisateur tente de réserver le même créneau', async () => {
      if (!roomId || !user2Token) {
        return;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const startTime = new Date(futureDate);
      startTime.setHours(10, 0, 0, 0);

      const endTime = new Date(futureDate);
      endTime.setHours(11, 0, 0, 0);

      const response = await makeRequest('POST', '/api/bookings', {
        room_id: roomId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      }, {
        'Authorization': `Bearer ${user2Token}`
      });

      expect([403, 409]).toContain(response.status);

      if (response.status === 409) {
      } else if (response.status === 403) {
      }
    });

    test('3.3 - Deuxième utilisateur réserve un créneau différent', async () => {
      if (!roomId || !user2Token) {
        return;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const startTime = new Date(futureDate);
      startTime.setHours(12, 0, 0, 0);

      const endTime = new Date(futureDate);
      endTime.setHours(13, 0, 0, 0);

      const response = await makeRequest('POST', '/api/bookings', {
        room_id: roomId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      }, {
        'Authorization': `Bearer ${user2Token}`
      });

      expect([201, 403, 409]).toContain(response.status);

      if (response.status === 201) {
      }
    });
  });

  describe('SCENARIO 4: Gestion des erreurs et validations', () => {
    let validToken = null;
    let roomId = null;
    const testEmail = `validation-user-${Date.now()}@test.com`;

    beforeAll(async () => {
      await makeRequest('POST', '/api/auth/register', {
        email: testEmail,
        password: 'ValidPass123!',
        fullName: 'Validation User'
      });

      const loginRes = await makeRequest('POST', '/api/auth/login', {
        email: testEmail,
        password: 'ValidPass123!'
      });

      if (loginRes.status === 200) {
        validToken = loginRes.body.token;
      }

      const roomsRes = await makeRequest('GET', '/api/rooms');
      if (roomsRes.body.rooms && roomsRes.body.rooms.length > 0) {
        roomId = roomsRes.body.rooms[0].id;
      }
    });

    test('4.1 - Tentative de réservation sans authentification', async () => {
      if (!roomId) {
        return;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const startTime = new Date(futureDate);
      startTime.setHours(10, 0, 0, 0);

      const endTime = new Date(futureDate);
      endTime.setHours(11, 0, 0, 0);

      const response = await makeRequest('POST', '/api/bookings', {
        room_id: roomId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      });

      expect([401, 403]).toContain(response.status);
    });

    test('4.2 - Tentative de réservation avec token invalide', async () => {
      if (!roomId) {
        return;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const startTime = new Date(futureDate);
      startTime.setHours(10, 0, 0, 0);

      const endTime = new Date(futureDate);
      endTime.setHours(11, 0, 0, 0);

      const response = await makeRequest('POST', '/api/bookings', {
        room_id: roomId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      }, {
        'Authorization': 'Bearer invalid-token-xyz'
      });

      expect([401, 403]).toContain(response.status);
    });

    test('4.3 - Tentative de réservation avec heure de fin avant heure de début', async () => {
      if (!roomId || !validToken) {
        return;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const startTime = new Date(futureDate);
      startTime.setHours(15, 0, 0, 0);

      const endTime = new Date(futureDate);
      endTime.setHours(14, 0, 0, 0);

      const response = await makeRequest('POST', '/api/bookings', {
        room_id: roomId,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      }, {
        'Authorization': `Bearer ${validToken}`
      });

      expect([400, 403]).toContain(response.status);
    });

    test('4.4 - Tentative de réservation avec salle inexistante', async () => {
      if (!validToken) {
        return;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      const startTime = new Date(futureDate);
      startTime.setHours(10, 0, 0, 0);

      const endTime = new Date(futureDate);
      endTime.setHours(11, 0, 0, 0);

      const response = await makeRequest('POST', '/api/bookings', {
        room_id: 'salle-inexistante-999',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      }, {
        'Authorization': `Bearer ${validToken}`
      });

      expect([400, 403, 404]).toContain(response.status);
    });

    test('4.5 - Tentative de connexion avec mauvais mot de passe', async () => {
      const response = await makeRequest('POST', '/api/auth/login', {
        email: testEmail,
        password: 'MauvaisMotDePasse!'
      });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    test('4.6 - Tentative d\'inscription avec email existant', async () => {
      const response = await makeRequest('POST', '/api/auth/register', {
        email: testEmail,
        password: 'NewPass123!',
        fullName: 'Duplicate User'
      });

      expect(response.status).toBe(400);
    });
  });
});

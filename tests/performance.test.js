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

describe('TESTS DE PERFORMANCE', () => {
  let perfToken = null;
  let perfRoomId = null;
  const perfEmail = `perf-user-${Date.now()}@test.com`;

  beforeAll(async () => {
    await makeRequest('POST', '/api/auth/register', {
      email: perfEmail,
      password: 'PerfTest123!',
      fullName: 'Performance Test User'
    });

    const loginRes = await makeRequest('POST', '/api/auth/login', {
      email: perfEmail,
      password: 'PerfTest123!'
    });

    if (loginRes.status === 200) {
      perfToken = loginRes.body.token;
    }

    const roomsRes = await makeRequest('GET', '/api/rooms');
    if (roomsRes.body?.rooms?.length > 0) {
      perfRoomId = roomsRes.body.rooms[0].id;
    }
  });

  describe('Temps de Réponse des Endpoints', () => {
    test('PERF-1: Health check répond en moins de 100ms', async () => {
      const startTime = Date.now();
      const response = await makeRequest('GET', '/api/health');
      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(100);
    });

    test('PERF-2: Liste des salles répond en moins de 500ms', async () => {
      const startTime = Date.now();
      const response = await makeRequest('GET', '/api/rooms');
      const responseTime = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(500);
    });

    test('PERF-3: Connexion utilisateur répond en moins de 1000ms', async () => {
      const startTime = Date.now();
      const response = await makeRequest('POST', '/api/auth/login', {
        email: perfEmail,
        password: 'PerfTest123!'
      });
      const responseTime = Date.now() - startTime;

      expect([200, 401]).toContain(response.status);
      expect(responseTime).toBeLessThan(1000);
    });

    test('PERF-4: Détails d\'une salle répondent en moins de 500ms', async () => {
      if (!perfRoomId) {
        return;
      }

      const startTime = Date.now();
      const response = await makeRequest('GET', `/api/rooms/${perfRoomId}`);
      const responseTime = Date.now() - startTime;

      expect([200, 404]).toContain(response.status);
      expect(responseTime).toBeLessThan(500);
    });
  });

  describe('Tests de Charge Séquentielle', () => {
    test('PERF-5: 10 requêtes consécutives au health check', async () => {
      const times = [];

      for (let i = 0; i < 10; i++) {
        const startTime = Date.now();
        const response = await makeRequest('GET', '/api/health');
        const responseTime = Date.now() - startTime;

        expect(response.status).toBe(200);
        times.push(responseTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(avgTime).toBeLessThan(100);
      expect(maxTime).toBeLessThan(200);

    });

    test('PERF-6: 5 requêtes consécutives à la liste des salles', async () => {
      const times = [];

      for (let i = 0; i < 5; i++) {
        const startTime = Date.now();
        const response = await makeRequest('GET', '/api/rooms');
        const responseTime = Date.now() - startTime;

        expect(response.status).toBe(200);
        times.push(responseTime);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      expect(avgTime).toBeLessThan(500);
      expect(maxTime).toBeLessThan(1000);

    });
  });

  describe('Tests de Charge Parallèle', () => {
    test('PERF-7: 10 requêtes parallèles au health check', async () => {
      const startTime = Date.now();

      const promises = Array(10).fill(null).map(() =>
        makeRequest('GET', '/api/health')
      );

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(totalTime).toBeLessThan(500);
    });

    test('PERF-8: 5 requêtes parallèles à la liste des salles', async () => {
      const startTime = Date.now();

      const promises = Array(5).fill(null).map(() =>
        makeRequest('GET', '/api/rooms')
      );

      const responses = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });

      expect(totalTime).toBeLessThan(1500);
    });
  });

  describe('Tests de Stabilité', () => {
    test('PERF-9: Le serveur reste stable après plusieurs requêtes', async () => {
      for (let i = 0; i < 5; i++) {
        await makeRequest('GET', '/api/health');
        await makeRequest('GET', '/api/rooms');
        if (perfRoomId) {
          await makeRequest('GET', `/api/rooms/${perfRoomId}`);
        }
      }

      const response = await makeRequest('GET', '/api/health');
      expect(response.status).toBe(200);
    });

    test('PERF-10: Temps de réponse cohérent sous charge légère', async () => {
      const times = [];

      for (let i = 0; i < 20; i++) {
        const startTime = Date.now();
        await makeRequest('GET', '/api/health');
        times.push(Date.now() - startTime);
        await sleep(50);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);
      const minTime = Math.min(...times);
      const variance = maxTime - minTime;

      expect(variance).toBeLessThan(150);
    });
  });

  describe('Tests de Concurrence', () => {
    test('PERF-11: Création de multiples réservations simultanées', async () => {
      if (!perfRoomId || !perfToken) {
        return;
      }

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 20);

      const promises = [1, 2, 3].map(i => {
        const startTime = new Date(futureDate);
        startTime.setHours(8 + i, 0, 0, 0);
        const endTime = new Date(futureDate);
        endTime.setHours(9 + i, 0, 0, 0);

        return makeRequest('POST', '/api/bookings', {
          room_id: perfRoomId,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString()
        }, {
          'Authorization': `Bearer ${perfToken}`
        });
      });

      const responses = await Promise.all(promises);

      responses.forEach(response => {
        expect([201, 403, 409]).toContain(response.status);
      });

    });
  });
});

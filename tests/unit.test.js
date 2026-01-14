const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-key-for-unit-tests';

const { generateToken, authenticateToken } = require('../server/utils/auth');

describe('TESTS UNITAIRES', () => {

  describe('Module Auth - generateToken()', () => {
    const mockUser = {
      id: 'test-user-id-123',
      email: 'test@example.com'
    };

    test('UNIT-1: generateToken() retourne une chaîne non vide', () => {
      const token = generateToken(mockUser);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });

    test('UNIT-2: generateToken() crée un JWT valide (3 parties)', () => {
      const token = generateToken(mockUser);

      expect(token.split('.')).toHaveLength(3);
    });

    test('UNIT-3: Token contient l\'ID utilisateur', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.id).toBe(mockUser.id);
    });

    test('UNIT-4: Token contient l\'email utilisateur', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.email).toBe(mockUser.email);
    });

    test('UNIT-5: Token a une date d\'expiration', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      expect(decoded.exp).toBeDefined();
      expect(typeof decoded.exp).toBe('number');
    });

    test('UNIT-6: Token expire après 7 jours', () => {
      const token = generateToken(mockUser);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const expirationDate = new Date(decoded.exp * 1000);
      const creationDate = new Date(decoded.iat * 1000);
      const daysDifference = (expirationDate - creationDate) / (1000 * 60 * 60 * 24);

      expect(daysDifference).toBeCloseTo(7, 0);
    });

    test('UNIT-7: Token invalide est rejeté par jwt.verify()', () => {
      const invalidToken = 'invalid.token.here';

      expect(() => {
        jwt.verify(invalidToken, process.env.JWT_SECRET);
      }).toThrow();
    });

    test('UNIT-8: Token avec mauvaise signature est rejeté', () => {
      const token = jwt.sign(
        { id: mockUser.id, email: mockUser.email },
        'wrong-secret-key',
        { expiresIn: '7d' }
      );

      expect(() => {
        jwt.verify(token, process.env.JWT_SECRET);
      }).toThrow('invalid signature');
    });

    test('UNIT-9: Token expiré est rejeté', () => {
      const expiredToken = jwt.sign(
        { id: mockUser.id, email: mockUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );

      expect(() => {
        jwt.verify(expiredToken, process.env.JWT_SECRET);
      }).toThrow();
    });
  });

  describe('Module Auth - authenticateToken() middleware', () => {
    const mockUser = {
      id: 'middleware-test-id',
      email: 'middleware@test.com'
    };

    test('UNIT-10: authenticateToken() rejette requête sans header Authorization', () => {
      const mockReq = {
        headers: {}
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('UNIT-11: authenticateToken() rejette token invalide', () => {
      const mockReq = {
        headers: {
          authorization: 'Bearer invalid.token.here'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('UNIT-12: authenticateToken() accepte token valide et appelle next()', () => {
      const validToken = generateToken(mockUser);
      const mockReq = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user.id).toBe(mockUser.id);
      expect(mockReq.user.email).toBe(mockUser.email);
    });

    test('UNIT-13: authenticateToken() attache les données utilisateur à req.user', () => {
      const validToken = generateToken(mockUser);
      const mockReq = {
        headers: {
          authorization: `Bearer ${validToken}`
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockReq.user).toHaveProperty('id');
      expect(mockReq.user).toHaveProperty('email');
    });

    test('UNIT-14: authenticateToken() rejette token expiré', () => {
      const expiredToken = jwt.sign(
        { id: mockUser.id, email: mockUser.email },
        process.env.JWT_SECRET,
        { expiresIn: '-1s' }
      );
      const mockReq = {
        headers: {
          authorization: `Bearer ${expiredToken}`
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });

    test('UNIT-15: authenticateToken() gère Authorization header sans Bearer', () => {
      const mockReq = {
        headers: {
          authorization: 'some-token-without-bearer'
        }
      };
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const mockNext = jest.fn();

      authenticateToken(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Access token required' });
    });
  });
});

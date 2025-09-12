const request = require('supertest');
const app = require('./index');

describe('User Service API', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);
      
      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('service', 'User Service');
      expect(response.body).toHaveProperty('port', 4011);
    });
  });

  describe('GET /users/:role', () => {
    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .get('/users/invalid')
        .expect(400);
      
      expect(response.body).toHaveProperty('error', 'Invalid role');
      expect(response.body).toHaveProperty('validRoles');
    });

    it('should accept valid roles', async () => {
      const validRoles = ['support', 'driver', 'guide', 'tourist'];
      
      for (const role of validRoles) {
        const response = await request(app)
          .get(`/users/${role}`);
        
        // Should not return 400 (bad request)
        expect(response.status).not.toBe(400);
        
        if (response.status === 200) {
          expect(response.body).toHaveProperty('success', true);
          expect(response.body).toHaveProperty('role', role);
          expect(response.body).toHaveProperty('data');
          expect(Array.isArray(response.body.data)).toBe(true);
        }
      }
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 for invalid routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect(404);
      
      expect(response.body).toHaveProperty('error', 'Not Found');
      expect(response.body).toHaveProperty('availableEndpoints');
    });
  });
});

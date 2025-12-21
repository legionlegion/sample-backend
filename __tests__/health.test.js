import request from 'supertest';
import app from '../server.js';

describe('Backend Health Check', () => {
  test('GET / should return success message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toBe('DBS App API is running');
  });

  test('GET /api/auth should return 404 for undefined route', async () => {
    const response = await request(app).get('/api/auth');
    expect(response.status).toBe(404);
  });
});


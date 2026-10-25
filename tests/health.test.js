const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
    it('should return a successful health response', async () => {
        const response = await request(app).get('/api/health');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('ApplyFlow API is running');
        expect(response.body.timestamp).toBeDefined();
        expect(Number.isNaN(Date.parse(response.body.timestamp))).toBe(false);
    });
});
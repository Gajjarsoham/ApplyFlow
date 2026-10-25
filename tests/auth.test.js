const request = require('supertest');
const app = require('../src/app');

describe('Authentication API', () => {
    describe('POST /api/auth/register', () => {
        it('should reject an empty registration request', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation failed');
            expect(response.body.errors).toBeInstanceOf(Array);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should reject an empty login request', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Validation failed');
            expect(response.body.errors).toBeInstanceOf(Array);
        });
    });

    describe('GET /api/auth/me', () => {
        it('should reject requests without an authentication cookie', async () => {
            const response = await request(app)
                .get('/api/auth/me');

            expect(response.status).toBe(401);
            expect(response.body.message).toBe(
                'Authentication required'
            );
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should return success and clear the token cookie', async () => {
            const response = await request(app)
                .post('/api/auth/logout');

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Logout successful');

            const cookies = response.headers['set-cookie'] || [];

            expect(
                cookies.some(cookie =>
                    /^token=;/.test(cookie) &&
                    /Expires=Thu, 01 Jan 1970 00:00:00 GMT/i.test(cookie) &&
                    /HttpOnly/i.test(cookie) &&
                    /SameSite=Lax/i.test(cookie)
                )
            ).toBe(true);
        });
    });
});

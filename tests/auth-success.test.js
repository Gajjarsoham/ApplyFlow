
process.env.JWT_SECRET = 'test-only-secret-for-jest';

jest.mock('../src/models/User');

const request = require('supertest');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');
const app = require('../src/app');

describe('Successful Authentication', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should register a user with a hashed password', async () => {
        User.findOne.mockResolvedValue(null);

        User.create.mockImplementation(async data => ({
            _id: '507f1f77bcf86cd799439011',
            name: data.name,
            email: data.email,
            createdAt: new Date()
        }));

        const response = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Test User',
                email: 'test@example.com',
                password: 'StrongPass123'
            });

        expect(response.status).toBe(201);
        expect(response.body.message).toBe('Account created successfully');
        expect(User.create).toHaveBeenCalledTimes(1);

        const savedUser = User.create.mock.calls[0][0];

        expect(savedUser.passwordHash).not.toBe('StrongPass123');
        expect(
            await bcrypt.compare('StrongPass123', savedUser.passwordHash)
        ).toBe(true);

        expect(response.body.user.passwordHash).toBeUndefined();
    });

    it('should log in and set an HTTP-only authentication cookie', async () => {
        const passwordHash = await bcrypt.hash('StrongPass123', 10);

        const user = {
            _id: { toString: () => '507f1f77bcf86cd799439011' },
            name: 'Test User',
            email: 'test@example.com',
            passwordHash
        };

        User.findOne.mockReturnValue({
            select: jest.fn().mockResolvedValue(user)
        });

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                identifier: 'test@example.com',
                password: 'StrongPass123'
            });

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Login successful');
        expect(response.body.user.email).toBe('test@example.com');
        expect(response.body.user.passwordHash).toBeUndefined();

        const cookies = response.headers['set-cookie'] || [];

        expect(cookies.some(cookie =>
            /^token=/.test(cookie) &&
            /HttpOnly/i.test(cookie) &&
            /SameSite=Lax/i.test(cookie)
        )).toBe(true);
    });
});

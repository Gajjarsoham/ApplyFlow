
process.env.JWT_SECRET = 'test-only-secret-for-jest';

jest.mock('../src/models/Application');

const request = require('supertest');
const Application = require('../src/models/Application');
const app = require('../src/app');

const userId = '507f1f77bcf86cd799439011';

const createToken = () => {
    const jwt = require('jsonwebtoken');

    return jwt.sign(
        { sub: userId },
        process.env.JWT_SECRET,
        {
            expiresIn: '15m',
            issuer: 'applyflow',
            audience: 'applyflow-api'
        }
    );
};

describe('Application API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should create an application successfully', async () => {
        const createdApplication = {
            _id: '507f1f77bcf86cd799439012',
            company: 'Example Ltd',
            jobTitle: 'Backend Intern',
            status: 'applied',
            user: userId
        };

        Application.create.mockResolvedValue(createdApplication);

        const response = await request(app)
            .post('/api/applications')
            .set('Cookie', `token=${createToken()}`)
            .send({
                company: 'Example Ltd',
                jobTitle: 'Backend Intern'
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.company).toBe('Example Ltd');

        expect(Application.create).toHaveBeenCalledWith({
            company: 'Example Ltd',
            jobTitle: 'Backend Intern',
            user: userId
        });
    });

    it('should reject application creation with missing required fields', async () => {
        const response = await request(app)
            .post('/api/applications')
            .set('Cookie', `token=${createToken()}`)
            .send({
                company: 'Example Ltd'
            });

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Validation failed.');
        expect(response.body.errors).toBeInstanceOf(Array);
        expect(Application.create).not.toHaveBeenCalled();
    });

    it('should reject application creation without authentication', async () => {
        const response = await request(app)
            .post('/api/applications')
            .send({
                company: 'Example Ltd',
                jobTitle: 'Backend Intern'
            });

        expect(response.status).toBe(401);
        expect(response.body.message).toBe('Authentication required');
        expect(Application.create).not.toHaveBeenCalled();
    });

    
    it('should list applications with pagination metadata', async () => {
        Application.countDocuments.mockResolvedValue(1);

        const results = [
            {
                _id: '507f1f77bcf86cd799439012',
                company: 'Example Ltd',
                jobTitle: 'Backend Intern',
                status: 'applied'
            }
        ];

        const query = {
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue(results)
        };

        Application.find.mockReturnValue(query);

        const response = await request(app)
            .get('/api/applications?page=1&limit=10')
            .set('Cookie', `token=${createToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.count).toBe(1);
        expect(response.body.pagination).toMatchObject({
            totalRecords: 1,
            currentPage: 1,
            pageSize: 10,
            totalPages: 1,
            hasPreviousPage: false,
            hasNextPage: false
        });

        expect(Application.find).toHaveBeenCalledWith({
            user: userId
        });

        expect(query.sort).toHaveBeenCalledWith({
            createdAt: -1,
            _id: -1
        });

        expect(query.skip).toHaveBeenCalledWith(0);
        expect(query.limit).toHaveBeenCalledWith(10);
    });

    it('should apply search, status filters, and sorting', async () => {
        Application.countDocuments.mockResolvedValue(0);

        const query = {
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([])
        };

        Application.find.mockReturnValue(query);

        const response = await request(app)
            .get('/api/applications?search=Example&status=interview&sortBy=company&order=asc')
            .set('Cookie', `token=${createToken()}`);

        expect(response.status).toBe(200);

        const filter = Application.find.mock.calls[0][0];

        expect(filter.user).toBe(userId);
        expect(filter.status).toBe('interview');
        expect(filter.$or).toHaveLength(3);
        expect(filter.$or[0].company).toBeInstanceOf(RegExp);
        expect(filter.$or[0].company.test('Example Ltd')).toBe(true);

        expect(query.sort).toHaveBeenCalledWith({
            company: 1,
            _id: -1
        });
    });

    it('should reject invalid listing query parameters', async () => {
        const response = await request(app)
            .get('/api/applications?status=invalid')
            .set('Cookie', `token=${createToken()}`);

        expect(response.status).toBe(400);
        expect(response.body.success).toBe(false);
        expect(response.body.message).toBe('Invalid query parameters.');
        expect(response.body.errors).toBeInstanceOf(Array);
        expect(Application.find).not.toHaveBeenCalled();
    });

    
    it('should delete an application belonging to the user', async () => {
        Application.findOneAndDelete.mockResolvedValue({
            _id: '507f1f77bcf86cd799439012',
            user: userId
        });

        const response = await request(app)
            .delete('/api/applications/507f1f77bcf86cd799439012')
            .set('Cookie', `token=${createToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe(
            'Application deleted successfully.'
        );

        expect(Application.findOneAndDelete).toHaveBeenCalledWith({
            _id: '507f1f77bcf86cd799439012',
            user: userId
        });
    });

    it('should return zero dashboard counts when no applications exist', async () => {
        Application.aggregate.mockResolvedValue([]);

        const response = await request(app)
            .get('/api/applications/stats')
            .set('Cookie', `token=${createToken()}`);

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.totalApplications).toBe(0);
        expect(response.body.data.acceptanceRate).toBe(0);
        expect(response.body.data.interviewCount).toBe(0);
        expect(response.body.data.offerCount).toBe(0);
        expect(response.body.data.applicationsOverTime).toEqual([]);

        expect(response.body.data.statusCounts).toEqual({
            applied: 0,
            pending: 0,
            interview: 0,
            offer: 0,
            accepted: 0,
            rejected: 0,
            withdrawn: 0
        });

        expect(Application.aggregate).toHaveBeenCalledTimes(3);

        for (const call of Application.aggregate.mock.calls) {
            expect(call[0][0].$match.user.toString()).toBe(userId);
        }
    });

    
    it('should forward unexpected application errors to the error handler', async () => {
        Application.countDocuments.mockRejectedValue(
            new Error('Simulated database failure with sensitive details')
        );

        const query = {
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockResolvedValue([])
        };

        Application.find.mockReturnValue(query);

        const response = await request(app)
            .get('/api/applications')
            .set('Cookie', `token=${createToken()}`);

        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.message).not.toContain(
            'Simulated database failure with sensitive details'
        );
    });

});

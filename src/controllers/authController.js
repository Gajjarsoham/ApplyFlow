const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { registerSchema } = require('../validations/authValidation');
const jwt = require('jsonwebtoken');
const { loginSchema } = require('../validations/authValidation')

const register = async (req, res, next) => {
    try {
        const result = registerSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: result.error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        const { name, email, password } = result.data;

        const existingUser = await User.findOne({
            $or: [{ name }, { email }]
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists!"
            });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            passwordHash
        });

        return res.status(201).json({
            message: 'Account created successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                createdAt: user.createdAt
            }
        });

    } catch (err) {
        if (err.code === 11000 && err.keyPattern?.email) {
            return res.status(409).json({
                mesage: 'An account with this eail already exists'
            });
        }

        next(err);
    }
};

const login = async (req, res, next) => {
    try {
        const result = loginSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                message: 'Validation failed',
                errors: result.error.issues.map(issue => ({
                    field: issue.path.join('.'),
                    message: issue.message
                }))
            });
        }

        const { identifier, password } = result.data;

        const normalizedIdentifier = identifier.toLowerCase();

        const user = await User.findOne({
            $or: [
                { email: normalizedIdentifier },
                { name: identifier }
            ]
        }).select('+passwordHash');

        if (!user) {
            return res.status(401).json({
                message: 'Invalid name/email or password'
            });
        }

        const passwordMatches = await bcrypt.compare(
            password,
            user.passwordHash
        );

        if (!passwordMatches) {
            return res.status(401).json({
                message: 'Invalid name/email or password'
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured');
        }

        const token = jwt.sign(
            { sub: user._id.toString() },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || '15m',
                issuer: 'applyflow',
                audience: 'applyflow-api'
            }
        );

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15 * 60 * 1000
        });

        return res.status(200).json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email
            }
        });


    } catch (error) {
        next(err);
    }
}

module.exports = { register, login };
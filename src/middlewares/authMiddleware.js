const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    try {
        const token = req.cookies?.token;

        if (!token) {
            return res.status(401).json({
                message: 'Authentication required'
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET is not configured');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: 'applyflow',
            audience: 'applyflow-api'
        });

        req.user = {
            id: decoded.sub
        };

        next();

    } catch (err) {
        if (
            err.name === 'JsonWebTokenError' ||
            err.name === 'TokenExpiredError' ||
            err.name === 'NotBeforeError'
        ) {
            return res.status(401).json({
                message: 'Invalid or expired authentication token'
            });
        }

        next(err);
    }
};

module.exports = authMiddleware;
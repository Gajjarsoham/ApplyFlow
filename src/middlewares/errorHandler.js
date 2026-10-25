
const errorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    const message = statusCode >= 500
        ? 'Internal Server Error'
        : err.message || 'Request failed';

    res.status(statusCode).json({
        success: false,
        message
    });
};

module.exports = errorHandler;

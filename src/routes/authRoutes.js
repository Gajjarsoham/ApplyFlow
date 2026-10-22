const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const { register } = require('../controllers/authController');
const { login } = require('../controllers/authController');
const { logout } = require('../controllers/authController');

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get('/me', authMiddleware, (req, res) => {
    res.status(200).json({
        message: 'Authenticated successfully',
        userId: req.user.id
    });
});


module.exports = router;
const errorHandler = require('./middlewares/errorHandler');
const express = require("express");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(express.json());

// test route
app.use("/api/health", healthRoutes);

app.use("/api/auth", authRoutes);

// error handler
app.use(errorHandler);

module.exports = app;
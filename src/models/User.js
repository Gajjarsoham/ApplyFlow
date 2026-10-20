const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
        unique: true
    },

    passwordHash: {
        type: String,
        required: true,
        select: false
    },
}, { timestamps: true });

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
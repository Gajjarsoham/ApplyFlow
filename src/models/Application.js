const mongoose = require('mongoose');
const { Schema } = mongoose;

const APPLICATION_STATUSES = [
    "applied",
    "pending",
    "interview",
    "offer",
    "accepted",
    "rejected",
    "withdrawn",
];

const JOB_TYPES = [
    "full-time",
    "part-time",
    "contract",
    "internship",
    "temporary",
    "freelance",
];

const applicationSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: false
    },

    company: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },

    jobTitle: {
        type: String,
        required: true,
        trim: true,
        maxlength: 150
    },
    status: {
        type: String,
        enum: APPLICATION_STATUSES,
        default: "applied",
        required: true,
    },

    applicationDate: {
        type: Date,
        default: Date.now,
        required: true,
    },

    jobUrl: {
        type: String,
        trim: true,
        maxlength: 2048,
        validate: {
            validator(value) {
                if (!value) return true;

                try {
                    const url = new URL(value);
                    return (
                        url.protocol === "http:" ||
                        url.protocol === "https:"
                    );
                } catch {
                    return false;
                }
            },
            message: "Job URL must be a valid HTTP or HTTPS URL.",
        },
    },

    location: {
        type: String,
        trim: true,
        maxlength: 150,
    },

    jobType: {
        type: String,
        enum: JOB_TYPES,
    },

    notes: {
        type: String,
        trim: true,
        maxlength: 5000,
    },

    nextFollowUpDate: {
        type: Date,
    },
}, {
    timestamps: true,
});

applicationSchema.index({ user: 1, createdAt: -1 });

applicationSchema.index({ user: 1, status: 1 });

const applicationModel = mongoose.model("Application", applicationSchema);

module.exports = applicationModel;
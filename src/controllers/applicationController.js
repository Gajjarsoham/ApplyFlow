const Application = require('../models/Application');
const { createApplicationSchema, updateApplicationSchema } = require("../validations/applicationValidation");
const mongoose = require('mongoose')

const createApplication = async (req, res, next) => {
    try {
        const result = createApplicationSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
        }

        const application = await Application.create({
            ...result.data,
            user: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "Application created successfully",
            data: application,
        });

    } catch (err) {
        next(err);
    }
};

const listApplications = async (req, res, next) => {
    try {
        const applications = await Application.find({
            user: req.user.id,
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            count: applications.length,
            data: applications,
        });
    } catch (error) {
        next(error);
    }
};

const getApplicationById = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isObjectIdOrHexString(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application Id."
            });
        }

        const application = await Application.findOne({
            _id: id,
            user: req.user.id,
        });

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found.",
            });
        }

        return res.status(200).json({
            success: true,
            data: application,
        });

    } catch (error) {
        next(error);
    }
};

const updateApplication = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isObjectIdOrHexString(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid application ID.",
            });
        }

        const result = updateApplicationSchema.safeParse(req.body);

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed.",
                errors: result.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
        }

        const application = await Application.findOneAndUpdate(
            {
                _id: id,
                user: req.user.id,
            },
            {
                $set: result.data,
            },
            {
                new: true,
                runValidators: true,
            }
        );

        if (!application) {
            return res.status(404).json({
                success: false,
                message: "Application not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Application updated successfully.",
            data: application
        });
    } catch (error) {
        next(error);
    }
};

const deleteApplication = async (req, res, next) => {
    try {
        const { id } = req.params;

        if (!mongoose.isObjectIdOrHexString(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid applicaion ID.",
            });
        }

        const application = await Application.findOneAndDelete({
            _id: id,
            user: req.user.id,
        });

        return res.status(200).json({
            success: true,
            message: "Application deleted successfully.",
        });

    } catch (error) {
        next(error);
    }
};

module.exports = {
    createApplication,
    listApplications,
    getApplicationById,
    updateApplication,
    deleteApplication
};
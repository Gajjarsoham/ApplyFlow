const Application = require('../models/Application');
const { createApplicationSchema, updateApplicationSchema, listApplicationsQuerySchema } = require("../validations/applicationValidation");
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
        // 1. Validate query parameters
        const validation = listApplicationsQuerySchema.safeParse(req.query);

        if (!validation.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters.",
                errors: validation.error.issues.map((issue) => ({
                    field: issue.path.join("."),
                    message: issue.message,
                })),
            });
        }

        const {
            search,
            status,
            jobType,
            location,
            startDate,
            endDate,
            sortBy,
            order,
            page,
            limit,
        } = validation.data;

        // 2. Escape user input before using it in a regex
        const escapeRegex = (value) =>
            value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

        // 3. Always restrict queries to the authenticated user
        const filter = {
            user: req.user.id,
        };

        // 4. Search across company, job title, and location
        if (search) {
            const searchRegex = new RegExp(escapeRegex(search), "i");

            filter.$or = [
                { company: searchRegex },
                { jobTitle: searchRegex },
                { location: searchRegex },
            ];
        }

        // 5. Apply filters
        if (status) {
            filter.status = status;
        }

        if (jobType) {
            filter.jobType = jobType;
        }

        if (location) {
            filter.location = new RegExp(escapeRegex(location), "i");
        }

        // 6. Apply an inclusive application-date range
        if (startDate || endDate) {
            filter.applicationDate = {};

            if (startDate) {
                filter.applicationDate.$gte = new Date(
                    `${startDate}T00:00:00.000Z`
                );
            }

            if (endDate) {
                const dayAfterEndDate = new Date(
                    `${endDate}T00:00:00.000Z`
                );

                dayAfterEndDate.setUTCDate(
                    dayAfterEndDate.getUTCDate() + 1
                );

                filter.applicationDate.$lt = dayAfterEndDate;
            }
        }

        // 7. Build a safe sort using validated fields only
        const sortDirection = order === "asc" ? 1 : -1;

        const sort = {
            [sortBy]: sortDirection,
            _id: -1,
        };

        // 8. Calculate pagination
        const skip = (page - 1) * limit;

        // 9. Count matching records and retrieve only the requested page
        const [totalRecords, applications] = await Promise.all([
            Application.countDocuments(filter),
            Application.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit),
        ]);

        const totalPages = Math.ceil(totalRecords / limit);

        // 10. Return results and metadata
        return res.status(200).json({
            success: true,
            count: applications.length,
            data: applications,
            pagination: {
                totalRecords,
                currentPage: page,
                pageSize: limit,
                totalPages,
                hasPreviousPage: page > 1,
                hasNextPage: page < totalPages,
            },
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

const getApplicationStats = async (req, res, next) => {
    try {
        const userId = new mongoose.Types.ObjectId(req.user.id);

        const [
            statusCounts,
            jobTypeCounts,
            applicationsOverTime,
        ] = await Promise.all([
            Application.aggregate([
                { $match: { user: userId } },
                {
                    $group: {
                        _id: "$status",
                        count: { $sum: 1 },
                    },
                },
            ]),

            Application.aggregate([
                { $match: { user: userId } },
                {
                    $group: {
                        _id: "$jobType",
                        count: { $sum: 1 },
                    },
                },
            ]),

            Application.aggregate([
                { $match: { user: userId } },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m",
                                date: "$createdAt",
                            },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

        const statuses = [
            "applied",
            "pending",
            "interview",
            "offer",
            "accepted",
            "rejected",
            "withdrawn",
        ];

        const counts = Object.fromEntries(
            statuses.map((status) => [status, 0])
        );

        for (const item of statusCounts) {
            counts[item._id] = item.count;
        }

        const totalApplications = Object.values(counts).reduce(
            (total, count) => total + count,
            0
        );

        const jobTypes = Object.fromEntries(
            [
                "full-time",
                "part-time",
                "contract",
                "internship",
                "temporary",
                "freelance",
            ].map((type) => [type, 0])
        );

        let unspecifiedJobType = 0;

        for (const item of jobTypeCounts) {
            if (item._id == null) {
                unspecifiedJobType = item.count;
            } else if (
                Object.prototype.hasOwnProperty.call(jobTypes, item._id)
            ) {
                jobTypes[item._id] = item.count;
            }
        }

        const acceptanceRate = totalApplications === 0
            ? 0
            : Number(
                ((counts.accepted / totalApplications) * 100).toFixed(2)
            );

        return res.status(200).json({
            success: true,
            data: {
                totalApplications,
                statusCounts: counts,
                interviewCount: counts.interview,
                offerCount: counts.offer,
                acceptanceRate,
                acceptanceRateDenominator: "totalApplications",
                applicationsByJobType: {
                    ...jobTypes,
                    unspecified: unspecifiedJobType,
                },
                applicationsOverTime: applicationsOverTime.map((item) => ({
                    month: item._id,
                    count: item.count,
                })),
            },
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
    deleteApplication,
    getApplicationStats,
};
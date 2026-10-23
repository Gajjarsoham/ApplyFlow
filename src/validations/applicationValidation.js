const { z } = require("zod");

const applicationStatuses = [
    "applied", "pending", "interview", "offer", "accepted", "rejected", "withdrawn"
];

const jobTypes = [
    "full-time", "part-time", "contract", "internship", "temporary", "freelance"
];

const optionalDate = z
    .string()
    .refine((val) => !Number.isNaN(Date.parse(val)), { message: "Must be a valid date." })
    .optional();

const isValidHttpUrl = (val) => {
    if (!val) return true; // allow undefined or empty optional strings
    try {
        const url = new URL(val);
        return url.protocol === "http:" || url.protocol === "https:";
    } catch {
        return false;
    }
};

const jobUrlSchema = z
    .string()
    .trim()
    .max(2048)
    .refine(isValidHttpUrl, { message: "Must be a valid HTTP or HTTPS URL." })
    .optional();

const baseFields = {
    status: z.enum(applicationStatuses).optional(),
    applicationDate: optionalDate,
    jobUrl: jobUrlSchema,
    location: z.string().trim().max(150).optional(),
    jobType: z.enum(jobTypes).optional(),
    notes: z.string().trim().max(5000).optional(),
    nextFollowUpDate: optionalDate,
};

const createApplicationSchema = z
    .object({
        company: z.string().trim().min(1).max(150),
        jobTitle: z.string().trim().min(1).max(150),
        ...baseFields,
    })
    .strict();

const updateApplicationSchema = z
    .object({
        company: z.string().trim().min(1).max(150).optional(),
        jobTitle: z.string().trim().min(1).max(150).optional(),
        ...baseFields,
    })
    .strict()
    .refine((data) => Object.keys(data).length > 0, {
        message: "Provide at least one field to update.",
    });

const listApplicationsQuerySchema = z
    .object({
        search: z.string().trim().max(100).optional(),

        status: z.enum(applicationStatuses).optional(),

        jobType: z.enum(jobTypes).optional(),

        location: z.string().trim().max(100).optional(),

        startDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, {
                message: "startDate must use YYYY-MM-DD format.",
            })
            .refine((value) => {
                const date = new Date(`${value}T00:00:00.000Z`);
                return (
                    !Number.isNaN(date.getTime()) &&
                    date.toISOString().slice(0, 10) === value
                );
            }, {
                message: "startDate must be a valid calendar date.",
            })
            .optional(),

        endDate: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, {
                message: "endDate must use YYYY-MM-DD format.",
            })
            .refine((value) => {
                const date = new Date(`${value}T00:00:00.000Z`);
                return (
                    !Number.isNaN(date.getTime()) &&
                    date.toISOString().slice(0, 10) === value
                );
            }, {
                message: "endDate must be a valid calendar date.",
            })
            .optional(),

        sortBy: z.enum([
            "createdAt",
            "updatedAt",
            "applicationDate",
            "company",
            "jobTitle",
        ]).default("createdAt"),

        order: z.enum(["asc", "desc"]).default("desc"),

        page: z.coerce.number().int().min(1).default(1),

        limit: z.coerce.number().int().min(1).max(100).default(10),
    })
    .strict()
    .refine(
        (query) =>
            !query.startDate ||
            !query.endDate ||
            query.startDate <= query.endDate,
        {
            message: "startDate cannot be later than endDate.",
            path: ["startDate"],
        }
    );

module.exports = { createApplicationSchema, updateApplicationSchema, listApplicationsQuerySchema };
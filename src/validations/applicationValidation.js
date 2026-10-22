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

module.exports = { createApplicationSchema, updateApplicationSchema };
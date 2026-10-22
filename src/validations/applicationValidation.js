
const { z } = require("zod");

const applicationStatuses = [
    "applied",
    "pending",
    "interview",
    "offer",
    "accepted",
    "rejected",
    "withdrawn",
];

const jobTypes = [
    "full-time",
    "part-time",
    "contract",
    "internship",
    "temporary",
    "freelance",
];

const optionalDate = z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), {
        message: "Must be a valid date.",
    })
    .optional();

const createApplicationSchema = z
    .object({
        company: z.string().trim().min(1).max(150),
        jobTitle: z.string().trim().min(1).max(150),

        status: z.enum(applicationStatuses).optional(),

        applicationDate: optionalDate,

        jobUrl: z
            .string()
            .trim()
            .max(2048)
            .refine(
                (value) => {
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
                { message: "Must be a valid HTTP or HTTPS URL." }
            )
            .optional(),

        location: z.string().trim().max(150).optional(),
        jobType: z.enum(jobTypes).optional(),
        notes: z.string().trim().max(5000).optional(),
        nextFollowUpDate: optionalDate,
    })
    .strict();

module.exports = { createApplicationSchema };
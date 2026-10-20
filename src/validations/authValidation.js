const { Buffer } = require('node:buffer');
const { z } = require('zod');

const registerSchema = z.object({
    name: z.string().trim().min(2).max(50),
    email: z.string().trim().email().transform(value => value.toLowerCase()),
    password: z.string().min(8).refine(
        value => Buffer.byteLength(value, 'utf-8') <= 72,
        'Password must not exceed 72 UTF-8 bytes'
    )
}).strict();

const loginSchema = z.object({
    identifier: z.string().trim().min(1),
    password: z.string().min(1)
}).strict();

module.exports = { registerSchema, loginSchema };
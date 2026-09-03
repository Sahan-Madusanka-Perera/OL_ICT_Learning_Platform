import { z } from 'zod';

/**
 * One schema, used by the client form and re-validated on the server.
 * The server never trusts that the client ran it.
 */

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(5, 'Enter your email address.')
  .max(254)
  .email('That does not look like an email address.');

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2, 'Enter a name we can call you by.')
    .max(40, 'That name is too long.')
    // A nickname is fine — we never ask for a legal name.
    .regex(/^[\p{L}\p{N} .'’-]+$/u, 'Use letters, numbers, spaces, apostrophes or hyphens.'),
  email: emailSchema,
  password: z.string().min(10, 'Use at least 10 characters.').max(200),
  grade: z.coerce.number().int().min(10).max(11),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Enter your password.').max(200),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;

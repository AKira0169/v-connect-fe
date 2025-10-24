import z from '../../../node_modules/zod/v4/classic/external.cjs';

export const loginSchema = z.object({
  email: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type loginFormType = z.infer<typeof loginSchema>;

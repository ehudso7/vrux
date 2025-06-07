import { z } from 'zod';

// User authentication schemas
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .transform(email => email.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
});

export const signUpSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes'),
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .transform(email => email.toLowerCase().trim()),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  confirmPassword: z
    .string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile update schema
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  email: z
    .string()
    .email('Invalid email address')
    .transform(email => email.toLowerCase().trim())
    .optional(),
  currentPassword: z
    .string()
    .min(6, 'Current password must be at least 6 characters')
    .optional(),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .optional(),
  confirmNewPassword: z
    .string()
    .optional(),
}).refine((data) => {
  // If changing password, both current and new are required
  if (data.newPassword || data.currentPassword) {
    return !!(data.newPassword && data.currentPassword);
  }
  return true;
}, {
  message: "Both current and new password are required to change password",
  path: ["newPassword"],
}).refine((data) => {
  // If new password is provided, confirm must match
  if (data.newPassword && data.confirmNewPassword) {
    return data.newPassword === data.confirmNewPassword;
  }
  return true;
}, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
});

// Component generation schema
export const generateComponentSchema = z.object({
  prompt: z
    .string()
    .min(1, 'Prompt is required')
    .min(10, 'Prompt must be at least 10 characters')
    .max(1000, 'Prompt must be less than 1000 characters'),
  variants: z
    .number()
    .min(1, 'At least 1 variant required')
    .max(5, 'Maximum 5 variants allowed')
    .default(3),
  style: z.enum(['modern', 'classic', 'minimal', 'bold']).optional(),
  framework: z.enum(['react', 'vue', 'angular']).default('react'),
});

// Share component schema
export const shareComponentSchema = z.object({
  code: z
    .string()
    .min(1, 'Component code is required'),
  title: z
    .string()
    .min(1, 'Title is required')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  tags: z
    .array(z.string())
    .max(5, 'Maximum 5 tags allowed')
    .optional(),
  isPublic: z.boolean().default(true),
});

// Deployment schema
export const deploymentSchema = z.object({
  provider: z.enum(['vercel', 'netlify', 'github']),
  projectName: z
    .string()
    .min(1, 'Project name is required')
    .regex(/^[a-z0-9-]+$/, 'Project name can only contain lowercase letters, numbers, and hyphens'),
  apiToken: z
    .string()
    .min(1, 'API token is required'),
  environmentVariables: z
    .record(z.string())
    .optional(),
  buildCommand: z.string().optional(),
  outputDirectory: z.string().optional(),
});

// Type exports
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type GenerateComponentInput = z.infer<typeof generateComponentSchema>;
export type ShareComponentInput = z.infer<typeof shareComponentSchema>;
export type DeploymentInput = z.infer<typeof deploymentSchema>;
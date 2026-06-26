import { z } from "zod";
import { APPLICATION_STATUSES } from "./status";

export const createApplicationSchema = z.object({
  profileId: z.string().uuid().optional(),
  company: z.string().trim().min(1, "Company is required").max(200),
  role: z.string().trim().min(1, "Role is required").max(200),
  status: z.enum(APPLICATION_STATUSES).default("saved"),
  fitScore: z.number().int().min(0).max(100).nullable().optional(),
  jobUrl: z
    .string()
    .url()
    .regex(/^https?:\/\//i, "Must be an http(s) URL")
    .max(2000)
    .nullable()
    .optional(),
  notes: z.string().max(5000).nullable().optional(),
});

export const updateApplicationSchema = z
  .object({
    company: z.string().trim().min(1).max(200),
    role: z.string().trim().min(1).max(200),
    status: z.enum(APPLICATION_STATUSES),
    fitScore: z.number().int().min(0).max(100).nullable(),
    jobUrl: z
      .string()
      .url()
      .regex(/^https?:\/\//i, "Must be an http(s) URL")
      .max(2000)
      .nullable(),
    notes: z.string().max(5000).nullable(),
  })
  .partial()
  .refine((patch) => Object.keys(patch).length > 0, { message: "No fields to update" });

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;

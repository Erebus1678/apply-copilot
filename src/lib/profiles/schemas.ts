import { z } from "zod";

export const createProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;

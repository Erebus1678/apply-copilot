import { z } from "zod";

export const createProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  // Optional parent: when set, this profile is a track nested under that person.
  parentId: z.string().uuid().optional(),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>;

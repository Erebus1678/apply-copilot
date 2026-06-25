import { z } from "zod";
import { PROVIDER_IDS } from "./config";

/** Input contract for the generic streaming endpoint. */
export const streamRequestSchema = z.object({
  prompt: z.string().min(1, "prompt is required").max(20_000),
  system: z.string().max(8_000).optional(),
  provider: z.enum(PROVIDER_IDS).optional(),
});

export type StreamRequest = z.infer<typeof streamRequestSchema>;

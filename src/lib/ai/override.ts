import { z } from "zod";
import { PROVIDER_IDS } from "./config";

// Shared request fields for per-request provider selection + BYO-key/model.
// Spread into each endpoint's request schema so the override travels with the call.
// apiKey rides the request body — fine on a self-host (the user's own
// server). For multi-tenant SaaS, swap to server-held keys instead.
export const providerOverrideFields = {
  provider: z.enum(PROVIDER_IDS).optional(),
  apiKey: z.string().max(400).optional(),
  model: z.string().max(200).optional(),
};

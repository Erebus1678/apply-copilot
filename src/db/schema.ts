import { pgEnum, pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { APPLICATION_STATUSES } from "@/lib/applications/status";

export const applicationStatus = pgEnum("application_status", APPLICATION_STATUSES);

// Local workspaces (no auth). Self-host can share an instance on a LAN; each
// person picks a profile and their applications are scoped to it. In the SaaS
// edition the same scoping column maps to an authenticated user instead.
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id").references(() => profiles.id, { onDelete: "cascade" }),
  company: text("company").notNull(),
  role: text("role").notNull(),
  status: applicationStatus("status").notNull().default("saved"),
  fitScore: integer("fit_score"),
  jobUrl: text("job_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;

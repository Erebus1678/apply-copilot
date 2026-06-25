import { pgEnum, pgTable, text, integer, timestamp, uuid } from "drizzle-orm/pg-core";
import { APPLICATION_STATUSES } from "@/lib/applications/status";

export const applicationStatus = pgEnum("application_status", APPLICATION_STATUSES);

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
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

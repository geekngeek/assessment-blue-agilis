# Down migrations

Drizzle only generates forward SQL. `npm run db:pop` rolls back the most recently applied migration
by running the file here whose name matches the migration tag.

After every `npm run db:generate`, add the matching `<tag>.sql` in this folder that reverses it.
Separate statements with `--> statement-breakpoint`, the same delimiter Drizzle uses.

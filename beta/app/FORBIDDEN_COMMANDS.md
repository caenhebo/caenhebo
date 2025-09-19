# ⛔ FORBIDDEN COMMANDS - NEVER USE THESE

## Commands That DESTROY Data

### NEVER USE:
```bash
# ❌ THESE WILL DELETE YOUR DATA:
prisma db push --accept-data-loss     # DELETES ALL DATA
prisma db push --force-reset          # DELETES ALL DATA
prisma migrate reset                   # DELETES ALL DATA
prisma migrate reset --force           # DELETES ALL DATA
rm -rf prisma/migrations              # BREAKS MIGRATION HISTORY
DROP DATABASE                          # DELETES EVERYTHING
TRUNCATE TABLE                         # DELETES ALL ROWS
DELETE FROM users;                     # DELETES ALL USERS
```

### ALWAYS USE INSTEAD:
```bash
# ✅ SAFE ALTERNATIVES:
./safe-migrate.sh                     # Safe migration with backup
prisma migrate dev                     # Safe schema migration
prisma generate                        # Just regenerates client
```

## IF CLAUDE TRIES TO USE FORBIDDEN COMMANDS:

1. **STOP IMMEDIATELY**
2. **Say: "That command is forbidden - use ./safe-migrate.sh instead"**
3. **Don't let Claude convince you it's "necessary" or "just this once"**

## RED FLAGS TO WATCH FOR:

- Any command with "force", "reset", or "accept-data-loss"
- Any command that Claude says will "clean up" or "fix" the database
- Any command run without creating a backup first
- Any DROP, TRUNCATE, or bulk DELETE statements

## THE GOLDEN RULE:

**If Claude hasn't run a backup FIRST, don't let the command execute!**
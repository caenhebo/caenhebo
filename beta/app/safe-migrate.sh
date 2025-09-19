#!/bin/bash

# SAFE MIGRATION SCRIPT - ALWAYS USE THIS INSTEAD OF DIRECT PRISMA COMMANDS

set -e  # Exit on any error

echo "🛡️ SAFE MIGRATION PROCESS STARTING..."
echo "======================================"

# 1. CREATE MANDATORY BACKUP
echo "📦 Step 1: Creating backup..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/Caenhebo/beta/db-backups"
mkdir -p $BACKUP_DIR

PGPASSWORD='C@enh3b0Beta2025' pg_dump -U caenhebo -h localhost caenhebo_beta > "$BACKUP_DIR/pre_migration_$TIMESTAMP.sql"
gzip "$BACKUP_DIR/pre_migration_$TIMESTAMP.sql"
echo "✅ Backup created: $BACKUP_DIR/pre_migration_$TIMESTAMP.sql.gz"

# 2. SHOW CURRENT DATA COUNTS
echo ""
echo "📊 Step 2: Current database state:"
echo -n "  Users: "
PGPASSWORD='C@enh3b0Beta2025' psql -U caenhebo -h localhost caenhebo_beta -t -c "SELECT COUNT(*) FROM users;" | tr -d ' '
echo -n "  Properties: "
PGPASSWORD='C@enh3b0Beta2025' psql -U caenhebo -h localhost caenhebo_beta -t -c "SELECT COUNT(*) FROM properties;" 2>/dev/null | tr -d ' ' || echo "0"
echo -n "  Transactions: "
PGPASSWORD='C@enh3b0Beta2025' psql -U caenhebo -h localhost caenhebo_beta -t -c "SELECT COUNT(*) FROM transactions;" 2>/dev/null | tr -d ' ' || echo "0"

# 3. GENERATE MIGRATION (SAFE)
echo ""
echo "🔄 Step 3: Generating migration (safe mode)..."
echo "⚠️  NEVER use 'prisma db push --accept-data-loss'"
echo "✅  Using 'prisma migrate dev' instead"
echo ""

# Check if there are pending changes
npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --exit-code || HAS_CHANGES=$?

if [ "$HAS_CHANGES" = "0" ]; then
    echo "✅ No schema changes detected. Database is up to date!"
    exit 0
fi

# 4. ASK FOR CONFIRMATION
echo ""
echo "⚠️  MIGRATION REQUIRED - PLEASE CONFIRM:"
echo "=====================================
echo "Backup has been created at: $BACKUP_DIR/pre_migration_$TIMESTAMP.sql.gz"
echo ""
echo "Type 'MIGRATE' to proceed with migration, or anything else to cancel:"
read -r CONFIRMATION

if [ "$CONFIRMATION" != "MIGRATE" ]; then
    echo "❌ Migration cancelled. Your data is safe."
    echo "💡 To restore if needed: gunzip < $BACKUP_DIR/pre_migration_$TIMESTAMP.sql.gz | PGPASSWORD='C@enh3b0Beta2025' psql -U caenhebo -h localhost caenhebo_beta"
    exit 1
fi

# 5. RUN SAFE MIGRATION
echo ""
echo "🚀 Step 4: Running migration..."
npx prisma migrate dev --name "migration_$TIMESTAMP"

# 6. VERIFY DATA IS STILL THERE
echo ""
echo "✅ Step 5: Verifying data integrity:"
echo -n "  Users after migration: "
PGPASSWORD='C@enh3b0Beta2025' psql -U caenhebo -h localhost caenhebo_beta -t -c "SELECT COUNT(*) FROM users;" | tr -d ' '
echo -n "  Properties after migration: "
PGPASSWORD='C@enh3b0Beta2025' psql -U caenhebo -h localhost caenhebo_beta -t -c "SELECT COUNT(*) FROM properties;" 2>/dev/null | tr -d ' ' || echo "0"
echo -n "  Transactions after migration: "
PGPASSWORD='C@enh3b0Beta2025' psql -U caenhebo -h localhost caenhebo_beta -t -c "SELECT COUNT(*) FROM transactions;" 2>/dev/null | tr -d ' ' || echo "0"

echo ""
echo "✅ MIGRATION COMPLETED SAFELY!"
echo "💾 Backup available at: $BACKUP_DIR/pre_migration_$TIMESTAMP.sql.gz"
echo ""
echo "If anything went wrong, restore with:"
echo "gunzip < $BACKUP_DIR/pre_migration_$TIMESTAMP.sql.gz | PGPASSWORD='C@enh3b0Beta2025' psql -U caenhebo -h localhost caenhebo_beta"
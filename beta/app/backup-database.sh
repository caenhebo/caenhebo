#!/bin/bash

# Database backup script
# Run this BEFORE any database migrations or changes

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/Caenhebo/beta/db-backups"
DB_NAME="caenhebo_beta"
DB_USER="caenhebo"
DB_PASS="C@enh3b0Beta2025"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
PGPASSWORD=$DB_PASS pg_dump -U $DB_USER -h localhost $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo "✅ Database backed up to: $BACKUP_DIR/backup_$TIMESTAMP.sql"
echo "To restore: PGPASSWORD=$DB_PASS psql -U $DB_USER -h localhost $DB_NAME < $BACKUP_DIR/backup_$TIMESTAMP.sql"
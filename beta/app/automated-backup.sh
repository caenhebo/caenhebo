#!/bin/bash

# Automated backup script with rotation
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/root/Caenhebo/beta/db-backups"
DB_NAME="caenhebo_beta"
DB_USER="caenhebo"
DB_PASS="C@enh3b0Beta2025"
MAX_BACKUPS=30  # Keep last 30 backups

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Create backup
PGPASSWORD=$DB_PASS pg_dump -U $DB_USER -h localhost $DB_NAME > "$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Compress the backup
gzip "$BACKUP_DIR/backup_$TIMESTAMP.sql"

echo "[$(date)] Backup created: backup_$TIMESTAMP.sql.gz" >> "$BACKUP_DIR/backup.log"

# Remove old backups (keep only last MAX_BACKUPS)
cd $BACKUP_DIR
ls -t backup_*.sql.gz 2>/dev/null | tail -n +$((MAX_BACKUPS + 1)) | xargs -r rm

echo "[$(date)] Old backups cleaned, keeping last $MAX_BACKUPS backups" >> "$BACKUP_DIR/backup.log"

#!/bin/bash

# Setup automated database backups with cron

# Create the backup script if it doesn't exist
cat > /root/Caenhebo/beta/app/automated-backup.sh << 'EOF'
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
EOF

chmod +x /root/Caenhebo/beta/app/automated-backup.sh

# Add cron jobs for automated backups
(crontab -l 2>/dev/null | grep -v "automated-backup.sh";
echo "# Database backups for Caenhebo Beta";
echo "0 */4 * * * /root/Caenhebo/beta/app/automated-backup.sh  # Every 4 hours";
echo "0 2 * * * /root/Caenhebo/beta/app/automated-backup.sh    # Daily at 2 AM";
echo "0 0 * * 0 /root/Caenhebo/beta/app/automated-backup.sh    # Weekly on Sunday midnight") | crontab -

echo "✅ Automated backups configured:"
echo "  - Every 4 hours"
echo "  - Daily at 2 AM"
echo "  - Weekly on Sunday midnight"
echo "  - Keeping last 30 backups"
echo "  - Backups stored in: /root/Caenhebo/beta/db-backups/"
echo ""
echo "To view backup schedule: crontab -l"
echo "To run backup manually: /root/Caenhebo/beta/app/automated-backup.sh"
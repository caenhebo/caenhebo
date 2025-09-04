#!/bin/bash

# Database Protection Script
# This script creates automatic backups and monitors for unauthorized changes

DB_PATH="prisma/dev.db"
BACKUP_DIR="prisma/backups"
HASH_FILE="prisma/.db-hashes"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Function to calculate hash of critical data
calculate_hash() {
    sqlite3 "$DB_PATH" "SELECT email, role, substr(password, 1, 20) FROM users ORDER BY email;" | sha256sum | cut -d' ' -f1
}

# Function to create backup
create_backup() {
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/dev.db.backup-$timestamp"
    cp "$DB_PATH" "$backup_file"
    echo "✅ Backup created: $backup_file"
}

# Function to check for unauthorized changes
check_changes() {
    local current_hash=$(calculate_hash)
    
    if [ -f "$HASH_FILE" ]; then
        local stored_hash=$(cat "$HASH_FILE")
        if [ "$current_hash" != "$stored_hash" ]; then
            echo "⚠️  WARNING: Database has been modified!"
            echo "Critical user data (emails, roles, or passwords) have changed."
            
            # Show what changed
            echo -e "\nCurrent users:"
            sqlite3 "$DB_PATH" "SELECT email, role FROM users;"
            
            # Create emergency backup
            create_backup
            
            echo -e "\n❌ If these changes were not authorized, restore from backup:"
            echo "   cp $BACKUP_DIR/dev.db.backup-TIMESTAMP prisma/dev.db"
            
            return 1
        else
            echo "✅ Database integrity verified - no unauthorized changes"
        fi
    else
        echo "📝 Creating initial database hash..."
    fi
    
    # Update hash file
    echo "$current_hash" > "$HASH_FILE"
    return 0
}

# Function to show fixed credentials
show_credentials() {
    echo -e "\n📋 Fixed Credentials (DO NOT CHANGE):"
    echo "   Admin: f@pachoman.com / C@rlos2025"
    echo "   Seller: seller@test.com / password123"
    echo "   Buyer: buyer@test.com / password123"
}

# Main execution
echo "🛡️  Database Protection Check"
echo "============================"

# Check for changes
check_changes

# Create regular backup
create_backup

# Show credentials reminder
show_credentials

# Clean old backups (keep last 10)
echo -e "\n🧹 Cleaning old backups..."
ls -t "$BACKUP_DIR"/*.backup-* 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null

echo -e "\n✅ Protection check complete!"
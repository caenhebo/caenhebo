#!/bin/bash

# Pre-edit hook for Claude Code
# This script should be run BEFORE editing any critical files

echo "🛡️  Running pre-edit safety checks..."

# Critical files that need extra protection
CRITICAL_FILES=(
    "src/app/api/kyc/status/route.ts"
    "src/app/api/auth/[...nextauth]/route.ts"
    "src/app/seller/dashboard/page.tsx"
    "src/app/buyer/dashboard/page.tsx"
    "src/lib/striga.ts"
    "prisma/schema.prisma"
)

# Check if the file being edited is critical
FILE_TO_EDIT="$1"
IS_CRITICAL=false

for critical_file in "${CRITICAL_FILES[@]}"; do
    if [[ "$FILE_TO_EDIT" == *"$critical_file"* ]]; then
        IS_CRITICAL=true
        break
    fi
done

if [ "$IS_CRITICAL" = true ]; then
    echo "⚠️  WARNING: You are about to edit a CRITICAL file!"
    echo "📋 Creating automatic backup..."
    
    # Create backup
    cp "$FILE_TO_EDIT" "$FILE_TO_EDIT.backup-$(date +%Y%m%d-%H%M%S)"
    echo "✅ Backup created"
    
    # Run tests
    echo "🧪 Running critical feature tests..."
    /root/coding/claudecode/projects/caenhebo-alpha/test-critical-features.sh > /tmp/pre-edit-test.log
    
    if grep -q "FAILED" /tmp/pre-edit-test.log; then
        echo "❌ WARNING: Some features are already broken!"
        cat /tmp/pre-edit-test.log
    else
        echo "✅ All critical features working"
    fi
    
    echo ""
    echo "📌 Remember:"
    echo "   1. Test after your changes with: ./test-critical-features.sh"
    echo "   2. If something breaks, restore with: cp $FILE_TO_EDIT.backup-* $FILE_TO_EDIT"
    echo "   3. Check imports match working patterns (see CLAUDE.md)"
fi
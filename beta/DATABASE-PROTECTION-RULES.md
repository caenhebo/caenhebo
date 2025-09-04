# DATABASE PROTECTION RULES

## 🚨 CRITICAL: NEVER MODIFY DATABASE WITHOUT AUTHORIZATION

### Fixed Credentials (NEVER CHANGE)
```
Admin User:
- Email: f@pachoman.com
- Password: C@rlos2025

Test Users:
- seller@test.com / password123
- buyer@test.com / password123
```

### Rules for Claude Code and All Developers

1. **NEVER MODIFY PASSWORDS**
   - Password hashes are sacred - never update them
   - If login fails, check the code, not the database
   - Password format: `$2b$10$...` (bcrypt)

2. **NEVER MODIFY USER DATA WITHOUT PERMISSION**
   - Don't change emails
   - Don't change roles
   - Don't change user IDs
   - Don't delete users

3. **READ-ONLY BY DEFAULT**
   - Always use SELECT queries for debugging
   - Never use UPDATE/DELETE without explicit user request
   - Create backup before any modifications

4. **WHEN LOGIN FAILS**
   ```bash
   # CHECK the code, not the database:
   1. Check auth route imports (must be from 'next-auth' not 'next-auth/next')
   2. Check bcrypt compare function
   3. Check session configuration
   4. Check environment variables
   
   # DO NOT:
   - Update password hashes
   - Create new users
   - Modify existing users
   ```

5. **DATABASE BACKUPS**
   ```bash
   # Before ANY database operation:
   cp prisma/dev.db prisma/dev.db.backup-$(date +%Y%m%d-%H%M%S)
   ```

6. **SAFE DATABASE QUERIES**
   ```bash
   # ✅ SAFE - Read only:
   sqlite3 prisma/dev.db "SELECT email, role FROM users;"
   
   # ❌ DANGEROUS - Never do without permission:
   sqlite3 prisma/dev.db "UPDATE users SET password='...';"
   ```

7. **IF DATABASE IS CORRUPTED**
   - Ask user first: "The database seems corrupted. Should I restore from backup?"
   - List available backups
   - Let user choose which backup to restore

## Automated Protection Script

Create this script and run it regularly:
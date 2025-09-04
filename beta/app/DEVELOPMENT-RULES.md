# Development Rules to Prevent Breaking Changes

## 🛡️ MANDATORY CHECKLIST BEFORE ANY CODE CHANGE

### 1. Before Modifying ANY File:
- [ ] Read the ENTIRE file first
- [ ] Check all functions/components that use the code you're changing
- [ ] Search for all references to the function/variable you're modifying
- [ ] Review recent error logs to understand current issues

### 2. Testing Strategy:
```bash
# ALWAYS run these tests before claiming something works:
1. Test the specific feature you're implementing
2. Test at least 2 other features that might be affected
3. Check the error logs: pm2 logs caenhebo-alpha --lines 50
4. Test the main user flows (login, dashboard access, etc.)
```

### 3. Code Change Rules:

#### Authentication Changes:
- NEVER change authentication without testing ALL endpoints
- Keep both old and new formats during transition
- Test with: Admin panel, KYC flow, User registration

#### API Changes:
- Document the exact format that works
- Keep backward compatibility when possible
- Test every endpoint that uses the changed code

#### Database Changes:
- Always run migrations in development first
- Back up data before migrations
- Test all CRUD operations after changes

### 4. Version Control:
```bash
# Before making changes:
1. Document current working state
2. Note which features are currently functional
3. Create a rollback plan
```

### 5. Error Prevention:

#### Common Mistakes to Avoid:
1. **Changing authentication format** without testing all API calls
2. **Modifying shared utilities** without checking all usages
3. **Updating dependencies** without testing the entire app
4. **Changing API endpoints** without updating all references

#### Safe Change Process:
1. Make changes incrementally
2. Test after EACH small change
3. Keep the old code commented until new code is verified
4. Document what changed and why

### 6. Testing Checklist:

Before saying "it works now":
- [ ] Test the feature you just implemented
- [ ] Test user login/logout
- [ ] Test admin panel access
- [ ] Test KYC flow start
- [ ] Check PM2 logs for errors
- [ ] Test API endpoints with curl/Postman

### 7. Rollback Strategy:

If something breaks:
1. Git diff to see exact changes
2. Revert only the breaking change
3. Document why it broke
4. Plan a better approach

### 8. Communication:

When reporting status:
- ✅ "Feature X is implemented and tested, also verified Y and Z still work"
- ❌ "It should work now" (without testing)

### 9. Striga API Specific Rules:

1. ALWAYS refer to `tipsforstriga.md` before changes
2. Test with the admin panel connection test
3. Verify both sandbox and production configs
4. Check webhook handling after auth changes

### 10. Documentation:

After every significant change:
1. Update relevant documentation
2. Add to tips/lessons learned
3. Comment complex code sections
4. Update API documentation

---

## 🚨 CRITICAL: Regression Testing

After ANY change to these files, test ALL of these:
- `/src/lib/striga.ts` → Test ALL Striga API calls
- `/src/app/api/auth/*` → Test login, register, session
- `/src/app/api/kyc/*` → Test complete KYC flow
- Database schema → Test all models and relations

---

## 📋 Quick Test Commands

```bash
# Check if app is running
pm2 list | grep caenhebo-alpha

# Check recent errors
pm2 logs caenhebo-alpha --err --lines 50

# Test Striga connection (as admin)
curl -X POST http://localhost:3018/api/admin/striga-test \
  -H "Cookie: [admin-session-cookie]"

# Test user creation
curl -X POST http://localhost:3018/api/kyc/initiate \
  -H "Content-Type: application/json" \
  -H "Cookie: [user-session-cookie]" \
  -d '{"firstName":"Test","lastName":"User","email":"test@example.com","phoneNumber":"+351 900000000","dateOfBirth":"1990-01-01","address":{"addressLine1":"Test St","city":"Lisbon","postalCode":"1000-000","country":"PT"}}'

# Monitor real-time logs
pm2 logs caenhebo-alpha --raw
```

---

Remember: It's better to test too much than to break working features!
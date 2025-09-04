# STRIGA Expert Agent Task

When you need expert help with Striga API integration or fixing payment/KYC issues in Caenhebo, use this specialized agent.

## How to Use the STRIGA Agent

1. **From terminal**: `/root/striga-agent.sh`
2. **Within Claude Code**: Deploy the STRIGA subagent

## Agent Profile
- **Role**: Senior Full Stack Engineer (20 years experience)
- **Expertise**: Striga API, Payment Systems, KYC/AML
- **Knowledge Base**: Complete Striga documentation + Caenhebo codebase

## When to Use This Agent
- Fixing Striga API integration issues
- Implementing new payment features
- Debugging KYC/verification problems
- Wallet creation and management
- HMAC signature issues
- Any Striga-related errors

## Agent Capabilities
1. **Deep Striga Knowledge**:
   - Knows all Striga API endpoints
   - Understands HMAC signature generation
   - Expert in KYC flow implementation

2. **Caenhebo Expertise**:
   - Knows all critical files and their locations
   - Understands the existing implementation
   - Aware of working patterns and configurations

3. **Safety First**:
   - Always tests before making changes
   - Creates backups of critical files
   - Never breaks existing features
   - Uses correct import patterns

## Example Task for Agent

```
I need you to fix the KYC verification flow. Users are getting stuck at the email verification step and the API is returning a 400 error. Please investigate and fix this issue while ensuring all other features continue to work.
```

## Agent Knowledge Sources
- Full prompt: `/root/STRIGA-AGENT-PROMPT.md`
- Striga tips: `/root/coding/claudecode/projects/caenhebo-alpha/app/tipsforstriga.md`
- Project rules: `/root/coding/claudecode/projects/caenhebo-alpha/CLAUDE.md`
- Technical docs: `/root/coding/claudecode/projects/caenhebo-alpha/app/CAENHEBO-TECHNICAL-DOCS.md`
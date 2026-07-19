# Backup & Recovery Guide

## MongoDB Backup Strategy

### Automated Backups
- Use MongoDB Atlas automated backups (continuous backups)
- Schedule daily snapshots retaining 30 days
- Enable point-in-time recovery

### Manual Backup
```bash
mongodump --uri="mongodb+srv://..." --out=/backup/$(date +%Y%m%d)
```

### Restore
```bash
mongorestore --uri="mongodb+srv://..." /backup/20260719
```

## Environment Backup
- Store .env files in secure password manager
- Document all required variables
- Keep .env.example in version control

## Disaster Recovery Checklist
1. Restore MongoDB from backup
2. Deploy application with correct environment variables
3. Verify health endpoint
4. Test authentication
5. Verify AI provider connections
6. Run smoke tests

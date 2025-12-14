# Data Migration Guide: Local → Cloud (EC2)

This guide explains how to migrate your MongoDB and Elasticsearch data from your local development environment to a cloud EC2 instance running docker-compose.

## Prerequisites

- SSH access to your EC2 instance
- Docker and docker-compose installed on EC2
- Same docker-compose.yml deployed on EC2

## Step 1: Backup Local Data

### On Windows (PowerShell):
```powershell
.\backup_local.ps1
```

### On Linux/Mac:
```bash
chmod +x backup_local.sh
./backup_local.sh
```

This creates a compressed archive: `backup_YYYYMMDD_HHMMSS.tar.gz` (or `.zip` on Windows)

## Step 2: Transfer to EC2

```bash
# Replace with your EC2 details
scp backup_*.tar.gz ubuntu@your-ec2-ip:/home/ubuntu/nexus/backend/
```

Or use WinSCP/FileZilla on Windows.

## Step 3: Restore on EC2

SSH into your EC2 instance:
```bash
ssh ubuntu@your-ec2-ip
cd /home/ubuntu/nexus/backend
```

Make sure your services are running:
```bash
docker compose up -d
```

Run the restore script:
```bash
chmod +x restore_cloud.sh
./restore_cloud.sh backup_YYYYMMDD_HHMMSS.tar.gz
```

## Step 4: Verify Data

### Check MongoDB:
```bash
docker compose exec mongodb mongosh -u admin -p changeme --authenticationDatabase admin

# In mongosh:
use mydatabase
db.images.countDocuments()
db.collections.countDocuments()
db.users.countDocuments()
```

### Check Elasticsearch:
```bash
curl http://localhost:9200/media_embeddings/_count
curl http://localhost:9200/_cat/indices?v
```

## Automated Deployment Script

For complete deployment, you can combine everything:

```bash
# On local machine
./backup_local.sh
scp backup_*.tar.gz ubuntu@ec2:/home/ubuntu/nexus/backend/

# On EC2
cd /home/ubuntu/nexus/backend
git pull  # Get latest code
docker compose down
docker compose up -d
./restore_cloud.sh backup_*.tar.gz
```

## Troubleshooting

### MongoDB restore fails
- Check if credentials match in .env file
- Ensure MongoDB container is running: `docker compose ps`

### Elasticsearch restore fails  
- Verify ES is healthy: `curl http://localhost:9200/_cluster/health`
- Check ES logs: `docker compose logs elasticsearch`

### Connection issues after restore
- Update MONGODB_URL in .env to point to cloud MongoDB
- Update ELASTICSEARCH_URL in .env
- Restart backend: `docker compose restart backend`

## Production Considerations

1. **Security**: Change default passwords in production
2. **Backups**: Set up automated backups using cron
3. **Data volumes**: Ensure Docker volumes persist data correctly
4. **Firewall**: Configure EC2 security groups appropriately
5. **SSL**: Use SSL for MongoDB and Elasticsearch in production

## Continuous Sync (Optional)

For ongoing sync, consider:
- MongoDB Atlas for managed database
- Elastic Cloud for managed Elasticsearch
- Use database replication instead of manual dumps

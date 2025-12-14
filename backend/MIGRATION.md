# Data Migration Guide: Local → Cloud (EC2)

This guide explains how to migrate your MongoDB and Elasticsearch data from your local development environment to a cloud EC2 instance running docker-compose.

## Prerequisites

- SSH access to your EC2 instance
- Docker and docker-compose installed on EC2
- Same docker-compose.yml deployed on EC2
- Python 3 with `requests` package (auto-installed by scripts)

## Step 1: Backup Local Data

### On Windows (PowerShell):
```powershell
.\backup_local.ps1
```

### On Windows (Git Bash) or Linux/Mac:
```bash
./backup_local.sh
```

**What the script does:**
- Reads credentials from your `.env` file automatically
- Backs up MongoDB database (default: `nexus_search`)
- Backs up Elasticsearch index (default: `media_embeddings`)
- Auto-installs Python `requests` package if needed
- Creates a compressed archive: `backup_YYYYMMDD_HHMMSS.tar.gz` (or `.zip` on Windows PowerShell)

**Output:**
- MongoDB: `./backups/YYYYMMDD_HHMMSS/mongodb_backup.archive.gz`
- Elasticsearch: `./backups/YYYYMMDD_HHMMSS/es_media_embeddings.json`
- Final archive: `backup_YYYYMMDD_HHMMSS.tar.gz`

## Step 2: Transfer to EC2

**Using SCP (Linux/Mac/Git Bash):**
```bash
# Replace with your EC2 details
scp backup_*.tar.gz ubuntu@your-ec2-ip:/home/ubuntu/nexus/backend/
```

**Using SCP (PowerShell with .zip file):**
```powershell
# First convert to .tar.gz if you used PowerShell backup
# Or use WinSCP/FileZilla GUI tools
```

**Alternative methods:**
- WinSCP (Windows GUI)
- FileZilla (Cross-platform GUI)
Ensure your `.env` file is configured with the correct credentials:
```bash
# Check your .env file contains:
# MONGO_INITDB_ROOT_USERNAME=admin
# MONGO_INITDB_ROOT_PASSWORD=your_password
# MONGODB_DB=nexus_search
# ELASTICSEARCH_INDEX=media_embeddings
```

Make sure your services are running:
```bash
docker compose up -d
# Wait for services to be healthy (30-60 seconds)
docker compose ps
```

Run the restore script:
```bash
chmod +x restore_cloud.sh
./restore_cloud.sh backup_YYYYMMDD_HHMMSS.tar.gz
```

**What the restore script does:**
- Reads credentials from `.env` file
- Auto-installs Python `requests` package if needed
# Use credentials from your .env file
docker compose exec mongodb mongosh -u admin -p your_password --authenticationDatabase admin

# In mongosh:
use nexus_search
db.images.countDocuments()
db.collections.countDocuments()
db.users.countDocuments()
exit
```

### Check Elasticsearch:
```bash
curl http://localhost:9200/media_embeddings/_count
curl http://localhost:9200/_cat/indices?v

# Check a sample document
curl http://localhost:9200/media_embeddings/_search?size=1
```

### Check Redis: (Git Bash/Linux/Mac)
./backup_local.sh
scp backup_*.tar.gz ubuntu@ec2-ip:/home/ubuntu/nexus/backend/

# On EC2
cd /home/ubuntu/nexus/backend
git pull  # Get latest code
docker compose down
docker compose build  # Rebuild if needed
docker compose up -d
sleep 30  # Wait for services to start
./restore_cloud.sh backup_*.tar.gz
docker compose restart backend  # Restart backend to refresh connections
```

## Environment Variables

Both scripts read from your `.env` file:

```bash
# MongoDB
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your_secure_password
MONGODB_DB=nexus_search

# Elasticsearch
ELASTICSEARCH_INDEX=media_embeddings
```

If variables are not set, defaults are used:
- MongoDB User: `admin`
- MongoDB Password: `changeme`
- MongoDB DB: `mydatabase`
- ES Index: `media_embeddingscker compose exec mongodb mongosh -u admin -p changeme --authenticationDatabase admin
`.env` file
- Ensure MongoDB container is running: `docker compose ps`
- Check MongoDB logs: `docker compose logs mongodb`
- Verify backup file exists: `ls -la restore_temp/`

### Elasticsearch restore fails  
- Verify ES is healthy: `curl http://localhost:9200/_cluster/health`
- Check ES logs: `docker compose logs elasticsearch`
- Ensure index name matches: Check `ELASTICSEARCH_INDEX` in `.env`
- Check for disk space: `df -h`

### Python requests module not found
- Scripts auto-install, but if it fails, manually install:
  ```bash
  pip install requests
  # or
  python -m pip install requests
  ```

### Git Bash path issues (Windows)
- The scripts use `//data//` paths which are Git Bash compatible
- If you see path errors, verify Docker is accessible from Git Bash
- Try running from PowerShell instead using `backup_local.ps1`

### Connection issues after restore
- Update connecti
   - Change default passwords in `.env` for production
   - Use strong passwords for `MONGO_INITDB_ROOT_PASSWORD`
   - Consider enabling Elasticsearch security (`xpack.security.enabled=true`)

2. **Backups**: 
   - Set up automated backups using cron on EC2:
     ```bash
     # Add to crontab (crontab -e)
     0 2 * * * cd /home/ubuntu/nexus/backend && ./backup_local.sh
     ```
   - Store backups in S3 for redundancy

3. **Data volumes**: 
   - Named volumes in docker-compose ensure persistence
   - Backup volumes regularly: `docker run --rm -v mongodb_data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb_volume.tar.gz /data`

4. **Firewall**: 
   - Configure EC2 security groups:
     - Port 8000 (API) - Allow from ALB/public
     - Port 27017 (MongoDB) - Deny public access
     - Port 9200 (Elasticsearch) - Deny public access
     - Port 6379 (Redis) - Deny public access

5. **SSL**: 
   - Use SSL/TLS for MongoDB in production
   - Use HTTPS for Elasticsearch
   - Add nginx reverse proxy for API with SSL certificate

6. **Monitoring**:
   - Set up CloudWatch for EC2 metrics
   - Monitor Docker container health
   - Track Elasticsearch cluster health

7. **Scaling**:
   - Consider MongoDB Atlas for managed database
   - Consider Elastic Cloud for managed Elasticsearch
   - Use AWS ECS/EKS for container orchestra
  ```
- Restart all services: `docker compose restart`
- Check network: `docker compose exec backend ping mongodb
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

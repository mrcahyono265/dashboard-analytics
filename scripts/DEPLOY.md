# EC2 Deployment Guide

## Quick Start

### 1. Launch EC2 Instance
- AMI: Ubuntu 22.04 LTS
- Instance: t2.micro (free tier) or t2.small
- Security Group: Allow SSH (22), HTTP (80), HTTPS (443)
- Key pair: Create or use existing

### 2. Setup (Run on EC2)

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# Download and run setup script
curl -sL https://raw.githubusercontent.com/mrcahyono265/dashboard-analytics/main/scripts/ec2-setup.sh -o ec2-setup.sh
chmod +x ec2-setup.sh
./ec2-setup.sh
```

### 3. Deploy Updates (Run from Local)

```bash
# Make deploy script executable
chmod +x scripts/deploy.sh

# Deploy
./scripts/deploy.sh 54.123.45.67 ~/.ssh/your-key.pem
```

## Scripts

| Script | Where | Purpose |
|--------|-------|---------|
| `ec2-setup.sh` | EC2 (once) | Initial server setup |
| `deploy.sh` | Local machine | Deploy updates |
| `health-check.sh` | EC2 | Check server status |
| `backup-db.sh` | EC2 | Backup database |

## Troubleshooting

### Backend down
```bash
ssh ubuntu@ec2-ip "pm2 restart prio-api"
```

### Check logs
```bash
ssh ubuntu@ec2-ip "pm2 logs prio-api --lines 50"
```

### Full health check
```bash
ssh ubuntu@ec2-ip "bash ~/dashboard-analytics/scripts/health-check.sh"
```

### Manual database backup
```bash
ssh ubuntu@ec2-ip "bash ~/dashboard-analytics/scripts/backup-db.sh"
```

## Default Login

| Role | Username | Password |
|------|----------|----------|
| RSE | zahra | admin123 |
| Store Manager | febriana | sm123 |
| CRR | dyah | crr123 |

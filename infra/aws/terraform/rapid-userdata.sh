#!/bin/bash
# Rapid deployment user data script
# Optimized for fastest possible setup

set -e

# Logging
exec > >(tee /var/log/rapid-setup.log)
exec 2>&1

echo "🚀 Starting rapid security lab setup..."

# Update system (essential only)
export DEBIAN_FRONTEND=noninteractive
apt-get update -y

# Install Docker (fastest method)
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu

# Install essential packages
apt-get install -y curl wget git jq unzip

# Start Docker
systemctl start docker
systemctl enable docker

# Pre-pull essential Docker images (parallel)
{
    docker pull node:18-ubuntu &
    docker pull owasp/zap2docker-stable &
    docker pull nginx:alpine &
    docker pull redis:alpine &
    wait
} &

# Create rapid lab directory
mkdir -p /opt/rapid-lab
cd /opt/rapid-lab

# Create rapid Docker Compose configuration
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Node.js Security Lab
  nodejs-lab:
    image: node:18-ubuntu
    container_name: rapid-nodejs-lab
    ports:
      - "3000:3000"
      - "9229:9229"  # Debug port
    volumes:
      - ./app:/app
      - ./logs:/var/log/app
    working_dir: /app
    command: bash -c "npm install --production && npm start"
    environment:
      - NODE_ENV=production
    networks:
      - rapid-network
    restart: unless-stopped

  # OWASP ZAP (lightweight config)
  zap:
    image: owasp/zap2docker-stable
    container_name: rapid-zap
    ports:
      - "8080:8080"
    volumes:
      - zap-data:/zap/wrk
    command: zap-webswing.sh
    networks:
      - rapid-network
    restart: unless-stopped

  # Nginx (reverse proxy)
  nginx:
    image: nginx:alpine
    container_name: rapid-nginx
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/html:/usr/share/nginx/html:ro
    networks:
      - rapid-network
    restart: unless-stopped
    depends_on:
      - nodejs-lab

  # Redis (for caching)
  redis:
    image: redis:alpine
    container_name: rapid-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    networks:
      - rapid-network
    restart: unless-stopped

volumes:
  zap-data:
  redis-data:

networks:
  rapid-network:
    driver: bridge
EOF

# Create simple Node.js application
mkdir -p app
cat > app/package.json << 'EOF'
{
  "name": "rapid-security-lab",
  "version": "1.0.0",
  "description": "Rapid deployment security lab",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "node --inspect=0.0.0.0:9229 server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5"
  }
}
EOF

cat > app/server.js << 'EOF'
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    deployment: 'rapid'
  });
});

// Lab dashboard
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Rapid Security Lab</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { color: #2c5aa0; margin-bottom: 30px; }
        .service { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 4px; border-left: 4px solid #2c5aa0; }
        .service h3 { margin: 0 0 10px 0; color: #2c5aa0; }
        .service a { color: #0066cc; text-decoration: none; }
        .service a:hover { text-decoration: underline; }
        .status { color: #28a745; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>⚡ Rapid Security Lab</h1>
          <p>Optimized for temporary accounts and fast builds</p>
          <p class="status">Status: Ready for testing</p>
        </div>
        
        <div class="service">
          <h3>🔍 OWASP ZAP Scanner</h3>
          <p>Web application security testing tool</p>
          <a href="http://${process.env.PUBLIC_IP || 'localhost'}:8080" target="_blank">Open ZAP Interface</a>
        </div>
        
        <div class="service">
          <h3>🔄 Redis Cache</h3>
          <p>In-memory data structure store</p>
          <p>Port: 6379 (internal)</p>
        </div>
        
        <div class="service">
          <h3>📊 System Health</h3>
          <p>Monitor lab services status</p>
          <a href="/health" target="_blank">Health Check API</a>
        </div>
        
        <div class="service">
          <h3>🧹 Auto-Cleanup</h3>
          <p>Resources will be automatically cleaned up after 8 hours</p>
          <p>Save your work frequently!</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Rapid Security Lab running on port ${port}`);
  console.log(`Dashboard: http://localhost:${port}`);
});
EOF

# Create Nginx configuration
mkdir -p nginx
cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    upstream nodejs-app {
        server nodejs-lab:3000;
    }
    
    server {
        listen 80;
        server_name _;
        
        location / {
            proxy_pass http://nodejs-app;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }
        
        location /zap {
            proxy_pass http://zap:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
EOF

# Wait for Docker images to finish pulling
wait

# Set ownership
chown -R ubuntu:ubuntu /opt/rapid-lab

# Start services
echo "🚀 Starting rapid lab services..."
cd /opt/rapid-lab
docker-compose up -d

# Create startup script for user
cat > /home/ubuntu/start-rapid-lab.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Rapid Security Lab..."
cd /opt/rapid-lab
docker-compose up -d
echo "✅ Lab started successfully!"
echo "Dashboard: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
EOF

chmod +x /home/ubuntu/start-rapid-lab.sh
chown ubuntu:ubuntu /home/ubuntu/start-rapid-lab.sh

# Create useful aliases
cat >> /home/ubuntu/.bashrc << 'EOF'

# Rapid Lab Aliases
alias lab-start='cd /opt/rapid-lab && docker-compose up -d'
alias lab-stop='cd /opt/rapid-lab && docker-compose down'
alias lab-restart='cd /opt/rapid-lab && docker-compose restart'
alias lab-logs='cd /opt/rapid-lab && docker-compose logs -f'
alias lab-status='cd /opt/rapid-lab && docker-compose ps'
alias lab-ip='curl -s http://169.254.169.254/latest/meta-data/public-ipv4'
EOF

echo "✅ Rapid security lab setup complete!"
echo "Services available at: http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
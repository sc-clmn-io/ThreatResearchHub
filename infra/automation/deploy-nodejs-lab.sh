#!/bin/bash
# One-Click Node.js Security Lab Deployment
# This script sets up everything automatically for Node.js supply chain testing

set -e  # Exit on any error

echo "🚀 Starting Node.js Security Lab Deployment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please log out and back in, then run this script again."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Create lab directory
LAB_DIR="$HOME/nodejs-security-lab"
mkdir -p "$LAB_DIR"
cd "$LAB_DIR"

echo "📁 Created lab directory: $LAB_DIR"

# Create Docker Compose configuration
cat > docker-compose.yml << 'EOF'
version: '3.8'
services:
  nodejs-dev:
    image: node:18-ubuntu
    container_name: nodejs-security-lab
    ports:
      - "3000:3000"
      - "8080:8080"
    volumes:
      - ./workspace:/workspace
      - ./logs:/var/log
    working_dir: /workspace
    environment:
      - NODE_ENV=development
    command: bash -c "
      apt-get update && 
      apt-get install -y build-essential curl git auditd rsyslog &&
      npm config set audit-level moderate &&
      npm config set fund false &&
      npm install -g nodemon pm2 audit-ci &&
      echo 'Node.js Security Lab Ready!' &&
      tail -f /dev/null
    "

  jenkins:
    image: jenkins/jenkins:lts
    container_name: nodejs-jenkins
    ports:
      - "8081:8080"
      - "50000:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    user: root
    environment:
      - JAVA_OPTS=-Djenkins.install.runSetupWizard=false
    command: bash -c "
      apt-get update && 
      apt-get install -y docker.io nodejs npm &&
      npm install -g snyk audit-ci &&
      /usr/local/bin/jenkins.sh
    "

  npm-registry:
    image: verdaccio/verdaccio
    container_name: npm-registry
    ports:
      - "4873:4873"
    volumes:
      - verdaccio_storage:/verdaccio/storage
      - ./verdaccio-config.yaml:/verdaccio/conf/config.yaml

  log-shipper:
    image: fluentd:latest
    container_name: log-shipper
    volumes:
      - ./logs:/fluentd/log
      - ./fluentd.conf:/fluentd/etc/fluent.conf
    ports:
      - "24224:24224"
    environment:
      - FLUENTD_CONF=fluent.conf

volumes:
  jenkins_home:
  verdaccio_storage:
EOF

# Create Verdaccio configuration
cat > verdaccio-config.yaml << 'EOF'
storage: /verdaccio/storage
auth:
  htpasswd:
    file: /verdaccio/storage/htpasswd
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
packages:
  '@*/*':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs
  '**':
    access: $all
    publish: $authenticated
    unpublish: $authenticated
    proxy: npmjs
logs:
  - {type: stdout, format: pretty, level: http}
EOF

# Create Fluentd logging configuration
cat > fluentd.conf << 'EOF'
<source>
  @type tail
  path /fluentd/log/npm.log
  pos_file /var/log/fluentd-npm.log.pos
  tag npm.logs
  format json
</source>

<match npm.**>
  @type file
  path /fluentd/log/processed/npm
  append true
  time_slice_format %Y%m%d
  time_slice_wait 10m
  time_format %Y%m%dT%H%M%S%z
</match>
EOF

# Create workspace directory and sample files
mkdir -p workspace logs
cd workspace

# Create sample vulnerable package.json for testing
cat > package.json << 'EOF'
{
  "name": "security-test-app",
  "version": "1.0.0",
  "description": "Test application for security scanning",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "npm audit",
    "security-scan": "audit-ci --config audit-ci.json"
  },
  "dependencies": {
    "express": "^4.18.0",
    "lodash": "4.17.20"
  },
  "devDependencies": {
    "nodemon": "^2.0.0"
  }
}
EOF

# Create sample application
cat > index.js << 'EOF'
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.json({ 
    message: 'Node.js Security Lab Running!',
    timestamp: new Date().toISOString(),
    environment: 'security-testing'
  });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Security lab app listening at http://0.0.0.0:${port}`);
});
EOF

# Create audit configuration
cat > audit-ci.json << 'EOF'
{
  "low": true,
  "moderate": true,
  "high": true,
  "critical": true,
  "report-type": "full",
  "output-format": "json"
}
EOF

cd ..

echo "🐳 Starting Docker containers..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 30

echo "🔍 Checking service status..."
docker-compose ps

echo "✅ Node.js Security Lab deployed successfully!"
echo ""
echo "🌐 Access Points:"
echo "   • Node.js App:     http://localhost:3000"
echo "   • Jenkins:         http://localhost:8081"
echo "   • npm Registry:    http://localhost:4873"
echo "   • Lab Directory:   $LAB_DIR"
echo ""
echo "🛠️  Next Steps:"
echo "   1. Access Jenkins at http://localhost:8081"
echo "   2. Get Jenkins password: docker exec nodejs-jenkins cat /var/jenkins_home/secrets/initialAdminPassword"
echo "   3. Set up Jenkins with recommended plugins"
echo "   4. Connect to development container: docker exec -it nodejs-security-lab bash"
echo "   5. Start testing with: cd /workspace && npm install"
echo ""
echo "📋 Testing Commands:"
echo "   • Run security scan: npm run security-scan"
echo "   • Check for vulnerabilities: npm audit"
echo "   • View logs: docker-compose logs -f"
echo ""
echo "🎯 Lab is ready for Node.js supply chain security testing!"
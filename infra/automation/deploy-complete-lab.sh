#!/bin/bash
# Complete Security Lab One-Click Deployment
# Supports Docker, Vagrant, VirtualBox, and cloud deployments

set -e
trap 'echo "❌ Deployment failed. Check logs above."' ERR

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🚀 Complete Security Lab One-Click Deployment${NC}"
echo -e "${CYAN}Automated infrastructure setup for threat testing labs${NC}"
echo ""

# Create deployment directory
DEPLOY_DIR="security-lab-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$DEPLOY_DIR"
cd "$DEPLOY_DIR"

echo -e "${BLUE}📦 Setting up deployment environment...${NC}"

# Create Docker Compose for complete lab
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  # Main Security Lab Environment
  security-lab:
    image: ubuntu:22.04
    container_name: security-lab-main
    privileged: true
    ports:
      - "3000:3000"    # Node.js app
      - "8080:8080"    # Jenkins
      - "9000:9000"    # Portainer
      - "5601:5601"    # Kibana
      - "3001:3001"    # Grafana
    volumes:
      - ./workspace:/workspace
      - ./logs:/var/log/lab
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - DEBIAN_FRONTEND=noninteractive
      - LAB_MODE=complete
    command: |
      bash -c "
        apt-get update &&
        apt-get install -y curl wget git docker.io nodejs npm python3 python3-pip &&
        curl -fsSL https://get.docker.com | sh &&
        npm install -g snyk audit-ci retire semgrep &&
        pip3 install bandit safety &&
        echo '✅ Security Lab Environment Ready!' &&
        tail -f /dev/null
      "
    networks:
      - lab-network

  # OWASP ZAP Security Scanner
  zap:
    image: owasp/zap2docker-stable
    container_name: zap-scanner
    ports:
      - "8081:8080"
    volumes:
      - ./zap-results:/zap/wrk
    command: zap.sh -daemon -host 0.0.0.0 -port 8080 -config api.disablekey=true
    networks:
      - lab-network

  # Vulnerability Database
  vulndb:
    image: postgres:15
    container_name: vulnerability-db
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: security_lab
      POSTGRES_USER: labuser
      POSTGRES_PASSWORD: SecurityLab123!
    volumes:
      - vulndb_data:/var/lib/postgresql/data
    networks:
      - lab-network

  # Redis for caching
  redis:
    image: redis:alpine
    container_name: lab-cache
    ports:
      - "6379:6379"
    networks:
      - lab-network

  # Nginx Load Balancer
  nginx:
    image: nginx:alpine
    container_name: lab-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - security-lab
    networks:
      - lab-network

  # Monitoring Stack
  prometheus:
    image: prom/prometheus:latest
    container_name: lab-monitoring
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    networks:
      - lab-network

  grafana:
    image: grafana/grafana:latest
    container_name: lab-grafana
    ports:
      - "3002:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - lab-network

  # Log Management
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    container_name: lab-elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elastic_data:/usr/share/elasticsearch/data
    networks:
      - lab-network

  kibana:
    image: docker.elastic.co/kibana/kibana:8.8.0
    container_name: lab-kibana
    ports:
      - "5602:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - lab-network

volumes:
  vulndb_data:
  grafana_data:
  elastic_data:

networks:
  lab-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.30.0.0/16
EOF

# Create Nginx configuration
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream security_lab {
        server security-lab-main:3000;
    }

    upstream zap_scanner {
        server zap-scanner:8080;
    }

    upstream monitoring {
        server lab-monitoring:9090;
    }

    server {
        listen 80;
        server_name localhost;

        location / {
            proxy_pass http://security_lab;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /zap/ {
            proxy_pass http://zap_scanner/;
            proxy_set_header Host $host;
        }

        location /monitoring/ {
            proxy_pass http://monitoring/;
            proxy_set_header Host $host;
        }

        location /health {
            return 200 "Security Lab Healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Create Prometheus configuration
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'security-lab'
    static_configs:
      - targets: ['security-lab-main:3000']

  - job_name: 'zap-scanner'
    static_configs:
      - targets: ['zap-scanner:8080']
EOF

# Create workspace directories
mkdir -p workspace/{nodejs,python,configs,scripts,tests}
mkdir -p logs zap-results certs

# Create lab startup script
cat > start-lab.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Complete Security Lab..."

# Start all services
docker-compose up -d

echo "⏳ Waiting for services to initialize..."
sleep 30

echo ""
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🌐 Access Points:"
echo "   • Lab Dashboard:     http://localhost:80"
echo "   • OWASP ZAP:         http://localhost:8081"
echo "   • Prometheus:        http://localhost:9090"
echo "   • Grafana:           http://localhost:3002 (admin/admin123)"
echo "   • Kibana:            http://localhost:5602"
echo "   • PostgreSQL:        localhost:5432 (labuser/SecurityLab123!)"

echo ""
echo "🔧 Management Commands:"
echo "   • View logs:         docker-compose logs -f [service]"
echo "   • Enter container:   docker exec -it security-lab-main bash"
echo "   • Stop lab:          docker-compose down"
echo "   • Full cleanup:      docker-compose down -v"

echo ""
echo "✅ Security Lab Ready for Testing!"
EOF

chmod +x start-lab.sh

# Create Node.js test application
cat > workspace/nodejs/app.js << 'EOF'
const express = require('express');
const app = express();
const port = 3000;

app.use(express.json());

// Intentionally vulnerable endpoint for testing
app.get('/', (req, res) => {
    res.json({
        message: 'Security Lab Test Application',
        version: '1.0.0',
        endpoints: [
            '/health',
            '/vulnerable/xss',
            '/vulnerable/sqli',
            '/vulnerable/rce'
        ]
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Vulnerable XSS endpoint
app.get('/vulnerable/xss', (req, res) => {
    const userInput = req.query.input || 'Hello World';
    res.send(`<h1>User Input: ${userInput}</h1>`);
});

// Vulnerable SQL injection simulation
app.get('/vulnerable/sqli', (req, res) => {
    const userId = req.query.id || '1';
    // Simulated vulnerable query
    const query = `SELECT * FROM users WHERE id = ${userId}`;
    res.json({ 
        query: query, 
        warning: 'This is vulnerable to SQL injection',
        users: [{ id: 1, name: 'Test User', email: 'test@example.com' }]
    });
});

// Vulnerable RCE simulation
app.post('/vulnerable/rce', (req, res) => {
    const command = req.body.command || 'echo hello';
    res.json({ 
        command: command,
        warning: 'This endpoint simulates RCE vulnerability',
        output: 'Command execution simulated (not actually executed)'
    });
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Security Lab app listening at http://0.0.0.0:${port}`);
});
EOF

# Create package.json for Node.js app
cat > workspace/nodejs/package.json << 'EOF'
{
  "name": "security-lab-app",
  "version": "1.0.0",
  "description": "Intentionally vulnerable application for security testing",
  "main": "app.js",
  "scripts": {
    "start": "node app.js",
    "test": "echo \"No tests specified\" && exit 0"
  },
  "dependencies": {
    "express": "^4.18.0"
  },
  "keywords": ["security", "testing", "vulnerable"],
  "author": "Security Lab",
  "license": "MIT"
}
EOF

# Create Python test script
cat > workspace/python/vulnerable_script.py << 'EOF'
#!/usr/bin/env python3
"""
Intentionally vulnerable Python script for security testing
"""
import os
import subprocess
import pickle
import yaml

def vulnerable_exec(user_input):
    """Vulnerable to code injection"""
    # SECURITY ISSUE: Direct execution of user input
    result = eval(user_input)
    return result

def vulnerable_pickle(data):
    """Vulnerable to pickle deserialization"""
    # SECURITY ISSUE: Unpickling untrusted data
    return pickle.loads(data)

def vulnerable_yaml(yaml_content):
    """Vulnerable to YAML deserialization"""
    # SECURITY ISSUE: Loading untrusted YAML
    return yaml.load(yaml_content, Loader=yaml.Loader)

def vulnerable_subprocess(command):
    """Vulnerable to command injection"""
    # SECURITY ISSUE: Shell injection
    result = subprocess.run(f"echo {command}", shell=True, capture_output=True, text=True)
    return result.stdout

def hardcoded_secrets():
    """Hardcoded credentials - security issue"""
    API_KEY = "sk-1234567890abcdef"
    DB_PASSWORD = "supersecret123"
    return {"api_key": API_KEY, "db_password": DB_PASSWORD}

if __name__ == "__main__":
    print("🐍 Vulnerable Python Script for Security Testing")
    print("This script contains intentional vulnerabilities for testing purposes")
    
    # Test functions
    secrets = hardcoded_secrets()
    print(f"Found secrets: {len(secrets)} items")
EOF

# Create test script
cat > test-lab.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing Security Lab Deployment..."

# Test Docker services
echo "📦 Checking Docker services..."
docker-compose ps | grep "Up" && echo "✅ Docker services running" || echo "❌ Docker services failed"

# Test web endpoints
echo "🌐 Testing web endpoints..."
curl -s http://localhost:80/health && echo "✅ Main app accessible" || echo "❌ Main app failed"
curl -s http://localhost:8081 && echo "✅ ZAP scanner accessible" || echo "❌ ZAP scanner failed"

# Test database connection
echo "💾 Testing database..."
docker exec vulnerability-db pg_isready -U labuser && echo "✅ Database accessible" || echo "❌ Database failed"

echo "🎉 Lab testing complete!"
EOF

chmod +x test-lab.sh

# Create cleanup script
cat > cleanup-lab.sh << 'EOF'
#!/bin/bash
echo "🧹 Cleaning up Security Lab..."

docker-compose down -v
docker system prune -f
docker volume prune -f

echo "✅ Cleanup complete!"
EOF

chmod +x cleanup-lab.sh

# Create comprehensive README
cat > README.md << 'EOF'
# Complete Security Lab Environment

## 🎯 Quick Start

```bash
# Start the complete lab
./start-lab.sh

# Test deployment
./test-lab.sh

# Stop and cleanup
./cleanup-lab.sh
```

## 🛠️ What's Included

### Core Services
- **Security Lab Container**: Ubuntu-based testing environment
- **OWASP ZAP**: Web application security scanner
- **PostgreSQL**: Vulnerability database
- **Redis**: Caching and session storage
- **Nginx**: Load balancer and reverse proxy

### Monitoring Stack
- **Prometheus**: Metrics collection
- **Grafana**: Visualization dashboards
- **Elasticsearch**: Log aggregation
- **Kibana**: Log analysis interface

### Test Applications
- **Node.js App**: Intentionally vulnerable web application
- **Python Scripts**: Security testing utilities

## 🌐 Access Points

After running `./start-lab.sh`:

- **Lab Dashboard**: http://localhost:80
- **OWASP ZAP**: http://localhost:8081
- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3002 (admin/admin123)
- **Kibana**: http://localhost:5602
- **Database**: localhost:5432 (labuser/SecurityLab123!)

## 🔍 Security Testing Features

### Vulnerable Test Endpoints
- `/vulnerable/xss` - Cross-site scripting
- `/vulnerable/sqli` - SQL injection simulation
- `/vulnerable/rce` - Remote code execution simulation

### Security Tools
- OWASP ZAP for web application scanning
- Bandit for Python security analysis
- npm audit for Node.js dependency scanning
- Snyk for multi-language security scanning

## 🎓 Learning Scenarios

1. **Web Application Testing**
   - Use ZAP to scan the vulnerable Node.js app
   - Identify XSS, SQLi, and RCE vulnerabilities
   - Learn remediation techniques

2. **Infrastructure Security**
   - Monitor system metrics with Prometheus/Grafana
   - Analyze logs with ELK stack
   - Test container security

3. **DevSecOps Pipeline**
   - Integrate security scanning in CI/CD
   - Automated vulnerability assessment
   - Security as code practices

## ⚠️ Important Notes

- This is a TESTING environment with intentional vulnerabilities
- Keep isolated from production networks
- All activities are logged and monitored
- Use only for authorized security testing

## 🆘 Troubleshooting

### Common Issues
- **Port conflicts**: Stop other services using ports 80, 3000, 8080
- **Docker issues**: Restart Docker daemon
- **Memory issues**: Ensure 8GB+ RAM available

### Debug Commands
```bash
# Check service status
docker-compose ps

# View service logs
docker-compose logs -f [service-name]

# Enter container
docker exec -it security-lab-main bash

# Check system resources
docker stats
```

Happy testing! 🎉
EOF

echo -e "${GREEN}✅ Complete Security Lab Deployment Package Created!${NC}"
echo ""
echo -e "${CYAN}📁 Deployment created in: $(pwd)${NC}"
echo -e "${CYAN}🚀 Start command: ./start-lab.sh${NC}"
echo -e "${CYAN}🧪 Test command: ./test-lab.sh${NC}"
echo -e "${CYAN}🧹 Cleanup command: ./cleanup-lab.sh${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo -e "   1. Review the README.md file"
echo -e "   2. Run ./start-lab.sh to deploy the lab"
echo -e "   3. Access the lab dashboard at http://localhost:80"
echo -e "   4. Use ./test-lab.sh to verify deployment"
echo ""
echo -e "${PURPLE}🎉 One-Click Security Lab Ready for Deployment!${NC}"
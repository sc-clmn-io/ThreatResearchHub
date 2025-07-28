#!/usr/bin/env python3
"""
Docker Escape Detection Lab - Python Deployment Automation
Provides cross-platform deployment automation with comprehensive error handling
"""

import os
import sys
import subprocess
import json
import time
import requests
import platform
import shutil
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import argparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('lab-deployment.log'),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class LabDeployment:
    """Main deployment orchestrator for Docker Escape Detection Lab"""
    
    def __init__(self, config: Dict):
        self.config = config
        self.lab_dir = Path(config.get('lab_directory', 'docker-escape-lab'))
        self.platform = platform.system().lower()
        self.deployment_steps = []
        
    def check_prerequisites(self) -> bool:
        """Check system prerequisites"""
        logger.info("🔍 Checking system prerequisites...")
        
        # Check Docker
        if not self._command_exists('docker'):
            logger.error("❌ Docker not found. Please install Docker Desktop")
            return False
        logger.info("✅ Docker is installed")
        
        # Check Docker Compose
        if not self._command_exists('docker-compose') and not self._command_exists('docker compose'):
            logger.error("❌ Docker Compose not found")
            return False
        logger.info("✅ Docker Compose is available")
        
        # Check Docker daemon
        try:
            subprocess.run(['docker', 'info'], capture_output=True, check=True)
            logger.info("✅ Docker daemon is running")
        except subprocess.CalledProcessError:
            logger.error("❌ Docker daemon is not running. Please start Docker")
            return False
            
        # Check disk space (10GB minimum)
        free_space = shutil.disk_usage('.').free / (1024**3)  # GB
        if free_space < 10:
            logger.warning(f"⚠️  Low disk space: {free_space:.1f}GB available")
        else:
            logger.info(f"✅ Sufficient disk space: {free_space:.1f}GB available")
            
        return True
    
    def create_project_structure(self) -> bool:
        """Create lab directory structure"""
        logger.info("📁 Creating project structure...")
        
        try:
            # Backup existing directory if it exists
            if self.lab_dir.exists():
                backup_name = f"{self.lab_dir}.backup.{int(time.time())}"
                self.lab_dir.rename(backup_name)
                logger.info(f"📦 Backed up existing directory to {backup_name}")
            
            # Create directory structure
            directories = [
                'configs/falco',
                'configs/filebeat', 
                'configs/xsiam',
                'logs/falco',
                'logs/filebeat',
                'logs/response',
                'scripts/response',
                'scripts/automation',
                'data'
            ]
            
            for dir_path in directories:
                (self.lab_dir / dir_path).mkdir(parents=True, exist_ok=True)
                
            logger.info("✅ Project structure created")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create project structure: {e}")
            return False
    
    def generate_docker_compose(self) -> bool:
        """Generate Docker Compose configuration"""
        logger.info("🐳 Creating Docker Compose configuration...")
        
        compose_content = """version: '3.8'

services:
  # Falco - Runtime Security Monitoring
  falco:
    image: falcosecurity/falco-no-driver:latest
    container_name: docker-escape-falco
    privileged: true
    volumes:
      - /var/run/docker.sock:/host/var/run/docker.sock
      - /dev:/host/dev
      - /proc:/host/proc:ro
      - /boot:/host/boot:ro
      - /lib/modules:/host/lib/modules:ro
      - /usr:/host/usr:ro
      - /etc:/host/etc:ro
      - ./configs/falco/falco_rules.yaml:/etc/falco/falco_rules_local.yaml
      - ./logs/falco:/var/log/falco
    environment:
      - FALCO_GRPC_ENABLED=true
      - FALCO_GRPC_BIND_ADDRESS=0.0.0.0:5060
    ports:
      - "5060:5060"
    networks:
      - monitoring
    restart: unless-stopped

  # Elasticsearch for log storage
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: docker-escape-elastic
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms2g -Xmx4g"
    ports:
      - "9200:9200"
    volumes:
      - elastic_data:/usr/share/elasticsearch/data
    networks:
      - monitoring
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 5

  # Kibana for log visualization
  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: docker-escape-kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      elasticsearch:
        condition: service_healthy
    networks:
      - monitoring
    restart: unless-stopped

  # Filebeat for log forwarding
  filebeat:
    image: docker.elastic.co/beats/filebeat:8.11.0
    container_name: docker-escape-filebeat
    user: root
    volumes:
      - ./configs/filebeat/filebeat.yml:/usr/share/filebeat/filebeat.yml:ro
      - ./logs:/var/log/lab:ro
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
      - /var/run/docker.sock:/var/run/docker.sock:ro
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      elasticsearch:
        condition: service_healthy
    networks:
      - monitoring
    restart: unless-stopped

  # Vulnerable container for testing
  vulnerable-container:
    image: alpine:latest
    container_name: escape-test-target
    command: sh -c "while true; do sleep 30; done"
    volumes:
      - /:/host-root:ro
    networks:
      - monitoring
    restart: unless-stopped

  # Attack simulation container
  attack-simulator:
    image: alpine:latest
    container_name: attack-simulator
    command: sh -c "apk add --no-cache curl nmap && while true; do sleep 60; done"
    networks:
      - monitoring
    restart: unless-stopped

volumes:
  elastic_data:

networks:
  monitoring:
    driver: bridge
"""
        
        try:
            with open(self.lab_dir / 'docker-compose.yml', 'w') as f:
                f.write(compose_content)
            logger.info("✅ Docker Compose configuration created")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to create Docker Compose file: {e}")
            return False
    
    def generate_configurations(self) -> bool:
        """Generate Falco and Filebeat configurations"""
        logger.info("⚙️  Creating security configurations...")
        
        # Falco rules
        falco_rules = """# Container Escape Detection Rules

- rule: Container Escape via Privileged Mount
  desc: Detect container attempting to access host filesystem
  condition: >
    spawned_process and
    container and
    (proc.name in (sh, bash, dash, ash, zsh) or
     proc.name in (cat, ls, find, mount, umount)) and
    (fd.name startswith /host-root or
     fd.name startswith /host or
     fd.name contains /proc/1/root or
     fd.name contains /etc/shadow or
     fd.name contains /etc/passwd or
     fd.name contains /root/)
  output: >
    Container escape attempt detected (proc=%proc.name pid=%proc.pid 
    container=%container.name image=%container.image.repository 
    file=%fd.name command=%proc.cmdline user=%user.name)
  priority: CRITICAL
  tags: [container, escape, privilege_escalation, T1611]

- rule: Docker Socket Access from Container
  desc: Detect container accessing Docker socket
  condition: >
    spawned_process and
    container and
    (fd.name=/var/run/docker.sock or
     fd.name=/host/var/run/docker.sock or
     proc.args contains "docker.sock")
  output: >
    Container accessing Docker socket (proc=%proc.name pid=%proc.pid 
    container=%container.name image=%container.image.repository 
    command=%proc.cmdline)
  priority: CRITICAL
  tags: [container, escape, docker, T1609]

- rule: Container Privilege Escalation
  desc: Detect privilege escalation inside container
  condition: >
    spawned_process and
    container and
    (proc.name in (sudo, su, newgrp) or
     (proc.args contains "--privileged" or
      proc.args contains "CAP_SYS_ADMIN" or
      proc.args contains "CAP_DAC_OVERRIDE"))
  output: >
    Container privilege escalation attempt (proc=%proc.name pid=%proc.pid 
    container=%container.name command=%proc.cmdline)
  priority: HIGH
  tags: [container, privilege_escalation, T1548]
"""
        
        # Filebeat configuration
        filebeat_config = """filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/lab/falco/*.log
  fields:
    log_type: falco_security
    environment: lab
    deployment: docker-escape-detection
  fields_under_root: true
  multiline.pattern: '^\\{'
  multiline.negate: true
  multiline.match: after
  json.keys_under_root: true
  json.add_error_key: true

- type: docker
  enabled: true
  containers.ids:
    - "*"
  containers.stream: "all"
  containers.path: "/var/lib/docker/containers"

processors:
- add_host_metadata:
    when.not.contains.tags: forwarded
- add_docker_metadata: ~

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "docker-escape-lab-%{+yyyy.MM.dd}"

setup.template.name: "docker-escape-lab"
setup.template.pattern: "docker-escape-lab-*"

setup.kibana:
  host: "kibana:5601"

logging.level: info
"""
        
        try:
            # Write Falco rules
            with open(self.lab_dir / 'configs/falco/falco_rules.yaml', 'w') as f:
                f.write(falco_rules)
                
            # Write Filebeat config
            with open(self.lab_dir / 'configs/filebeat/filebeat.yml', 'w') as f:
                f.write(filebeat_config)
                
            logger.info("✅ Security configurations created")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create configurations: {e}")
            return False
    
    def create_automation_scripts(self) -> bool:
        """Create automation and response scripts"""
        logger.info("🤖 Creating automation scripts...")
        
        # Attack simulation script
        attack_script = """#!/bin/bash
# Simulate various container escape attacks for testing

echo "Starting attack simulation suite..."

# Test 1: Host filesystem access
echo "Test 1: Simulating host filesystem access..."
docker exec escape-test-target sh -c "ls /host-root/etc/ 2>/dev/null || echo 'Host access blocked'"
sleep 2

# Test 2: Docker socket access
echo "Test 2: Simulating Docker socket access..."
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock alpine:latest sh -c "ls -la /var/run/docker.sock 2>/dev/null || echo 'Socket access blocked'"
sleep 2

# Test 3: Privileged operations
echo "Test 3: Simulating privileged operations..."
docker exec escape-test-target sh -c "mount 2>/dev/null || echo 'Mount operation blocked'"
sleep 2

echo "Attack simulation completed. Check Falco logs for detection results."
"""
        
        # Health check script
        health_script = """#!/bin/bash
# Check health of all lab components

echo "=== Docker Escape Detection Lab Health Check ==="
echo "Timestamp: $(date)"
echo

# Check container status
echo "1. Container Status:"
docker-compose ps
echo

# Check Elasticsearch
echo "2. Elasticsearch Health:"
curl -s http://localhost:9200/_cluster/health | python3 -m json.tool 2>/dev/null || echo "Elasticsearch unavailable"
echo

# Check Kibana
echo "3. Kibana Status:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:5601 | grep -q "200" && echo "Kibana: OK" || echo "Kibana: NOT READY"
echo

echo "Health check completed."
"""
        
        try:
            # Write attack simulation script
            script_path = self.lab_dir / 'scripts/automation/simulate_attacks.sh'
            with open(script_path, 'w') as f:
                f.write(attack_script)
            script_path.chmod(0o755)
            
            # Write health check script
            health_path = self.lab_dir / 'scripts/automation/health_check.sh'
            with open(health_path, 'w') as f:
                f.write(health_script)
            health_path.chmod(0o755)
            
            logger.info("✅ Automation scripts created")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to create automation scripts: {e}")
            return False
    
    def deploy_services(self) -> bool:
        """Deploy Docker services"""
        logger.info("🚀 Deploying lab services...")
        
        try:
            # Change to lab directory
            os.chdir(self.lab_dir)
            
            # Pull images first
            logger.info("📥 Pulling Docker images...")
            subprocess.run(['docker', 'compose', 'pull'], check=True)
            
            # Start services
            logger.info("🔄 Starting services...")
            subprocess.run(['docker', 'compose', 'up', '-d'], check=True)
            
            logger.info("✅ Services deployed successfully")
            return True
            
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ Failed to deploy services: {e}")
            return False
    
    def wait_for_services(self) -> bool:
        """Wait for services to be ready"""
        logger.info("⏳ Waiting for services to initialize...")
        
        services = {
            'Elasticsearch': 'http://localhost:9200/_cluster/health',
            'Kibana': 'http://localhost:5601',
        }
        
        for service_name, url in services.items():
            logger.info(f"🔍 Checking {service_name}...")
            for attempt in range(30):  # 5 minutes total
                try:
                    response = requests.get(url, timeout=5)
                    if response.status_code == 200:
                        logger.info(f"✅ {service_name} is ready")
                        break
                except requests.exceptions.RequestException:
                    pass
                
                if attempt < 29:  # Don't sleep on last attempt
                    time.sleep(10)
            else:
                logger.warning(f"⚠️  {service_name} may still be initializing")
        
        return True
    
    def run_tests(self) -> bool:
        """Run initial tests"""
        logger.info("🧪 Running initial tests...")
        
        try:
            # Wait for containers to settle
            time.sleep(10)
            
            # Run attack simulation
            result = subprocess.run([
                str(self.lab_dir / 'scripts/automation/simulate_attacks.sh')
            ], capture_output=True, text=True)
            
            logger.info("Attack simulation output:")
            logger.info(result.stdout)
            
            # Check for generated alerts
            time.sleep(5)
            alert_result = subprocess.run([
                'docker', 'logs', 'docker-escape-falco'
            ], capture_output=True, text=True)
            
            critical_alerts = alert_result.stdout.count('CRITICAL')
            high_alerts = alert_result.stdout.count('HIGH')
            
            if critical_alerts > 0 or high_alerts > 0:
                logger.info(f"✅ Generated {critical_alerts} CRITICAL and {high_alerts} HIGH alerts")
            else:
                logger.warning("⚠️  No alerts generated yet (services may still be initializing)")
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to run tests: {e}")
            return False
    
    def generate_summary(self) -> bool:
        """Generate deployment summary"""
        logger.info("📋 Generating deployment summary...")
        
        summary = f"""# Docker Escape Detection Lab - Deployment Summary

**Deployment Date:** {time.strftime('%Y-%m-%d %H:%M:%S')}
**Lab Directory:** {self.lab_dir.resolve()}
**Platform:** {platform.system()} {platform.release()}
**Deployed by:** Python Automation Script

## Services Deployed

- **Falco**: Runtime security monitoring (Port 5060)
- **Elasticsearch**: Log storage and search (Port 9200)
- **Kibana**: Log visualization dashboard (Port 5601)
- **Filebeat**: Log forwarding agent
- **Test Containers**: Vulnerable targets for testing

## Access URLs

- **Kibana Dashboard**: http://localhost:5601
- **Elasticsearch API**: http://localhost:9200
- **Falco gRPC API**: http://localhost:5060

## Quick Commands

```bash
# Check service status
cd {self.lab_dir}
docker-compose ps

# View Falco alerts
docker logs docker-escape-falco | grep -E "CRITICAL|HIGH"

# Run attack simulation
./scripts/automation/simulate_attacks.sh

# Health check
./scripts/automation/health_check.sh

# Stop lab
docker-compose down

# Start lab
docker-compose up -d
```

## Python Management

```bash
# Redeploy lab
python3 {Path(__file__).name} --redeploy

# Health check via Python
python3 {Path(__file__).name} --health-check

# Run tests via Python
python3 {Path(__file__).name} --run-tests
```

**Lab deployment completed successfully via Python automation!**
"""
        
        try:
            with open(self.lab_dir / 'python-deployment-summary.md', 'w') as f:
                f.write(summary)
            logger.info("✅ Deployment summary saved")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to save summary: {e}")
            return False
    
    def deploy(self) -> bool:
        """Execute full deployment"""
        logger.info("🎯 Starting Docker Escape Detection Lab deployment...")
        
        steps = [
            ("Prerequisites Check", self.check_prerequisites),
            ("Project Structure", self.create_project_structure),
            ("Docker Compose", self.generate_docker_compose),
            ("Configurations", self.generate_configurations),
            ("Automation Scripts", self.create_automation_scripts),
            ("Service Deployment", self.deploy_services),
            ("Service Readiness", self.wait_for_services),
            ("Initial Tests", self.run_tests),
            ("Summary Generation", self.generate_summary),
        ]
        
        for step_name, step_func in steps:
            logger.info(f"🔄 Executing: {step_name}")
            if not step_func():
                logger.error(f"❌ Failed at step: {step_name}")
                return False
            self.deployment_steps.append(step_name)
        
        logger.info("🎉 Lab deployment completed successfully!")
        logger.info("🔗 Kibana Dashboard: http://localhost:5601")
        logger.info("🔗 Elasticsearch API: http://localhost:9200")
        logger.info(f"📖 Full summary: {self.lab_dir}/python-deployment-summary.md")
        
        return True
    
    def health_check(self) -> bool:
        """Perform health check"""
        try:
            os.chdir(self.lab_dir)
            result = subprocess.run([
                str(self.lab_dir / 'scripts/automation/health_check.sh')
            ], capture_output=True, text=True)
            print(result.stdout)
            return result.returncode == 0
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return False
    
    def _command_exists(self, command: str) -> bool:
        """Check if command exists"""
        return shutil.which(command) is not None

def main():
    parser = argparse.ArgumentParser(description='Docker Escape Detection Lab - Python Deployment')
    parser.add_argument('--config', default='config.json', help='Configuration file path')
    parser.add_argument('--lab-dir', default='docker-escape-lab', help='Lab directory name')
    parser.add_argument('--xsiam-url', help='XSIAM tenant URL')
    parser.add_argument('--xsiam-key', help='XSIAM API key')
    parser.add_argument('--health-check', action='store_true', help='Run health check only')
    parser.add_argument('--run-tests', action='store_true', help='Run tests only')
    parser.add_argument('--redeploy', action='store_true', help='Redeploy lab')
    
    args = parser.parse_args()
    
    # Load configuration
    config = {
        'lab_directory': args.lab_dir,
        'xsiam_url': args.xsiam_url or os.getenv('XSIAM_URL', ''),
        'xsiam_api_key': args.xsiam_key or os.getenv('XSIAM_API_KEY', ''),
    }
    
    # Load config file if exists
    if Path(args.config).exists():
        try:
            with open(args.config) as f:
                file_config = json.load(f)
                config.update(file_config)
        except Exception as e:
            logger.warning(f"Failed to load config file: {e}")
    
    deployment = LabDeployment(config)
    
    if args.health_check:
        sys.exit(0 if deployment.health_check() else 1)
    elif args.run_tests:
        sys.exit(0 if deployment.run_tests() else 1)
    else:
        sys.exit(0 if deployment.deploy() else 1)

if __name__ == '__main__':
    main()
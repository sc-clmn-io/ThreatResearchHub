import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Layers, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertTriangle,
  Download,
  Play,
  Settings,
  Network,
  Shield,
  Server
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface LabBuildPlan {
  id: string;
  threatReportId: string;
  threatName: string;
  description: string;
  environmentType: string;
  accessControlRequirements: Record<string, string[]>;
  totalDuration: string;
  totalCost: {
    setup: number;
    hourly: number;
    monthly: number;
  };
  phases: Array<{
    name: string;
    osiLayer: string;
    duration: string;
    steps: string[];
  }>;
  components: Array<{
    id: string;
    name: string;
    type: string;
    osiLayer: string;
    description: string;
    requirements: Record<string, string>;
    estimatedCost?: {
      setup?: number;
      hourly?: number;
      monthly?: number;
    };
  }>;
  steps: Array<{
    id: string;
    title: string;
    description: string;
    instructions: string[];
    commands?: Array<{
      platform: string;
      code: string;
    }>;
    validation: string[];
    duration: string;
  }>;
  ttpExecution: Array<{
    id: string;
    name: string;
    mitreId?: string;
    description: string;
    platform: string;
    expectedLogs: string[];
  }>;
  validation: {
    dataIngestion: string[];
    detectionRules: string[];
    alertGeneration: string[];
    responsePlaybooks: string[];
  };
}

export function LabBuildPlanner() {
  const [threatReportContent, setThreatReportContent] = useState('');
  const [threatReportTitle, setThreatReportTitle] = useState('');
  const [labPlan, setLabPlan] = useState<LabBuildPlan | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [executionProgress, setExecutionProgress] = useState<Record<string, 'pending' | 'running' | 'completed' | 'failed'>>({});
  const [selectedUseCase, setSelectedUseCase] = useState<any>(null);

  // Load selected use case on component mount
  useEffect(() => {
    const storedUseCases = JSON.parse(localStorage.getItem('useCases') || '[]');
    if (storedUseCases.length > 0) {
      // Get the most recent use case or find selected one
      const latestUseCase = storedUseCases[storedUseCases.length - 1];
      setSelectedUseCase(latestUseCase);
      setThreatReportTitle(latestUseCase.title);
      setThreatReportContent(latestUseCase.description + '\n\nThreat Indicators: ' + ((latestUseCase.indicators && latestUseCase.indicators.length > 0) ? latestUseCase.indicators.join(', ') : 'None specified'));
    }
  }, []);

  const generateLabPlan = useMutation({
    mutationFn: async (data: { content: string; title: string }) => {
      // Generate threat-specific infrastructure plan
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate processing
      
      const threat = selectedUseCase || { title: data.title, category: 'endpoint', description: data.content };
      const isNodeJsSupplyChain = threat.title?.toLowerCase().includes('node.js') || threat.title?.toLowerCase().includes('npm');
      const isCloudThreat = threat.category === 'cloud' || threat.title?.toLowerCase().includes('aws') || threat.title?.toLowerCase().includes('azure');
      
      let components, steps, ttpExecution, validation;
      
      if (isNodeJsSupplyChain) {
        // Node.js Supply Chain specific infrastructure
        components = [
          {
            id: 'dev-environment',
            name: 'Development Environment',
            type: 'Virtual Machine',
            osiLayer: 'application',
            description: 'Ubuntu 22.04 LTS with Node.js development stack for package analysis',
            requirements: {
              'CPU': '4 vCPUs',
              'RAM': '8 GB',
              'Storage': '100 GB SSD',
              'OS': 'Ubuntu 22.04 LTS',
              'Software': 'Node.js 18.x, npm, yarn, git'
            },
            estimatedCost: { setup: 0, hourly: 0.50, monthly: 360 }
          },
          {
            id: 'ci-cd-pipeline',
            name: 'CI/CD Pipeline Server',
            type: 'Container Platform',
            osiLayer: 'application',
            description: 'Jenkins/GitLab CI instance for testing malicious package detection',
            requirements: {
              'Platform': 'Docker/Kubernetes',
              'CPU': '2 vCPUs', 
              'RAM': '4 GB',
              'Integrations': 'npm audit, Snyk, OWASP dependency-check'
            },
            estimatedCost: { setup: 100, hourly: 0.25, monthly: 180 }
          },
          {
            id: 'package-registry',
            name: 'Private npm Registry',
            type: 'Package Repository',
            osiLayer: 'application',
            description: 'Verdaccio or Nexus private registry for controlled package testing',
            requirements: {
              'Storage': '50 GB',
              'Bandwidth': '100 Mbps',
              'Features': 'Package scanning, vulnerability analysis'
            },
            estimatedCost: { setup: 50, hourly: 0.15, monthly: 108 }
          },
          {
            id: 'siem-integration',
            name: 'XSIAM Data Collector',
            type: 'Log Management',
            osiLayer: 'presentation',
            description: 'Cortex XSIAM broker for collecting development environment logs',
            requirements: {
              'Log Sources': 'npm install logs, build process logs, file system changes',
              'Data Volume': '1 GB/day',
              'Retention': '90 days'
            },
            estimatedCost: { setup: 0, hourly: 0.10, monthly: 72 }
          }
        ];
        
        steps = [
          {
            id: 'step-1',
            title: 'Deploy Development Environment (Professional Instructions)',
            description: 'Set up computer for testing malicious packages safely',
            instructions: [
              '1. Download Ubuntu 22.04 from ubuntu.com (free operating system)',
              '2. Create new virtual machine using VirtualBox (free software)',
              '3. Give the virtual machine 4 processors and 8 GB memory',
              '4. Install Ubuntu by following the setup wizard',
              '5. Open Terminal (like Command Prompt on Windows)',
              '6. Copy and paste the commands below one at a time',
              '7. Wait for each command to finish before running the next one',
              '8. Test that everything works by typing "node --version"'
            ],
            commands: [
              {
                platform: 'Ubuntu Terminal (Copy & Paste Each Line)',
                code: `# Step 1: Update your system (like Windows Update)
sudo apt update && sudo apt upgrade -y

# Step 2: Install Node.js (programming language for packages)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs build-essential

# Step 3: Set up security logging
npm config set audit-level moderate
npm config set fund false

# Step 4: Create test user (safer than using admin account)
sudo adduser --disabled-password --gecos "" npm-tester
sudo usermod -aG sudo npm-tester

# Step 5: Test everything works
node --version
npm --version`
              },
              {
                platform: 'One-Click Automation Script',
                code: `# DOWNLOAD AND RUN THIS SCRIPT FOR AUTOMATIC SETUP:
# curl -L https://your-platform.com/deploy-nodejs-lab.sh | bash

# OR manually run Docker setup:
docker run -d --name nodejs-lab \\
  -p 3000:3000 \\
  -v /tmp/lab:/workspace \\
  node:18-ubuntu bash -c "
    apt update && apt install -y build-essential curl
    npm config set audit-level moderate
    tail -f /dev/null
  "

# Connect to the container
docker exec -it nodejs-lab bash`
              }
            ],
            validation: [
              'Type "node --version" - should show v18.x.x',
              'Type "npm --version" - should show version number',
              'Type "npm audit --help" - should show help text',
              'Virtual machine runs without errors'
            ],
            duration: '45 minutes'
          },
          {
            id: 'step-2',
            title: 'Set Up Testing Pipeline (Professional Instructions)',
            description: 'Create automated system to check packages for problems',
            instructions: [
              '1. Install Docker Desktop from docker.com (free software)',
              '2. Create new folder on your computer called "security-lab"',
              '3. Open that folder in File Explorer or Finder',
              '4. Create new text file called "docker-compose.yml"',
              '5. Copy the Docker configuration below into that file',
              '6. Open Terminal/Command Prompt in that folder',
              '7. Type "docker-compose up -d" and press Enter',
              '8. Wait 2-3 minutes for everything to download and start',
              '9. Open web browser to http://localhost:8080 (Jenkins)',
              '10. Follow setup wizard to create admin account'
            ],
            commands: [
              {
                platform: 'docker-compose.yml (Save This File)',
                code: `version: '3.8'
services:
  jenkins:
    image: jenkins/jenkins:lts
    container_name: security-jenkins
    ports:
      - "8080:8080"
      - "50000:50000"
    volumes:
      - jenkins_home:/var/jenkins_home
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - JAVA_OPTS=-Djenkins.install.runSetupWizard=false
    user: root
    command: >
      bash -c "
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

volumes:
  jenkins_home:
  verdaccio_storage:`
              },
              {
                platform: 'Start Everything (Run in Terminal)',
                code: `# Navigate to your security-lab folder
cd /path/to/security-lab

# Start all services
docker-compose up -d

# Check everything is running
docker-compose ps

# View Jenkins password (copy this!)
docker exec security-jenkins cat /var/jenkins_home/secrets/initialAdminPassword`
              }
            ],
            validation: [
              'Open http://localhost:8080 - Jenkins login page appears',
              'Open http://localhost:4873 - npm registry page appears',
              'Type "docker-compose ps" - shows 2 services running',
              'Jenkins setup wizard completes successfully'
            ],
            duration: '60 minutes'
          },
          {
            id: 'step-3',
            title: 'Connect to XSIAM (Professional Instructions)', 
            description: 'Send security logs to your XSIAM system',
            instructions: [
              '1. Log into your XSIAM system using web browser',
              '2. Go to Settings → Data Sources → Add Data Source',
              '3. Choose "Syslog" or "File Collection" option',
              '4. Write down the server address XSIAM gives you',
              '5. Download the XSIAM Broker software from XSIAM',
              '6. Install XSIAM Broker on your Ubuntu virtual machine',
              '7. Edit the broker configuration file with your server address',
              '8. Start the broker service',
              '9. Check XSIAM to see if logs are coming in',
              '10. Create test alert to make sure everything works'
            ],
            commands: [
              {
                platform: 'XSIAM Broker Setup (Ubuntu)',
                code: `# Download and install XSIAM Broker
wget https://your-xsiam-server.com/broker/xsiam-broker.deb
sudo dpkg -i xsiam-broker.deb

# Configure logging for npm operations
sudo tee /etc/rsyslog.d/50-npm.conf << EOF
# Log npm operations
if $programname startswith 'npm' then /var/log/npm.log
& stop
EOF

# Restart logging service
sudo systemctl restart rsyslog

# Configure XSIAM Broker
sudo tee /etc/xsiam/broker.conf << EOF
[connection]
server = your-xsiam-server.com
port = 514
protocol = tcp

[npm_logs]
type = file
path = /var/log/npm.log
format = json

[audit_logs]
type = command
command = auditctl -l
interval = 60
EOF

# Start XSIAM Broker
sudo systemctl enable xsiam-broker
sudo systemctl start xsiam-broker`
              },
              {
                platform: 'Test Log Collection',
                code: `# Generate test logs
npm install express --verbose

# Check logs are being created
tail -f /var/log/npm.log

# Check broker is sending logs
sudo systemctl status xsiam-broker

# Test XSIAM connection
sudo journalctl -u xsiam-broker -f`
              }
            ],
            validation: [
              'XSIAM Data Sources page shows "Connected" status',
              'Test npm install command creates logs in XSIAM',
              'XSIAM broker service shows "Active (running)" status',
              'Can create and see test security alert in XSIAM'
            ],
            duration: '75 minutes'
          }
        ];
        
        ttpExecution = [
          {
            id: 'ttp-1',
            name: 'Malicious Package Installation',
            mitreId: 'T1195.002',
            description: 'Install packages with embedded malicious code to test detection',
            platform: 'Node.js/npm',
            expectedLogs: [
              'npm install logs',
              'Package download events', 
              'File system modifications',
              'Network connections from packages',
              'Process execution from node_modules'
            ]
          }
        ];
        
        validation = {
          dataIngestion: [
            'npm installation logs flowing to XSIAM',
            'Package audit results stored and queryable',
            'File integrity events captured for node_modules',
            'CI/CD pipeline logs integrated with XSIAM'
          ],
          detectionRules: [
            'XQL rule detects suspicious package installations',
            'Correlation rule identifies dependency confusion attempts', 
            'Alert triggers on malicious package script execution',
            'Detection covers npm audit bypass attempts'
          ],
          alertGeneration: [
            'High-priority alerts for known malicious packages',
            'Medium alerts for packages with critical vulnerabilities',
            'Information alerts for unusual package installation patterns',
            'Automated enrichment with package metadata'
          ],
          responsePlaybooks: [
            'Automated package quarantine and removal',
            'Developer notification and guidance workflow',
            'CI/CD pipeline isolation and cleanup',
            'Incident escalation for supply chain compromises'
          ]
        };
      } else if (isCloudThreat) {
        // Cloud-specific infrastructure
        components = [
          {
            id: 'cloud-lab',
            name: 'AWS Testing Environment',
            type: 'Cloud Infrastructure', 
            osiLayer: 'network',
            description: 'Isolated AWS account for cloud security testing',
            requirements: {
              'Services': 'EC2, S3, IAM, CloudTrail, GuardDuty',
              'Regions': 'us-east-1, us-west-2',
              'Budget': '$500/month'
            },
            estimatedCost: { setup: 100, hourly: 2.0, monthly: 1440 }
          }
        ];
        steps = [
          {
            id: 'cloud-step-1',
            title: 'Deploy AWS Cloud Lab (Professional Instructions)',
            description: 'Set up Amazon Web Services for cloud security testing',
            instructions: [
              '1. Go to aws.amazon.com and click "Create AWS Account"',
              '2. Enter your email and create password (write these down!)',
              '3. Choose "Personal" account type and enter payment info',
              '4. Verify your phone number when AWS calls you',
              '5. Choose "Basic Support" plan (free)',
              '6. Wait for account activation email (may take 10 minutes)',
              '7. Log into AWS Console at console.aws.amazon.com',
              '8. Click "Services" and find "CloudFormation"',
              '9. Click "Create Stack" and choose "Upload Template"',
              '10. Upload the security-lab-template.yaml file below',
              '11. Name your stack "security-lab" and click "Create"',
              '12. Wait 15-20 minutes for everything to build automatically'
            ],
            commands: [
              {
                platform: 'security-lab-template.yaml (CloudFormation)',
                code: `AWSTemplateFormatVersion: '2010-09-09'
Description: 'Security Lab Environment for Threat Testing'

Resources:
  # Virtual Private Cloud (your private network)
  SecurityLabVPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      Tags:
        - Key: Name
          Value: SecurityLab-VPC

  # Internet Gateway (connects to internet)
  SecurityLabIGW:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: SecurityLab-IGW

  # Test Ubuntu Server
  UbuntuTestServer:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-0c7217cdde317cfec  # Ubuntu 22.04
      InstanceType: t3.medium
      KeyName: !Ref SSHKeyPair
      SecurityGroupIds:
        - !Ref SecurityLabSG
      UserData:
        Fn::Base64: !Sub |
          #!/bin/bash
          apt update && apt upgrade -y
          curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
          apt-get install -y nodejs build-essential docker.io
          systemctl enable docker
          systemctl start docker
          # Install CloudWatch agent
          wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
          dpkg -i amazon-cloudwatch-agent.deb

  # S3 Bucket for logs
  SecurityLogsBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub 'security-lab-logs-\${AWS::AccountId}'
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true

Outputs:
  ServerIP:
    Description: 'IP address of test server'
    Value: !GetAtt UbuntuTestServer.PublicIp
  S3Bucket:
    Description: 'S3 bucket for logs'
    Value: !Ref SecurityLogsBucket`
              },
              {
                platform: 'One-Click AWS Deployment',
                code: `# DOWNLOAD AND RUN THIS SCRIPT FOR AUTOMATIC AWS DEPLOYMENT:
# curl -L https://your-platform.com/deploy-aws-lab.sh | bash

# Script will automatically:
# 1. Install AWS CLI and Terraform
# 2. Deploy complete infrastructure with CloudFormation
# 3. Configure logging and monitoring
# 4. Provide SSH connection details

# Manual connection after deployment:
ssh -i ~/.ssh/id_rsa ubuntu@YOUR-SERVER-IP

# The script outputs all connection details automatically`
              }
            ],
            validation: [
              'AWS Console shows CloudFormation stack "CREATE_COMPLETE"',
              'Can SSH into Ubuntu server using key pair',
              'Server has Node.js, Docker, and AWS CLI installed',
              'S3 bucket appears in AWS S3 console',
              'CloudWatch shows log groups being created'
            ],
            duration: '2 hours'
          }
        ];
        ttpExecution = [{ id: 'cloud-ttp-1', name: 'Cloud Attack Simulation', description: 'Simulate cloud-based attack', platform: 'AWS', expectedLogs: ['CloudTrail events'] }];
        validation = { dataIngestion: ['Cloud logs ingested'], detectionRules: ['Cloud detection rules active'], alertGeneration: ['Cloud alerts configured'], responsePlaybooks: ['Cloud response automated'] };
      } else {
        // Generic endpoint infrastructure
        components = [
          {
            id: 'endpoint-lab',
            name: 'Windows Test Environment',
            type: 'Virtual Machine',
            osiLayer: 'application',
            description: 'Windows 10/11 endpoints for threat simulation',
            requirements: {
              'OS': 'Windows 10/11 Enterprise',
              'CPU': '4 vCPUs',
              'RAM': '8 GB',
              'Tools': 'Sysmon, PowerShell logging'
            },
            estimatedCost: { setup: 0, hourly: 0.75, monthly: 540 }
          }
        ];
        steps = [
          {
            id: 'endpoint-step-1',
            title: 'Deploy Windows Lab (Professional Instructions)',
            description: 'Set up Windows computers for security testing',
            instructions: [
              '1. Download VirtualBox from virtualbox.org (free software)',
              '2. Download Windows 10 ISO from microsoft.com (need license)',
              '3. Create new virtual machine with 4 GB RAM and 50 GB disk',
              '4. Install Windows 10 following the setup wizard',
              '5. Install Windows updates (this may take 1-2 hours)',
              '6. Download PowerShell scripts below to Desktop',
              '7. Right-click PowerShell and "Run as Administrator"',
              '8. Type "Set-ExecutionPolicy Bypass" and press Enter',
              '9. Run the setup script by typing its name',
              '10. Restart computer when script finishes'
            ],
            commands: [
              {
                platform: 'setup-security-lab.ps1 (PowerShell Script)',
                code: `# Windows Security Lab Setup Script
# Save this as setup-security-lab.ps1 on Desktop

Write-Host "Setting up Windows Security Lab..." -ForegroundColor Green

# Install Chocolatey (package manager for Windows)
Write-Host "Installing Chocolatey..." -ForegroundColor Yellow
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install essential tools
Write-Host "Installing security tools..." -ForegroundColor Yellow
choco install -y sysmon
choco install -y wireshark
choco install -y git
choco install -y vscode
choco install -y firefox

# Configure Sysmon for detailed logging
Write-Host "Configuring Sysmon..." -ForegroundColor Yellow
$sysmonConfig = @"
<Sysmon schemaversion="4.40">
  <EventFiltering>
    <ProcessCreate onmatch="exclude"/>
    <FileCreateTime onmatch="exclude"/>
    <NetworkConnect onmatch="exclude"/>
    <ProcessTerminate onmatch="exclude"/>
    <DriverLoad onmatch="exclude"/>
    <ImageLoad onmatch="exclude"/>
    <CreateRemoteThread onmatch="exclude"/>
    <RawAccessRead onmatch="exclude"/>
    <ProcessAccess onmatch="exclude"/>
    <FileCreate onmatch="exclude"/>
    <RegistryEvent onmatch="exclude"/>
    <FileCreateStreamHash onmatch="exclude"/>
    <PipeEvent onmatch="exclude"/>
    <WmiEvent onmatch="exclude"/>
  </EventFiltering>
</Sysmon>
"@

$sysmonConfig | Out-File -FilePath "C:\\sysmon-config.xml" -Encoding UTF8
sysmon -accepteula -i C:\\sysmon-config.xml

# Enable PowerShell logging
Write-Host "Enabling PowerShell logging..." -ForegroundColor Yellow
$regPath = "HKLM:\\SOFTWARE\\Policies\\Microsoft\\Windows\\PowerShell\\ModuleLogging"
New-Item -Path $regPath -Force
Set-ItemProperty -Path $regPath -Name "EnableModuleLogging" -Value 1

# Create test user account
Write-Host "Creating test user..." -ForegroundColor Yellow
$password = ConvertTo-SecureString "TestPassword123!" -AsPlainText -Force
New-LocalUser -Name "SecurityTester" -Password $password -Description "Test account for security labs"
Add-LocalGroupMember -Group "Users" -Member "SecurityTester"

Write-Host "Setup complete! Please restart your computer." -ForegroundColor Green`
              },
              {
                platform: 'One-Click PowerShell Setup',
                code: `# DOWNLOAD AND RUN THIS POWERSHELL SCRIPT:
# Invoke-WebRequest -Uri "https://your-platform.com/deploy-windows-lab.ps1" -OutFile "deploy.ps1"
# Set-ExecutionPolicy Bypass -Scope Process; .\deploy.ps1

# This PowerShell script automatically:
# 1. Installs Chocolatey package manager
# 2. Installs all security tools (Sysmon, Wireshark, etc.)
# 3. Configures comprehensive logging
# 4. Creates test user account
# 5. Sets up desktop shortcuts and lab scripts

# Alternative: Use Docker for Windows containers
docker run -d --name windows-lab \\
  -p 3389:3389 \\
  -e ACCEPT_EULA=Y \\
  mcr.microsoft.com/windows/servercore:ltsc2019`
              }
            ],
            validation: [
              'Sysmon shows in Windows Event Viewer under Applications and Services Logs',
              'PowerShell logging enabled (check Windows Event Viewer)',
              'Test user "SecurityTester" appears in Computer Management → Users',
              'Windows Security shows real-time protection enabled'
            ],
            duration: '90 minutes'
          }
        ];  
        ttpExecution = [{ id: 'endpoint-ttp-1', name: 'Endpoint Attack', description: 'Simulate endpoint attack', platform: 'Windows', expectedLogs: ['Windows Event Logs', 'Sysmon logs'] }];
        validation = { dataIngestion: ['Endpoint logs ingested'], detectionRules: ['Endpoint detection active'], alertGeneration: ['Endpoint alerts configured'], responsePlaybooks: ['Endpoint response automated'] };
      }
      
      return {
        id: 'lab-plan-' + Date.now(),
        threatReportId: selectedUseCase?.id || 'unknown',
        threatName: selectedUseCase?.title || data.title,
        description: selectedUseCase?.description || data.content,
        environmentType: isNodeJsSupplyChain ? 'endpoint' : 'cloud',
        accessControlRequirements: {
          privilegedAccess: [
            'Administrative credentials for deployment platform',
            'Just-In-Time (JIT) access for privileged operations'
          ],
          rbac: [
            'Least-privilege principle implementation',
            'Role separation between attackers and defenders'
          ],
          authentication: [
            'Multi-factor authentication configuration',
            'Single Sign-On (SSO) integration testing'
          ]
        },
        totalDuration: isNodeJsSupplyChain ? '4-5 hours' : '2-3 hours',
        totalCost: {
          setup: components.reduce((sum, c) => sum + (c.estimatedCost?.setup || 0), 0),
          hourly: components.reduce((sum, c) => sum + (c.estimatedCost?.hourly || 0), 0),
          monthly: components.reduce((sum, c) => sum + (c.estimatedCost?.monthly || 0), 0)
        },
        phases: [
          {
            name: 'Infrastructure Deployment',
            osiLayer: 'application',
            duration: isNodeJsSupplyChain ? '3 hours' : '90 minutes',
            steps: components.map(c => `Deploy ${c.name}`)
          },
          {
            name: 'Data Source Integration',
            osiLayer: 'presentation', 
            duration: '60 minutes',
            steps: ['Configure log collection', 'Set up XSIAM integration', 'Validate data flow']
          },
          {
            name: 'Attack Simulation',
            osiLayer: 'application',
            duration: '90 minutes',
            steps: ['Execute TTPs', 'Generate test data', 'Validate detection']
          }
        ],
        components,
        steps,
        ttpExecution,
        validation
      };
    },
    onSuccess: (data) => {
      setLabPlan(data as LabBuildPlan);
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error('Failed to generate lab build plan:', error);
      setIsGenerating(false);
    }
  });

  const executeStep = useMutation({
    mutationFn: async (stepId: string) => {
      // Simulate step execution for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      return { success: true, stepId };
    },
    onSuccess: (_, stepId) => {
      setExecutionProgress(prev => ({ ...prev, [stepId]: 'completed' }));
    },
    onError: (_, stepId) => {
      setExecutionProgress(prev => ({ ...prev, [stepId]: 'failed' }));
    }
  });

  const handleGenerateLabPlan = () => {
    if (!selectedUseCase) return;
    
    setIsGenerating(true);
    generateLabPlan.mutate({
      content: selectedUseCase.description,
      title: selectedUseCase.title
    });
  };

  const handleExecuteStep = (stepId: string) => {
    setExecutionProgress(prev => ({ ...prev, [stepId]: 'running' }));
    setActiveStep(stepId);
    executeStep.mutate(stepId);
  };

  const getOSILayerIcon = (layer: string) => {
    const icons = {
      'physical': Server,
      'network': Network,
      'application': Shield
    };
    const IconComponent = icons[layer as keyof typeof icons] || Layers;
    return <IconComponent className="h-4 w-4" />;
  };

  const getOSILayerColor = (layer: string) => {
    const colors = {
      'physical': 'bg-red-100 text-red-800',
      'data-link': 'bg-orange-100 text-orange-800',
      'network': 'bg-yellow-100 text-yellow-800',
      'transport': 'bg-green-100 text-green-800',
      'session': 'bg-blue-100 text-blue-800',
      'presentation': 'bg-indigo-100 text-indigo-800',
      'application': 'bg-purple-100 text-purple-800'
    };
    return colors[layer as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const renderThreatInput = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Infrastructure Planning for Selected Threat
        </CardTitle>
        <CardDescription>
          {selectedUseCase ? 
            `Generating infrastructure plan for: ${selectedUseCase.title}` :
            'Automatically detect your selected threat scenario for infrastructure planning'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedUseCase ? (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Selected Threat Scenario:</h4>
            <p className="text-sm text-blue-800 mb-2">{selectedUseCase.title}</p>
            <p className="text-xs text-blue-700">{selectedUseCase.description}</p>
            <div className="mt-3 flex gap-2">
              <Badge variant="secondary">{selectedUseCase.category}</Badge>
              <Badge variant={selectedUseCase.severity === 'critical' ? 'destructive' : 'default'}>
                {selectedUseCase.severity}
              </Badge>
            </div>
          </div>
        ) : (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No threat scenario selected. Please go back to Step 2 to select a specific threat for infrastructure planning.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="bg-gray-50 border rounded-lg p-4">
          <h5 className="font-medium mb-2">What this step does:</h5>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Analyzes your selected threat to identify required infrastructure components</li>
            <li>• Creates step-by-step deployment instructions with clear, professional guidance</li>
            <li>• Maps infrastructure to OSI layers for systematic deployment</li>
            <li>• Provides cost estimates and deployment timelines</li>
          </ul>
        </div>
        
        <Button 
          onClick={handleGenerateLabPlan}
          disabled={!selectedUseCase || isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Settings className="h-4 w-4 mr-2 animate-spin" />
              Generating Infrastructure Plan...
            </>
          ) : (
            <>
              <Layers className="h-4 w-4 mr-2" />
              Generate Infrastructure Plan
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );

  const renderPlanOverview = () => {
    if (!labPlan) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{labPlan.threatName}</CardTitle>
          <CardDescription>{labPlan.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">Duration</div>
                <div className="font-medium">{labPlan.totalDuration}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-sm text-gray-600">Monthly Cost</div>
                <div className="font-medium">${labPlan.totalCost.monthly}</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-sm text-gray-600">Components</div>
                <div className="font-medium">{(labPlan.phases || []).length} systems</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-sm text-gray-600">Environment</div>
                <div className="font-medium capitalize">{labPlan.environmentType}</div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <h4 className="font-medium">OSI Layer Phases</h4>
            <Badge variant="outline">{(labPlan.phases || []).length} phases</Badge>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-2">
            {(labPlan.phases || []).map((phase) => (
              <Badge 
                key={phase.name} 
                className={getOSILayerColor(phase.osiLayer)}
              >
                {getOSILayerIcon(phase.osiLayer)}
                <span className="ml-1">{phase.osiLayer}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLabExecution = () => {
    if (!labPlan) return null;

    return (
      <Tabs defaultValue="access-control" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="access-control">Access Control</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
          <TabsTrigger value="deployment">Deployment</TabsTrigger>
          <TabsTrigger value="ttp-execution">TTP Execution</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <TabsContent value="access-control" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                IAM & Access Control Requirements
              </CardTitle>
              <CardDescription>
                Required permissions and access controls for building, deploying, and executing attack simulations in {labPlan.environmentType} environments
              </CardDescription>
            </CardHeader>
            <CardContent>
              {labPlan.accessControlRequirements && (
                <div className="space-y-6">
                  {Object.entries(labPlan.accessControlRequirements).map(([category, requirements]) => (
                    <div key={category} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </Badge>
                      </h4>
                      <div className="grid grid-cols-1 gap-2">
                        {(requirements as string[]).map((requirement, idx) => (
                          <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-sm leading-relaxed">{requirement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h5 className="font-medium text-yellow-800 mb-2">Critical Access Requirements</h5>
                        <p className="text-sm text-yellow-700 mb-3">
                          These permissions are essential for comprehensive lab buildout where ALL data sources forward logs to Cortex XSIAM for centralized threat detection. 
                          The lab must simulate authentic environments with complete log aggregation to validate use cases from threat reports and customer scenarios.
                        </p>
                        <div className="space-y-2">
                          <div className="text-sm text-yellow-800">
                            <strong>Build Phase:</strong> Administrative credentials, Infrastructure-as-Code tools (Terraform/Ansible), and container platform access
                          </div>
                          <div className="text-sm text-yellow-800">
                            <strong>Attack Phase:</strong> Attack simulation frameworks (CALDERA/Atomic Red Team), elevated privileges for malware execution
                          </div>
                          <div className="text-sm text-yellow-800">
                            <strong>Critical Integration:</strong> ALL data sources must forward logs to Cortex XSIAM for comprehensive threat detection and validation of use case scenarios
                          </div>
                          <div className="text-sm text-yellow-800">
                            <strong>Open Source Tools:</strong> Docker, Kubernetes, Metasploit, network simulation, and identity management platforms
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Required Infrastructure Components</CardTitle>
              <CardDescription>OSI layer-mapped infrastructure for threat simulation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(labPlan.components || []).map((component) => (
                  <div key={component.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{component.name}</h4>
                          <Badge className={getOSILayerColor(component.osiLayer)}>
                            {getOSILayerIcon(component.osiLayer)}
                            <span className="ml-1">{component.osiLayer}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{component.description}</p>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(component.requirements || {}).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      {component.estimatedCost && (
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            ${component.estimatedCost.monthly}/mo
                          </div>
                          <div className="text-xs text-gray-500">
                            Setup: ${component.estimatedCost.setup}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step-by-Step Deployment</CardTitle>
              <CardDescription>Execute deployment phases in OSI layer order</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(labPlan.steps || []).map((step) => {
                  const status = executionProgress[step.id] || 'pending';
                  const isActive = activeStep === step.id;
                  
                  return (
                    <div key={step.id} className={`border rounded-lg p-4 ${isActive ? 'border-blue-500' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{step.title}</h4>
                            <Badge variant={
                              status === 'completed' ? 'default' : 
                              status === 'running' ? 'secondary' :
                              status === 'failed' ? 'destructive' : 'outline'
                            }>
                              {status === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
                              {status === 'failed' && <AlertTriangle className="h-3 w-3 mr-1" />}
                              {status}
                            </Badge>
                            <Badge variant="outline">{step.duration}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                        </div>
                        
                        <Button
                          size="sm"
                          variant={status === 'completed' ? 'secondary' : 'default'}
                          onClick={() => handleExecuteStep(step.id)}
                          disabled={status === 'running' || executeStep.isPending}
                        >
                          {status === 'running' ? (
                            <>
                              <Settings className="h-3 w-3 mr-1 animate-spin" />
                              Running...
                            </>
                          ) : status === 'completed' ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </>
                          ) : (
                            <>
                              <Play className="h-3 w-3 mr-1" />
                              Execute
                            </>
                          )}
                        </Button>
                      </div>
                      
                      {isActive && (
                        <div className="mt-3 space-y-2">
                          <h5 className="font-medium text-sm">Instructions:</h5>
                          <ul className="text-sm space-y-1">
                            {(step.instructions || []).map((instruction, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <span className="text-gray-400 mt-1">•</span>
                                <span>{instruction}</span>
                              </li>
                            ))}
                          </ul>
                          
                          {step.commands && step.commands.length > 0 && (
                            <div className="mt-3">
                              <h5 className="font-medium text-sm mb-2">Commands:</h5>
                              {(step.commands || []).map((cmd, idx) => (
                                <div key={idx} className="mb-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <Badge variant="outline">{cmd.platform}</Badge>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                      onClick={() => {
                                        // Create file content based on the platform type
                                        let fileContent = '';
                                        let fileName = '';
                                        
                                        if (cmd.platform.includes('PowerShell') || cmd.platform.includes('Windows')) {
                                          fileName = 'deploy-windows-lab.ps1';
                                          fileContent = `# Windows Security Lab Deployment Script
# Run as Administrator: Set-ExecutionPolicy Bypass -Scope Process; .\\${fileName}

${cmd.code}`;
                                        } else if (cmd.platform.includes('YAML') || cmd.platform.includes('Docker Compose') || cmd.platform.includes('Kubernetes')) {
                                          fileName = cmd.platform.includes('Docker') ? 'docker-compose.yml' : 
                                                   cmd.platform.includes('Kubernetes') ? 'deployment.yaml' : 'config.yml';
                                          fileContent = `# ${cmd.platform} Configuration
# Usage: Apply this configuration to your environment

${cmd.code}`;
                                        } else if (cmd.platform.includes('Terraform') || cmd.platform.includes('AWS') || cmd.platform.includes('Cloud')) {
                                          fileName = cmd.platform.includes('Terraform') ? 'main.tf' : 'deploy-cloud-lab.sh';
                                          fileContent = cmd.platform.includes('Terraform') ? 
                                            `# Terraform Infrastructure Configuration
# Usage: terraform init && terraform plan && terraform apply

${cmd.code}` :
                                            `#!/bin/bash
# Cloud Security Lab Deployment Script
# Usage: chmod +x ${fileName} && ./${fileName}

${cmd.code}`;
                                        } else if (cmd.platform.includes('Ansible')) {
                                          fileName = 'playbook.yml';
                                          fileContent = `# Ansible Playbook Configuration
# Usage: ansible-playbook -i inventory ${fileName}

${cmd.code}`;
                                        } else {
                                          // Default to shell script for other platforms
                                          fileName = 'deploy-lab.sh';
                                          fileContent = `#!/bin/bash
# Security Lab Deployment Script
# Usage: chmod +x ${fileName} && ./${fileName}

${cmd.code}`;
                                        }
                                        
                                        const blob = new Blob([fileContent], { type: 'text/plain' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = fileName;
                                        document.body.appendChild(a);
                                        a.click();
                                        document.body.removeChild(a);
                                        URL.revokeObjectURL(url);
                                      }}
                                    >
                                      <Download className="h-3 w-3 mr-1" />
                                      Download
                                    </Button>
                                  </div>
                                  <pre className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">
                                    <code>{cmd.code}</code>
                                  </pre>
                                </div>
                              ))}
                            </div>
                          )}
                          
                          <div className="mt-3">
                            <h5 className="font-medium text-sm mb-1">Validation:</h5>
                            <ul className="text-sm space-y-1">
                              {(step.validation || []).map((validation, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <span className="text-green-500 mt-1">✓</span>
                                  <span>{validation}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ttp-execution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Threat Tactics, Techniques & Procedures</CardTitle>
              <CardDescription>Execute attack scenarios based on threat report analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(labPlan.ttpExecution || []).map((ttp) => (
                  <div key={ttp.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{ttp.name}</h4>
                          {ttp.mitreId && (
                            <Badge variant="outline">{ttp.mitreId}</Badge>
                          )}
                          <Badge>{ttp.platform}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">{ttp.description}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <h5 className="font-medium text-sm mb-1">Expected Log Sources:</h5>
                      <div className="flex flex-wrap gap-1">
                        {(ttp.expectedLogs || []).map((log, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {log}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Lab Validation Framework</CardTitle>
              <CardDescription>Comprehensive testing and validation procedures</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Data Ingestion</h4>
                  <ul className="text-sm space-y-1">
                    {(labPlan.validation?.dataIngestion || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Detection Rules</h4>
                  <ul className="text-sm space-y-1">
                    {(labPlan.validation?.detectionRules || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Alert Generation</h4>
                  <ul className="text-sm space-y-1">
                    {(labPlan.validation?.alertGeneration || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Response Playbooks</h4>
                  <ul className="text-sm space-y-1">
                    {(labPlan.validation?.responsePlaybooks || []).map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Lab Build Planner</h1>
        <p className="text-gray-600">
          Generate comprehensive, step-by-step lab infrastructure plans from threat reports with OSI layer mapping, 
          Infrastructure as Code deployment, and automated TTP execution scenarios.
        </p>
      </div>

      {renderThreatInput()}
      {renderPlanOverview()}
      {renderLabExecution()}
    </div>
  );
}
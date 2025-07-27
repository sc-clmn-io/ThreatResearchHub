# Identity Infrastructure Setup Guide
*Professional step-by-step guide for infrastructure deployment*

## Overview

This guide provides comprehensive instructions for establishing a complete identity infrastructure testing environment. The deployment enables security professionals to analyze identity-based attack vectors and validate detection capabilities in a controlled environment.

## Prerequisites

### Required Resources
- Administrative workstation with internet connectivity
- Estimated deployment time: 4-6 hours
- Technical proficiency with cloud platforms and Windows Server administration
- AWS account with billing configuration (estimated cost: $50-100 for testing period)

### Infrastructure Components
- AWS Cloud Infrastructure (Amazon Web Services)
- Windows Server 2022 (Enterprise directory services platform)
- Active Directory Domain Services (Identity and access management)
- Okta Identity Platform (Cloud identity management service)

## Phase 1: AWS Account Configuration (30 minutes)

### Account Provisioning
1. Navigate to aws.amazon.com
2. Select "Create an AWS Account"
3. Complete account registration with email address and secure password
4. Provide contact information and billing details
5. Complete identity verification via phone or SMS
6. Select "Basic Support" plan

### Billing Monitoring Configuration
1. Access "Billing & Cost Management" console
2. Navigate to "Billing preferences"
3. Enable "Receive Billing Alerts"
4. Configure cost alert threshold at $50 for budget management

## Phase 2: Network Infrastructure Deployment (45 minutes)

The Virtual Private Cloud (VPC) provides isolated network infrastructure supporting secure communications between laboratory components.

### VPC Configuration
1. Access AWS VPC console
2. Select "Create VPC"
3. Choose "VPC and more" for comprehensive deployment
4. Configure naming: "identity-threat-lab"
5. Set CIDR block: "10.0.0.0/16" for adequate address space
6. Configure single Availability Zone deployment
7. Enable public and private subnet configuration
8. Enable DNS hostnames and DNS resolution
9. Complete VPC creation

### Network Segmentation
- Public subnet: Internet-accessible resources and management interfaces
- Private subnet: Internal infrastructure components with restricted access

## Phase 3: Management Infrastructure Deployment (1 hour)

The jump box serves as the secure administrative access point for managing all laboratory infrastructure components.

### EC2 Instance Configuration
1. Access AWS EC2 console
2. Select "Launch Instance"
3. Configure instance naming: "threat-lab-jumpbox"
4. Select "Microsoft Windows Server 2022 Base" AMI
5. Choose "t3.medium" instance type for adequate performance
6. Key pair configuration:
   - Create new key pair: "threat-lab-key"
   - Download and securely store .pem file
7. Network configuration:
   - Assign to "identity-threat-lab" VPC
   - Deploy in public subnet
   - Create security group: "jumpbox-sg"
   - Configure RDP access (port 3389) restricted to administrative IP
8. Complete instance launch

### Administrative Access Configuration
1. Monitor instance status until "Running" state (approximately 5 minutes)
2. Select instance and choose "Connect"
3. Select "RDP client" connection method
4. Retrieve administrator password using .pem key file
5. Download RDP configuration file
6. Establish remote desktop connection with retrieved credentials
7. Verify successful administrative access to Windows Server environment

## Phase 4: Active Directory Domain Services Deployment (2 hours)

Active Directory provides centralized identity and access management services for the laboratory environment.

### Domain Services Installation
1. Launch Server Manager (opens automatically upon login)
2. Select "Add roles and features"
3. Navigate through installation wizard (select "Next" for default configurations)
4. Select "Active Directory Domain Services" role
5. Accept additional feature requirements when prompted
6. Complete installation wizard
7. Monitor installation progress (approximately 10 minutes)

### Domain Controller Promotion
1. Access post-deployment configuration via Server Manager notification flag
2. Select "Promote this server to a domain controller"
3. Choose "Add a new forest" for new domain deployment
4. Configure domain name: "threatlab.local"
5. Set Directory Services Restore Mode (DSRM) password (document securely)
6. Accept default configuration through remaining wizard screens
7. Complete installation and allow system restart

### User Account Provisioning
1. After system restart, launch "Active Directory Users and Computers"
2. Right-click "Users" organizational unit
3. Select "New" → "User"
4. Create laboratory user accounts:
   - Administrative Account: John Admin (jadmin)
   - Standard User Account: Jane User (juser)  
   - Service Account: Bob Service (bservice)
5. Configure secure passwords compliant with complexity requirements
6. Configure administrative privileges:
   - Access jadmin account properties
   - Navigate to "Member Of" tab
   - Add account to "Domain Admins" security group

## Phase 5: Okta Identity Platform Integration (1 hour)

Okta provides cloud-based identity and access management services for modern enterprise environments.

### Developer Account Provisioning
1. Navigate to developer.okta.com
2. Complete account registration process
3. Provide business email address and create secure credentials
4. Select "Build a SSO integration" as primary use case
5. Access provisioned Okta domain (format: dev-123456.okta.com)

### Active Directory Integration
1. Access Okta administration console
2. Navigate to "Directory" → "Directory Integrations"
3. Select "Add Directory"
4. Choose "Active Directory" integration type
5. Download Okta AD Agent installation package
6. Deploy agent on jump box infrastructure
7. Configure integration with threatlab.local domain
8. Complete user synchronization from Active Directory

### SSO Application Configuration
1. Access "Applications" → "Applications" in Okta console
2. Select "Create App Integration"
3. Choose "SAML 2.0" protocol
4. Configure application naming: "Threat Lab Test App"
5. Apply standard SAML configuration parameters
6. Assign synchronized user accounts to application

## Phase 6: Security Monitoring and Audit Configuration (1 hour)

Comprehensive logging and monitoring capabilities provide visibility into infrastructure activities and security events.

### AWS CloudTrail Configuration
1. Access AWS CloudTrail console
2. Select "Create trail"
3. Configure trail naming: "threat-lab-trail"
4. Provision dedicated S3 bucket for log storage
5. Enable multi-region logging coverage
6. Enable log file validation for integrity verification
7. Complete trail creation and activation

### Windows Event Auditing Configuration
1. Launch Event Viewer on jump box
2. Navigate to "Windows Logs" → "Security"
3. Access Security log properties
4. Configure maximum log size: 100 MB
5. Set log retention policy: "Overwrite events as needed"
6. Enable comprehensive auditing:
   - Launch "Group Policy Management"
   - Edit "Default Domain Policy"
   - Navigate to Computer Configuration → Policies → Windows Settings → Security Settings → Local Policies → Audit Policy
   - Enable "Audit account logon events" and "Audit logon events"

### XSIAM Broker Deployment (Optional)
1. Download XSIAM Broker installation package from tenant console
2. Deploy broker on jump box infrastructure
3. Configure data collection for:
   - Windows Security Event Logs
   - DNS audit logs
   - Active Directory security events
4. Validate data flow and connectivity to XSIAM platform

## Phase 7: Infrastructure Validation and Testing (30 minutes)

Comprehensive testing validates infrastructure deployment and operational readiness.

### Active Directory Validation
1. Authenticate using each provisioned user account
2. Verify jadmin administrative privileges
3. Confirm juser standard user access controls

### Okta Integration Validation
1. Authenticate to Okta console using synchronized accounts  
2. Access configured test application
3. Verify accurate user attribute synchronization

### Monitoring System Validation
1. Review CloudTrail logs for AWS API activity
2. Analyze Windows Event Logs for authentication events
3. Validate XSIAM log ingestion (if configured)

## Infrastructure Summary

The completed deployment provides:
- Isolated AWS cloud infrastructure
- Enterprise Active Directory services
- Cloud identity management via Okta
- Comprehensive security monitoring
- Foundation for identity threat analysis

## Cost Management and Optimization

Infrastructure cost considerations:
- Monthly operational cost: $50-75 (continuous operation)
- Daily testing cost: $2-3 (on-demand usage)
- Resource shutdown recommended when not actively testing

## Advanced Configuration Opportunities

The infrastructure enables:
1. Advanced threat scenario generation and analysis
2. Custom detection rule development in XSIAM
3. Controlled attack simulation and validation
4. Enterprise incident response procedure development

## Technical Support Resources

For technical assistance:
1. Reference AWS official documentation
2. Utilize platform-integrated troubleshooting guides
3. Engage enterprise support channels
4. Leverage community knowledge bases

## Security and Compliance Guidelines

- Laboratory environment isolation from production systems
- Test credentials only - no production data
- Resource deprovisioning after testing completion
- Continuous cost monitoring and budget management
- Strict network segmentation and access control
// Step-by-step documentation templates for engineers with less experience

export const generateBeginnerIntroduction = () => `
# 🚀 Welcome to XSIAM Enterprise Deployment

## What is XSIAM?
XSIAM (Extended Security Intelligence and Automation Management) is Palo Alto Networks' cloud-native security platform that helps organizations detect, investigate, and respond to cyber threats automatically.

## What This Tool Does
This deployment generator creates a complete package that installs your security content (like detection rules and response playbooks) into your XSIAM environment. Think of it like an app installer for security tools.

## Before You Start - Prerequisites
✅ **Access Requirements:**
- XSIAM instance URL (looks like: https://your-company.xsiam.paloaltonetworks.com)
- API key with Content Management permissions
- Administrator or Security Engineer role

✅ **Knowledge Requirements:**
- Basic understanding of your organization's security policies
- Familiarity with your XSIAM tenant (if unsure, contact your security team)

✅ **Time Required:**
- Initial setup: 15-30 minutes
- Content deployment: 5-10 minutes
- Testing and validation: 30-60 minutes

## Security Content Types Explained

### 🔍 **Correlation Rules**
These are like security "sensors" that watch for suspicious patterns in your data:
- Example: "Alert if someone logs in from 2 different countries within 1 hour"
- Written in XQL (XSIAM Query Language) - similar to SQL but for security data

### 📋 **Alert Layouts** 
These control how security alerts look when analysts investigate them:
- Defines which information is displayed (IP addresses, usernames, etc.)
- Makes it easier for analysts to quickly understand threats

### 🤖 **Playbooks**
Automated response workflows that take action when threats are detected:
- Example: "When malware is detected, isolate the computer and notify the security team"
- Reduces response time from hours to minutes

### 📊 **Dashboards**
Visual displays showing your security status:
- Charts showing threat trends, attack types, system health
- Helps security managers understand overall risk

## What Happens During Deployment

### Phase 1: Environment Preparation ⚙️
- Validates your XSIAM connection across all data sources
- Checks permissions for hundreds of vendor integrations
- Maps data source compatibility (Endpoint, Network, Cloud, Identity, Email, etc.)
- Creates comprehensive backup of existing multi-vendor content
- Validates integration endpoints for all connected vendors

### Phase 2: Multi-Vendor Content Installation 📦
- **Data Source Mapping**: Automatically maps content to appropriate data sources (Crowdstrike, Sentinel, Splunk, QRadar, etc.)
- **Vendor-Specific Rules**: Deploys correlation rules tailored to each vendor's data format
- **Cross-Vendor Correlation**: Installs rules that correlate data across multiple vendors
- **Alert Layout Adaptation**: Configures layouts for different vendor alert formats
- **Multi-Source Playbooks**: Deploys response workflows that work across vendor boundaries
- **Unified Dashboards**: Creates dashboards aggregating data from all connected sources

### Phase 3: Multi-Source Testing & Validation ✅
- **Data Source Coverage**: Validates rules work across all integrated vendors
- **Cross-Vendor Correlation**: Tests multi-source threat detection scenarios
- **Vendor-Specific Testing**: Generates test alerts for each data source type
- **Integration Health Checks**: Confirms all vendor connections remain stable
- **Performance Impact Assessment**: Measures impact across hundreds of data sources

## Common Questions

**Q: Will this break my existing XSIAM setup?**
A: No. The tool creates backups and uses safe deployment practices. You can always rollback changes.

**Q: Do I need programming knowledge?**
A: No. The tool handles all technical details. You just need to provide configuration information.

**Q: How long before I see results?**
A: Detection rules activate immediately. You'll see alerts within minutes if threats are present.

**Q: What if something goes wrong?**
A: Every deployment includes automatic rollback scripts and detailed troubleshooting guides.

---
*Ready to proceed? The next step will guide you through environment configuration.*
`;

export const generateStepByStepGuide = (step: number, totalSteps: number, stepName: string, details: any) => {
  const stepTemplates = {
    1: generateEnvironmentConfigGuide,
    2: generateContentSelectionGuide,
    3: generateDeploymentGuide
  };

  const template = stepTemplates[step as keyof typeof stepTemplates];
  return template ? template(details) : generateGenericStepGuide(step, totalSteps, stepName, details);
};

const generateEnvironmentConfigGuide = (details: any) => `
# Step 1 of 3: Environment Configuration 🔧

## What We're Doing
Setting up the connection to your XSIAM environment and configuring deployment preferences.

## Required Information

### 🌐 XSIAM Instance Details
**Your XSIAM URL:** This is where your organization's XSIAM system is hosted.
- Format: https://[tenant-name].xsiam.paloaltonetworks.com
- Example: https://acme-corp.xsiam.paloaltonetworks.com
- ❓ **Don't know your URL?** Check with your IT or security team, or look for "XSIAM" in your organization's password manager.

### 🔑 API Authentication
**API Key:** A secure token that allows this tool to deploy content.
- Looks like: a long string of letters and numbers
- Must have "Content Management" permissions
- ❓ **Don't have an API key?** Ask your XSIAM administrator to create one with these permissions:
  - Content Management (Read/Write)
  - Incidents (Read)
  - Investigation (Read)

### 🏢 Environment Type
Choose based on your deployment:
- **Production:** Live environment serving real users
- **Staging:** Testing environment that mirrors production
- **Development:** Development/testing environment
- **Sandbox:** Isolated testing environment

## Step-by-Step Instructions

### 📝 Step 1.1: Gather Your Information
Before clicking "Configure Environment":

1. **Open a new browser tab** and log into your XSIAM instance
2. **Copy your XSIAM URL** from the address bar (everything before /incident or /investigation)
3. **Locate your API key** (usually in Settings > API Keys) or request one from your admin
4. **Confirm your environment type** with your team lead if unsure

### ⚙️ Step 1.2: Configure Environment Settings
1. Click the **"Configure Environment"** button below
2. **Paste your XSIAM URL** in the first field
3. **Enter your API key** in the security field (it will be hidden)
4. **Select your environment type** from the dropdown
5. **Choose compliance mode** if your organization requires it:
   - **SOX:** Financial compliance (banks, public companies)
   - **PCI:** Payment card industry (e-commerce, payment processors)
   - **HIPAA:** Healthcare compliance (hospitals, health insurers)
   - **GDPR:** European data protection (EU organizations)
   - **Standard:** General enterprise compliance

### 🔍 Step 1.3: Test Connection
After entering details:
1. Click **"Test Connection"** - this verifies your credentials work
2. **Wait for green checkmark** - indicates successful connection
3. **Review permissions report** - shows what access the API key has
4. **Check environment health** - confirms XSIAM is ready for deployment

## ⚠️ Troubleshooting Common Issues

### "Connection Failed" Error
- **Double-check URL format:** Must include https:// and end with .com
- **Verify API key:** Copy-paste carefully, no extra spaces
- **Check permissions:** API key needs Content Management access
- **Network access:** Ensure your computer can reach XSIAM URL

### "Insufficient Permissions" Warning  
- Contact your XSIAM administrator
- Request Content Management permissions for your API key
- May need temporary elevated access for deployment

### "Environment Busy" Message
- XSIAM is processing other operations
- Wait 5-10 minutes and try again
- Check with team if major operations are running

## ✅ When Step 1 is Complete
You'll see:
- ✅ Green "Connected" status
- ✅ Environment details confirmed
- ✅ Permissions validated
- ✅ Ready for content selection

**Estimated time:** 5-10 minutes

---
*Having trouble? Contact your security team or XSIAM administrator for assistance.*
`;

const generateContentSelectionGuide = (details: any) => `
# Step 2 of 3: Multi-Vendor Content Selection & Validation 📋

## What We're Doing
Selecting security content that works across hundreds of individual vendors and multiple data source types in your XSIAM environment.

## Understanding Multi-Vendor Content Complexity

### 🏢 Enterprise Multi-Vendor XSIAM Ecosystem
**The XSIAM Marketplace contains 500+ individual vendor integrations across all security domains:**

**🌐 Cloud & Infrastructure (100+ vendors):**
- AWS services: CloudTrail, GuardDuty, EC2, S3, IAM, Lambda, Security Hub, WAF, Route53, etc.
- Azure services: Security Center, Active Directory, Key Vault, Sentinel, etc.
- GCP services: Security Command Center, Cloud Logging, IAM, etc.
- VMware, Docker, Kubernetes, OpenShift, Terraform, etc.

**🔒 Endpoint & Device Management (80+ vendors):**
- CrowdStrike, SentinelOne, Microsoft Defender, Carbon Black, Symantec, McAfee, Trend Micro
- Absolute, Armis, Claroty, Dragos, Forescout, Lansweeper, Qualys, Rapid7, Tanium, etc.

**🌐 Network Security (60+ vendors):**
- Palo Alto NGFW, Cisco ASA, Fortinet, Check Point, Juniper, F5, SonicWall
- ARIA Packet Intelligence, Darktrace, ExtraHop, Gigamon, Plixer, etc.

**👤 Identity & Access Management (40+ vendors):**
- Active Directory, Okta, Ping Identity, Auth0, CyberArk, SailPoint, OneLogin
- AWS IAM Identity Center, Azure AD, Google Workspace, LDAP, SAML providers, etc.

**📧 Email & Communication Security (30+ vendors):**
- Proofpoint, Mimecast, Microsoft 365 Defender, Abnormal Security, Barracuda
- Cisco Email Security, FireEye Email Security, SpamTitan, etc.

**📊 SIEM & Log Management (25+ vendors):**
- Splunk, IBM QRadar, ArcSight, LogRhythm, Elasticsearch, Sumo Logic
- Chronicle, Graylog, Securonix, etc.

**🔍 Threat Intelligence & Analysis (50+ vendors):**
- ANY.RUN, APIVoid, AbuseIPDB, VirusTotal, ThreatConnect, Recorded Future
- Cofense, CrowdSec, DomainTools, Flashpoint, Mandiant, PassiveTotal, etc.

### 🔍 Content Types for Multi-Vendor Environments

**4-10 Data Source Cross-Vendor Correlation Rules** 
- **Purpose:** Advanced threat detection spanning 4-10 different data source types from the 500+ XSIAM marketplace vendors
- **Example:** "Alert when endpoint anomaly (CrowdStrike) + network suspicious traffic (Palo Alto) + cloud permission escalation (AWS IAM) + identity brute force (Azure AD) + email phishing (Proofpoint) + SIEM correlation (Splunk) occur together"
- **Complexity:** Very High - must correlate data across completely different vendor schemas and APIs
- **Deployment time:** 15-30 minutes (extensive cross-vendor validation required)

**Single-Vendor Optimized Rules**
- **Purpose:** Maximize detection accuracy for specific vendor data formats from the marketplace
- **Example:** "AWS-specific rule detecting IAM policy changes across 20+ AWS services (GuardDuty + CloudTrail + IAM + Organizations + etc.)"
- **Complexity:** Medium - tailored to specific vendor within the 500+ marketplace integrations
- **Deployment time:** 3-8 minutes per vendor integration

**Cross-Category Unified Layouts**
- **Purpose:** Present data from multiple vendor categories (Cloud+Endpoint+Network+Identity+Email) in single view
- **Example:** Incident layout showing AWS GuardDuty alert + CrowdStrike process data + Palo Alto network logs + Okta authentication + Proofpoint email analysis
- **Complexity:** Very High - must normalize data from 5+ completely different vendor categories
- **Deployment time:** 10-20 minutes (complex field mapping across vendor categories)

**Multi-Vendor Orchestrated Response Playbooks**
- **Purpose:** Coordinate automated response across multiple marketplace vendor APIs
- **Example:** "Malware Response: Isolate endpoint (CrowdStrike) + Block domains (Palo Alto) + Quarantine email (Proofpoint) + Disable user (Okta) + Update AWS security groups + Create ServiceNow ticket + Notify Slack"
- **Complexity:** Extremely High - requires API integration with 5+ different vendor categories
- **Deployment time:** 20-45 minutes (includes testing across all vendor APIs)

**Enterprise Vendor Health Dashboards**
- **Purpose:** Monitor operational status of hundreds of marketplace integrations
- **Example:** Real-time dashboard showing data flow from 100+ active vendor integrations across all categories
- **Complexity:** High - aggregates health metrics from diverse vendor types
- **Deployment time:** 10-15 minutes (complex data source aggregation)

## Step-by-Step Multi-Vendor Content Selection

### 📋 Step 2.1: Enterprise Dataset Schema & Cortex XQL Field Assessment
1. **Inventory your marketplace integrations** - catalog which of the 500+ XSIAM marketplace vendors you have deployed
2. **Map vendor datasets** - each data source may have multiple datasets (e.g., AWS has CloudTrail, GuardDuty, VPC Flow Logs, etc.)
3. **Extract dataset schemas for Cortex XQL** - import field schemas for each dataset (can be extracted from screenshots if needed)
4. **Document XQL-available fields** - catalog all fields available in each dataset for Cortex XQL queries, layouts, playbooks, and dashboards
5. **Reference Cortex XQL Helper** - use Visual Studio Code Cortex XQL extension for field validation and query building
6. **Categorize by data source type** - identify your coverage across Cloud, Endpoint, Network, Identity, Email, SIEM categories
7. **Map vendor interdependencies** - understand which vendors provide complementary data for XQL correlation queries
8. **Assess data volumes per dataset** - identify high-volume datasets that may impact XQL query performance
9. **Validate marketplace versions** - ensure all vendor integrations are updated to latest marketplace versions
10. **Verify XQL field accessibility** - confirm all required fields are accessible via Cortex XQL syntax

### 🔍 Step 2.2: Content Complexity Classification for 500+ Vendor Ecosystem

**Single-Vendor Content (Baseline Complexity):**
- Rules leveraging one specific marketplace integration (e.g., only AWS GuardDuty from 30+ AWS marketplace packs)
- Fastest deployment and validation
- Essential for validating individual vendor integration health
- **Best for:** Initial testing, vendor-specific compliance requirements

**Cross-Category Content (Moderate Complexity):**
- Rules correlating 2-3 different vendor categories (e.g., Cloud + Endpoint + Identity)
- Moderate complexity due to different data schemas across vendor types
- **Example:** AWS CloudTrail + CrowdStrike + Okta correlation
- **Best for:** Standard enterprise threat detection scenarios

**Multi-Data-Source Content (High Complexity):**
- Rules spanning 4-10 different data source types from various marketplace vendors
- High complexity due to diverse data formats and timing requirements
- **Example:** Cloud + Endpoint + Network + Identity + Email + SIEM + Threat Intel correlation
- **Best for:** Advanced persistent threat detection, complex attack chain analysis

**Enterprise-Scale Content (Maximum Complexity):**
- Playbooks orchestrating actions across 10+ different marketplace vendor APIs
- Extremely high complexity due to API rate limits, authentication, and error handling
- **Example:** Coordinated response across AWS, Azure, CrowdStrike, Palo Alto, Okta, Proofpoint, ServiceNow, Slack
- **Best for:** Automated incident response in large enterprise environments

### ✅ Step 2.3: Strategic Phased Selection for 500+ Vendor Marketplace

**Phase 1: Marketplace Foundation (Start Here - Essential)**
- ✅ 2-3 Single-vendor rules for your highest-volume marketplace integrations
- ✅ 1 Enterprise vendor health dashboard (monitoring 50+ active integrations)
- ✅ 1 Basic alert layout for your primary data aggregation vendor (Splunk/Sentinel/etc.)
- ✅ Marketplace integration health monitoring for all active vendor connections

**Phase 2: Cross-Category Integration (After Phase 1 Success)**
- ✅ 3-5 Cross-category correlation rules (Cloud + Endpoint + Network combinations)
- ✅ Multi-vendor alert layouts (combining 3-4 vendor data sources)
- ✅ Vendor performance monitoring (API response times, data volumes)
- ✅ Basic automated remediation for 2-3 primary vendors

**Phase 3: Multi-Data-Source Correlation (Advanced - Requires Proven Success)**
- ✅ 2-3 Complex 4-10 data source correlation rules
- ✅ Advanced incident layouts aggregating 5+ vendor categories  
- ✅ Cross-marketplace vendor failover and redundancy scenarios
- ✅ Performance optimization for high-volume vendor combinations

**Phase 4: Enterprise-Scale Orchestration (Expert Level - After Extensive Testing)**
- ✅ Complex multi-vendor response playbooks (10+ marketplace vendor APIs)
- ✅ Advanced marketplace vendor analytics and optimization
- ✅ Automated vendor lifecycle management (updates, health checks, failovers)
- ✅ Custom marketplace content development and testing frameworks

### 🔍 Step 2.4: Multi-Vendor Content Validation Process
For each selected item:

1. **Click the validation icon** (🔍) next to each piece of content
2. **Review multi-vendor validation results:**
   - ✅ **Green:** Compatible with all required vendors
   - ⚠️ **Yellow:** Works with most vendors, some limitations
   - ❌ **Red:** Vendor compatibility issues need resolution

3. **Understanding Cortex XQL Dataset Schema Dependency:**
   - **XQL Schema Compatibility:** Ensures all content types work with Cortex XQL field references from dataset schemas
   - **Cross-Dataset XQL Field Mapping:** Validates that XQL queries can access required fields across all necessary datasets
   - **XQL Field Type Validation:** Confirms field data types are compatible with Cortex XQL syntax across different vendor datasets
   - **Cortex XQL Query Building:** All correlation rules, dashboards, and layouts depend on proper XQL field references
   - **Dataset Health for XQL:** Verifies all required datasets are actively ingesting data with XQL-accessible field structures
   - **XQL Schema Version Compatibility:** Ensures content works with your specific dataset schema versions in XQL context
   - **XQL Field Availability Validation:** Checks that all fields referenced in XQL queries, layouts, playbooks, and dashboards actually exist and are accessible via Cortex XQL
   - **Visual Studio Code XQL Helper:** Leverage the Cortex XQL extension for field validation and query development

4. **Cortex XQL Dataset Schema Validation by Vendor Category:**
   - **Endpoint Dataset XQL Fields:** CrowdStrike (process events, file events, network events), SentinelOne (threats, processes, network), Defender (alerts, incidents, advanced hunting) - all fields must be XQL-accessible
   - **Network Dataset XQL Fields:** Palo Alto (traffic logs, threat logs, system logs), Cisco (flow records, security events), Check Point (logs, events, analytics) - validate XQL field syntax
   - **Cloud Dataset XQL Fields:** AWS (CloudTrail events, GuardDuty findings, VPC Flow Logs), Azure (Activity logs, Security Center alerts, Sign-in logs), GCP (Audit logs, Security findings) - ensure XQL compatibility
   - **Identity Dataset XQL Fields:** Active Directory (authentication events, group changes), Okta (system logs, authentication events), Azure AD (sign-ins, audit logs, risk events) - verify XQL field access
   - **SIEM Dataset XQL Fields:** Splunk (indexes and sourcetypes), QRadar (events, flows, offenses), ArcSight (events, cases, correlation rules) - confirm XQL integration

   **Essential XQL Development Tools:**
   - **Visual Studio Code Cortex XQL Helper:** Critical extension for validating XQL field references and building queries
   - **XQL Field Explorer:** Browse available fields from each dataset within VS Code
   - **XQL Syntax Validation:** Real-time validation of field references and query syntax
   - **XQL Auto-completion:** IntelliSense for dataset fields and XQL functions
   - **XQL Query Testing:** Test queries against actual dataset schemas before deployment

### 🛠️ Step 2.5: Fix Multi-Vendor Validation Issues

**Auto-Fixable Issues (Yellow):**
- **Field Mapping:** System automatically maps equivalent fields across vendors
- **Schema Translation:** Auto-converts data formats between vendor standards
- **Query Optimization:** Adjusts rules for optimal performance across vendors
- Click **"Apply Auto-Fixes"** - system handles most vendor compatibility issues

**Manual Fix Required (Red):**
- **Missing Vendor Integration:** Required vendor not connected to XSIAM
- **Missing Dataset Schema:** Required dataset schema not imported or available
- **Field Schema Mismatch:** Content references fields that don't exist in the dataset schemas
- **API Permission Issues:** Insufficient permissions for vendor APIs
- **Incompatible Dataset Versions:** Content requires newer dataset schema versions
- **Dataset Ingestion Gaps:** Required datasets not actively ingesting data with expected fields

**Resolution Steps for Cortex XQL Dataset Schema Issues:**
1. **Import Dataset Schemas for XQL:** Extract and import field schemas for each required dataset with XQL field accessibility (from screenshots if necessary)
2. **Verify XQL Field Availability:** Confirm all referenced fields exist in dataset schemas AND are accessible via Cortex XQL
3. **Use Visual Studio Code XQL Helper:** Leverage the Cortex XQL extension to validate field references and build proper XQL queries
4. **Update XQL Field References:** Modify content to use correct XQL-compatible field names from imported schemas
5. **Test XQL Field Access:** Validate that all field references work properly in Cortex XQL queries
6. **Contact Data Source Teams:** Work with vendor teams to verify dataset structures and XQL field accessibility
7. **XQL Schema Version Management:** Ensure dataset schema versions are compatible with Cortex XQL requirements
8. **Alternative XQL Field Mapping:** Consider using equivalent XQL-accessible fields from available datasets if primary fields are unavailable

## 📊 Content Impact Assessment

### High Impact Content ⭐
- **Threat Detection Rules:** Immediately improve security posture
- **Incident Response Playbooks:** Dramatically reduce response time
- **Executive Dashboards:** Provide leadership visibility

### Medium Impact Content 📈
- **Alert Layouts:** Improve analyst efficiency
- **Operational Dashboards:** Enhance team coordination
- **Workflow Automation:** Reduce manual tasks

### Low Impact Content 📊
- **Reporting Widgets:** Nice-to-have metrics
- **Custom Views:** Convenience features
- **Historical Analytics:** Trend analysis

## ⚠️ Important Considerations

### Before Selecting Response Playbooks:
1. **Understand what actions they take** (isolate devices, block IPs, etc.)
2. **Confirm you want automation** - these run automatically when triggered
3. **Test in non-production first** if possible
4. **Have rollback plan** in case automation causes issues

### Multi-Dataset Resource Impact Across 500+ Vendor Ecosystem:
- **Single-Dataset Rules:** Very low impact, queries one dataset from one vendor
- **Cross-Dataset Rules:** Low-Medium impact, correlates multiple datasets from same or different vendors
- **Multi-Dataset Correlation Rules:** Medium-High impact, queries 4-10 different datasets across vendor categories
- **Cross-Vendor Dataset Dashboards:** Medium impact, aggregates data from multiple datasets across all connected vendors  
- **Multi-Dataset API Playbooks:** High impact when executing across multiple vendor APIs using different dataset fields
- **Dataset Health Monitoring:** Low impact, essential for monitoring schema compatibility across hundreds of datasets

### Dataset-Specific Performance Considerations:
- **High-Volume Datasets:** Endpoint process logs, network traffic logs, cloud audit trails - optimize field selection
- **Complex Dataset Schemas:** Some datasets have 100+ fields - use only required fields in queries
- **Cross-Dataset Field Mapping:** Different field names across datasets require careful mapping - impacts query performance
- **Dataset Version Changes:** Schema updates can break existing field references - monitor for changes
- **API Dataset Interactions:** Playbooks referencing multiple dataset fields may hit API rate limits faster

## 🔧 Essential Tool: Visual Studio Code Cortex XQL Helper

**Why This Tool is Critical:**
All XSIAM content types (correlation rules, dashboards, layouts, playbooks) depend on Cortex XQL and require precise field references from dataset schemas. Without proper field validation, your content will fail at deployment.

**Key Benefits:**
- **Field Validation:** Ensures all field references exist in target datasets
- **XQL Syntax Checking:** Validates query syntax before deployment
- **Auto-completion:** Browse available fields from imported dataset schemas
- **Query Testing:** Test XQL queries against actual data structures
- **Cross-Dataset Support:** Handles complex multi-vendor field mapping

**Installation & Setup:**
1. Install Visual Studio Code
2. Search for "Cortex XQL Helper" in VS Code extensions
3. Connect to your XSIAM environment
4. Import dataset schemas (can extract from screenshots)
5. Begin building XQL-validated content

## ✅ When Step 2 is Complete
You'll see:
- ✅ Content selected and validated across all required datasets using Cortex XQL Helper
- ✅ All dataset schemas imported and XQL field references verified
- ✅ All items show green or yellow status with XQL field validation passed
- ✅ Cross-dataset XQL field mapping confirmed for correlation rules
- ✅ Impact assessment reviewed including dataset performance considerations for XQL queries
- ✅ Ready for deployment with verified Cortex XQL dataset compatibility

**Estimated time:** 25-60 minutes (longer for complex multi-vendor environments with Cortex XQL dataset schema validation)

---
*Critical XQL Dependency: ALL content types (queries, layouts, playbooks, dashboards) depend on Cortex XQL field references. Use Visual Studio Code Cortex XQL Helper to validate field availability from dataset schemas. Each of the 500+ marketplace vendors may have multiple datasets with unique field schemas that must be XQL-accessible. Extract schemas from screenshots if documentation is unavailable.*
`;

const generateDeploymentGuide = (details: any) => `
# Step 3 of 3: Multi-Dataset Production Deployment 🚀

## What We're Doing
Deploying your selected security content to XSIAM with full dataset schema validation across the 500+ vendor marketplace ecosystem.

## Deployment Process Overview

### 🔄 Automated Deployment Phases
This process runs automatically once you click "Deploy":

1. **Cortex XQL Dataset Schema Validation** (2-4 minutes)
   - Verifies all required dataset schemas are available and XQL-accessible
   - Validates XQL field references exist in target datasets
   - Confirms cross-dataset XQL field mappings for correlation rules
   - Tests XQL query compatibility with dataset field structures

2. **Pre-deployment Backup** (30 seconds)
   - Creates backup of existing XSIAM content and dataset configurations
   - Generates rollback scripts for safety

3. **Multi-Dataset Content Upload** (3-8 minutes)
   - Uploads correlation rules with verified dataset field references
   - Deploys playbooks with validated API dataset interactions
   - Installs dashboards with confirmed dataset field mappings
   - Validates each item against actual dataset schemas

4. **Cross-Dataset Configuration** (2-4 minutes) 
   - Activates detection rules across multiple datasets
   - Configures alert routing with dataset-specific field mappings
   - Sets up dashboard permissions for multi-dataset access
   - Validates field compatibility across different vendor datasets

5. **Multi-Dataset Testing & Validation** (5-10 minutes)
   - Tests correlation rules across 4-10 different datasets
   - Generates test alerts using actual dataset field structures
   - Validates playbooks can execute using correct dataset field references
   - Confirms cross-dataset queries perform within acceptable limits

5. **Final Report** (30 seconds)
   - Creates deployment summary
   - Generates monitoring checklist
   - Provides next steps guidance

## Step-by-Step Deployment Instructions

### 🚀 Step 3.1: Initiate Deployment
1. **Review your selected content** one final time
2. **Click "Start Deployment"** button
3. **Do NOT close this window** - deployment takes 5-10 minutes
4. **Watch the progress bar** and status messages

### 📊 Step 3.2: Monitor Deployment Progress
**You'll see real-time Cortex XQL dataset-aware updates like:**
- "Validating Cortex XQL dataset schemas for 8 required data sources..."
- "Confirming XQL field accessibility across all vendor datasets..."
- "Creating backup of existing content and XQL dataset configurations..."
- "Uploading correlation rule: Advanced Multi-Dataset Threat Detection (validating XQL field references: CrowdStrike.process_name + AWS.cloudtrail_event + Okta.authentication_result)..."
- "Configuring alert layout: Cross-Vendor Investigation (mapping XQL fields from 5 different datasets)..."
- "Testing playbook: Multi-Vendor Automated Response (validating XQL-driven API calls across 6 vendor datasets)..."

**Status Indicators:**
- 🔄 **In Progress:** Item is being processed
- ✅ **Complete:** Item deployed successfully  
- ⚠️ **Warning:** Minor issue, deployment continued
- ❌ **Failed:** Item failed to deploy

### 🔍 Step 3.3: Handle Any Issues
**If you see warnings (⚠️):**
- **Continue deployment** - warnings don't stop the process
- **Review warning details** in the log
- **Note items for post-deployment review**

**If you see failures (❌):**
- **Deployment continues** with other items
- **Failed items are skipped** safely
- **Check error details** for troubleshooting
- **Contact support** if multiple failures occur

### ✅ Step 3.4: Review Deployment Results
After deployment completes:

1. **Check the summary report:**
   - ✅ Items deployed successfully
   - ⚠️ Items with warnings
   - ❌ Items that failed
   - 📊 Overall deployment health

2. **Download deployment package:**
   - Contains all scripts and documentation
   - Includes rollback instructions
   - Provides troubleshooting guides

## 🧪 Post-Deployment Testing

### Step 3.5: Verify Everything Works

**Test Detection Rules (5 minutes):**
1. **Log into your XSIAM instance**
2. **Navigate to Correlation Rules** (Settings > Correlation Rules)
3. **Find your newly deployed rules** 
4. **Check status shows "Active"**
5. **Verify "Last Triggered" updates within 24 hours**

**Test Alert Layouts (2 minutes):**
1. **Go to Incidents** (Investigation > Incidents)
2. **Open any recent incident**
3. **Verify new layout displays correctly**
4. **Check all fields show proper data**

**Test Dashboards (3 minutes):**
1. **Navigate to Dashboards** (Overview > Dashboards)
2. **Find your new dashboards**
3. **Verify widgets load data**
4. **Check refresh functionality works**

**Test Playbooks (10 minutes - Advanced):**
1. **Go to Playbooks** (Investigation > Playbooks)
2. **Find deployed playbooks**
3. **Run in "Test Mode" if available**
4. **Verify automated actions work correctly**

## 📋 Post-Deployment Checklist

### ✅ Immediate Actions (First 24 Hours)
- [ ] Verify all detection rules are active
- [ ] Check for any new alerts generated
- [ ] Confirm dashboards display current data
- [ ] Review any playbook executions
- [ ] Monitor XSIAM performance impact

### ✅ First Week Actions
- [ ] Review alert quality (true vs false positives)
- [ ] Adjust detection thresholds if needed
- [ ] Train team on new dashboards
- [ ] Document any customizations needed
- [ ] Schedule team review meeting

### ✅ Ongoing Monitoring
- [ ] Weekly review of new content performance
- [ ] Monthly assessment of automation effectiveness
- [ ] Quarterly review of detection coverage
- [ ] Update content as threat landscape evolves

## 🚨 Troubleshooting Common Issues

### "Detection Rules Not Triggering"
**Possible Causes:**
- Rules need 2-4 hours to fully activate
- Insufficient data in your environment
- Thresholds set too high for your environment

**Solutions:**
1. Wait 4 hours and check again
2. Review rule logic in Correlation Rules section
3. Adjust thresholds in rule configuration
4. Contact your security team for guidance

### "Playbooks Not Executing" 
**Possible Causes:**
- Insufficient permissions for automation
- Integration connections not configured
- Playbook conditions not met

**Solutions:**
1. Check API permissions for playbook actions
2. Verify integrations are connected (Settings > Integrations)
3. Review playbook logic and triggers
4. Test manually first before automation

### "Dashboard Widgets Empty"
**Possible Causes:**
- Data sources not configured
- Time range too narrow
- Permissions insufficient

**Solutions:**
1. Extend time range to 30 days
2. Check data source connections
3. Verify dashboard permissions
4. Contact XSIAM administrator

## 📄 Deployment Summary Report

${generateDeploymentSummaryReport(details)}

## 🎯 Next Steps for Success

### Week 1: Monitor & Adjust
- Watch for new alerts and validate they're actionable
- Fine-tune detection thresholds based on your environment
- Train your team on new dashboards and workflows

### Month 1: Optimize & Expand
- Review automation effectiveness
- Add additional content based on lessons learned
- Integrate with other security tools as needed

### Ongoing: Maintain & Improve
- Regular content updates as threats evolve
- Continuous tuning based on false positive rates
- Expand automation as team confidence grows

## ✅ Deployment Complete!

**Congratulations!** You've successfully deployed enterprise security content to XSIAM.

**Key Success Metrics to Track:**
- Number of threats detected
- Average response time to incidents  
- Reduction in manual investigation tasks
- Team efficiency improvements

---
*Questions? Contact your security team or XSIAM administrator. Save this guide for future reference.*
`;

const generateGenericStepGuide = (step: number, totalSteps: number, stepName: string, details: any) => `
# Step ${step} of ${totalSteps}: ${stepName}

## Overview
This step involves ${stepName.toLowerCase()} for your XSIAM deployment.

## Instructions
1. Follow the on-screen prompts
2. Provide required information
3. Review and confirm settings
4. Proceed to the next step

**Estimated time:** 5-10 minutes
`;

export const generateDeploymentSummaryReport = (details: any) => `
## 📊 Deployment Summary Report
**Generated:** ${new Date().toLocaleString()}
**Environment:** ${details.environment || 'Production'}
**Deployment ID:** ${details.deploymentId || 'DEP-' + Date.now()}

### Content Deployed
${details.deployedContent?.map((item: any) => `
- ✅ **${item.name}** (${item.type})
  - Status: ${item.status}
  - Impact: ${item.impact}
  - Deployment time: ${item.deploymentTime}
`).join('') || '- No content deployed'}

### Performance Impact
- **XSIAM CPU Usage:** +${details.cpuImpact || '2-5'}%
- **Memory Usage:** +${details.memoryImpact || '50-100'}MB
- **Storage Used:** ${details.storageUsed || '5-15'}MB

### Deployment Statistics
- **Total Items:** ${details.totalItems || 0}
- **Successful:** ${details.successful || 0}
- **Warnings:** ${details.warnings || 0}
- **Failed:** ${details.failed || 0}
- **Success Rate:** ${details.successRate || '95'}%

### Next Steps
1. Monitor alerts for the next 24 hours
2. Review dashboard performance
3. Schedule team training session
4. Plan for additional content deployment
`;

export const generateTroubleshootingGuide = (issue: string) => {
  const guides = {
    'connection': `
### Multi-Vendor Connection Issues Troubleshooting

#### Symptom: Cannot connect to XSIAM with hundreds of data sources
**Step 1:** Verify XSIAM URL format for enterprise environments
- Must start with https://
- Should end with .xsiam.paloaltonetworks.com
- Example: https://enterprise-corp.xsiam.paloaltonetworks.com
- Verify you're connecting to production tenant, not staging

**Step 2:** Check API Key Permissions for Multi-Vendor Environment
- Ensure API key has permissions for ALL connected vendors
- Verify Content Management permissions across all data source types
- Check vendor-specific API permissions (CrowdStrike, Splunk, etc.)
- Try regenerating key with full enterprise permissions

**Step 3:** Validate Multi-Vendor Network Connectivity
- Test XSIAM URL access from your deployment environment
- Verify firewall allows connections to vendor API endpoints
- Check if corporate proxy affects hundreds of vendor integrations
- Validate DNS resolution for all vendor-specific XSIAM endpoints

**Step 4:** Vendor Integration Health Check
- Go to XSIAM Settings > Data Sources
- Verify all expected vendors show "Connected" status
- Check for any vendor integrations showing errors
- Review vendor-specific authentication status
`,
    'deployment': `
### Multi-Vendor Deployment Issues Troubleshooting

#### Symptom: Deployment fails with hundreds of vendors
**Step 1:** Check XSIAM System Capacity
- Is XSIAM experiencing high load from hundreds of data sources?
- Are other bulk operations running (data ingestion, vendor updates)?
- Check XSIAM tenant resource usage and limits
- Verify deployment window aligns with vendor data flow patterns

**Step 2:** Vendor-Specific Deployment Issues
- **Large deployments:** 50+ vendor rules may timeout - deploy in vendor-specific batches
- **Vendor API limits:** Some vendors (CrowdStrike, Splunk) have API rate limits
- **Data source dependencies:** Some rules require multiple vendors - check all are connected
- **Cross-vendor timing:** Multi-vendor correlation rules need synchronized deployment

**Step 3:** Review Multi-Vendor Error Logs
- Check deployment log for vendor-specific errors
- Note any vendor API permission failures
- Identify which vendor integrations caused failures
- Look for vendor version compatibility issues

**Step 4:** Phased Deployment Strategy for 500+ Marketplace Vendor Ecosystem
- **Phase 1:** Deploy single-vendor content for your largest marketplace integrations (AWS, CrowdStrike, Splunk, etc.)
- **Phase 2:** Deploy cross-category rules after single-vendor validation (Cloud+Endpoint, Network+Identity combinations)
- **Phase 3:** Deploy 4-10 data source correlation rules only after extensive testing
- **Phase 4:** Deploy enterprise-scale orchestration playbooks (10+ vendor APIs) last
- **Recovery:** Always deploy marketplace vendor health monitoring first for comprehensive troubleshooting
`,
    'validation': `
### Multi-Vendor Content Validation Issues

#### Symptom: Content fails validation across multiple vendors
**Step 1:** Review Multi-Vendor Validation Report
- **Red items:** Vendor compatibility failures requiring manual fixes
- **Yellow items:** Vendor-specific optimizations that can be auto-fixed
- **Green items:** Validated across all required vendor data sources

**Step 2:** Common Multi-Vendor Validation Fixes
**XQL Syntax Errors:**
- Different vendors use different field names - check field mapping
- Some vendors require vendor-specific XQL syntax
- Cross-vendor queries need proper data source specification

**Cortex XQL Dataset Field Mapping Issues:**
- Verify field names exist in ALL required dataset schemas AND are accessible via Cortex XQL
- Check dataset-specific field formats are compatible with XQL syntax (timestamps, IPs, strings, arrays, etc.)
- Validate cross-dataset XQL field correlations work correctly across different vendor schemas
- Ensure field data types are compatible with Cortex XQL when correlating across multiple datasets
- Confirm XQL field naming conventions match between different datasets (e.g., "user_name" vs "username" vs "user.name")
- Use Visual Studio Code Cortex XQL Helper to validate field accessibility and syntax
- Test all XQL field references in queries, layouts, playbooks, and dashboards before deployment

**Marketplace Vendor Integration Status:**
- Ensure ALL required marketplace vendors from the 500+ available are connected and actively sending data
- Check vendor-specific data retention policies and API rate limits
- Verify vendor API versions match XSIAM marketplace requirements
- Validate cross-vendor dependencies (some vendors require others to function properly)

**Performance Impact Validation for 500+ Vendor Ecosystem:**
- Rules correlating 4-10 data sources from marketplace vendors may significantly impact performance
- Check query complexity against each vendor's data volume characteristics
- Validate memory usage across diverse vendor data streams (some vendors send high-frequency data)
- Test API rate limit compliance across all integrated marketplace vendors
- Monitor cross-vendor timing dependencies (some vendors have data ingestion delays)

**Step 3:** Vendor-Specific Resolution Steps
**Missing Dataset Schema or Field Data:**
- Contact vendor teams to verify dataset ingestion and field availability
- Check vendor-specific dataset collection configuration
- Validate vendor agent/connector status for each required dataset
- Import missing dataset schemas (extract from screenshots if documentation unavailable)
- Verify dataset field structures match imported schemas
- Check if field names have changed in newer dataset versions

**API Permission Issues:**
- Work with vendor administrators for API access
- Verify service accounts have proper vendor permissions
- Check vendor-specific authentication requirements

**Version Compatibility:**
- Update vendor connectors to latest supported versions
- Check XSIAM compatibility matrix for each vendor
- Plan vendor upgrade schedules to maintain compatibility

**Step 4:** Get Expert Help for Complex Multi-Vendor Issues
- Contact XSIAM Professional Services for environment assessment
- Work with Palo Alto TAC for vendor integration troubleshooting
- Engage vendor support teams for API and data format issues
- Use XSIAM documentation vendor-specific integration guides
`
  };

  return guides[issue as keyof typeof guides] || 'Multi-vendor troubleshooting guide not found for this issue.';
};

export const generateComplianceDocumentation = (complianceMode: string) => {
  const compliance = {
    'SOX': `
### SOX Compliance Requirements
**Sarbanes-Oxley Act Financial Compliance**

#### Key Requirements:
- All changes must be logged and auditable
- Segregation of duties in deployment process
- Regular access reviews and validations
- Data retention for 7 years minimum

#### Deployment Considerations:
- Change approval workflow required
- Production deployments need manager approval
- All scripts and configurations must be version controlled
- Regular compliance reporting generated

#### Documentation Generated:
- Change control records
- Access audit trails
- Deployment verification reports
- Risk assessment documentation
`,
    'PCI': `
### PCI DSS Compliance Requirements
**Payment Card Industry Data Security Standard**

#### Key Requirements:
- Network segmentation validation
- Encryption of sensitive data processing
- Regular security assessments
- Incident response procedures

#### Deployment Considerations:
- Cardholder data environment isolation
- Encrypted transmission of configuration data
- Regular vulnerability scanning post-deployment
- Compliance validation testing

#### Documentation Generated:
- Network security validation reports
- Encryption verification certificates
- PCI compliance assessment
- Incident response procedures update
`,
    'HIPAA': `
### HIPAA Compliance Requirements
**Health Insurance Portability and Accountability Act**

#### Key Requirements:
- Protected Health Information (PHI) safeguards
- Access controls and audit logging
- Business Associate Agreements compliance
- Breach notification procedures

#### Deployment Considerations:
- PHI data handling validation
- Access control verification
- Audit trail configuration
- Employee training documentation

#### Documentation Generated:
- Privacy impact assessment
- Security safeguards verification
- Access control audit report
- HIPAA compliance certification
`,
    'GDPR': `
### GDPR Compliance Requirements
**General Data Protection Regulation**

#### Key Requirements:
- Data processing lawfulness validation
- Privacy by design implementation
- Data subject rights protection
- Cross-border transfer safeguards

#### Deployment Considerations:
- Personal data processing assessment
- Privacy impact evaluation
- Data retention policy validation
- Rights management workflow setup

#### Documentation Generated:
- Data Protection Impact Assessment (DPIA)
- Privacy compliance report
- Data processing inventory
- Rights management procedures
`
  };

  return compliance[complianceMode as keyof typeof compliance] || 'Compliance documentation not available for this mode.';
};
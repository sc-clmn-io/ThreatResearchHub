# XSIAM Content Testing & Validation Framework

## Overview

Comprehensive testing framework for validating XSIAM content through API automation and manual verification processes.

## Testing Categories

### 1. Automated API Testing
**XSIAM API Integration Points:**
- Correlation rule syntax validation
- XQL query execution testing  
- Playbook logic verification
- Dashboard widget functionality
- Alert layout field mapping

### 2. Manual Testing Checklists
**Pass/Fail Validation Points:**
- Data source connectivity
- Field parsing accuracy
- Alert generation timing
- Playbook execution success
- Dashboard visualization quality

## API Testing Framework

### Connection Testing
```bash
# XSIAM API Health Check
curl -H "Authorization: Bearer $YOUR_XSIAM_API_KEY" \
     -H "Content-Type: application/json" \
     "https://$TENANT.xdr.us.paloaltonetworks.com/api/v1/health"
```

### Content Validation
```bash
# Test XQL Correlation Rule
curl -X POST \
     -H "Authorization: Bearer $YOUR_XSIAM_API_KEY" \
     -H "Content-Type: application/json" \
     -d @correlation_rule.json \
     "https://$TENANT.xdr.us.paloaltonetworks.com/api/v1/correlation-rules/validate"
```

### Playbook Testing
```bash
# Validate Playbook Structure  
curl -X POST \
     -H "Authorization: Bearer $YOUR_XSIAM_API_KEY" \
     -H "Content-Type: application/json" \
     -d @playbook.yml \
     "https://$TENANT.xdr.us.paloaltonetworks.com/api/v1/playbooks/validate"
```

## Manual Test Checklists

### Data Source Integration Test
- [ ] **Connectivity**: Data source connects to XSIAM Broker
- [ ] **Log Flow**: Logs appearing in XSIAM within 5 minutes
- [ ] **Field Parsing**: All required fields extracting properly
- [ ] **Data Types**: Field data types match XSIAM schema
- [ ] **Timestamps**: Log timestamps in correct format and recent
- [ ] **Volume**: Expected log volume arriving consistently

### Correlation Rule Test  
- [ ] **Syntax**: XQL query executes without errors
- [ ] **Logic**: Rule logic matches threat detection requirements
- [ ] **Performance**: Query executes within 30 seconds
- [ ] **False Positives**: Rule doesn't trigger on normal activity
- [ ] **True Positives**: Rule triggers on simulated threat activity
- [ ] **Alert Generation**: Alerts created with proper severity and context

### Playbook Test
- [ ] **Execution**: Playbook runs without errors
- [ ] **Logic Flow**: All conditional branches execute properly  
- [ ] **Integration**: External system calls complete successfully
- [ ] **Outputs**: Playbook produces expected outputs and context
- [ ] **Timing**: Playbook completes within expected timeframe
- [ ] **Error Handling**: Graceful failure handling for edge cases

### Dashboard Test
- [ ] **Data Loading**: All widgets load data successfully
- [ ] **Visualization**: Charts and graphs display correctly
- [ ] **Filtering**: Filter controls work as expected
- [ ] **Real-time**: Live data updates appropriately
- [ ] **Performance**: Dashboard loads within 10 seconds
- [ ] **Mobile**: Dashboard renders properly on mobile devices

## Failed Test Issue Template

### Issue Details
- **Test Type**: [API/Manual]
- **Component**: [Correlation Rule/Playbook/Dashboard/Alert Layout]
- **Use Case**: [Threat scenario being tested]
- **Severity**: [Critical/High/Medium/Low]
- **Environment**: [Production/Staging/Lab]

### Failure Description
- **Expected Result**: What should have happened
- **Actual Result**: What actually happened  
- **Error Messages**: Any error codes or messages
- **Screenshots**: Visual evidence of failure
- **Log Excerpts**: Relevant log entries

### Reproduction Steps
1. Step-by-step instructions to reproduce the failure
2. Include specific configuration details
3. Note any environmental prerequisites

### Impact Assessment
- **Affected Functionality**: What doesn't work due to this failure
- **Workaround Available**: Temporary solutions if any
- **Customer Impact**: How this affects end users
- **Timeline**: When this needs to be resolved

### Triage Information
- **Assigned To**: Team member responsible for fix
- **Priority**: Based on severity and impact
- **Related Issues**: Links to similar or dependent issues
- **Fix Estimate**: Expected time to resolution

## Automated Notifications

### Failed Test Alerts
- **Slack Integration**: Immediate notification to team channel
- **Email Alerts**: Summary reports to stakeholders  
- **Dashboard Updates**: Real-time test status dashboard
- **Issue Creation**: Automatic GitHub/Jira issue creation

### Success Metrics Dashboard
- **Test Pass Rate**: Percentage of successful tests
- **Component Reliability**: Success rate by content type
- **Environment Health**: Infrastructure and connectivity status
- **Performance Metrics**: Response times and throughput
- **Trend Analysis**: Success rate trends over time

## Integration with Platform Workflow

### Step 6: Test & Deploy Integration
- Automated API tests run before deployment
- Manual checklists guide validation process
- Failed tests block deployment until resolved
- Success metrics track deployment quality

### Continuous Improvement
- Test results feed back into content generation
- Failed patterns inform template improvements  
- Performance metrics optimize infrastructure
- User feedback enhances testing coverage
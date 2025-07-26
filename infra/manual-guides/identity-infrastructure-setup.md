# Identity Infrastructure Setup Guide
*Written at 8th grade reading level for easy understanding*

## What You're Building

You're going to set up a test environment to practice finding bad guys who try to break into computer accounts. This will help you learn how to catch identity attacks before they cause damage.

## What You Need

### Before You Start
- A computer with internet connection
- About 4-6 hours of time
- Basic computer skills (you can follow step-by-step instructions)
- A credit card for cloud services (will cost about $50-100 for testing)

### Tools You'll Install
- AWS account (Amazon's cloud service)
- Windows Server (a powerful computer operating system)
- Active Directory (system that manages user accounts)
- Okta (identity management service)

## Step 1: Set Up Your AWS Account (30 minutes)

### Create Your Account
1. Go to aws.amazon.com in your web browser
2. Click the orange "Create an AWS Account" button
3. Enter your email address and choose a password
4. Fill out your contact information
5. Add your credit card information (don't worry, we'll set up billing alerts)
6. Verify your identity with a phone call or text message
7. Choose the "Basic Support" plan (it's free)

### Set Up Billing Alerts (Important!)
1. In AWS, go to "Billing & Cost Management"
2. Click "Billing preferences" 
3. Check the box for "Receive Billing Alerts"
4. Set up an alert for $50 (this warns you if costs get too high)

## Step 2: Create Your Virtual Network (45 minutes)

Think of this like building the foundation of a house. You need a secure space where your test computers can talk to each other.

### Create a Virtual Private Cloud (VPC)
1. In AWS, search for "VPC" and click on it
2. Click "Create VPC"
3. Choose "VPC and more" (this creates everything you need)
4. Name it "identity-threat-lab"
5. Set IP addresses to "10.0.0.0/16" (this gives you lots of addresses)
6. Choose 1 Availability Zone
7. Choose 1 public subnet and 1 private subnet
8. Enable DNS hostnames and DNS resolution
9. Click "Create VPC"

### Why This Matters
- Public subnet = where computers can reach the internet
- Private subnet = where sensitive computers hide from the internet
- It's like having a front yard (public) and a backyard (private)

## Step 3: Set Up Your Jump Box Computer (1 hour)

This is like having a secure entrance to your test environment. You'll use this computer to manage everything else.

### Create the Jump Box
1. In AWS, search for "EC2" and click on it
2. Click "Launch Instance"
3. Name it "threat-lab-jumpbox"
4. Choose "Microsoft Windows Server 2022 Base"
5. Choose "t3.medium" instance type (powerful enough but not too expensive)
6. Create a new key pair:
   - Name it "threat-lab-key"
   - Download the .pem file and save it somewhere safe
7. Network settings:
   - Choose your "identity-threat-lab" VPC
   - Choose the public subnet
   - Create a new security group called "jumpbox-sg"
   - Allow RDP (port 3389) from your IP address
8. Click "Launch Instance"

### Connect to Your Jump Box
1. Wait for the instance to show "Running" status (about 5 minutes)
2. Select your instance and click "Connect"
3. Choose "RDP client"
4. Click "Get password" and upload your .pem file
5. Copy the password they give you
6. Download the RDP file
7. Open the RDP file and enter the password
8. You're now connected to your Windows Server!

## Step 4: Set Up Active Directory (2 hours)

Active Directory is like a phone book for computers. It keeps track of all users and controls who can access what.

### Install Active Directory Services
1. In your Jump Box, open "Server Manager" (it should open automatically)
2. Click "Add roles and features"
3. Click "Next" three times
4. Check the box for "Active Directory Domain Services"
5. Click "Add Features" when asked
6. Click "Next" through all screens
7. Click "Install" and wait (about 10 minutes)

### Create Your Domain
1. After installation, click the yellow warning flag in Server Manager
2. Click "Promote this server to a domain controller"
3. Choose "Add a new forest"
4. Domain name: "threatlab.local"
5. Set a DSRM password (remember this!)
6. Click "Next" through all screens (ignore warnings)
7. Click "Install" and the computer will restart

### Create Test Users
1. After restart, open "Active Directory Users and Computers"
2. Right-click on "Users" folder
3. Choose "New" → "User"
4. Create these test users:
   - First Name: John, Last Name: Admin, Username: jadmin
   - First Name: Jane, Last Name: User, Username: juser  
   - First Name: Bob, Last Name: Service, Username: bservice
5. Set simple passwords like "Password123!" for testing
6. For jadmin, right-click and choose "Properties"
7. Go to "Member Of" tab and add to "Domain Admins" group

## Step 5: Set Up Okta Test Environment (1 hour)

Okta helps companies manage user logins. We'll create a test environment to practice with.

### Create Okta Developer Account
1. Go to developer.okta.com
2. Click "Sign up for free"
3. Enter your email and create an account
4. Choose "Build a SSO integration" when asked about your use case
5. You'll get an email with your Okta domain (like dev-123456.okta.com)

### Connect Okta to Active Directory
1. In Okta, go to "Directory" → "Directory Integrations"
2. Click "Add Directory"
3. Choose "Active Directory"
4. Download the Okta AD Agent installer
5. Run the installer on your Jump Box
6. Follow the setup wizard and connect to your threatlab.local domain
7. Import your test users from Active Directory

### Set Up SSO Application
1. In Okta, go to "Applications" → "Applications"
2. Click "Create App Integration"
3. Choose "SAML 2.0"
4. Name it "Threat Lab Test App"
5. Use basic settings for testing
6. Assign your test users to the application

## Step 6: Set Up Monitoring and Logging (1 hour)

This is how you'll see what's happening in your environment. It's like security cameras for your computers.

### Enable AWS CloudTrail
1. In AWS, search for "CloudTrail"
2. Click "Create trail"
3. Name it "threat-lab-trail"
4. Create a new S3 bucket to store logs
5. Enable logging for all regions
6. Turn on "Log file validation"
7. Click "Create trail"

### Set Up Windows Event Logging
1. On your Jump Box, open "Event Viewer"
2. Go to "Windows Logs" → "Security"
3. Right-click and choose "Properties"
4. Set maximum log size to 100 MB
5. Choose "Overwrite events as needed"
6. Enable auditing:
   - Open "Group Policy Management"
   - Edit "Default Domain Policy"
   - Go to Computer Configuration → Policies → Windows Settings → Security Settings → Local Policies → Audit Policy
   - Enable "Audit account logon events" and "Audit logon events"

### Install XSIAM Broker (if you have XSIAM)
1. Download the XSIAM Broker from your XSIAM tenant
2. Install it on your Jump Box
3. Configure it to collect:
   - Windows Security Event Logs
   - DNS logs
   - Active Directory logs
4. Test the connection to make sure logs are flowing

## Step 7: Test Your Setup (30 minutes)

Let's make sure everything works before we start testing threats.

### Test Active Directory
1. Try logging in as each test user
2. Verify that jadmin has admin rights
3. Check that juser has regular user rights

### Test Okta Integration
1. Log into Okta as each user
2. Try accessing the test application
3. Verify that user information synced correctly

### Test Monitoring
1. Check CloudTrail to see AWS API calls
2. Look at Windows Event Logs for login events
3. If using XSIAM, verify logs are arriving

## What You've Built

Congratulations! You now have:
- A secure test environment in AWS
- Active Directory with test users
- Okta identity management
- Complete logging and monitoring
- A foundation for testing identity threats

## Cost Management

Your test environment will cost about:
- $50-75 per month if left running
- $2-3 per day for testing sessions
- Always remember to shut down EC2 instances when not testing!

## Next Steps

Now you're ready to:
1. Generate threat scenarios using the platform
2. Create detection rules in XSIAM
3. Test attacks against your environment
4. Practice incident response procedures

## Need Help?

If you get stuck:
1. Check the AWS documentation
2. Use the platform's troubleshooting guides
3. Ask for help in your team's chat channel
4. Remember: this is for learning, so mistakes are okay!

## Safety Reminders

- This is a test environment only
- Never use real passwords or data
- Always shut down resources when done testing
- Monitor your AWS costs regularly
- Keep your environment isolated from production systems
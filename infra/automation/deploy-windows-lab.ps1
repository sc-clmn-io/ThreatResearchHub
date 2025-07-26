# One-Click Windows Security Lab Deployment
# This script sets up a complete Windows security testing environment

Write-Host "🖥️  Starting Windows Security Lab Deployment..." -ForegroundColor Green

# Check if running as Administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script requires Administrator privileges" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Enable execution of scripts
Set-ExecutionPolicy Bypass -Scope Process -Force
Write-Host "✅ PowerShell execution policy set" -ForegroundColor Green

# Install Chocolatey package manager
Write-Host "📦 Installing Chocolatey package manager..." -ForegroundColor Yellow
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
try {
    iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    Write-Host "✅ Chocolatey installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install Chocolatey: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Refresh environment variables
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Install essential security tools
Write-Host "🔧 Installing security tools..." -ForegroundColor Yellow
$tools = @(
    "sysmon",
    "wireshark", 
    "git",
    "vscode",
    "firefox",
    "sysinternals",
    "procexp",
    "procmon",
    "autoruns",
    "tcpview"
)

foreach ($tool in $tools) {
    try {
        Write-Host "Installing $tool..." -ForegroundColor Cyan
        choco install $tool -y --no-progress
        Write-Host "✅ $tool installed" -ForegroundColor Green
    } catch {
        Write-Host "⚠️  Warning: Failed to install $tool" -ForegroundColor Yellow
    }
}

# Create lab directory
$labDir = "$env:USERPROFILE\Desktop\SecurityLab"
New-Item -ItemType Directory -Path $labDir -Force | Out-Null
Write-Host "📁 Created lab directory: $labDir" -ForegroundColor Green

# Configure Sysmon with comprehensive logging
Write-Host "⚙️  Configuring Sysmon for detailed logging..." -ForegroundColor Yellow
$sysmonConfig = @"
<Sysmon schemaversion="4.40">
  <EventFiltering>
    <!-- Log all process creation -->
    <ProcessCreate onmatch="include">
      <Image condition="contains">powershell</Image>
      <Image condition="contains">cmd</Image>
      <Image condition="contains">wscript</Image>
      <Image condition="contains">cscript</Image>
      <Image condition="contains">mshta</Image>
      <Image condition="contains">rundll32</Image>
    </ProcessCreate>
    
    <!-- Log file creation in sensitive locations -->
    <FileCreate onmatch="include">
      <TargetFilename condition="contains">Windows</TargetFilename>
      <TargetFilename condition="contains">Temp</TargetFilename>
      <TargetFilename condition="contains">AppData</TargetFilename>
    </FileCreate>
    
    <!-- Log network connections -->
    <NetworkConnect onmatch="exclude">
      <Image condition="is">C:\Windows\System32\svchost.exe</Image>
    </NetworkConnect>
    
    <!-- Log registry modifications -->
    <RegistryEvent onmatch="include">
      <TargetObject condition="contains">CurrentVersion\Run</TargetObject>
      <TargetObject condition="contains">Policies</TargetObject>
      <TargetObject condition="contains">Windows\CurrentVersion</TargetObject>
    </RegistryEvent>
    
    <!-- Log image/library loads -->
    <ImageLoad onmatch="include">
      <Image condition="contains">powershell</Image>
      <Image condition="contains">rundll32</Image>
    </ImageLoad>
  </EventFiltering>
</Sysmon>
"@

$sysmonConfigPath = "$labDir\sysmon-config.xml"
$sysmonConfig | Out-File -FilePath $sysmonConfigPath -Encoding UTF8
Write-Host "📄 Sysmon configuration saved to: $sysmonConfigPath" -ForegroundColor Green

# Install and configure Sysmon
try {
    & sysmon -accepteula -i $sysmonConfigPath
    Write-Host "✅ Sysmon configured with comprehensive logging" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Sysmon configuration may have failed" -ForegroundColor Yellow
}

# Enable PowerShell logging
Write-Host "📝 Enabling PowerShell detailed logging..." -ForegroundColor Yellow
$regPaths = @(
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ModuleLogging",
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging",
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\Transcription"
)

foreach ($regPath in $regPaths) {
    try {
        New-Item -Path $regPath -Force | Out-Null
        Set-ItemProperty -Path $regPath -Name "EnableModuleLogging" -Value 1 -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $regPath -Name "EnableScriptBlockLogging" -Value 1 -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $regPath -Name "EnableTranscription" -Value 1 -ErrorAction SilentlyContinue
        Set-ItemProperty -Path $regPath -Name "OutputDirectory" -Value "$labDir\PowerShellLogs" -ErrorAction SilentlyContinue
    } catch {
        Write-Host "⚠️  Warning: Some PowerShell logging settings may not be applied" -ForegroundColor Yellow
    }
}

# Create PowerShell logs directory
New-Item -ItemType Directory -Path "$labDir\PowerShellLogs" -Force | Out-Null
Write-Host "✅ PowerShell logging enabled" -ForegroundColor Green

# Enable Windows Event Collection
Write-Host "📊 Configuring Windows Event Collection..." -ForegroundColor Yellow
try {
    # Enable Security audit logging
    auditpol /set /category:"Account Logon" /success:enable /failure:enable
    auditpol /set /category:"Account Management" /success:enable /failure:enable
    auditpol /set /category:"Process Tracking" /success:enable /failure:enable
    auditpol /set /category:"Policy Change" /success:enable /failure:enable
    auditpol /set /category:"Privilege Use" /success:enable /failure:enable
    auditpol /set /category:"System" /success:enable /failure:enable
    Write-Host "✅ Windows audit policies configured" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Some audit policies may not be configured" -ForegroundColor Yellow
}

# Create test user account for lab exercises
Write-Host "👤 Creating test user account..." -ForegroundColor Yellow
$testUserName = "SecurityTester"
$testPassword = ConvertTo-SecureString "TestPassword123!" -AsPlainText -Force

try {
    New-LocalUser -Name $testUserName -Password $testPassword -Description "Test account for security labs" -PasswordNeverExpires -ErrorAction Stop
    Add-LocalGroupMember -Group "Users" -Member $testUserName -ErrorAction Stop
    Write-Host "✅ Test user '$testUserName' created with password 'TestPassword123!'" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Test user may already exist or creation failed" -ForegroundColor Yellow
}

# Create lab scripts and tools
Write-Host "🛠️  Creating lab scripts..." -ForegroundColor Yellow

# Create log collection script
$logCollectionScript = @"
# Log Collection Script for Security Lab
`$logDir = "$labDir\CollectedLogs"
New-Item -ItemType Directory -Path `$logDir -Force | Out-Null

Write-Host "Collecting Windows Event Logs..." -ForegroundColor Green
Get-WinEvent -LogName Security -MaxEvents 100 | Export-Csv "`$logDir\Security-Events.csv" -NoTypeInformation
Get-WinEvent -LogName System -MaxEvents 100 | Export-Csv "`$logDir\System-Events.csv" -NoTypeInformation
Get-WinEvent -LogName Application -MaxEvents 100 | Export-Csv "`$logDir\Application-Events.csv" -NoTypeInformation

Write-Host "Collecting Sysmon Logs..." -ForegroundColor Green
Get-WinEvent -LogName "Microsoft-Windows-Sysmon/Operational" -MaxEvents 100 -ErrorAction SilentlyContinue | Export-Csv "`$logDir\Sysmon-Events.csv" -NoTypeInformation

Write-Host "Logs collected in: `$logDir" -ForegroundColor Green
"@

$logCollectionScript | Out-File -FilePath "$labDir\Collect-Logs.ps1" -Encoding UTF8

# Create attack simulation script
$attackSimScript = @"
# Basic Attack Simulation Script
Write-Host "🎯 Running basic attack simulations..." -ForegroundColor Red
Write-Host "These are SAFE simulations for testing detection capabilities" -ForegroundColor Yellow

# Simulate suspicious PowerShell activity
Write-Host "1. Simulating suspicious PowerShell execution..." -ForegroundColor Cyan
Invoke-Expression "Get-Process | Where-Object {`$_.ProcessName -eq 'explorer'}"

# Simulate file system enumeration
Write-Host "2. Simulating file system enumeration..." -ForegroundColor Cyan
Get-ChildItem C:\ -Recurse -ErrorAction SilentlyContinue | Select-Object -First 10

# Simulate network reconnaissance
Write-Host "3. Simulating network reconnaissance..." -ForegroundColor Cyan
Test-NetConnection -ComputerName "google.com" -Port 80

# Simulate registry access
Write-Host "4. Simulating registry access..." -ForegroundColor Cyan
Get-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion" -Name "ProductName"

Write-Host "✅ Attack simulations completed. Check logs for detection!" -ForegroundColor Green
"@

$attackSimScript | Out-File -FilePath "$labDir\Simulate-Attacks.ps1" -Encoding UTF8

# Create lab startup script
$startupScript = @"
# Security Lab Startup Script
Write-Host "🚀 Starting Security Lab Environment..." -ForegroundColor Green

Write-Host "📊 Opening Event Viewer..." -ForegroundColor Cyan
Start-Process eventvwr.msc

Write-Host "🔍 Available Lab Tools:" -ForegroundColor Yellow
Write-Host "  • Event Viewer (already opened)"
Write-Host "  • Process Explorer: procexp"
Write-Host "  • Process Monitor: procmon" 
Write-Host "  • Autoruns: autoruns"
Write-Host "  • TCP View: tcpview"
Write-Host "  • Wireshark: wireshark"

Write-Host ""
Write-Host "📋 Lab Scripts:" -ForegroundColor Yellow
Write-Host "  • Collect Logs: .\Collect-Logs.ps1"
Write-Host "  • Simulate Attacks: .\Simulate-Attacks.ps1"

Write-Host ""
Write-Host "🎯 Lab Ready! Navigate to: $labDir" -ForegroundColor Green
Write-Host "Happy hunting! 🕵️‍♂️" -ForegroundColor Green
"@

$startupScript | Out-File -FilePath "$labDir\Start-Lab.ps1" -Encoding UTF8

# Create desktop shortcuts
Write-Host "🔗 Creating desktop shortcuts..." -ForegroundColor Yellow
$WshShell = New-Object -comObject WScript.Shell

# Security Lab shortcut
$Shortcut = $WshShell.CreateShortcut("$env:USERPROFILE\Desktop\Security Lab.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$labDir\Start-Lab.ps1`""
$Shortcut.WorkingDirectory = $labDir
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Save()

# Create README file
$readmeContent = @"
# Windows Security Lab Environment

This lab environment has been configured for security testing and analysis.

## 🛠️ Installed Tools
- Sysmon (system monitoring)
- Wireshark (network analysis)
- Sysinternals Suite (system utilities)
- Visual Studio Code (text editor)
- Git (version control)

## 📊 Logging Configuration
- Sysmon: Comprehensive system monitoring enabled
- PowerShell: Script block and module logging enabled
- Windows Events: Security audit policies configured
- Log Location: $labDir\PowerShellLogs

## 🎯 Lab Scripts
- Start-Lab.ps1: Opens lab environment and tools
- Collect-Logs.ps1: Gathers logs for analysis
- Simulate-Attacks.ps1: Safe attack simulations for testing

## 👤 Test Account
- Username: SecurityTester
- Password: TestPassword123!

## 🔍 How to Use
1. Double-click "Security Lab" shortcut on desktop
2. Use lab scripts to generate test data
3. Analyze logs using Event Viewer and other tools
4. Practice threat hunting and incident response

## ⚠️  Important Notes
- This is a TEST environment - keep isolated from production
- All simulations are SAFE and designed for learning
- Logs are stored in: $labDir\CollectedLogs
- Sysmon config: $labDir\sysmon-config.xml

Happy learning! 🎓
"@

$readmeContent | Out-File -FilePath "$labDir\README.txt" -Encoding UTF8

# Final setup steps
Write-Host "🏁 Completing final setup..." -ForegroundColor Yellow

# Enable Windows Defender for testing (if disabled)
try {
    Set-MpPreference -DisableRealtimeMonitoring $false -ErrorAction SilentlyContinue
    Write-Host "✅ Windows Defender real-time protection enabled" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Windows Defender settings may need manual configuration" -ForegroundColor Yellow
}

# Display completion summary
Write-Host ""
Write-Host "🎉 Windows Security Lab Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Lab Location: $labDir" -ForegroundColor Cyan
Write-Host "🖥️  Desktop Shortcut: Security Lab" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Double-click 'Security Lab' shortcut on desktop"
Write-Host "  2. Run .\Simulate-Attacks.ps1 to generate test data"
Write-Host "  3. Use .\Collect-Logs.ps1 to gather analysis data"
Write-Host "  4. Open tools like Process Monitor, Process Explorer"
Write-Host "  5. Practice threat hunting with generated logs"
Write-Host ""
Write-Host "📚 Documentation: $labDir\README.txt" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔐 Test Account Created:" -ForegroundColor Green
Write-Host "  Username: SecurityTester" 
Write-Host "  Password: TestPassword123!"
Write-Host ""
Write-Host "Happy threat hunting! 🕵️‍♂️" -ForegroundColor Green

# Pause to show results
Read-Host "Press Enter to open lab directory"
Start-Process explorer.exe -ArgumentList $labDir
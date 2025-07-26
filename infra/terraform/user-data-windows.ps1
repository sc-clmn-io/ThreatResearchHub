Set-Location C:\

# Variables from Terraform
$LAB_NAME = "${lab_name}"
$REGION = "${region}"
$S3_BUCKET = "${s3_bucket}"
$LOG_GROUP = "${log_group}"

Write-Host "Starting Windows Security Lab setup for $LAB_NAME in $REGION" -ForegroundColor Green

# Set execution policy
Set-ExecutionPolicy Bypass -Scope LocalMachine -Force

# Install Chocolatey
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Refresh environment
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Install essential tools
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
    "tcpview",
    "docker-desktop",
    "nodejs",
    "python3",
    "awscli",
    "nmap"
)

foreach ($tool in $tools) {
    Write-Host "Installing $tool..." -ForegroundColor Yellow
    choco install $tool -y --no-progress --ignore-checksums
}

# Create lab directory
$labDir = "C:\SecurityLab"
New-Item -ItemType Directory -Path $labDir -Force | Out-Null
Write-Host "Created lab directory: $labDir" -ForegroundColor Green

# Configure Sysmon
$sysmonConfig = @"
<Sysmon schemaversion="4.40">
  <EventFiltering>
    <ProcessCreate onmatch="include">
      <Image condition="contains">powershell</Image>
      <Image condition="contains">cmd</Image>
      <Image condition="contains">wscript</Image>
      <Image condition="contains">cscript</Image>
      <Image condition="contains">mshta</Image>
      <Image condition="contains">rundll32</Image>
      <Image condition="contains">node</Image>
      <Image condition="contains">python</Image>
    </ProcessCreate>
    
    <FileCreate onmatch="include">
      <TargetFilename condition="contains">Windows</TargetFilename>
      <TargetFilename condition="contains">Temp</TargetFilename>
      <TargetFilename condition="contains">AppData</TargetFilename>
      <TargetFilename condition="contains">SecurityLab</TargetFilename>
    </FileCreate>
    
    <NetworkConnect onmatch="exclude">
      <Image condition="is">C:\Windows\System32\svchost.exe</Image>
    </NetworkConnect>
    
    <RegistryEvent onmatch="include">
      <TargetObject condition="contains">CurrentVersion\Run</TargetObject>
      <TargetObject condition="contains">Policies</TargetObject>
    </RegistryEvent>
  </EventFiltering>
</Sysmon>
"@

$sysmonConfigPath = "$labDir\sysmon-config.xml"
$sysmonConfig | Out-File -FilePath $sysmonConfigPath -Encoding UTF8

# Install and configure Sysmon
sysmon -accepteula -i $sysmonConfigPath

# Enable PowerShell logging
$regPaths = @(
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ModuleLogging",
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\ScriptBlockLogging",
    "HKLM:\SOFTWARE\Policies\Microsoft\Windows\PowerShell\Transcription"
)

foreach ($regPath in $regPaths) {
    New-Item -Path $regPath -Force | Out-Null
    Set-ItemProperty -Path $regPath -Name "EnableModuleLogging" -Value 1 -ErrorAction SilentlyContinue
    Set-ItemProperty -Path $regPath -Name "EnableScriptBlockLogging" -Value 1 -ErrorAction SilentlyContinue
    Set-ItemProperty -Path $regPath -Name "EnableTranscription" -Value 1 -ErrorAction SilentlyContinue
    Set-ItemProperty -Path $regPath -Name "OutputDirectory" -Value "$labDir\PowerShellLogs" -ErrorAction SilentlyContinue
}

New-Item -ItemType Directory -Path "$labDir\PowerShellLogs" -Force | Out-Null

# Enable audit policies
auditpol /set /category:"Account Logon" /success:enable /failure:enable
auditpol /set /category:"Account Management" /success:enable /failure:enable
auditpol /set /category:"Process Tracking" /success:enable /failure:enable

# Install AWS CloudWatch agent
$cwAgentUrl = "https://s3.amazonaws.com/amazoncloudwatch-agent/windows/amd64/latest/amazon-cloudwatch-agent.msi"
$cwAgentPath = "$env:TEMP\amazon-cloudwatch-agent.msi"
Invoke-WebRequest -Uri $cwAgentUrl -OutFile $cwAgentPath
Start-Process -FilePath "msiexec.exe" -ArgumentList "/i", $cwAgentPath, "/quiet" -Wait

# Configure CloudWatch agent
$cwConfig = @"
{
    "logs": {
        "logs_collected": {
            "windows_events": {
                "collect_list": [
                    {
                        "event_name": "System",
                        "event_levels": ["ERROR", "WARNING", "INFORMATION"],
                        "log_group_name": "$LOG_GROUP",
                        "log_stream_name": "{instance_id}/System"
                    },
                    {
                        "event_name": "Security",
                        "event_levels": ["ERROR", "WARNING", "INFORMATION"],
                        "log_group_name": "$LOG_GROUP",
                        "log_stream_name": "{instance_id}/Security"
                    },
                    {
                        "event_name": "Microsoft-Windows-Sysmon/Operational",
                        "event_levels": ["ERROR", "WARNING", "INFORMATION"],
                        "log_group_name": "$LOG_GROUP",
                        "log_stream_name": "{instance_id}/Sysmon"
                    }
                ]
            },
            "files": {
                "collect_list": [
                    {
                        "file_path": "$labDir\\Logs\\*.log",
                        "log_group_name": "$LOG_GROUP",
                        "log_stream_name": "{instance_id}/SecurityLab"
                    }
                ]
            }
        }
    },
    "metrics": {
        "namespace": "SecurityLab",
        "metrics_collected": {
            "Memory": {
                "measurement": ["% Committed Bytes In Use"],
                "metrics_collection_interval": 60
            },
            "Processor": {
                "measurement": ["% Processor Time"],
                "metrics_collection_interval": 60,
                "resources": ["_Total"]
            }
        }
    }
}
"@

$cwConfigPath = "C:\ProgramData\Amazon\AmazonCloudWatchAgent\amazon-cloudwatch-agent.json"
New-Item -ItemType Directory -Path (Split-Path $cwConfigPath) -Force | Out-Null
$cwConfig | Out-File -FilePath $cwConfigPath -Encoding UTF8

# Start CloudWatch agent
& "C:\Program Files\Amazon\AmazonCloudWatchAgent\amazon-cloudwatch-agent-ctl.ps1" `
    -a fetch-config -m ec2 -c file:$cwConfigPath -s

# Create test user
$testUserName = "SecurityTester"
$testPassword = ConvertTo-SecureString "SecurityLab123!" -AsPlainText -Force
New-LocalUser -Name $testUserName -Password $testPassword -Description "Test account for security labs" -PasswordNeverExpires
Add-LocalGroupMember -Group "Users" -Member $testUserName

# Create lab directories
$labDirs = @("Workspace", "Logs", "Scripts", "Configs", "Tools")
foreach ($dir in $labDirs) {
    New-Item -ItemType Directory -Path "$labDir\$dir" -Force | Out-Null
}

# Create Docker Compose file
$dockerCompose = @"
version: '3.8'
services:
  windows-lab:
    image: mcr.microsoft.com/windows/servercore:ltsc2019
    container_name: windows-security-lab
    volumes:
      - type: bind
        source: C:\SecurityLab\Workspace
        target: C:\workspace
    command: powershell -Command "Write-Host 'Windows Security Lab Ready!'; Start-Sleep -Seconds 3600"

  jenkins:
    image: jenkins/jenkins:lts
    container_name: security-jenkins
    ports:
      - "8080:8080"
    volumes:
      - jenkins_home:/var/jenkins_home

volumes:
  jenkins_home:
"@

$dockerCompose | Out-File -FilePath "$labDir\docker-compose.yml" -Encoding UTF8

# Create lab startup script
$startupScript = @"
# Windows Security Lab Startup Script
Write-Host "🚀 Starting Windows Security Lab Environment..." -ForegroundColor Green

# Start Docker containers
Set-Location C:\SecurityLab
docker-compose up -d

Write-Host "📊 Lab Services Status:" -ForegroundColor Cyan
docker-compose ps

Write-Host ""
Write-Host "🌐 Access Points:" -ForegroundColor Yellow
Write-Host "   • Jenkins:        http://localhost:8080"
Write-Host "   • Lab Directory:  C:\SecurityLab"

Write-Host ""
Write-Host "🔍 Available Tools:" -ForegroundColor Yellow
Write-Host "   • Event Viewer:    eventvwr.msc"
Write-Host "   • Process Explorer: procexp"
Write-Host "   • Process Monitor:  procmon" 
Write-Host "   • Autoruns:        autoruns"
Write-Host "   • TCP View:        tcpview"

Write-Host ""
Write-Host "✅ Windows Security Lab Ready!" -ForegroundColor Green
"@

$startupScript | Out-File -FilePath "$labDir\Scripts\Start-Lab.ps1" -Encoding UTF8

# Create vulnerability scanning script
$scanScript = @"
# Windows Vulnerability Scanning Script
Write-Host "🔍 Running Windows Security Scan..." -ForegroundColor Green

`$resultsDir = "C:\SecurityLab\Logs\ScanResults"
New-Item -ItemType Directory -Path `$resultsDir -Force | Out-Null

# System information gathering
Get-ComputerInfo | ConvertTo-Json | Out-File "`$resultsDir\system-info.json"

# Installed software audit
Get-WmiObject -Class Win32_Product | Select-Object Name, Version, Vendor | 
    ConvertTo-Json | Out-File "`$resultsDir\installed-software.json"

# Running processes
Get-Process | Select-Object Name, Id, CPU, WorkingSet | 
    ConvertTo-Json | Out-File "`$resultsDir\running-processes.json"

# Network connections
Get-NetTCPConnection | Select-Object LocalAddress, LocalPort, RemoteAddress, RemotePort, State | 
    ConvertTo-Json | Out-File "`$resultsDir\network-connections.json"

# Windows Update status
Get-WUHistory | ConvertTo-Json | Out-File "`$resultsDir\windows-updates.json" -ErrorAction SilentlyContinue

Write-Host "✅ Security scan completed. Results in: `$resultsDir" -ForegroundColor Green
"@

$scanScript | Out-File -FilePath "$labDir\Scripts\Scan-Vulnerabilities.ps1" -Encoding UTF8

# Create system monitoring script  
$monitorScript = @"
# Windows System Monitoring Script
Write-Host "📊 Windows System Monitoring Report" -ForegroundColor Green
Write-Host "==================================="

Write-Host ""
Write-Host "🖥️  System Information:" -ForegroundColor Cyan
Write-Host "   • Computer Name: `$(hostname)"
Write-Host "   • Uptime: `$((Get-Date) - (Get-CimInstance Win32_OperatingSystem).LastBootUpTime)"
Write-Host "   • OS Version: `$(Get-CimInstance Win32_OperatingSystem | Select-Object -ExpandProperty Caption)"

Write-Host ""
Write-Host "💾 Memory Usage:" -ForegroundColor Cyan
Get-CimInstance Win32_OperatingSystem | Select-Object @{Name="Total(GB)";Expression={[math]::round(`$_.TotalVisibleMemorySize/1MB,2)}}, @{Name="Free(GB)";Expression={[math]::round(`$_.FreePhysicalMemory/1MB,2)}}

Write-Host ""
Write-Host "💽 Disk Usage:" -ForegroundColor Cyan
Get-CimInstance -ClassName Win32_LogicalDisk | Select-Object DeviceID, @{Name="Size(GB)";Expression={[math]::round(`$_.Size/1GB,2)}}, @{Name="Free(GB)";Expression={[math]::round(`$_.FreeSpace/1GB,2)}}

Write-Host ""
Write-Host "🐳 Docker Status:" -ForegroundColor Cyan
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>$null

Write-Host ""
Write-Host "🔍 Recent Security Events:" -ForegroundColor Cyan
Get-WinEvent -LogName Security -MaxEvents 5 | Select-Object TimeCreated, Id, LevelDisplayName, Message | Format-Table -Wrap

# Log to file
`$logEntry = "$(Get-Date): System monitoring completed"
Add-Content -Path "C:\SecurityLab\Logs\monitoring.log" -Value `$logEntry
"@

$monitorScript | Out-File -FilePath "$labDir\Scripts\Monitor-System.ps1" -Encoding UTF8

# Create scheduled tasks for monitoring
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-ExecutionPolicy Bypass -File C:\SecurityLab\Scripts\Monitor-System.ps1"
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Minutes 5)
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName "SecurityLabMonitoring" -Action $action -Trigger $trigger -Principal $principal

# Create desktop shortcuts
$WshShell = New-Object -ComObject WScript.Shell

$shortcut = $WshShell.CreateShortcut("$env:PUBLIC\Desktop\Security Lab.lnk")
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-ExecutionPolicy Bypass -File `"C:\SecurityLab\Scripts\Start-Lab.ps1`""
$shortcut.WorkingDirectory = "C:\SecurityLab"
$shortcut.Save()

$shortcut = $WshShell.CreateShortcut("$env:PUBLIC\Desktop\Lab Monitor.lnk")
$shortcut.TargetPath = "powershell.exe"
$shortcut.Arguments = "-ExecutionPolicy Bypass -File `"C:\SecurityLab\Scripts\Monitor-System.ps1`""
$shortcut.WorkingDirectory = "C:\SecurityLab"
$shortcut.Save()

# Create README
$readme = @"
# Windows Security Lab Environment

This Windows Security Lab has been configured for security testing and analysis.

## 🛠️ Installed Tools
- Sysmon (system monitoring)
- Wireshark (network analysis)
- Sysinternals Suite (system utilities)
- Visual Studio Code (editor)
- Docker Desktop (containerization)
- Node.js and Python (development)

## 📊 Logging Configuration
- Sysmon: Comprehensive system monitoring enabled
- PowerShell: Script block and module logging enabled
- Windows Events: Security audit policies configured
- CloudWatch: AWS logging and monitoring configured

## 🎯 Lab Scripts
- Start-Lab.ps1: Starts lab environment and services
- Monitor-System.ps1: System monitoring and reporting
- Scan-Vulnerabilities.ps1: Security vulnerability scanning

## 👤 Test Account
- Username: SecurityTester
- Password: SecurityLab123!

## 🔍 Desktop Shortcuts
- Security Lab: Starts the complete lab environment
- Lab Monitor: Opens system monitoring dashboard

## ⚠️  Important Notes
- Lab Directory: C:\SecurityLab
- All logs stored in: C:\SecurityLab\Logs
- Sysmon config: C:\SecurityLab\sysmon-config.xml
- This is a TEST environment - keep isolated

Happy learning! 🎓
"@

$readme | Out-File -FilePath "$labDir\README.txt" -Encoding UTF8

# Set environment variables
[Environment]::SetEnvironmentVariable("LAB_NAME", $LAB_NAME, "Machine")
[Environment]::SetEnvironmentVariable("REGION", $REGION, "Machine")
[Environment]::SetEnvironmentVariable("S3_BUCKET", $S3_BUCKET, "Machine")

# Final logging
$completionMsg = "$(Get-Date): Windows Security Lab setup completed for $LAB_NAME"
Add-Content -Path "$labDir\Logs\setup.log" -Value $completionMsg

Write-Host ""
Write-Host "🎉 Windows Security Lab Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Lab Location: $labDir" -ForegroundColor Cyan
Write-Host "🖥️  Desktop Shortcuts: Security Lab, Lab Monitor" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Windows Security Lab ready for use!" -ForegroundColor Green
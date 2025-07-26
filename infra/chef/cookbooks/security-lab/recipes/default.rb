# Security Lab Chef Cookbook - Default Recipe
# Installs and configures complete security testing environment

# Update package cache
apt_update 'update' do
  action :update
end

# Install essential packages
package %w(
  curl
  wget
  git
  vim
  build-essential
  software-properties-common
  apt-transport-https
  ca-certificates
  gnupg
  lsb-release
  jq
  unzip
  htop
  nmap
  wireshark-common
  tcpdump
  netcat
  auditd
  rsyslog
  fail2ban
  python3
  python3-pip
)

# Install Docker
docker_installation_script 'default' do
  repo 'main'
  action :create
end

docker_service 'default' do
  action [:create, :start]
end

# Install Docker Compose
remote_file '/usr/local/bin/docker-compose' do
  source 'https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-linux-x86_64'
  mode '0755'
  action :create
end

# Install Node.js
nodejs_install '18' do
  version '18'
  action :install
end

# Install npm security tools
npm_package 'snyk' do
  options '-g'
end

npm_package 'audit-ci' do
  options '-g'
end

npm_package 'retire' do
  options '-g'
end

npm_package 'semgrep' do
  options '-g'
end

# Install Python security tools
python_package 'bandit' do
  python '3'
end

python_package 'safety' do
  python '3'
end

python_package 'checkov' do
  python '3'
end

# Create lab user
user 'labuser' do
  manage_home true
  shell '/bin/bash'
  action :create
end

group 'docker' do
  append true
  members ['labuser']
  action :modify
end

# Create lab directory structure
%w(
  /opt/security-lab
  /opt/security-lab/workspace
  /opt/security-lab/logs
  /opt/security-lab/scripts
  /opt/security-lab/configs
  /opt/security-lab/tools
  /opt/security-lab/scans
).each do |dir|
  directory dir do
    owner 'labuser'
    group 'labuser'
    mode '0755'
    recursive true
    action :create
  end
end

# Install AWS CLI
remote_file '/tmp/awscliv2.zip' do
  source 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip'
  action :create
end

bash 'install_aws_cli' do
  cwd '/tmp'
  code <<-EOH
    unzip awscliv2.zip
    ./aws/install
    rm -rf aws awscliv2.zip
  EOH
  not_if 'which aws'
end

# Configure audit daemon
cookbook_file '/etc/audit/rules.d/security-lab.rules' do
  source 'audit-rules.conf'
  mode '0640'
  notifies :restart, 'service[auditd]', :immediately
end

service 'auditd' do
  action [:enable, :start]
end

# Configure fail2ban
cookbook_file '/etc/fail2ban/jail.local' do
  source 'jail.local'
  mode '0644'
  notifies :restart, 'service[fail2ban]', :immediately
end

service 'fail2ban' do
  action [:enable, :start]
end

# Create Docker Compose file for lab services
template '/opt/security-lab/docker-compose.yml' do
  source 'docker-compose.yml.erb'
  owner 'labuser'
  group 'labuser'
  mode '0644'
  variables(
    lab_name: node['security-lab']['name'] || 'security-lab',
    environment: node['security-lab']['environment'] || 'development'
  )
end

# Create lab startup script
template '/opt/security-lab/scripts/start-lab.sh' do
  source 'start-lab.sh.erb'
  owner 'labuser'
  group 'labuser'
  mode '0755'
end

# Create vulnerability scanning script
template '/opt/security-lab/scripts/scan-vulnerabilities.sh' do
  source 'scan-vulnerabilities.sh.erb'
  owner 'labuser'
  group 'labuser'
  mode '0755'
end

# Create system monitoring script
template '/opt/security-lab/scripts/monitor-system.sh' do
  source 'monitor-system.sh.erb'
  owner 'labuser'
  group 'labuser'
  mode '0755'
end

# Set up cron job for monitoring
cron 'security-lab-monitoring' do
  minute '*/5'
  command '/opt/security-lab/scripts/monitor-system.sh >> /opt/security-lab/logs/monitoring.log 2>&1'
  user 'root'
end

# Create systemd service for lab
template '/etc/systemd/system/security-lab.service' do
  source 'security-lab.service.erb'
  mode '0644'
  notifies :run, 'bash[reload_systemd]', :immediately
end

bash 'reload_systemd' do
  code 'systemctl daemon-reload'
  action :nothing
end

service 'security-lab' do
  action [:enable, :start]
end

# Create README
template '/opt/security-lab/README.md' do
  source 'README.md.erb'
  owner 'labuser'
  group 'labuser'
  mode '0644'
  variables(
    lab_name: node['security-lab']['name'] || 'security-lab'
  )
end

# Set up MOTD
template '/etc/motd' do
  source 'motd.erb'
  mode '0644'
end

log 'Security Lab Chef cookbook deployment completed successfully!' do
  level :info
end
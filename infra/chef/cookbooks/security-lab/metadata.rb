name 'security-lab'
maintainer 'Security Lab Team'
maintainer_email 'admin@securitylab.com'
license 'MIT'
description 'Installs and configures security testing laboratory environment'
version '1.0.0'
chef_version '>= 16.0'

platforms = {
  'ubuntu' => '>= 20.04',
  'debian' => '>= 10.0',
  'centos' => '>= 8.0',
  'redhat' => '>= 8.0'
}

platforms.each do |platform, version|
  supports platform, version
end

depends 'docker', '~> 4.0'
depends 'nodejs', '~> 6.0'
depends 'python', '~> 3.0'

source_url 'https://github.com/security-lab/chef-security-lab'
issues_url 'https://github.com/security-lab/chef-security-lab/issues'

attribute 'security-lab/name',
  display_name: 'Lab Name',
  description: 'Name of the security lab environment',
  type: 'string',
  default: 'security-lab'

attribute 'security-lab/environment',
  display_name: 'Environment',
  description: 'Deployment environment (development, staging, production)',
  type: 'string',
  default: 'development'

attribute 'security-lab/services',
  display_name: 'Lab Services',
  description: 'List of services to deploy in the lab',
  type: 'array',
  default: ['nodejs-lab', 'owasp-zap', 'postgresql', 'redis', 'nginx']

attribute 'security-lab/monitoring/enabled',
  display_name: 'Enable Monitoring',
  description: 'Enable Prometheus and Grafana monitoring',
  type: 'string',
  default: 'true'

attribute 'security-lab/security/fail2ban',
  display_name: 'Enable Fail2ban',
  description: 'Enable fail2ban intrusion prevention',
  type: 'string',
  default: 'true'

attribute 'security-lab/security/auditd',
  display_name: 'Enable Audit Daemon',
  description: 'Enable system audit logging',
  type: 'string',
  default: 'true'
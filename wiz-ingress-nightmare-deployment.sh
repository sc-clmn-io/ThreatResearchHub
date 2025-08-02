#!/bin/bash

echo "=== Wiz IngressNightmare - Azure AKS Deployment ==="
echo "Official CVE-2025-1974 vulnerability reproducer"
echo "Source: https://github.com/ofirc/ingress-nightmare"
echo ""

# Set variables matching Wiz repo configuration
export RESOURCE_GROUP="wiz-ingress-nightmare-rg"
export CLUSTER_NAME="wiz-ingress-nightmare-aks"
export LOCATION="eastus"
export INGRESS_NGINX_VERSION="4.12.0"  # Vulnerable version from Wiz research

echo "🎯 Deploying Wiz IngressNightmare:"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   Cluster Name: $CLUSTER_NAME"
echo "   Location: $LOCATION"
echo "   Vulnerable ingress-nginx: v$INGRESS_NGINX_VERSION"
echo ""

# Check Azure login
if ! az account show &> /dev/null; then
    echo "❌ Azure login required. Please run: az login"
    exit 1
fi

echo "📋 Current Azure Account:"
az account show --query "{name:name, id:id, tenantId:tenantId}" -o table
echo ""

# Confirm deployment
echo "🚀 This deploys the official Wiz IngressNightmare vulnerability:"
echo "   - CVE-2025-1974 admission controller RCE"
echo "   - Vulnerable ingress-nginx v4.12.0"
echo "   - Azure AKS cluster with LoadBalancer"
echo ""
echo "⚠️  WARNING: This deploys VULNERABLE infrastructure for testing only!"
echo ""

read -p "Continue with deployment? (y/N): " -n 1 -r
echo

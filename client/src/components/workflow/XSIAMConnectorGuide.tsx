import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, AlertTriangle, Terminal, Download, ExternalLink } from "lucide-react";

export default function XSIAMConnectorGuide() {
  const deploymentSteps = [
    {
      step: 1,
      title: "Deploy Vulnerable Infrastructure",
      command: "./wiz-ingress-nightmare-deployment.sh",
      description: "Creates Azure AKS cluster with vulnerable ingress-nginx v4.12.0",
      duration: "15-20 minutes",
      status: "ready"
    },
    {
      step: 2,
      title: "Install XSIAM Connector",
      command: "./deploy-xsiam-connector.sh", 
      description: "Uses authentic XSIAM distribution configuration",
      duration: "5-10 minutes",
      status: "ready"
    },
    {
      step: 3,
      title: "Test CVE-2025-1974 Detection",
      command: "./test-cve-2025-1974.sh",
      description: "Triggers vulnerability and verifies XSIAM detection",
      duration: "2-3 minutes",
      status: "ready"
    }
  ];

  const configFiles = [
    {
      name: "ingress-nightmare.values.yaml",
      description: "XSIAM distribution configuration with authentic credentials",
      status: "configured",
      icon: "⚙️"
    },
    {
      name: "xsiam-cve-2025-1974-correlation-rule.json", 
      description: "CVE-2025-1974 detection rules for XSIAM",
      status: "ready",
      icon: "🔍"
    },
    {
      name: "admission-review.json",
      description: "Official Wiz vulnerability test payload",
      status: "ready", 
      icon: "🧪"
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">XSIAM Kubernetes Connector</h1>
        <p className="text-muted-foreground">
          Complete CVE-2025-1974 detection workflow with authentic Wiz IngressNightmare vulnerability
        </p>
        <Badge variant="destructive" className="text-sm">
          Critical Vulnerability Testing
        </Badge>
      </div>

      {/* Quick Start */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            3-Command Deployment Sequence
          </CardTitle>
          <CardDescription>
            Complete setup from infrastructure to detection in ~25-35 minutes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {deploymentSteps.map((step) => (
            <div key={step.step} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Step {step.step}</Badge>
                  <h3 className="font-semibold">{step.title}</h3>
                  <Badge variant="secondary">{step.duration}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                <code className="text-sm bg-muted px-2 py-1 rounded">{step.command}</code>
              </div>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Configuration Files Ready
          </CardTitle>
          <CardDescription>
            All files configured with authentic XSIAM distribution details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {configFiles.map((file) => (
            <div key={file.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg">{file.icon}</span>
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{file.description}</p>
                </div>
              </div>
              <Badge variant={file.status === "configured" ? "default" : "secondary"}>
                {file.status}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* XSIAM Integration Details */}
      <Card>
        <CardHeader>
          <CardTitle>Your XSIAM Configuration</CardTitle>
          <CardDescription>
            Deployment uses your authentic distribution configuration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Distribution ID</p>
              <code className="text-xs bg-muted px-2 py-1 rounded block">
                f398475526c84bc196c6db33fc80a16d
              </code>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Repository</p>
              <code className="text-xs bg-muted px-2 py-1 rounded block">
                us-central1-docker.pkg.dev/xdr-us-1003757525225
              </code>
            </div>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Agent Version</p>
            <Badge variant="outline">k8s-agent:0.3.336.38068000</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Verification Points */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Checklist</CardTitle>
          <CardDescription>
            Key checkpoints to ensure successful deployment
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <p className="font-medium">After Infrastructure Deployment:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• AKS cluster running with 3 nodes</li>
              <li>• Vulnerable ingress-nginx v4.12.0 deployed</li>
              <li>• LoadBalancer service accessible</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <p className="font-medium">After XSIAM Connector:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• Connector appears in XSIAM Data Sources → Kubernetes</li>
              <li>• Initial scan completes successfully</li>
              <li>• Audit log collection active</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <p className="font-medium">After Vulnerability Testing:</p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>• CVE-2025-1974 alerts in XSIAM Incidents</li>
              <li>• Correlation rule triggers correctly</li>
              <li>• Alert layout displays response actions</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Cost Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Cost Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">Running Costs</p>
              <p className="text-2xl font-bold text-yellow-600">$30-60/month</p>
              <p className="text-xs text-muted-foreground">Azure AKS cluster with 3 Standard_B2s nodes</p>
            </div>
            <div>
              <p className="text-sm font-medium">Cleanup</p>
              <code className="text-xs bg-muted px-2 py-1 rounded block mb-1">
                helm uninstall konnector -n pan
              </code>
              <code className="text-xs bg-muted px-2 py-1 rounded block">
                az group delete --name wiz-ingress-nightmare-rg
              </code>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-center">
        <Button variant="default" className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Deployment Scripts
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4" />
          View Complete Workflow Guide
        </Button>
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Key, 
  Copy, 
  ExternalLink, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  Search,
  Settings,
  Cloud
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AzureCredentialsGuide() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "Text copied successfully",
    });
  };

  const steps = [
    {
      title: "Access Azure Portal",
      description: "Navigate to the Azure Portal",
      content: (
        <div className="space-y-4">
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              Open your web browser and go to <strong>portal.azure.com</strong>
            </AlertDescription>
          </Alert>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => window.open('https://portal.azure.com', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Open Azure Portal
            </Button>
          </div>
        </div>
      )
    },
    {
      title: "Navigate to App Registrations",
      description: "Find the App Registrations service",
      content: (
        <div className="space-y-4">
          <div className="grid gap-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Method 1: Search Bar</h4>
              <p className="text-sm">In the top search bar, type "App Registrations" and click the result</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-semibold mb-2">Method 2: Azure Active Directory</h4>
              <ol className="text-sm space-y-1">
                <li>1. Click "Azure Active Directory" from the left menu</li>
                <li>2. Click "App registrations" in the left sidebar</li>
              </ol>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Create or Select App Registration",
      description: "Create a new app or select existing one",
      content: (
        <div className="space-y-4">
          <Tabs defaultValue="new-app">
            <TabsList>
              <TabsTrigger value="new-app">Create New App</TabsTrigger>
              <TabsTrigger value="existing-app">Use Existing App</TabsTrigger>
            </TabsList>
            
            <TabsContent value="new-app" className="space-y-3">
              <Alert>
                <CheckCircle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Create New Application:</strong>
                </AlertDescription>
              </Alert>
              <ol className="space-y-2 text-sm">
                <li>1. Click <Badge variant="outline">+ New registration</Badge></li>
                <li>2. Enter name: <code className="bg-gray-100 px-2 py-1 rounded">ThreatLab-App</code></li>
                <li>3. Select "Accounts in this organizational directory only"</li>
                <li>4. Click <Badge variant="outline">Register</Badge></li>
              </ol>
            </TabsContent>
            
            <TabsContent value="existing-app" className="space-y-3">
              <Alert>
                <Info className="w-4 h-4" />
                <AlertDescription>
                  <strong>Select Existing Application:</strong>
                </AlertDescription>
              </Alert>
              <p className="text-sm">Click on an existing app registration from the list that you want to use for the threat lab platform.</p>
            </TabsContent>
          </Tabs>
        </div>
      )
    },
    {
      title: "Get Application (Client) ID",
      description: "Copy the Client ID from the Overview page",
      content: (
        <div className="space-y-4">
          <Alert>
            <Key className="w-4 h-4" />
            <AlertDescription>
              On the app's <strong>Overview</strong> page, copy the <strong>Application (client) ID</strong>
            </AlertDescription>
          </Alert>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium mb-2">What it looks like:</p>
            <code className="text-xs bg-white p-2 rounded border block">
              12345678-1234-1234-1234-123456789012
            </code>
            <p className="text-xs text-muted-foreground mt-1">This is your <strong>Client ID</strong></p>
          </div>
        </div>
      )
    },
    {
      title: "Get Directory (Tenant) ID",
      description: "Copy the Tenant ID from the same Overview page",
      content: (
        <div className="space-y-4">
          <Alert>
            <Key className="w-4 h-4" />
            <AlertDescription>
              Also on the <strong>Overview</strong> page, copy the <strong>Directory (tenant) ID</strong>
            </AlertDescription>
          </Alert>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium mb-2">What it looks like:</p>
            <code className="text-xs bg-white p-2 rounded border block">
              87654321-4321-4321-4321-210987654321
            </code>
            <p className="text-xs text-muted-foreground mt-1">This is your <strong>Tenant ID</strong></p>
          </div>
        </div>
      )
    },
    {
      title: "Create Client Secret",
      description: "Generate a new client secret",
      content: (
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              Go to <strong>Certificates & secrets</strong> in the left menu
            </AlertDescription>
          </Alert>
          <ol className="space-y-2 text-sm">
            <li>1. Click <Badge variant="outline">+ New client secret</Badge></li>
            <li>2. Enter description: <code className="bg-gray-100 px-2 py-1 rounded">ThreatLab-Secret</code></li>
            <li>3. Select expiration (recommended: 12 months)</li>
            <li>4. Click <Badge variant="outline">Add</Badge></li>
            <li>5. <strong>Immediately copy the Value</strong> (not the Secret ID)</li>
          </ol>
          <Alert>
            <AlertTriangle className="w-4 h-4" />
            <AlertDescription>
              <strong>Important:</strong> Copy the secret value immediately - you won't be able to see it again!
            </AlertDescription>
          </Alert>
        </div>
      )
    },
    {
      title: "Get Subscription ID",
      description: "Find your Azure subscription ID",
      content: (
        <div className="space-y-4">
          <Alert>
            <Search className="w-4 h-4" />
            <AlertDescription>
              Search for <strong>"Subscriptions"</strong> in the Azure portal search bar
            </AlertDescription>
          </Alert>
          <ol className="space-y-2 text-sm">
            <li>1. Click on your subscription name</li>
            <li>2. Copy the <strong>Subscription ID</strong> from the Overview page</li>
          </ol>
          <div className="p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm font-medium mb-2">What it looks like:</p>
            <code className="text-xs bg-white p-2 rounded border block">
              abcdef12-3456-7890-abcd-ef1234567890
            </code>
            <p className="text-xs text-muted-foreground mt-1">This is your <strong>Subscription ID</strong></p>
          </div>
        </div>
      )
    },
    {
      title: "Set Resource Group",
      description: "Create or select a resource group",
      content: (
        <div className="space-y-4">
          <Tabs defaultValue="new-rg">
            <TabsList>
              <TabsTrigger value="new-rg">Create New</TabsTrigger>
              <TabsTrigger value="existing-rg">Use Existing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="new-rg" className="space-y-3">
              <Alert>
                <Cloud className="w-4 h-4" />
                <AlertDescription>
                  Search for <strong>"Resource groups"</strong> and create new
                </AlertDescription>
              </Alert>
              <ol className="space-y-2 text-sm">
                <li>1. Click <Badge variant="outline">+ Create</Badge></li>
                <li>2. Enter name: <code className="bg-gray-100 px-2 py-1 rounded">threat-lab-rg</code></li>
                <li>3. Select your preferred region</li>
                <li>4. Click <Badge variant="outline">Review + create</Badge></li>
              </ol>
            </TabsContent>
            
            <TabsContent value="existing-rg" className="space-y-3">
              <p className="text-sm">Use an existing resource group name from your Azure subscription.</p>
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm">Common names: <code>Default-ResourceGroup</code>, <code>NetworkWatcherRG</code>, or any custom resource group you've created.</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )
    },
    {
      title: "Assign Permissions",
      description: "Grant the app necessary permissions",
      content: (
        <div className="space-y-4">
          <Alert>
            <Settings className="w-4 h-4" />
            <AlertDescription>
              The app needs <strong>Contributor</strong> role on your subscription or resource group
            </AlertDescription>
          </Alert>
          <ol className="space-y-2 text-sm">
            <li>1. Go to your Subscription or Resource Group</li>
            <li>2. Click <strong>Access control (IAM)</strong></li>
            <li>3. Click <Badge variant="outline">+ Add</Badge> → <strong>Add role assignment</strong></li>
            <li>4. Select <strong>Contributor</strong> role</li>
            <li>5. Search for your app name (ThreatLab-App)</li>
            <li>6. Select it and click <Badge variant="outline">Save</Badge></li>
          </ol>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Azure Credentials Setup Guide</h1>
          <p className="text-muted-foreground">Step-by-step guide to find your Azure service principal credentials</p>
        </div>
        <Badge variant="outline">Step {currentStep} of {steps.length}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Progress Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    currentStep === index + 1
                      ? 'bg-blue-100 border-l-4 border-blue-500'
                      : currentStep > index + 1
                      ? 'bg-green-50 text-green-700'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => setCurrentStep(index + 1)}
                >
                  <div className="flex items-center gap-2">
                    {currentStep > index + 1 ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs">
                        {index + 1}
                      </span>
                    )}
                    <span className="text-xs font-medium">{step.title}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">
                  Step {currentStep}
                </span>
                {steps[currentStep - 1].title}
              </CardTitle>
              <CardDescription>{steps[currentStep - 1].description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {steps[currentStep - 1].content}

              <Separator />

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
                  disabled={currentStep === 1}
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentStep(Math.min(steps.length, currentStep + 1))}
                  disabled={currentStep === steps.length}
                >
                  Next Step
                </Button>
              </div>
            </CardContent>
          </Card>

          {currentStep === steps.length && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Credentials Ready!
                </CardTitle>
                <CardDescription>
                  You should now have all the required Azure credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3">
                  <div className="p-3 bg-gray-50 rounded">
                    <strong>Tenant ID:</strong> Directory (tenant) ID from app Overview
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <strong>Client ID:</strong> Application (client) ID from app Overview
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <strong>Client Secret:</strong> Secret value from Certificates & secrets
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <strong>Subscription ID:</strong> From Subscriptions page
                  </div>
                  <div className="p-3 bg-gray-50 rounded">
                    <strong>Resource Group:</strong> threat-lab-rg (or your chosen name)
                  </div>
                </div>
                
                <Alert>
                  <Info className="w-4 h-4" />
                  <AlertDescription>
                    Enter these credentials in the Azure Connection tab to connect your infrastructure platform.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
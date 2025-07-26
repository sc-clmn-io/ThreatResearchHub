import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PlatformLayout from "@/components/platform-layout";
import Dashboard from "@/pages/dashboard";
import ThreatFeeds from "@/pages/threat-feeds";
import ThreatIntelligence from "@/pages/threat-intelligence";
import TemplateSharing from "@/pages/template-sharing";
import ContentBuilderWizard from "@/components/content-builder-wizard";
import ContentLibrary from "@/pages/content-library";
import ContentTestPage from "@/pages/content-test";
import ContentGenerationDemo from "@/pages/content-generation-demo";
import DDLCWorkflowDemo from "@/pages/ddlc-workflow-demo";
import DDLCAnalyticsDashboard from "@/pages/ddlc-analytics-dashboard";
import DDLCExplained from "@/pages/ddlc-explained";
import DatasetSchemasPage from "@/pages/dataset-schemas";
import XSIAMExtractorPage from "@/pages/xsiam-extractor";
import LabBuildPlannerPage from "@/pages/lab-build-planner";
import LabEnvironmentPage from "@/pages/lab-environment";
import UserGuidePage from "@/pages/user-guide";
import PIISanitizerPage from "@/pages/pii-sanitizer";
import ThreatArchivePage from "@/pages/threat-archive";
import ThreatMonitoringPage from "@/pages/threat-monitoring";
import FindingsReportPage from "@/pages/findings-report";
import XSIAMDebuggerPage from "@/pages/xsiam-debugger";
import XSIAMDeployment from "@/pages/xsiam-deployment";
import GitHubExportPage from "@/pages/github-export";
import ContentRecommendationsPage from "@/pages/content-recommendations";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <PlatformLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/threat-feeds" component={ThreatFeeds} />
        <Route path="/threat-intelligence" component={ThreatIntelligence} />

        <Route path="/content-generation" component={ContentBuilderWizard} />
        <Route path="/content-generation-demo" component={ContentGenerationDemo} />
        <Route path="/ddlc-workflow-demo" component={DDLCWorkflowDemo} />
        <Route path="/ddlc-analytics" component={DDLCAnalyticsDashboard} />
        <Route path="/ddlc-explained" component={DDLCExplained} />
        <Route path="/templates" component={TemplateSharing} />
        <Route path="/content-library" component={ContentLibrary} />
        <Route path="/content-test" component={ContentTestPage} />
        <Route path="/dataset-schemas" component={DatasetSchemasPage} />
        <Route path="/xsiam-extractor" component={XSIAMExtractorPage} />
        <Route path="/lab-build-planner" component={LabBuildPlannerPage} />
        <Route path="/lab-environment" component={LabEnvironmentPage} />
        <Route path="/user-guide" component={UserGuidePage} />
        <Route path="/pii-sanitizer" component={PIISanitizerPage} />
        <Route path="/threat-archive" component={ThreatArchivePage} />
        <Route path="/threat-monitoring" component={ThreatMonitoringPage} />

        <Route path="/xsiam-debugger" component={XSIAMDebuggerPage} />
        <Route path="/xsiam-deployment" component={XSIAMDeployment} />
        <Route path="/github-export" component={GitHubExportPage} />
        <Route path="/content-recommendations" component={ContentRecommendationsPage} />
        <Route component={NotFound} />
      </Switch>
    </PlatformLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

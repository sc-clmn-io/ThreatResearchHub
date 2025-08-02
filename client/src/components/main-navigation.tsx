import { useState } from "react";
import { Link, useLocation } from "wouter";
import { 
  Home, 
  Shield, 
  Activity, 
  Layers, 
  Settings, 
  FileText, 
  Database, 
  Server, 
  Archive,
  Monitor,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Search,
  Zap,
  Beaker,
  BookOpen,
  Share2,
  Play,
  RefreshCw,
  BarChart3,
  Github
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  category: 'stage1' | 'stage2' | 'stage3' | 'stage4' | 'stage5' | 'stage6' | 'tools';
  description: string;
}

const navigationItems: NavItem[] = [
  // STAGE 1: Use Case Definition - Primary Entry Point
  { href: "/", icon: Home, label: "1. 7-Stage Workflow", category: 'stage1', description: "Start here: Complete guided workflow from use case definition to production deployment" },
  { href: "/threat-monitoring", icon: Activity, label: "1a. TBH Threat Feeds", category: 'stage1', description: "View threat intelligence automatically ingested into ThreatResearchHub platform" },
  { href: "/pii-sanitizer", icon: Search, label: "1b. Homographic Sanitizer", category: 'stage1', description: "Transform sensitive information using homographic characters while preserving structure" },
  
  // STAGE 2: Threat Selection
  { href: "/", icon: CheckCircle, label: "2. Threat Selection", category: 'stage2', description: "Choose specific threat from loaded intelligence to create security outcome" },
  
  // STAGE 3: Plan Lab Infrastructure
  { href: "/lab-build-planner", icon: Monitor, label: "3. Plan Infrastructure", category: 'stage3', description: "Design lab infrastructure for your selected threat scenario" },
  { href: "/connection-management", icon: Server, label: "3a. Connection Setup", category: 'stage3', description: "Configure connections to Docker, Proxmox, and Azure environments" },
  { href: "/threat-infrastructure", icon: Activity, label: "3b. Infrastructure Mapping", category: 'stage3', description: "Map threats to required infrastructure for streamlined deployment" },
  { href: "/lab-environment", icon: Beaker, label: "3c. Lab Setup Guide", category: 'stage3', description: "Step-by-step lab deployment with infrastructure and cost planning" },
  
  // STAGE 4: Setup Data Sources & XSIAM
  { href: "/xsiam-debugger", icon: Database, label: "4. Setup Data Sources", category: 'stage4', description: "Configure XSIAM data ingestion and validate log parsing" },
  { href: "/xsiam-deployment", icon: Server, label: "4a. XSIAM Integration", category: 'stage4', description: "Connect XSIAM to data sources and validate field mappings" },
  
  // STAGE 5: Generate Content
  { href: "/content-generation", icon: FileText, label: "5. Generate Content", category: 'stage5', description: "Create XSIAM content using your live data sources and validated fields" },
  
  // STAGE 6: Test & Deploy
  { href: "/github-export", icon: Github, label: "6. Test & Deploy", category: 'stage6', description: "Test detection rules and deploy to production XSIAM" },
  
  // SUPPORTING TOOLS
  { href: "/user-guide", icon: BookOpen, label: "📖 User Guide", category: 'tools', description: "Complete documentation and interactive tutorial" },
  { href: "/repository-sanitizer", icon: Shield, label: "🛡️ Repository Sanitizer", category: 'tools', description: "Sanitize repository for safe public sharing while protecting PAN employment" },
  { href: "/ddlc-workflow-demo", icon: RefreshCw, label: "🔄 DDLC Workflow", category: 'tools', description: "Detection Development Life Cycle management" },
  { href: "/templates", icon: Share2, label: "📋 Templates", category: 'tools', description: "Community-shared training scenarios" },
  { href: "/content-library", icon: Database, label: "📚 Content Library", category: 'tools', description: "Manage generated XSIAM content" }
];

const categoryColors = {
  stage1: 'text-emerald-700 bg-emerald-50 border-emerald-200',   // Stage 1 - Load Threat Intelligence
  stage2: 'text-blue-700 bg-blue-50 border-blue-200',           // Stage 2 - Select Specific Threat
  stage3: 'text-purple-700 bg-purple-50 border-purple-200',     // Stage 3 - Plan Infrastructure
  stage4: 'text-orange-700 bg-orange-50 border-orange-200',     // Stage 4 - Setup Data Sources & XSIAM
  stage5: 'text-indigo-700 bg-indigo-50 border-indigo-200',     // Stage 5 - Generate Content
  stage6: 'text-red-700 bg-red-50 border-red-200',             // Stage 6 - Test & Deploy
  tools: 'text-gray-600 bg-gray-50 border-gray-200'            // Supporting Tools - Gray
};

const categoryLabels = {
  stage1: 'Stage 1: Use Case Definition',
  stage2: 'Stage 2: Security Stack Configuration',
  stage3: 'Stage 3: Infrastructure Deployment', 
  stage4: 'Stage 4: Data Source Configuration',
  stage5: 'Stage 5: Platform Content Generation',
  stage6: 'Stage 6: Testing & Validation | Stage 7: Documentation & Deployment',
  tools: 'Supporting Tools & Resources'
};

export default function MainNavigation() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [location] = useLocation();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);

  // Define category order based on 6-stage workflow priority
  const categoryOrder = ['stage1', 'stage2', 'stage3', 'stage4', 'stage5', 'stage6', 'tools'];
  const orderedGroupedItems = Object.entries(groupedItems).sort((a, b) => {
    return categoryOrder.indexOf(a[0]) - categoryOrder.indexOf(b[0]);
  });

  return (
    <div className={cn(
      "h-screen bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h1 className="text-lg font-bold text-gray-900">ThreatResearchHub</h1>
            <p className="text-xs text-gray-500">Version 1.0</p>
          </div>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8 p-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2">
        <nav className="space-y-6">
          {orderedGroupedItems.map(([category, items]) => (
            <div key={category}>
              {!isCollapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {categoryLabels[category as keyof typeof categoryLabels]}
                </h3>
              )}
              
              <ul className="space-y-1">
                {items.map((item) => (
                  <li key={item.href}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Link href={item.href}>
                          <Button
                            variant="ghost"
                            className={cn(
                              "w-full justify-start h-10 transition-all duration-200",
                              isCollapsed ? "px-2" : "px-3",
                              isActive(item.href) 
                                ? `${categoryColors[item.category]} font-medium` 
                                : "text-gray-700 hover:bg-gray-100"
                            )}
                          >
                            <item.icon className={cn("h-5 w-5", isCollapsed ? "" : "mr-3")} />
                            {!isCollapsed && (
                              <span className="truncate">{item.label}</span>
                            )}
                          </Button>
                        </Link>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        {!isCollapsed ? (
          <div className="text-xs text-gray-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>Live Threat Feeds</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
            <div className="text-gray-400">
              Last update: {new Date().toLocaleTimeString()}
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}
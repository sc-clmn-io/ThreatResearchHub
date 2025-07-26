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
  category: 'status' | 'learning' | 'usecase' | 'lab' | 'xsiam' | 'content';
  description: string;
}

const navigationItems: NavItem[] = [
  // STEP 1: Load Threat Report
  { href: "/", icon: Home, label: "1. Load Threat Report", category: 'status', description: "Start here: Load threat report from URL, PDF, or threat feeds to begin the workflow" },
  { href: "/threat-monitoring", icon: Activity, label: "🔗 TBH Threat Feeds", category: 'status', description: "View threat intelligence automatically ingested into ThreatResearchHub platform" },
  { href: "/pii-sanitizer", icon: Search, label: "PII Sanitizer", category: 'status', description: "Clean sensitive information from customer data before processing" },
  
  // STEP 2: Select Specific Use Case (Dashboard handles this)
  // STEP 3: Plan Lab Infrastructure First
  { href: "/lab-build-planner", icon: Monitor, label: "3. Plan Infrastructure", category: 'usecase', description: "Design lab infrastructure for your selected threat scenario" },
  { href: "/lab-environment", icon: Beaker, label: "Lab Setup Guide", category: 'usecase', description: "Step-by-step lab deployment with infrastructure and cost planning" },
  
  // STEP 4: Setup Data Sources & XSIAM
  { href: "/xsiam-debugger", icon: Database, label: "4. Setup Data Sources", category: 'lab', description: "Configure XSIAM data ingestion and validate log parsing" },
  { href: "/xsiam-deployment", icon: Server, label: "XSIAM Integration", category: 'lab', description: "Connect XSIAM to data sources and validate field mappings" },
  
  // STEP 5: Generate Content (After Infrastructure)
  { href: "/content-generation", icon: FileText, label: "5. Generate Content", category: 'learning', description: "Create XSIAM content using your live data sources and validated fields" },
  
  // STEP 6: Test & Deploy
  { href: "/github-export", icon: Github, label: "6. Test & Deploy", category: 'xsiam', description: "Test detection rules and deploy to production XSIAM" },
  
  // ADVANCED FEATURES (Collapsible)
  { href: "/user-guide", icon: BookOpen, label: "📖 User Guide", category: 'content', description: "Complete documentation and interactive tutorial" },
  { href: "/ddlc-workflow-demo", icon: RefreshCw, label: "🔄 DDLC Workflow", category: 'content', description: "Detection Development Life Cycle management" },
  { href: "/templates", icon: Share2, label: "📋 Templates", category: 'content', description: "Community-shared training scenarios" },
  { href: "/content-library", icon: Database, label: "📚 Content Library", category: 'content', description: "Manage generated XSIAM content" }
];

const categoryColors = {
  status: 'text-emerald-700 bg-emerald-50 border-emerald-200',   // Step 1 - Load Threat Report
  learning: 'text-blue-700 bg-blue-50 border-blue-200',         // Step 2 - Generate Content  
  usecase: 'text-purple-700 bg-purple-50 border-purple-200',    // Step 3 - Plan Lab Environment
  lab: 'text-orange-700 bg-orange-50 border-orange-200',        // Step 4 - Deploy & Test XSIAM
  xsiam: 'text-indigo-700 bg-indigo-50 border-indigo-200',      // Step 5 - Backup to GitHub
  content: 'text-gray-600 bg-gray-50 border-gray-200'            // Advanced Features - Gray
};

const categoryLabels = {
  status: 'Status & Overview',
  learning: 'Documentation',
  usecase: 'Load Use Case',
  lab: 'Lab Planning & Setup',
  xsiam: 'XSIAM Integration & Setup',
  content: 'Content Development & Testing',
  deployment: 'Deploy Cortex Content',
  configuration: 'Configuration & Management'
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

  // Define category order based on workflow priority
  const categoryOrder = ['status', 'learning', 'usecase', 'lab', 'xsiam', 'content', 'deployment', 'configuration'];
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
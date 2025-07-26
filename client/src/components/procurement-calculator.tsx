import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Clock,
  Download,
  AlertCircle
} from "lucide-react";

interface CostCalculation {
  infrastructure: number;
  licensing: number;
  personnel: number;
  operations: number;
  total: number;
}

export default function ProcurementCalculator() {
  const [duration, setDuration] = useState([6]); // months
  const [teamSize, setTeamSize] = useState([2]); // people
  const [infrastructureType, setInfrastructureType] = useState('cloud');
  const [threatComplexity, setThreatComplexity] = useState('medium');
  const [customCosts, setCustomCosts] = useState({
    additionalSoftware: 0,
    trainingBudget: 0,
    consultingDays: 0
  });

  const calculateCosts = (): CostCalculation => {
    const months = duration[0];
    const team = teamSize[0];
    
    // Base infrastructure costs by type
    const infraBaseCosts = {
      cloud: 285 * months,
      onprem: 1200 + (50 * months), // One-time + maintenance
      hybrid: 600 + (125 * months)
    };

    // Licensing costs (XSIAM, tools, etc.)
    const licensingCosts = {
      low: 2000 * team,
      medium: 3500 * team,
      high: 5000 * team
    };

    // Personnel costs (assuming $150/hour blended rate)
    const hoursPerMonth = {
      low: 40,
      medium: 80,
      high: 120
    };
    
    const complexity = threatComplexity as keyof typeof hoursPerMonth;
    const personnelCost = team * hoursPerMonth[complexity] * 150 * months;

    // Operations costs (monitoring, maintenance, cloud costs)
    const operationsCost = months * 500;

    const infrastructure = infraBaseCosts[infrastructureType as keyof typeof infraBaseCosts];
    const licensing = licensingCosts[complexity];
    const personnel = personnelCost;
    const operations = operationsCost + 
                     customCosts.additionalSoftware + 
                     customCosts.trainingBudget + 
                     (customCosts.consultingDays * 2000);

    return {
      infrastructure,
      licensing,
      personnel,
      operations,
      total: infrastructure + licensing + personnel + operations
    };
  };

  const costs = calculateCosts();

  const generateCostBreakdown = () => {
    const breakdown = `
# Threat Testing Lab - Cost Analysis

## Project Parameters
- **Duration:** ${duration[0]} months
- **Team Size:** ${teamSize[0]} people
- **Infrastructure:** ${infrastructureType.toUpperCase()}
- **Threat Complexity:** ${threatComplexity.toUpperCase()}

## Cost Breakdown

### Infrastructure: $${costs.infrastructure.toLocaleString()}
${infrastructureType === 'cloud' ? '- Cloud hosting and compute resources' : 
  infrastructureType === 'onprem' ? '- Hardware procurement and setup' : 
  '- Hybrid cloud and on-premises infrastructure'}
- Network and security components
- Storage and backup systems

### Licensing: $${costs.licensing.toLocaleString()}
- Cortex XSIAM tenant and data processing
- Security tool licenses (endpoint, network, cloud)
- Development and testing software
- Compliance and audit tools

### Personnel: $${costs.personnel.toLocaleString()}
- Security engineers and analysts
- Infrastructure specialists
- Project management and coordination
- Training and knowledge transfer

### Operations: $${costs.operations.toLocaleString()}
- Ongoing monitoring and maintenance
- Additional software licenses: $${customCosts.additionalSoftware.toLocaleString()}
- Training budget: $${customCosts.trainingBudget.toLocaleString()}
- Consulting days: ${customCosts.consultingDays} days @ $2,000/day

## Total Project Cost: $${costs.total.toLocaleString()}

### Monthly Breakdown
- Average monthly cost: $${Math.round(costs.total / duration[0]).toLocaleString()}
- Infrastructure per month: $${Math.round(costs.infrastructure / duration[0]).toLocaleString()}
- Team cost per month: $${Math.round(costs.personnel / duration[0]).toLocaleString()}

### ROI Considerations
- Reduced incident response time
- Improved threat detection capabilities
- Enhanced security team expertise
- Compliance and audit readiness
- Reduced risk exposure

**Generated on:** ${new Date().toLocaleDateString()}
`;

    const blob = new Blob([breakdown], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `threat-lab-cost-analysis-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Advanced Cost Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Duration Slider */}
          <div className="space-y-2">
            <Label>Project Duration: {duration[0]} months</Label>
            <Slider
              value={duration}
              onValueChange={setDuration}
              max={24}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 month</span>
              <span>24 months</span>
            </div>
          </div>

          {/* Team Size */}
          <div className="space-y-2">
            <Label>Team Size: {teamSize[0]} people</Label>
            <Slider
              value={teamSize}
              onValueChange={setTeamSize}
              max={10}
              min={1}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 person</span>
              <span>10 people</span>
            </div>
          </div>

          {/* Infrastructure Type */}
          <div className="space-y-2">
            <Label>Infrastructure Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {['cloud', 'onprem', 'hybrid'].map((type) => (
                <Button
                  key={type}
                  onClick={() => setInfrastructureType(type)}
                  variant={infrastructureType === type ? "default" : "outline"}
                  className="capitalize"
                >
                  {type}
                </Button>
              ))}
            </div>
          </div>

          {/* Threat Complexity */}
          <div className="space-y-2">
            <Label>Threat Complexity</Label>
            <div className="grid grid-cols-3 gap-2">
              {['low', 'medium', 'high'].map((complexity) => (
                <Button
                  key={complexity}
                  onClick={() => setThreatComplexity(complexity)}
                  variant={threatComplexity === complexity ? "default" : "outline"}
                  className="capitalize"
                >
                  {complexity}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Costs */}
          <div className="space-y-4">
            <Label>Additional Costs</Label>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="software">Additional Software ($)</Label>
                <Input
                  id="software"
                  type="number"
                  value={customCosts.additionalSoftware}
                  onChange={(e) => setCustomCosts(prev => ({
                    ...prev,
                    additionalSoftware: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="training">Training Budget ($)</Label>
                <Input
                  id="training"
                  type="number"
                  value={customCosts.trainingBudget}
                  onChange={(e) => setCustomCosts(prev => ({
                    ...prev,
                    trainingBudget: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="consulting">Consulting Days</Label>
                <Input
                  id="consulting"
                  type="number"
                  value={customCosts.consultingDays}
                  onChange={(e) => setCustomCosts(prev => ({
                    ...prev,
                    consultingDays: parseInt(e.target.value) || 0
                  }))}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cost Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Summary
            </span>
            <Button onClick={generateCostBreakdown} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Analysis
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                ${costs.infrastructure.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Infrastructure</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                ${costs.licensing.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Licensing</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ${costs.personnel.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Personnel</div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                ${costs.operations.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Operations</div>
            </div>
          </div>

          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <div className="text-4xl font-bold text-gray-900 mb-2">
              ${costs.total.toLocaleString()}
            </div>
            <div className="text-lg text-gray-600 mb-4">Total Project Cost</div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Monthly Average:</span>
                <Badge variant="outline">
                  ${Math.round(costs.total / duration[0]).toLocaleString()}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Cost per Team Member:</span>
                <Badge variant="outline">
                  ${Math.round(costs.total / teamSize[0]).toLocaleString()}
                </Badge>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-blue-900">Cost Optimization Tips</h4>
                <ul className="text-sm text-blue-800 mt-2 space-y-1">
                  <li>• Start with cloud infrastructure for faster deployment</li>
                  <li>• Consider phased approach to spread costs over time</li>
                  <li>• Leverage existing team expertise to reduce consulting needs</li>
                  <li>• Plan for ongoing operational costs beyond initial setup</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
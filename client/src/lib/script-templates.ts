export interface ScriptTemplate {
  name: string;
  description: string;
  category: 'automation' | 'layout' | 'enrichment' | 'utility' | 'response';
  type: 'python' | 'javascript' | 'powershell';
  tags: string[];
  script: string;
  inputs: ScriptInput[];
  outputs: ScriptOutput[];
  dockerimage?: string;
  dependencies?: string[];
}

export interface ScriptInput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
}

export interface ScriptOutput {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'html';
  description: string;
  contextPath?: string;
}

export const scriptTemplates: ScriptTemplate[] = [
  {
    name: "Dynamic Evidence Display",
    description: "Display formatted evidence data from alert context in HTML table format for layout sections",
    category: "layout",
    type: "python",
    tags: ["dynamic-section", "evidence", "html"],
    dockerimage: "demisto/python3:3.12.8.1983910",
    script: `# Dynamic Evidence Display Script
def json_array_to_html_table(json_array_string):
    import json
    def format_value(value):
        if isinstance(value, str):
            try:
                value_dict = json.loads(value)
                if isinstance(value_dict, dict):
                    return "<br>".join(["<b>{}</b>: {}".format(k, v) for k, v in value_dict.items()])
            except ValueError:
                pass
        elif isinstance(value, dict):
            return "<br>".join(["<b>{}</b>: {}".format(k, v) for k, v in value.items()])
        return value

    data = json.loads(json_array_string)
    html_tables = ""
    for dictionary in data:
        html_table = "<table style='border-collapse: collapse; width: 100%;'>"
        for key, value in dictionary.items():
            row_style = "background-color: #01cc66; font-size: 120%;" if key == "@odata.type" else ""
            key_html = "<span style='text-align: right; display: inline-block;'>{key}:</span>".format(key=key)
            value_html = format_value(value) if key != "@odata.type" else value
            html_table += "<tr style='{}'><td style='text-align: right; width: 20%;'>{}</td><td style='width: 80%;'>{}</td></tr>".format(row_style, key_html, value_html)
        html_table += "</table>"
        html_tables += html_table + "<br>"
    return html_tables

def main():
    try:
        context_data = demisto.alert()
        evidence_field = demisto.args().get('evidence_field', 'evidence')
        evidence_data = context_data['CustomFields'].get(evidence_field)
        if not evidence_data:
            return_results("No evidence data found in alert context.")
            return
        table = json_array_to_html_table(evidence_data)
        return_results({
            'ContentsFormat': EntryFormat.HTML,
            'Type': EntryType.NOTE,
            'Contents': table,
        })
    except Exception as e:
        error_statement = "Error rendering evidence field: " + str(e)
        return_results(error_statement)

if __name__ in ("builtins", "__builtin__", "__main__"):
    main()`,
    inputs: [
      {
        name: "evidence_field",
        type: "string",
        required: false,
        description: "Field name containing evidence data in alert context",
        defaultValue: "evidence"
      }
    ],
    outputs: [
      {
        name: "html_table",
        type: "html",
        description: "Formatted HTML table containing evidence data"
      }
    ]
  },
  {
    name: "False Positive Checker",
    description: "Check for patterns indicating potential false positives based on historical data",
    category: "automation",
    type: "python",
    tags: ["automation", "false-positive", "analysis"],
    dockerimage: "demisto/python3:3.12.8.1983910",
    script: `# False Positive Checker
def check_false_positive_patterns():
    try:
        alert_data = demisto.alert()
        args = demisto.args()
        fp_threshold = int(args.get('threshold', 3))
        time_window = args.get('time_window', '30 days')
        
        source_ip = alert_data['CustomFields'].get('sourceip', '')
        hostname = alert_data['CustomFields'].get('hostname', '')
        alert_name = alert_data.get('name', '')
        
        query_parts = []
        if source_ip:
            query_parts.append('sourceip:"{}"'.format(source_ip))
        if hostname:
            query_parts.append('hostname:"{}"'.format(hostname))
        if alert_name:
            query_parts.append('name:"{}"'.format(alert_name))
        
        if not query_parts:
            return_results("Insufficient data for false positive analysis")
            return
            
        search_query = " AND ".join(query_parts)
        search_query += " AND occurred:>={} AND status:closed".format(time_window)
        
        try:
            search_results = execute_command('SearchIncidentsV2', {
                'query': search_query,
                'size': 50
            })
            
            if not search_results or not search_results[0].get('Contents'):
                return_results("No similar historical alerts found")
                return
                
            incidents = search_results[0]['Contents']
            if not isinstance(incidents, list):
                incidents = [incidents] if incidents else []
            
            fp_count = 0
            total_count = len(incidents)
            closure_reasons = {}
            
            for incident in incidents:
                close_reason = incident.get('closeReason', 'Unknown')
                closure_reasons[close_reason] = closure_reasons.get(close_reason, 0) + 1
                if 'false positive' in close_reason.lower() or 'fp' in close_reason.lower():
                    fp_count += 1
            
            fp_rate = (fp_count / total_count * 100) if total_count > 0 else 0
            
            if fp_count >= fp_threshold and fp_rate >= 60:
                recommendation = "HIGH likelihood of false positive"
                risk_level = "LOW RISK"
            elif fp_count >= 2 and fp_rate >= 40:
                recommendation = "MODERATE likelihood of false positive"
                risk_level = "MEDIUM RISK"
            else:
                recommendation = "Requires manual investigation"
                risk_level = "HIGH RISK"
            
            report = "False Positive Analysis Results\\n"
            report += "Current Alert: {}\\n".format(alert_name)
            report += "Similar Alerts Found: {}\\n".format(total_count)
            report += "False Positives: {}\\n".format(fp_count)
            report += "FP Rate: {:.1f}%\\n".format(fp_rate)
            report += "Risk Level: {}\\n".format(risk_level)
            report += "Recommendation: {}\\n".format(recommendation)
            
            demisto.setContext('FalsePositive.Analysis', {
                'Recommendation': recommendation,
                'FPCount': fp_count,
                'TotalSimilar': total_count,
                'FPRate': fp_rate,
                'RiskLevel': risk_level
            })
            
            return_results({
                'Type': EntryType.NOTE,
                'Contents': report,
                'ContentsFormat': EntryFormat.TEXT,
                'HumanReadable': report
            })
            
        except Exception as e:
            return_results("Error searching for similar incidents: {}".format(str(e)))
            
    except Exception as e:
        return_results("False positive analysis failed: {}".format(str(e)))

def main():
    check_false_positive_patterns()

if __name__ in ("builtins", "__builtin__", "__main__"):
    main()`,
    inputs: [
      {
        name: "threshold",
        type: "number",
        required: false,
        description: "Minimum number of false positives to trigger recommendation",
        defaultValue: 3
      }
    ],
    outputs: [
      {
        name: "fp_analysis",
        type: "object",
        description: "False positive analysis results",
        contextPath: "FalsePositive.Analysis"
      }
    ]
  }
];

export function getScriptsByCategory(category: 'automation' | 'layout' | 'enrichment' | 'utility' | 'response'): ScriptTemplate[] {
  return scriptTemplates.filter(script => script.category === category);
}

export function generateScriptYAML(useCase: string, category: 'automation' | 'layout' | 'enrichment' | 'utility' | 'response', type: 'python' | 'javascript' | 'powershell' = 'python'): string {
  const templates = getScriptsByCategory(category);
  if (templates.length === 0) {
    return generateBasicScript(useCase, type);
  }

  const template = templates[0];
  const scriptId = generateId();
  
  return `# Generated Script for: ${useCase}
# Based on template: ${template.name}

commonfields:
  id: ${scriptId}
  version: 1
name: ${useCase.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}_Script
script: |
  ${template.script.replace(/\n/g, '\n  ')}
type: ${template.type}
tags:
${template.tags.map(tag => `- ${tag}`).join('\n')}
enabled: true
scripttarget: 0
subtype: ${template.type}3
${template.dockerimage ? `dockerimage: ${template.dockerimage}` : ''}
runas: DBotWeakRole`;
}

function generateBasicScript(useCase: string, type: string): string {
  const scriptId = generateId();
  
  const pythonTemplate = `# ${useCase} Script
def main():
    try:
        alert_data = demisto.alert()
        result = "Processing {} for alert: {}".format("${useCase}", alert_data.get('name', 'Unknown'))
        return_results({
            'Type': EntryType.NOTE,
            'Contents': result,
            'ContentsFormat': EntryFormat.TEXT
        })
    except Exception as e:
        return_results("Error in ${useCase} script: {}".format(str(e)))

if __name__ in ("builtins", "__builtin__", "__main__"):
    main()`;

  const jsTemplate = `// ${useCase} Script
function main() {
    try {
        const alertData = invContext.alert || {};
        const result = \`Processing ${useCase} for alert: \${alertData.name || 'Unknown'}\`;
        return {
            Type: entryTypes.note,
            Contents: result,
            ContentsFormat: formats.text
        };
    } catch (error) {
        return {
            Type: entryTypes.error,
            Contents: \`Error in ${useCase} script: \${error.message}\`
        };
    }
}
main();`;

  const script = type === 'javascript' ? jsTemplate : pythonTemplate;
  
  return `# Generated Script for: ${useCase}

commonfields:
  id: ${scriptId}
  version: 1
name: ${useCase.replace(/[^a-zA-Z0-9\s-]/g, '').replace(/\s+/g, '_')}_Script
script: |
  ${script.replace(/\n/g, '\n  ')}
type: ${type}
tags:
- automation
enabled: true
scripttarget: 0
subtype: ${type}3
runas: DBotWeakRole`;
}

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
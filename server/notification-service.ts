import sgMail from '@sendgrid/mail';

// Email notification system for manual testing requirements
export class NotificationService {
  private initialized = false;

  constructor() {
    this.initializeSendGrid();
  }

  private initializeSendGrid() {
    if (process.env.SENDGRID_API_KEY) {
      sgMail.setApiKey(process.env.SENDGRID_API_KEY);
      this.initialized = true;
      console.log('[NOTIFICATIONS] ✓ SendGrid initialized for manual testing alerts');
    } else {
      console.log('[NOTIFICATIONS] ✗ SENDGRID_API_KEY not found - manual testing notifications disabled');
    }
  }

  // Send email notification for manual testing requirements
  async sendManualTestingAlert(contentPackage: {
    threatName: string;
    contentTypes: string[];
    infrastructureRequired: string[];
    testingRequirements: string[];
  }): Promise<boolean> {
    if (!this.initialized) {
      console.log('[NOTIFICATIONS] SendGrid not configured - cannot send manual testing alert');
      return false;
    }

    try {
      const emailContent = this.generateTestingAlertEmail(contentPackage);
      
      const msg = {
        to: process.env.NOTIFICATION_EMAIL || 'analyst@company.com', // User can configure their email
        from: 'noreply@threatresearchhub.com',
        subject: `Manual Testing Required: ${contentPackage.threatName}`,
        html: emailContent.html,
        text: emailContent.text
      };

      await sgMail.send(msg);
      console.log('[NOTIFICATIONS] ✓ Manual testing alert sent successfully');
      return true;
    } catch (error) {
      console.error('[NOTIFICATIONS] Error sending manual testing alert:', error);
      return false;
    }
  }

  // Generate email content for manual testing alerts
  private generateTestingAlertEmail(contentPackage: {
    threatName: string;
    contentTypes: string[];
    infrastructureRequired: string[];
    testingRequirements: string[];
  }): { html: string; text: string } {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1a365d; color: white; padding: 20px; text-align: center;">
          <h1>Manual Testing Required</h1>
        </div>
        
        <div style="padding: 20px; background: #f7fafc;">
          <h2>Content Package Ready for Testing</h2>
          <p><strong>Threat:</strong> ${contentPackage.threatName}</p>
          
          <h3>Generated Content Types:</h3>
          <ul>
            ${contentPackage.contentTypes.map(type => `<li>${type}</li>`).join('')}
          </ul>
          
          <h3>Infrastructure Required:</h3>
          <ul>
            ${contentPackage.infrastructureRequired.map(infra => `<li>${infra}</li>`).join('')}
          </ul>
          
          <h3>Manual Testing Requirements:</h3>
          <ul>
            ${contentPackage.testingRequirements.map(req => `<li>${req}</li>`).join('')}
          </ul>
          
          <div style="background: #fed7d7; border: 1px solid #fc8181; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h4 style="color: #c53030; margin-top: 0;">Action Required</h4>
            <p>The content has passed automated validation but requires manual testing on actual infrastructure. Please review and test the generated XSIAM content in your lab environment.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173" style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Content Package
            </a>
          </div>
        </div>
        
        <div style="background: #2d3748; color: #a0aec0; padding: 15px; text-align: center; font-size: 12px;">
          ThreatResearchHub - Content Engineering Workflow Platform
        </div>
      </div>
    `;

    const text = `
Manual Testing Required: ${contentPackage.threatName}

Generated Content Types:
${contentPackage.contentTypes.map(type => `- ${type}`).join('\n')}

Infrastructure Required:
${contentPackage.infrastructureRequired.map(infra => `- ${infra}`).join('\n')}

Manual Testing Requirements:
${contentPackage.testingRequirements.map(req => `- ${req}`).join('\n')}

Action Required: The content has passed automated validation but requires manual testing on actual infrastructure. Please review and test the generated XSIAM content in your lab environment.

View Content Package: http://localhost:5173
    `;

    return { html, text };
  }

  // Send validation completion notification
  async sendValidationComplete(validationResults: {
    threatName: string;
    fidelityScore: number;
    readyForCustomer: boolean;
    issues: string[];
  }): Promise<boolean> {
    if (!this.initialized) {
      console.log('[NOTIFICATIONS] SendGrid not configured - cannot send validation notification');
      return false;
    }

    try {
      const subject = validationResults.readyForCustomer 
        ? `✓ Customer POV Ready: ${validationResults.threatName} (${validationResults.fidelityScore}%)`
        : `⚠ Validation Issues: ${validationResults.threatName} (${validationResults.fidelityScore}%)`;

      const statusColor = validationResults.readyForCustomer ? '#48bb78' : '#ed8936';
      const statusText = validationResults.readyForCustomer ? 'Ready for Customer POV' : 'Requires Improvement';

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: ${statusColor}; color: white; padding: 20px; text-align: center;">
            <h1>Validation Complete</h1>
            <p style="margin: 0; font-size: 18px;">${statusText}</p>
          </div>
          
          <div style="padding: 20px; background: #f7fafc;">
            <h2>${validationResults.threatName}</h2>
            <p><strong>Fidelity Score:</strong> ${validationResults.fidelityScore}%</p>
            <p><strong>Customer POV Ready:</strong> ${validationResults.readyForCustomer ? 'Yes' : 'No'}</p>
            
            ${validationResults.issues.length > 0 ? `
              <h3>Issues to Address:</h3>
              <ul>
                ${validationResults.issues.map(issue => `<li>${issue}</li>`).join('')}
              </ul>
            ` : '<p>✓ No issues found - content passes all authenticity checks</p>'}
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:5173" style="background: #3182ce; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                View Results
              </a>
            </div>
          </div>
        </div>
      `;

      const msg = {
        to: process.env.NOTIFICATION_EMAIL || 'analyst@company.com',
        from: 'noreply@threatresearchhub.com',
        subject,
        html
      };

      await sgMail.send(msg);
      console.log('[NOTIFICATIONS] ✓ Validation completion notification sent');
      return true;
    } catch (error) {
      console.error('[NOTIFICATIONS] Error sending validation notification:', error);
      return false;
    }
  }

  // Health check for email notifications
  async healthCheck(): Promise<{ status: string; sendgrid: boolean }> {
    return {
      status: this.initialized ? 'ready' : 'not_configured',
      sendgrid: this.initialized
    };
  }
}

// Singleton instance for email notifications
export const notificationService = new NotificationService();
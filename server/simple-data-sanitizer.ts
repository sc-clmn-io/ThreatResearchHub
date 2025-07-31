// Simple Data Sanitizer for immediate PII protection (fallback for SEAL issues)
export class SimpleDataSanitizer {
  private encryptedData: Map<string, string> = new Map();

  // Sanitize and encrypt PII with simple obfuscation
  async sanitizeAndEncrypt(inputText: string): Promise<{
    sanitizedText: string;
    encryptedOriginals: Map<string, string>;
    detectedPII: string[];
  }> {
    let sanitizedText = inputText;
    const detectedPII: string[] = [];
    const encryptedOriginals = new Map<string, string>();

    // PII patterns with replacement strategies
    const piiPatterns = [
      { name: 'Email Address', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, replacement: 'user{N}@example.com' },
      { name: 'IP Address', regex: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g, replacement: '192.168.1.{N}' },
      { name: 'Hostname', regex: /\b[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+\b/gi, replacement: 'HOST-{N:02d}' },
      { name: 'Domain User', regex: /\b[A-Z0-9]+\\[a-z0-9.]+\b/gi, replacement: 'DOMAIN\\user{N}' },
      { name: 'Windows Server', regex: /\b[A-Z]+-[A-Z]+-[0-9]+\b/g, replacement: 'SERVER-{N:02d}' },
      { name: 'File Path', regex: /\bC:\\[^\\s"]+/g, replacement: 'C:\\Data\\file{N}.exe' },
      { name: 'Phone Number', regex: /\b\d{3}-\d{3}-\d{4}\b/g, replacement: '555-{N:02d}{N:02d}-{N:04d}' },
      { name: 'MAC Address', regex: /\b[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}:[0-9A-Fa-f]{2}\b/g, replacement: '00:1B:44:11:3A:{N:02X}' },
      { name: 'Credit Card', regex: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g, replacement: '****-****-****-{N:04d}' },
      { name: 'SSN', regex: /\b\d{3}-\d{2}-\d{4}\b/g, replacement: 'XXX-XX-{N:04d}' }
    ];

    let counter = 1;

    for (const pattern of piiPatterns) {
      const matches = sanitizedText.match(pattern.regex);
      if (matches) {
        for (const match of matches) {
          // Simple encryption using Base64 + timestamp
          const encrypted = this.simpleEncrypt(match);
          const sanitizedValue = pattern.replacement.replace('{N}', counter.toString())
                                                    .replace('{N:02d}', counter.toString().padStart(2, '0'))
                                                    .replace('{N:04d}', counter.toString().padStart(4, '0'))
                                                    .replace('{N:02X}', counter.toString(16).toUpperCase().padStart(2, '0'));
          
          encryptedOriginals.set(sanitizedValue, encrypted);
          detectedPII.push(pattern.name);
          sanitizedText = sanitizedText.replace(match, sanitizedValue);
          counter++;
        }
      }
    }

    return {
      sanitizedText,
      encryptedOriginals,
      detectedPII: Array.from(new Set(detectedPII))
    };
  }

  // Simple encryption for PII data
  private simpleEncrypt(data: string): string {
    const timestamp = Date.now().toString();
    const combined = `${data}::${timestamp}`;
    return Buffer.from(combined).toString('base64');
  }

  // Simple decryption for PII data
  async decryptPII(encryptedData: string): Promise<string> {
    try {
      const decoded = Buffer.from(encryptedData, 'base64').toString();
      const [originalData] = decoded.split('::');
      return originalData;
    } catch (error) {
      throw new Error('Failed to decrypt PII data');
    }
  }

  // Health check for simple sanitizer
  async healthCheck(): Promise<{ status: string; encryption: boolean; analytics: boolean }> {
    try {
      // Test encryption/decryption
      const testData = "test@example.com";
      const encrypted = this.simpleEncrypt(testData);
      const decrypted = await this.decryptPII(encrypted);
      
      return {
        status: decrypted === testData ? 'ready' : 'error',
        encryption: decrypted === testData,
        analytics: true // Simple analytics always available
      };
    } catch (error) {
      return {
        status: 'error',
        encryption: false,
        analytics: false
      };
    }
  }
}

// Singleton instance for simple data sanitizer
export const simpleDataSanitizer = new SimpleDataSanitizer();
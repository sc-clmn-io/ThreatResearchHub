import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export interface PDFParseResult {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    pages: number;
  };
}

export async function parsePDFFile(file: File): Promise<PDFParseResult> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    const pdf = await pdfjsLib.getDocument({ data: uint8Array }).promise;
    const metadata = await pdf.getMetadata();
    
    let fullText = '';
    
    // Extract text from all pages
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
        .trim();
      
      if (pageText) {
        fullText += pageText + '\n\n';
      }
    }
    
    return {
      text: fullText.trim(),
      metadata: {
        title: (metadata.info as any)?.Title || undefined,
        author: (metadata.info as any)?.Author || undefined,
        subject: (metadata.info as any)?.Subject || undefined,
        creator: (metadata.info as any)?.Creator || undefined,
        pages: pdf.numPages
      }
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function extractUseCasesFromPDFText(text: string): Array<{
  title: string;
  description: string;
  techniques: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: 'endpoint' | 'network' | 'cloud' | 'identity';
}> {
  const useCases: Array<{
    title: string;
    description: string;
    techniques: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: 'endpoint' | 'network' | 'cloud' | 'identity';
  }> = [];
  
  // Common patterns for threat detection use cases
  const patterns = [
    // Lateral movement patterns
    {
      regex: /lateral\s+movement|rdp\s+brute\s*force|remote\s+desktop|smb\s+enumeration/gi,
      title: 'Lateral Movement Detection',
      category: 'network' as const,
      severity: 'high' as const
    },
    // Credential access patterns  
    {
      regex: /credential\s+dumping|lsass|mimikatz|hashdump|password\s+spraying/gi,
      title: 'Credential Access Detection',
      category: 'endpoint' as const,
      severity: 'critical' as const
    },
    // Persistence patterns
    {
      regex: /persistence|scheduled\s+task|registry\s+modification|startup\s+folder/gi,
      title: 'Persistence Mechanism Detection',
      category: 'endpoint' as const,
      severity: 'medium' as const
    },
    // Exfiltration patterns
    {
      regex: /data\s+exfiltration|file\s+transfer|dns\s+tunneling|ftp\s+upload/gi,
      title: 'Data Exfiltration Detection',
      category: 'network' as const,
      severity: 'high' as const
    },
    // Cloud patterns
    {
      regex: /cloud\s+misconfiguration|s3\s+bucket|azure\s+blob|iam\s+privilege/gi,
      title: 'Cloud Security Violation',
      category: 'cloud' as const,
      severity: 'high' as const
    }
  ];
  
  // Extract MITRE ATT&CK techniques
  const mitrePattern = /T\d{4}(?:\.\d{3})?/g;
  const mitreMatches = text.match(mitrePattern) || [];
  
  // Find use cases based on patterns
  patterns.forEach(pattern => {
    const matches = text.match(pattern.regex);
    if (matches && matches.length > 0) {
      // Find relevant context around matches
      const sentences = text.split(/[.!?]+/);
      const relevantSentences = sentences.filter(sentence => 
        pattern.regex.test(sentence)
      ).slice(0, 3); // Take first 3 relevant sentences
      
      if (relevantSentences.length > 0) {
        useCases.push({
          title: pattern.title,
          description: relevantSentences.join('. ').trim(),
          techniques: mitreMatches.slice(0, 5), // Limit to 5 techniques
          severity: pattern.severity,
          category: pattern.category
        });
      }
    }
  });
  
  // Remove duplicates based on title
  const uniqueUseCases = useCases.filter((useCase, index, self) => 
    index === self.findIndex(u => u.title === useCase.title)
  );
  
  return uniqueUseCases;
}

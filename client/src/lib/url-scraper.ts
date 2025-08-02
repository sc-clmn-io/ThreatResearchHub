export interface ScrapedContent {
  title: string;
  content: string;
  url: string;
  author?: string;
  publishedDate?: string;
  tags?: string[];
}

export async function scrapeURL(url: string): Promise<ScrapedContent> {
  try {
    // Use a CORS proxy for scraping external URLs
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const html = data.contents;
    
    // Parse HTML content
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Extract title
    const title = doc.querySelector('title')?.textContent ||
                 doc.querySelector('h1')?.textContent ||
                 'Untitled Document';
    
    // Extract main content
    let content = '';
    
    // Try to find main content areas
    const contentSelectors = [
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '.post-content',
      '.entry-content',
      'main',
      '.article-body'
    ];
    
    for (const selector of contentSelectors) {
      const element = doc.querySelector(selector);
      if (element) {
        content = extractTextContent(element);
        break;
      }
    }
    
    // Fallback to body content if no specific content area found
    if (!content) {
      const body = doc.querySelector('body');
      if (body) {
        content = extractTextContent(body);
      }
    }
    
    // Extract metadata
    const author = doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
                  doc.querySelector('.author')?.textContent ||
                  undefined;
    
    const publishedDate = doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                         doc.querySelector('meta[name="publish-date"]')?.getAttribute('content') ||
                         doc.querySelector('time')?.getAttribute('datetime') ||
                         undefined;
    
    // Extract tags/keywords
    const keywordsContent = doc.querySelector('meta[name="keywords"]')?.getAttribute('content');
    const tags = keywordsContent ? keywordsContent.split(',').map(tag => tag.trim()) : undefined;
    
    return {
      title: title.trim(),
      content: content.trim(),
      url,
      author,
      publishedDate,
      tags
    };
  } catch (error) {
    console.error('Error scraping URL:', error);
    throw new Error(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function extractTextContent(element: Element): string {
  // Remove script and style elements
  const scripts = element.querySelectorAll('script, style, nav, footer, header, .navigation, .sidebar');
  scripts.forEach(script => script.remove());
  
  // Get text content and clean it up
  let text = element.textContent || '';
  
  // Clean up whitespace
  text = text.replace(/\s+/g, ' ').trim();
  
  // Remove common navigation text
  text = text.replace(/\b(Home|About|Contact|Privacy|Terms|Navigation|Menu|Search)\b/gi, '');
  
  return text;
}

export function extractUseCasesFromWebContent(content: string, url: string): Array<{
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
  
  // Define patterns for different types of threats
  const threatPatterns = [
    {
      keywords: ['phishing', 'email attack', 'spear phishing', 'business email compromise'],
      title: 'Phishing Attack Detection',
      category: 'identity' as const,
      severity: 'high' as const
    },
    {
      keywords: ['malware', 'trojan', 'ransomware', 'cryptolocker', 'payload'],
      title: 'Malware Detection and Analysis',
      category: 'endpoint' as const,
      severity: 'critical' as const
    },
    {
      keywords: ['sql injection', 'web application', 'xss', 'csrf', 'web exploit'],
      title: 'Web Application Attack Detection',
      category: 'network' as const,
      severity: 'high' as const
    },
    {
      keywords: ['privilege escalation', 'admin rights', 'elevation', 'uac bypass'],
      title: 'Privilege Escalation Detection',
      category: 'endpoint' as const,
      severity: 'high' as const
    },
    {
      keywords: ['cloud breach', 'aws compromise', 'azure attack', 'gcp incident'],
      title: 'Cloud Infrastructure Compromise',
      category: 'cloud' as const,
      severity: 'critical' as const
    },
    {
      keywords: ['insider threat', 'data theft', 'unauthorized access', 'employee misuse'],
      title: 'Insider Threat Detection',
      category: 'identity' as const,
      severity: 'medium' as const
    }
  ];
  
  // Extract MITRE ATT&CK techniques
  const mitrePattern = /T\d{4}(?:\.\d{3})?/g;
  const mitreMatches = content.match(mitrePattern) || [];
  
  // Extract CVE references
  const cvePattern = /CVE-\d{4}-\d{4,}/g;
  const cveMatches = content.match(cvePattern) || [];
  
  // Find sentences containing threat indicators
  const sentences = content.split(/[.!?]+/);
  
  threatPatterns.forEach(pattern => {
    const matchingSentences = sentences.filter(sentence => 
      pattern.keywords.some(keyword => 
        sentence.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    if (matchingSentences.length > 0) {
      // Take the most relevant sentences (up to 3)
      const description = matchingSentences
        .slice(0, 3)
        .map(s => s.trim())
        .filter(s => s.length > 20) // Filter out very short sentences
        .join('. ');
      
      if (description.length > 50) { // Only add if we have substantial content
        useCases.push({
          title: pattern.title,
          description,
          techniques: [...mitreMatches, ...cveMatches].slice(0, 5),
          severity: pattern.severity,
          category: pattern.category
        });
      }
    }
  });
  
  // Remove duplicates
  const uniqueUseCases = useCases.filter((useCase, index, self) => 
    index === self.findIndex(u => u.title === useCase.title)
  );
  
  return uniqueUseCases;
}

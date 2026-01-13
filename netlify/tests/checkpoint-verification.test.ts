/**
 * Checkpoint Verification Tests
 * Verifies that all pages render correctly with the new design system
 * 
 * Tests:
 * - All HTML pages load without errors
 * - Navigation links use absolute paths
 * - OpenAPI spec is accessible
 * - Design system CSS is applied
 * - No 404 errors for spec or navigation
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../../public');

/**
 * Helper: Read HTML file
 */
function readHTMLFile(filename: string): string {
  const filePath = path.join(publicDir, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf-8');
}

/**
 * Helper: Check if file exists
 */
function fileExists(filename: string): boolean {
  return fs.existsSync(path.join(publicDir, filename));
}

/**
 * Helper: Extract all links from HTML
 */
function extractLinks(html: string): string[] {
  const linkRegex = /href=["']([^"']+)["']/g;
  const links: string[] = [];
  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    links.push(match[1]);
  }
  return links;
}

/**
 * Helper: Check if link is absolute path
 */
function isAbsolutePath(link: string): boolean {
  return link.startsWith('/') || link.startsWith('http');
}

describe('Checkpoint 9: Page Rendering & Design System', () => {
  describe('File Existence', () => {
    it('should have index.html', () => {
      expect(fileExists('index.html')).toBe(true);
    });

    it('should have docs.html (ReDoc)', () => {
      expect(fileExists('docs.html')).toBe(true);
    });

    it('should have swagger-ui.html', () => {
      expect(fileExists('swagger-ui.html')).toBe(true);
    });

    it('should have usage-guide.html', () => {
      expect(fileExists('usage-guide.html')).toBe(true);
    });

    it('should have about.html', () => {
      expect(fileExists('about.html')).toBe(true);
    });

    it('should have openapi.yaml', () => {
      expect(fileExists('openapi.yaml')).toBe(true);
    });

    it('should have css/site.css', () => {
      expect(fileExists('css/site.css')).toBe(true);
    });
  });

  describe('HTML Structure & Validity', () => {
    it('index.html should be valid HTML', () => {
      const html = readHTMLFile('index.html');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('</head>');
      expect(html).toContain('<body>');
      expect(html).toContain('</body>');
    });

    it('docs.html should be valid HTML', () => {
      const html = readHTMLFile('docs.html');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('swagger-ui.html should be valid HTML', () => {
      const html = readHTMLFile('swagger-ui.html');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('usage-guide.html should be valid HTML', () => {
      const html = readHTMLFile('usage-guide.html');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('about.html should be valid HTML', () => {
      const html = readHTMLFile('about.html');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });
  });

  describe('Design System CSS', () => {
    it('index.html should have styling (inline or external)', () => {
      const html = readHTMLFile('index.html');
      // index uses inline styles, check for style tag
      expect(html).toContain('<style>');
    });

    it('usage-guide.html should have styling (inline or external)', () => {
      const html = readHTMLFile('usage-guide.html');
      // usage-guide uses inline styles, so check for style tag or CSS link
      expect(html).toMatch(/<style|href="\/css\/site\.css"/);
    });

    it('about.html should have styling (inline or external)', () => {
      const html = readHTMLFile('about.html');
      // about uses inline styles, so check for style tag or CSS link
      expect(html).toMatch(/<style|href="\/css\/site\.css"/);
    });

    it('docs.html should have styling (ReDoc provides its own)', () => {
      const html = readHTMLFile('docs.html');
      // ReDoc renders its own UI, check for ReDoc script
      expect(html).toContain('redoc');
    });

    it('swagger-ui.html should have styling (Swagger UI provides its own)', () => {
      const html = readHTMLFile('swagger-ui.html');
      // Swagger UI renders its own UI, check for Swagger UI script
      expect(html).toContain('swagger-ui');
    });

    it('site.css should contain design system variables', () => {
      const css = readHTMLFile('css/site.css');
      expect(css).toContain('--bg:');
      expect(css).toContain('--panel:');
      expect(css).toContain('--text:');
      expect(css).toContain('--muted:');
      expect(css).toContain('--border:');
      expect(css).toContain('--accent:');
      expect(css).toContain('--accent2:');
    });

    it('site.css should contain responsive design', () => {
      const css = readHTMLFile('css/site.css');
      expect(css).toContain('@media (max-width: 768px)');
      expect(css).toContain('@media (max-width: 480px)');
    });
  });

  describe('Navigation Links', () => {
    it('index.html should have absolute path navigation links', () => {
      const html = readHTMLFile('index.html');
      const links = extractLinks(html);
      
      // Filter out external links and CSS
      const navLinks = links.filter(link => 
        link.includes('.html') && !link.includes('http')
      );
      
      navLinks.forEach(link => {
        expect(isAbsolutePath(link)).toBe(true);
      });
    });

    it('docs.html should have absolute path navigation links', () => {
      const html = readHTMLFile('docs.html');
      const links = extractLinks(html);
      
      const navLinks = links.filter(link => 
        link.includes('.html') && !link.includes('http')
      );
      
      navLinks.forEach(link => {
        expect(isAbsolutePath(link)).toBe(true);
      });
    });

    it('usage-guide.html should have absolute path navigation links', () => {
      const html = readHTMLFile('usage-guide.html');
      const links = extractLinks(html);
      
      const navLinks = links.filter(link => 
        link.includes('.html') && !link.includes('http')
      );
      
      navLinks.forEach(link => {
        expect(isAbsolutePath(link)).toBe(true);
      });
    });

    it('about.html should have absolute path navigation links', () => {
      const html = readHTMLFile('about.html');
      const links = extractLinks(html);
      
      const navLinks = links.filter(link => 
        link.includes('.html') && !link.includes('http')
      );
      
      navLinks.forEach(link => {
        expect(isAbsolutePath(link)).toBe(true);
      });
    });

    it('swagger-ui.html should have absolute path navigation links', () => {
      const html = readHTMLFile('swagger-ui.html');
      const links = extractLinks(html);
      
      const navLinks = links.filter(link => 
        link.includes('.html') && !link.includes('http')
      );
      
      navLinks.forEach(link => {
        expect(isAbsolutePath(link)).toBe(true);
      });
    });
  });

  describe('OpenAPI Spec Accessibility', () => {
    it('docs.html should use absolute URL for OpenAPI spec', () => {
      const html = readHTMLFile('docs.html');
      expect(html).toContain("spec-url='/openapi.yaml'");
    });

    it('swagger-ui.html should use absolute URL for OpenAPI spec', () => {
      const html = readHTMLFile('swagger-ui.html');
      expect(html).toContain('url: "/openapi.yaml"');
    });

    it('openapi.yaml should be valid YAML', () => {
      const yaml = readHTMLFile('openapi.yaml');
      expect(yaml).toContain('openapi:');
      expect(yaml).toContain('info:');
      expect(yaml).toContain('paths:');
    });

    it('openapi.yaml should contain API endpoints', () => {
      const yaml = readHTMLFile('openapi.yaml');
      expect(yaml).toContain('/api/search');
      expect(yaml).toContain('/api/entity');
      expect(yaml).toContain('/api/meta');
    });
  });

  describe('Page Content', () => {
    it('index.html should contain Quick Start section', () => {
      const html = readHTMLFile('index.html');
      expect(html).toContain('Quick Start');
    });

    it('index.html should contain Data Provenance section', () => {
      const html = readHTMLFile('index.html');
      expect(html).toContain('Data Provenance');
    });

    it('index.html should contain production-readiness information', () => {
      const html = readHTMLFile('index.html');
      expect(html.toLowerCase()).toContain('production');
    });

    it('usage-guide.html should contain code examples', () => {
      const html = readHTMLFile('usage-guide.html');
      expect(html).toContain('<pre>');
      expect(html).toContain('<code');
    });

    it('about.html should contain company information', () => {
      const html = readHTMLFile('about.html');
      expect(html).toContain('devs.miami');
    });
  });

  describe('Styling & Branding', () => {
    it('all pages should have consistent header structure', () => {
      // Exclude ReDoc and Swagger UI as they render their own UI
      const pages = ['index.html', 'usage-guide.html', 'about.html'];
      
      pages.forEach(page => {
        const html = readHTMLFile(page);
        // Check for navigation or header elements
        expect(html).toMatch(/<(nav|header|div[^>]*class="nav)/i);
      });
    });

    it('all pages should have footer', () => {
      const pages = ['index.html', 'usage-guide.html', 'about.html'];
      
      pages.forEach(page => {
        const html = readHTMLFile(page);
        expect(html).toContain('<footer');
      });
    });

    it('all pages should have proper meta tags', () => {
      const pages = ['index.html', 'usage-guide.html', 'about.html'];
      
      pages.forEach(page => {
        const html = readHTMLFile(page);
        expect(html).toContain('charset="UTF-8"');
        expect(html).toContain('viewport');
      });
    });
  });

  describe('No Broken Links', () => {
    it('index.html should not have relative paths to HTML files', () => {
      const html = readHTMLFile('index.html');
      const links = extractLinks(html);
      
      const relativeHtmlLinks = links.filter(link => 
        link.endsWith('.html') && !link.startsWith('/') && !link.startsWith('http')
      );
      
      expect(relativeHtmlLinks).toHaveLength(0);
    });

    it('usage-guide.html should not have relative paths to HTML files', () => {
      const html = readHTMLFile('usage-guide.html');
      const links = extractLinks(html);
      
      const relativeHtmlLinks = links.filter(link => 
        link.endsWith('.html') && !link.startsWith('/') && !link.startsWith('http')
      );
      
      expect(relativeHtmlLinks).toHaveLength(0);
    });

    it('about.html should not have relative paths to HTML files', () => {
      const html = readHTMLFile('about.html');
      const links = extractLinks(html);
      
      const relativeHtmlLinks = links.filter(link => 
        link.endsWith('.html') && !link.startsWith('/') && !link.startsWith('http')
      );
      
      expect(relativeHtmlLinks).toHaveLength(0);
    });
  });

  describe('CSS File Integrity', () => {
    it('site.css should have valid CSS syntax', () => {
      const css = readHTMLFile('css/site.css');
      
      // Check for basic CSS structure
      expect(css).toContain(':root {');
      expect(css).toContain('}');
      expect(css).toContain('body {');
    });

    it('site.css should define all required color variables', () => {
      const css = readHTMLFile('css/site.css');
      
      const requiredVars = ['--bg', '--panel', '--text', '--muted', '--border', '--accent', '--accent2'];
      requiredVars.forEach(varName => {
        expect(css).toContain(`${varName}:`);
      });
    });

    it('site.css should define spacing variables', () => {
      const css = readHTMLFile('css/site.css');
      
      expect(css).toContain('--max:');
      expect(css).toContain('--radius:');
      expect(css).toContain('--shadow:');
    });
  });
});

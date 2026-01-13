/**
 * Smoke Tests for Documentation Site
 * Quick verification that all pages render correctly and are accessible
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

describe('Documentation Site Smoke Tests', () => {
  describe('HTML Files Generated', () => {
    const pages = [
      { file: 'index.html', name: 'Landing Page' },
      { file: 'api-docs.html', name: 'API Documentation' },
      { file: 'usage-guide.html', name: 'Usage Guide' },
      { file: 'about.html', name: 'About Page' }
    ];

    pages.forEach(({ file, name }) => {
      it(`${name} (${file}) should exist and have content`, () => {
        const filePath = path.join(publicDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
        
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content.length).toBeGreaterThan(1000);
      });
    });
  });

  describe('Page Structure', () => {
    const pages = ['index.html', 'api-docs.html', 'usage-guide.html', 'about.html'];

    pages.forEach(file => {
      it(`${file} should have valid HTML structure`, () => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        expect(content).toContain('<!DOCTYPE html>');
        expect(content).toContain('<html');
        expect(content).toContain('<head>');
        expect(content).toContain('<body>');
        expect(content).toContain('</html>');
      });
    });
  });

  describe('Navigation Works Across All Pages', () => {
    const pages = ['index.html', 'api-docs.html', 'usage-guide.html', 'about.html'];
    const requiredLinks = [
      '/api-docs.html',
      '/usage-guide.html',
      '/about.html'
    ];

    pages.forEach(file => {
      it(`${file} should have all navigation links`, () => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        requiredLinks.forEach(link => {
          expect(content).toContain(`href="${link}"`);
        });
      });
    });

    it('all pages should have navbar element', () => {
      pages.forEach(file => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('class="navbar"');
      });
    });

    it('all pages should have nav-link elements', () => {
      pages.forEach(file => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('class="nav-link"');
      });
    });
  });

  describe('Responsive Design', () => {
    const pages = ['index.html', 'api-docs.html', 'usage-guide.html', 'about.html'];

    pages.forEach(file => {
      it(`${file} should have responsive design breakpoints`, () => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for tablet breakpoint
        expect(content).toContain('@media (max-width: 768px)');
        // Check for mobile breakpoint
        expect(content).toContain('@media (max-width: 480px)');
      });
    });

    it('all pages should have viewport meta tag', () => {
      pages.forEach(file => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('viewport');
      });
    });
  });

  describe('Branding & Styling', () => {
    const pages = ['index.html', 'api-docs.html', 'usage-guide.html', 'about.html'];

    pages.forEach(file => {
      it(`${file} should include devs.miami branding`, () => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content).toContain('devs.miami');
      });

      it(`${file} should have CSS styling embedded`, () => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        expect(content).toContain('<style>');
        expect(content).toContain('--primary-color');
        expect(content).toContain('--accent-color');
      });

      it(`${file} should have syntax highlighting styles`, () => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        expect(content).toContain('.hljs');
        expect(content).toContain('hljs-string');
      });
    });
  });

  describe('Footer & Attribution', () => {
    const pages = ['index.html', 'api-docs.html', 'usage-guide.html', 'about.html'];

    pages.forEach(file => {
      it(`${file} should have footer with attribution`, () => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        expect(content).toContain('class="footer"');
        expect(content).toContain('Robert Melrose');
        expect(content).toContain('2024');
      });
    });
  });

  describe('SEO & Meta Tags', () => {
    const pages = ['index.html', 'api-docs.html', 'usage-guide.html', 'about.html'];

    pages.forEach(file => {
      it(`${file} should have proper meta tags`, () => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        expect(content).toContain('charset="UTF-8"');
        expect(content).toContain('description');
        expect(content).toContain('<title>');
        expect(content).toContain('OFAC API');
      });
    });
  });

  describe('File Sizes', () => {
    const pages = [
      { file: 'index.html', minSize: 5000, maxSize: 100000 },
      { file: 'api-docs.html', minSize: 5000, maxSize: 100000 },
      { file: 'usage-guide.html', minSize: 5000, maxSize: 100000 },
      { file: 'about.html', minSize: 5000, maxSize: 100000 }
    ];

    pages.forEach(({ file, minSize, maxSize }) => {
      it(`${file} should have reasonable file size (${minSize / 1000}KB - ${maxSize / 1000}KB)`, () => {
        const filePath = path.join(publicDir, file);
        const stats = fs.statSync(filePath);
        
        expect(stats.size).toBeGreaterThan(minSize);
        expect(stats.size).toBeLessThan(maxSize);
      });
    });
  });

  describe('Content Validation', () => {
    it('landing page should have hero content', () => {
      const filePath = path.join(publicDir, 'index.html');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('OFAC API');
      expect(content).toContain('Serverless');
      expect(content).toContain('<h1>');
    });

    it('API docs should include ReDoc', () => {
      const filePath = path.join(publicDir, 'api-docs.html');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('redoc');
      expect(content).toContain('redoc.standalone.js');
      expect(content).toContain("spec-url='../openapi.yaml'");
    });

    it('usage guide should have code examples', () => {
      const filePath = path.join(publicDir, 'usage-guide.html');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('<pre>');
      expect(content).toContain('<code');
      expect(content).toContain('hljs');
    });

    it('about page should have company information', () => {
      const filePath = path.join(publicDir, 'about.html');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('devs.miami');
      expect(content).toContain('Robert Melrose');
      expect(content).toContain('About');
    });
  });

  describe('No Load Errors', () => {
    const pages = ['index.html', 'api-docs.html', 'usage-guide.html', 'about.html'];

    pages.forEach(file => {
      it(`${file} should have no unclosed tags`, () => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for properly closed HTML tags
        expect(content).toContain('</html>');
        expect(content).toContain('</head>');
        expect(content).toContain('</body>');
      });

      it(`${file} should have matching opening and closing tags`, () => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Count opening and closing div tags
        const openDivs = (content.match(/<div/g) || []).length;
        const closeDivs = (content.match(/<\/div>/g) || []).length;
        expect(openDivs).toBe(closeDivs);
      });
    });
  });
});

/**
 * Tests for Documentation Build Process
 * Validates that the build system generates complete static sites
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

describe('Documentation Build Process', () => {
  // Verify all required HTML files are generated
  describe('Build generates complete static site', () => {
    const requiredPages = [
      { file: 'index.html', title: 'Landing Page' },
      { file: 'api-docs.html', title: 'API Documentation' },
      { file: 'usage-guide.html', title: 'Usage Guide' },
      { file: 'about.html', title: 'About Page' }
    ];

    requiredPages.forEach(({ file, title }) => {
      it(`should generate ${title} (${file})`, () => {
        const filePath = path.join(publicDir, file);
        expect(fs.existsSync(filePath)).toBe(true);
        
        const content = fs.readFileSync(filePath, 'utf-8');
        expect(content.length).toBeGreaterThan(0);
        expect(content).toContain('<!DOCTYPE html>');
      });
    });

    it('should generate HTML files with proper structure', () => {
      const indexPath = path.join(publicDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      // Check for essential HTML structure
      expect(content).toContain('<html');
      expect(content).toContain('<head>');
      expect(content).toContain('<body>');
      expect(content).toContain('</html>');
    });

    it('should include navigation in all pages', () => {
      requiredPages.forEach(({ file }) => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for navigation elements
        expect(content).toContain('navbar');
        expect(content).toContain('nav-link');
      });
    });

    it('should include branding in all pages', () => {
      requiredPages.forEach(({ file }) => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for devs.miami branding
        expect(content).toContain('devs.miami');
      });
    });

    it('should include footer in all pages', () => {
      requiredPages.forEach(({ file }) => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for footer
        expect(content).toContain('footer');
      });
    });

    it('should include CSS styling in all pages', () => {
      requiredPages.forEach(({ file }) => {
        const filePath = path.join(publicDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for CSS
        expect(content).toContain('<style>');
        expect(content).toContain('--primary-color');
        expect(content).toContain('--accent-color');
      });
    });

    it('should include responsive design CSS', () => {
      const indexPath = path.join(publicDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      // Check for responsive breakpoints
      expect(content).toContain('@media (max-width: 768px)');
      expect(content).toContain('@media (max-width: 480px)');
    });

    it('should include syntax highlighting styles', () => {
      const indexPath = path.join(publicDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      // Check for syntax highlighting classes
      expect(content).toContain('.hljs');
      expect(content).toContain('hljs-string');
      expect(content).toContain('hljs-number');
    });

    it('should have proper meta tags for SEO', () => {
      const indexPath = path.join(publicDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      // Check for meta tags
      expect(content).toContain('charset="UTF-8"');
      expect(content).toContain('viewport');
      expect(content).toContain('description');
    });

    it('should have proper page titles', () => {
      const indexPath = path.join(publicDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      // Check for title tag
      expect(content).toContain('<title>');
      expect(content).toContain('OFAC API');
    });

    it('should generate files with reasonable size', () => {
      requiredPages.forEach(({ file }) => {
        const filePath = path.join(publicDir, file);
        const stats = fs.statSync(filePath);
        
        // Each page should be at least 5KB (content + styling)
        expect(stats.size).toBeGreaterThan(5000);
        // But not excessively large (less than 100KB)
        expect(stats.size).toBeLessThan(100000);
      });
    });
  });

  describe('Build process configuration', () => {
    it('should have branding configuration file', () => {
      const brandingPath = path.join(__dirname, 'branding.config.js');
      expect(fs.existsSync(brandingPath)).toBe(true);
    });

    it('should have build script', () => {
      const buildPath = path.join(__dirname, 'build.js');
      expect(fs.existsSync(buildPath)).toBe(true);
    });

    it('should have markdown source files', () => {
      const markdownFiles = [
        'landing.md',
        'api-docs.md',
        'usage-guide.md',
        'about.md'
      ];

      markdownFiles.forEach(file => {
        const filePath = path.join(__dirname, file);
        expect(fs.existsSync(filePath)).toBe(true);
      });
    });
  });

  describe('Content validation', () => {
    it('should have content in generated pages', () => {
      const indexPath = path.join(publicDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      // Check for actual content beyond just structure
      expect(content).toContain('OFAC API');
      expect(content).toContain('Serverless');
    });

    it('should preserve markdown formatting in HTML', () => {
      const indexPath = path.join(publicDir, 'index.html');
      const content = fs.readFileSync(indexPath, 'utf-8');
      
      // Check for heading tags
      expect(content).toContain('<h1>');
      expect(content).toContain('<h2>');
    });

    it('should include code blocks with syntax highlighting', () => {
      const usageGuidePath = path.join(publicDir, 'usage-guide.html');
      const content = fs.readFileSync(usageGuidePath, 'utf-8');
      
      // Check for code blocks
      expect(content).toContain('<pre>');
      expect(content).toContain('<code');
    });
  });

  describe('OpenAPI documentation generation', () => {
    // Feature: documentation-site, Property 2.6: API documentation generated from openapi.yaml
    // Validates: Requirements 2.6
    it('should generate API docs from openapi.yaml', () => {
      const apiDocsPath = path.join(publicDir, 'api-docs.html');
      const openApiPath = path.join(__dirname, '..', 'openapi.yaml');
      
      // Verify API docs file exists
      expect(fs.existsSync(apiDocsPath)).toBe(true);
      
      // Verify openapi.yaml exists
      expect(fs.existsSync(openApiPath)).toBe(true);
      
      const apiDocsContent = fs.readFileSync(apiDocsPath, 'utf-8');
      
      // Verify ReDoc is included for rendering OpenAPI spec
      expect(apiDocsContent).toContain('redoc');
      expect(apiDocsContent).toContain('redoc.standalone.js');
      
      // Verify the spec-url points to openapi.yaml
      expect(apiDocsContent).toContain("spec-url='../openapi.yaml'");
      
      // Verify ReDoc container is present
      expect(apiDocsContent).toContain('<redoc');
      expect(apiDocsContent).toContain('</redoc>');
    });

    it('should include ReDoc script for interactive documentation', () => {
      const apiDocsPath = path.join(publicDir, 'api-docs.html');
      const content = fs.readFileSync(apiDocsPath, 'utf-8');
      
      // Verify ReDoc CDN script is included
      expect(content).toContain('https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js');
    });

    it('should include API documentation branding and navigation', () => {
      const apiDocsPath = path.join(publicDir, 'api-docs.html');
      const content = fs.readFileSync(apiDocsPath, 'utf-8');
      
      // Verify branding elements
      expect(content).toContain('devs.miami');
      expect(content).toContain('navbar');
      expect(content).toContain('API Docs');
      expect(content).toContain('Usage Guide');
      expect(content).toContain('About');
      
      // Verify footer
      expect(content).toContain('footer');
      expect(content).toContain('Robert Melrose');
    });

    it('should have proper styling for API documentation', () => {
      const apiDocsPath = path.join(publicDir, 'api-docs.html');
      const content = fs.readFileSync(apiDocsPath, 'utf-8');
      
      // Verify CSS is included
      expect(content).toContain('<style>');
      expect(content).toContain('--primary-color');
      expect(content).toContain('--accent-color');
      
      // Verify ReDoc styling
      expect(content).toContain('redoc-container');
    });
  });
});

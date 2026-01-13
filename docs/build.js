#!/usr/bin/env node

/**
 * Build Script: Markdown to HTML Conversion
 * Converts markdown files in docs/ to static HTML in public/
 * Applies branding, syntax highlighting, and responsive styling
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import hljs from 'highlight.js';
import { brandingConfig } from './branding.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = __dirname;
const publicDir = path.join(__dirname, '..', 'public');

// Configure marked with syntax highlighting
marked.setOptions({
  breaks: true,
  gfm: true,
  pedantic: false,
  renderer: new marked.Renderer()
});

// Custom renderer for code blocks with syntax highlighting
const renderer = new marked.Renderer();
renderer.code = (code, language) => {
  const validLanguage = language && hljs.getLanguage(language) ? language : 'plaintext';
  const highlighted = hljs.highlight(code, { language: validLanguage }).value;
  return `<pre><code class="hljs language-${validLanguage}">${highlighted}</code></pre>`;
};

marked.setOptions({ renderer });

/**
 * HTML Template with branding and responsive design
 */
function createHTMLTemplate(title, content, pageType = 'default') {
  const navLinks = brandingConfig.navigation
    .map(link => `<a href="${link.href}" class="nav-link">${link.label}</a>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | OFAC API</title>
  <meta name="description" content="Professional documentation for the OFAC API by devs.miami">
  <style>
    ${getStyles()}
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="container">
      <div class="nav-brand">
        <span class="logo">${brandingConfig.companyName}</span>
      </div>
      <div class="nav-links">
        ${navLinks}
      </div>
    </div>
  </nav>

  <main class="container">
    <article class="content">
      ${content}
    </article>
  </main>

  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <p>&copy; 2024 ${brandingConfig.companyName}. All rights reserved.</p>
        <p>Built by <strong>${brandingConfig.founderName}</strong></p>
      </div>
    </div>
  </footer>

  <script>
    ${getSyntaxHighlightingScript()}
  </script>
</body>
</html>`;
}

/**
 * Generate responsive CSS with branding
 */
function getStyles() {
  return `
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    :root {
      --primary-color: ${brandingConfig.primaryColor};
      --secondary-color: ${brandingConfig.secondaryColor};
      --accent-color: ${brandingConfig.accentColor};
      --text-color: ${brandingConfig.textColor};
      --text-secondary: ${brandingConfig.textSecondary};
      --bg-color: ${brandingConfig.backgroundColor};
      --font-family: ${brandingConfig.fontFamily};
      --heading-font: ${brandingConfig.headingFont};
      --code-font: ${brandingConfig.codeFont};
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: var(--font-family);
      background-color: var(--bg-color);
      color: var(--text-color);
      line-height: 1.6;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 20px;
    }

    /* Navigation */
    .navbar {
      background-color: var(--primary-color);
      border-bottom: 2px solid var(--accent-color);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .navbar .container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 20px;
    }

    .nav-brand {
      font-size: 1.5rem;
      font-weight: bold;
      color: var(--accent-color);
    }

    .logo {
      font-family: var(--heading-font);
      letter-spacing: 1px;
    }

    .nav-links {
      display: flex;
      gap: 2rem;
      flex-wrap: wrap;
    }

    .nav-link {
      color: var(--text-color);
      text-decoration: none;
      transition: color 0.3s ease;
      font-weight: 500;
    }

    .nav-link:hover {
      color: var(--accent-color);
    }

    /* Main Content */
    main {
      min-height: calc(100vh - 200px);
      padding: 3rem 20px;
    }

    .content {
      max-width: 900px;
      margin: 0 auto;
    }

    /* API Docs Container */
    .api-docs-container {
      min-height: calc(100vh - 200px);
      padding: 0;
      background-color: var(--bg-color);
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: var(--heading-font);
      margin-top: 2rem;
      margin-bottom: 1rem;
      color: var(--accent-color);
    }

    h1 {
      font-size: 2.5rem;
      margin-top: 0;
    }

    h2 {
      font-size: 2rem;
      border-bottom: 2px solid var(--accent-color);
      padding-bottom: 0.5rem;
    }

    h3 {
      font-size: 1.5rem;
    }

    p {
      margin-bottom: 1rem;
      color: var(--text-secondary);
    }

    a {
      color: var(--accent-color);
      text-decoration: none;
      transition: opacity 0.3s ease;
    }

    a:hover {
      opacity: 0.8;
      text-decoration: underline;
    }

    /* Code Blocks */
    pre {
      background-color: var(--primary-color);
      border-left: 4px solid var(--accent-color);
      padding: 1rem;
      margin: 1rem 0;
      overflow-x: auto;
      border-radius: 4px;
    }

    code {
      font-family: var(--code-font);
      font-size: 0.9rem;
    }

    pre code {
      background-color: transparent;
      color: var(--text-color);
    }

    p code {
      background-color: var(--primary-color);
      padding: 0.2rem 0.4rem;
      border-radius: 3px;
      color: var(--accent-color);
    }

    /* Lists */
    ul, ol {
      margin-left: 2rem;
      margin-bottom: 1rem;
    }

    li {
      margin-bottom: 0.5rem;
    }

    /* Blockquotes */
    blockquote {
      border-left: 4px solid var(--accent-color);
      padding-left: 1rem;
      margin: 1rem 0;
      color: var(--text-secondary);
      font-style: italic;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }

    th, td {
      border: 1px solid var(--secondary-color);
      padding: 0.75rem;
      text-align: left;
    }

    th {
      background-color: var(--primary-color);
      color: var(--accent-color);
      font-weight: bold;
    }

    /* Footer */
    .footer {
      background-color: var(--primary-color);
      border-top: 2px solid var(--accent-color);
      padding: 2rem 20px;
      margin-top: 3rem;
    }

    .footer-content {
      text-align: center;
      color: var(--text-secondary);
    }

    .footer-content p {
      margin-bottom: 0.5rem;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      h1 {
        font-size: 2rem;
      }

      h2 {
        font-size: 1.5rem;
      }

      .nav-links {
        gap: 1rem;
        font-size: 0.9rem;
      }

      main {
        padding: 2rem 10px;
      }

      pre {
        font-size: 0.8rem;
      }
    }

    @media (max-width: 480px) {
      h1 {
        font-size: 1.5rem;
      }

      h2 {
        font-size: 1.2rem;
      }

      .navbar .container {
        flex-direction: column;
        gap: 1rem;
      }

      .nav-links {
        flex-direction: column;
        gap: 0.5rem;
      }

      .nav-link {
        display: block;
      }
    }

    /* Syntax Highlighting */
    .hljs {
      color: var(--text-color);
    }

    .hljs-string { color: #7ec699; }
    .hljs-number { color: #ff9999; }
    .hljs-literal { color: #ff9999; }
    .hljs-attr { color: #7ec699; }
    .hljs-variable { color: var(--accent-color); }
    .hljs-template-variable { color: var(--accent-color); }
    .hljs-tag { color: var(--accent-color); }
    .hljs-name { color: var(--accent-color); }
    .hljs-type { color: var(--accent-color); }
    .hljs-attribute { color: #7ec699; }
    .hljs-regexp { color: #ff9999; }
    .hljs-link { color: #7ec699; }
    .hljs-symbol { color: #ff9999; }
    .hljs-bullet { color: #ff9999; }
    .hljs-built_in { color: var(--accent-color); }
    .hljs-builtin-name { color: var(--accent-color); }
    .hljs-meta { color: var(--text-secondary); }
    .hljs-deletion { color: #ff9999; }
    .hljs-addition { color: #7ec699; }
    .hljs-emphasis { font-style: italic; }
    .hljs-strong { font-weight: bold; }
  `;
}

/**
 * Syntax highlighting script
 */
function getSyntaxHighlightingScript() {
  return `
    // Syntax highlighting is applied during build time
    // This script is a placeholder for any runtime enhancements
    console.log('Documentation site loaded');
  `;
}

/**
 * Build markdown file to HTML
 */
async function buildMarkdownFile(markdownPath, outputPath) {
  try {
    const markdown = fs.readFileSync(markdownPath, 'utf-8');
    const html = marked(markdown);
    
    // Extract title from first h1
    const titleMatch = markdown.match(/^# (.+)$/m);
    const title = titleMatch ? titleMatch[1] : 'Documentation';
    
    const fullHTML = createHTMLTemplate(title, html);
    
    fs.writeFileSync(outputPath, fullHTML, 'utf-8');
    console.log(`✓ Built ${path.basename(markdownPath)} → ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`✗ Error building ${markdownPath}:`, error.message);
    throw error;
  }
}

/**
 * Build API documentation with ReDoc integration
 */
async function buildAPIDocumentation(outputPath) {
  try {
    const navLinks = brandingConfig.navigation
      .map(link => `<a href="${link.href}" class="nav-link">${link.label}</a>`)
      .join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation | OFAC API</title>
  <meta name="description" content="Interactive API documentation for the OFAC API by devs.miami">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    ${getStyles()}
    
    /* ReDoc Custom Styling */
    redoc {
      --primary-color: ${brandingConfig.accentColor};
      --secondary-color: ${brandingConfig.secondaryColor};
      --text-color: ${brandingConfig.textColor};
      --bg-color: ${brandingConfig.backgroundColor};
    }
    
    .redoc-container {
      background-color: var(--bg-color);
    }
  </style>
</head>
<body>
  <nav class="navbar">
    <div class="container">
      <div class="nav-brand">
        <span class="logo">${brandingConfig.companyName}</span>
      </div>
      <div class="nav-links">
        ${navLinks}
      </div>
    </div>
  </nav>

  <main class="api-docs-container">
    <redoc spec-url='../openapi.yaml'></redoc>
  </main>

  <footer class="footer">
    <div class="container">
      <div class="footer-content">
        <p>&copy; 2024 ${brandingConfig.companyName}. All rights reserved.</p>
        <p>Built by <strong>${brandingConfig.founderName}</strong></p>
      </div>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
</body>
</html>`;

    fs.writeFileSync(outputPath, html, 'utf-8');
    console.log(`✓ Built API documentation → ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`✗ Error building API documentation:`, error.message);
    throw error;
  }
}

/**
 * Main build function
 */
async function build() {
  try {
    // Ensure public directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    console.log('🔨 Building documentation site...\n');

    // Build landing page
    await buildMarkdownFile(
      path.join(docsDir, 'landing.md'),
      path.join(publicDir, 'index.html')
    );

    // Build API docs with ReDoc integration
    await buildAPIDocumentation(
      path.join(publicDir, 'api-docs.html')
    );

    // Build usage guide
    await buildMarkdownFile(
      path.join(docsDir, 'usage-guide.md'),
      path.join(publicDir, 'usage-guide.html')
    );

    // Build about page
    await buildMarkdownFile(
      path.join(docsDir, 'about.md'),
      path.join(publicDir, 'about.html')
    );

    console.log('\n✅ Documentation site built successfully!');
  } catch (error) {
    console.error('\n❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run build
build();

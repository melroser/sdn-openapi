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
 * HTML Template with light theme and responsive design
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
  <script type="module" src="https://cdn.jsdelivr.net/npm/ionicons/dist/ionicons/ionicons.esm.js"></script>
  <noscript><script src="https://cdn.jsdelivr.net/npm/ionicons/dist/ionicons/ionicons.js"></script></noscript>
  <style>
    ${getStyles()}
  </style>
</head>
<body class="bg-loom">
  <div class="nav-sticky">
    <div class="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
      <div class="font-bold text-lg text-indigo-600">SDN OpenAPI</div>
      <div class="flex gap-6 ml-auto">
        ${navLinks}
      </div>
    </div>
  </div>

  <div class="max-w-4xl mx-auto px-5 py-12">
    <div class="loom-card bg-white rounded-lg p-10">
      <article class="content">
        ${content}
      </article>
    </div>
  </div>

  <script>
    ${getSyntaxHighlightingScript()}
  </script>
</body>
</html>`;
}

/**
 * Generate responsive CSS with light theme
 */
function getStyles() {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    /* LIGHT THEME */
    :root {
      color-scheme: light;
      
      /* Loom-ish background knobs */
      --loom-bg: #ffffff;
      
      /* grid */
      --loom-grid-size: 144px;
      --loom-grid-alpha: 0.18;
      
      /* glows */
      --loom-indigo: 0.16;
      --loom-pink: 0.12;
      --loom-emerald: 0.12;
      
      /* hero slab tint (very light purple) */
      --loom-slab: rgba(99, 102, 241, 0.10);
      
      /* optional vignette */
      --loom-vignette: 0.09;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html,
    body {
      height: 100%;
      background: var(--loom-bg) !important;
      color: #09090b !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .bg-loom {
      background-color: var(--loom-bg);
      background-image:
        /* Glows */
        radial-gradient(900px 500px at 50% 0%, rgba(99, 102, 241, var(--loom-indigo)), transparent 60%),
        radial-gradient(800px 450px at 15% 25%, rgba(236, 72, 153, var(--loom-pink)), transparent 60%),
        radial-gradient(800px 450px at 85% 30%, rgba(34, 197, 94, var(--loom-emerald)), transparent 60%),
        /* Vignette */
        radial-gradient(1200px 700px at 50% 10%, rgba(0, 0, 0, var(--loom-vignette)), transparent 60%),
        /* The Grid */
        linear-gradient(to bottom, rgba(15, 23, 42, var(--loom-grid-alpha)) 1px, transparent 1px),
        linear-gradient(to right, rgba(15, 23, 42, var(--loom-grid-alpha)) 1px, transparent 1px);
      background-size:
        auto, auto, auto, auto,
        var(--loom-grid-size) var(--loom-grid-size),
        var(--loom-grid-size) var(--loom-grid-size);
      background-position:
        center, center, center, center,
        top left, top left;
      background-repeat:
        no-repeat, no-repeat, no-repeat, no-repeat,
        repeat, repeat;
      background-attachment: fixed;
    }

    .loom-slab {
      background: var(--loom-slab);
    }

    .loom-card {
      box-shadow:
        0 0 0 1px rgba(0,0,0,0.06),
        0 1px 2px rgba(0,0,0,0.04),
        0 20px 50px -12px rgba(0,0,0,0.15);
    }

    /* Navigation */
    .nav-sticky {
      position: sticky;
      top: 0;
      z-index: 50;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    .max-w-4xl {
      max-width: 56rem;
    }

    .mx-auto {
      margin-left: auto;
      margin-right: auto;
    }

    .px-5 {
      padding-left: 1.25rem;
      padding-right: 1.25rem;
    }

    .py-4 {
      padding-top: 1rem;
      padding-bottom: 1rem;
    }

    .py-12 {
      padding-top: 3rem;
      padding-bottom: 3rem;
    }

    .p-10 {
      padding: 2.5rem;
    }

    .flex {
      display: flex;
    }

    .items-center {
      align-items: center;
    }

    .justify-between {
      justify-content: space-between;
    }

    .gap-6 {
      gap: 1.5rem;
    }

    .ml-auto {
      margin-left: auto;
    }

    .font-bold {
      font-weight: 700;
    }

    .text-lg {
      font-size: 1.125rem;
    }

    .text-indigo-600 {
      color: #6366f1;
    }

    .text-sm {
      font-size: 0.875rem;
    }

    .font-medium {
      font-weight: 500;
    }

    .text-gray-600 {
      color: #4b5563;
    }

    .hover\\:text-indigo-600:hover {
      color: #6366f1;
    }

    .transition {
      transition: all 0.2s;
    }

    .bg-white {
      background: white;
    }

    .rounded-lg {
      border-radius: 0.75rem;
    }

    /* Typography */
    h1 {
      font-size: 3rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      line-height: 1.2;
      margin-bottom: 1rem;
      color: #09090b;
    }

    h2 {
      font-size: 1.875rem;
      font-weight: 600;
      line-height: 1.2;
      margin-top: 2rem;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #09090b;
    }

    h2 ion-icon {
      font-size: 2rem;
      color: #6366f1;
    }

    h3 {
      font-size: 1.125rem;
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      color: #09090b;
    }

    p {
      color: #666666;
      margin-bottom: 1rem;
      line-height: 1.6;
    }

    a {
      color: #6366f1;
      text-decoration: none;
      transition: opacity 0.3s ease;
    }

    a:hover {
      opacity: 0.8;
      text-decoration: underline;
    }

    /* Code */
    code {
      font-family: 'Fira Code', 'Courier New', monospace;
      background: #f3f4f6;
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
      color: #d73a49;
      font-size: 0.9em;
    }

    pre {
      background: #f9fafb;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 0.5rem;
      padding: 1rem;
      overflow: auto;
      font-size: 0.8125rem;
      line-height: 1.5;
      color: #374151;
      margin: 1.5rem 0;
    }

    pre code {
      background: none;
      padding: 0;
      color: inherit;
    }

    /* Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #6366f1;
      color: white;
      padding: 0.75rem 1.25rem;
      border-radius: 0.5rem;
      border: none;
      font-weight: 600;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }

    .btn:hover {
      background: #4f46e5;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }

    .btn ion-icon {
      font-size: 1rem;
    }

    /* Highlight box */
    .highlight {
      background: #f0f4ff;
      border-left: 4px solid #6366f1;
      padding: 1rem 1.25rem;
      border-radius: 0.5rem;
      margin: 1.5rem 0;
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
    }

    .highlight ion-icon {
      color: #6366f1;
      font-size: 1.25rem;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .highlight p {
      margin: 0;
      color: #09090b;
    }

    /* Grid */
    .feature-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
      margin: 2rem 0;
    }

    .feature-card {
      background: white;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-radius: 0.75rem;
      padding: 1.5rem;
      transition: all 0.2s;
    }

    .feature-card:hover {
      border-color: #6366f1;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.1);
    }

    .feature-card h3 {
      margin-top: 0;
      display: flex;
      align-items: center;
      gap: 0.625rem;
      color: #09090b;
    }

    .feature-card ion-icon {
      color: #6366f1;
      font-size: 1.5rem;
    }

    .feature-card p {
      margin-bottom: 0;
      font-size: 0.875rem;
      color: #666666;
    }

    /* Code example */
    .code-example {
      margin: 1.5rem 0;
    }

    .code-label {
      color: #6366f1;
      font-weight: 600;
      font-size: 0.75rem;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Lists */
    ul {
      margin-left: 1.25rem;
      padding: 0;
    }

    li {
      margin-bottom: 0.625rem;
      color: #666666;
    }

    /* Footer */
    .footer {
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      padding-top: 1.5rem;
      margin-top: 3rem;
      text-align: center;
      color: #666666;
      font-size: 0.875rem;
    }

    /* Responsive */
    @media (max-width: 768px) {
      h1 {
        font-size: 2rem;
      }

      h2 {
        font-size: 1.5rem;
      }

      .p-10 {
        padding: 1.5rem;
      }

      pre {
        font-size: 0.75rem;
      }
    }
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
 * Build API documentation as static HTML
 */
async function buildAPIDocumentation(outputPath) {
  try {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Documentation | OFAC API</title>
  <meta name="description" content="Interactive API documentation for the OFAC API by devs.miami">
  <script type="module" src="https://cdn.jsdelivr.net/npm/ionicons/dist/ionicons/ionicons.esm.js"></script>
  <noscript><script src="https://cdn.jsdelivr.net/npm/ionicons/dist/ionicons/ionicons.js"></script></noscript>
  <style>
    ${getStyles()}
    
    .endpoint {
      background-color: white;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-left: 4px solid #6366f1;
      padding: 1.5rem;
      margin: 2rem 0;
      border-radius: 0.5rem;
    }

    .endpoint-header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .method {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 0.25rem;
      font-weight: bold;
      font-size: 0.75rem;
      font-family: 'Fira Code', 'Courier New', monospace;
    }

    .method.get {
      background-color: #61affe;
      color: #fff;
    }

    .method.post {
      background-color: #49cc90;
      color: #fff;
    }

    .method.put {
      background-color: #fca130;
      color: #fff;
    }

    .method.delete {
      background-color: #f93e3e;
      color: #fff;
    }

    .path {
      font-family: 'Fira Code', 'Courier New', monospace;
      font-size: 1rem;
      color: #6366f1;
    }

    .endpoint-description {
      color: #666666;
      margin-bottom: 1rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: bold;
      color: #09090b;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }

    .param-table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
      font-size: 0.875rem;
    }

    .param-table th,
    .param-table td {
      border: 1px solid rgba(0, 0, 0, 0.06);
      padding: 0.75rem;
      text-align: left;
    }

    .param-table th {
      background-color: #f9fafb;
      color: #09090b;
      font-weight: bold;
    }

    .param-table td {
      background-color: white;
    }

    .response-example {
      background-color: #f9fafb;
      border: 1px solid rgba(0, 0, 0, 0.06);
      border-left: 4px solid #6366f1;
      padding: 1rem;
      margin: 1rem 0;
      border-radius: 0.25rem;
      overflow-x: auto;
    }

    .response-example code {
      color: #374151;
      font-size: 0.8rem;
    }

    .required {
      color: #f93e3e;
      font-weight: bold;
    }

    .optional {
      color: #fca130;
    }
  </style>
</head>
<body class="bg-loom">
  <div class="nav-sticky">
    <div class="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
      <div class="font-bold text-lg text-indigo-600">SDN OpenAPI</div>
      <div class="flex gap-6 ml-auto">
        <a href="/" class="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">Home</a>
        <a href="/docs.html" class="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">ReDoc</a>
        <a href="/swagger-ui.html" class="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">Swagger</a>
        <a href="/usage-guide.html" class="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">Usage</a>
        <a href="/about.html" class="text-sm font-medium text-gray-600 hover:text-indigo-600 transition">About</a>
      </div>
    </div>
  </div>

  <div class="max-w-4xl mx-auto px-5 py-12">
    <div class="loom-card bg-white rounded-lg p-10">
      <article class="content">
        <h1>API Documentation</h1>
        <p>OFAC SDN JSON Wrapper API - Unofficial JSON wrapper for OFAC Sanctions List Service exports.</p>

        <h2><ion-icon name="code"></ion-icon> Base URL</h2>
        <p><code>https://YOUR-SITE.netlify.app</code></p>

        <h2><ion-icon name="list"></ion-icon> Endpoints</h2>

        <!-- GET /api/meta -->
        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/meta</span>
          </div>
          <p class="endpoint-description">Get dataset metadata including last update time and record count</p>
          
          <div class="section-title">Response</div>
          <table class="param-table">
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
            <tr>
              <td>lastUpdated</td>
              <td>string (ISO 8601)</td>
              <td>Timestamp of last data refresh</td>
            </tr>
            <tr>
              <td>recordCount</td>
              <td>integer</td>
              <td>Total number of entities in dataset</td>
            </tr>
            <tr>
              <td>version</td>
              <td>string</td>
              <td>API version</td>
            </tr>
          </table>

          <div class="section-title">Example Response</div>
          <div class="response-example"><code>{
  "lastUpdated": "2024-01-13T00:00:00Z",
  "recordCount": 12345,
  "version": "1.0.0"
}</code></div>
        </div>

        <!-- GET /api/search -->
        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/search</span>
          </div>
          <p class="endpoint-description">Fuzzy search SDN entities by name or alias</p>
          
          <div class="section-title">Query Parameters</div>
          <table class="param-table">
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Required</th>
              <th>Description</th>
            </tr>
            <tr>
              <td>q</td>
              <td>string</td>
              <td><span class="required">Yes</span></td>
              <td>Search query (name or alias)</td>
            </tr>
            <tr>
              <td>limit</td>
              <td>integer</td>
              <td><span class="optional">No</span></td>
              <td>Max results (1-50, default: 20)</td>
            </tr>
          </table>

          <div class="section-title">Example Request</div>
          <div class="response-example"><code>GET /api/search?q=Maduro&limit=10</code></div>

          <div class="section-title">Example Response</div>
          <div class="response-example"><code>{
  "results": [
    {
      "uid": "12345",
      "name": "Nicolás Maduro",
      "type": "Individual",
      "score": 0.98
    }
  ],
  "total": 1
}</code></div>
        </div>

        <!-- GET /api/entity/{uid} -->
        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method get">GET</span>
            <span class="path">/api/entity/{uid}</span>
          </div>
          <p class="endpoint-description">Get complete details for a specific entity</p>
          
          <div class="section-title">Path Parameters</div>
          <table class="param-table">
            <tr>
              <th>Parameter</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
            <tr>
              <td>uid</td>
              <td>string</td>
              <td>Entity unique identifier</td>
            </tr>
          </table>

          <div class="section-title">Response Fields</div>
          <table class="param-table">
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
            <tr>
              <td>uid</td>
              <td>string</td>
              <td>Unique entity identifier</td>
            </tr>
            <tr>
              <td>name</td>
              <td>string</td>
              <td>Primary entity name</td>
            </tr>
            <tr>
              <td>type</td>
              <td>string</td>
              <td>Individual or Entity</td>
            </tr>
          </table>

          <div class="section-title">Example Response</div>
          <div class="response-example"><code>{
  "uid": "12345",
  "name": "Nicolás Maduro",
  "type": "Individual",
  "aliases": ["Nicolás Maduro Moros"],
  "addresses": [{"address": "Miraflores Palace", "city": "Caracas", "country": "Venezuela"}],
  "dateOfBirth": "1962-11-23",
  "placeOfBirth": "Caracas"
}</code></div>
        </div>

        <!-- POST /api/update -->
        <div class="endpoint">
          <div class="endpoint-header">
            <span class="method post">POST</span>
            <span class="path">/api/update</span>
          </div>
          <p class="endpoint-description">Trigger manual dataset refresh</p>
          
          <div class="section-title">Example Response</div>
          <div class="response-example"><code>{
  "status": "success",
  "message": "Dataset refresh initiated"
}</code></div>
        </div>

        <h2><ion-icon name="alert"></ion-icon> Error Responses</h2>
        <p>All errors follow this format:</p>
        <div class="response-example"><code>{
  "error": "Error message",
  "code": "ERROR_CODE"
}</code></div>
      </article>
    </div>
  </div>
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
 * Build Swagger UI documentation
 */
async function buildSwaggerUI(outputPath) {
  try {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Swagger UI - OFAC API</title>
  <link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.24.0/swagger-ui.min.css">
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin: 0;
      padding: 0;
      background: #fafafa;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    }
    .topbar {
      background-color: #6366f1;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.24.0/swagger-ui-bundle.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/5.24.0/swagger-ui-standalone-preset.min.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/openapi.yaml",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
      window.ui = ui;
    };
  </script>
</body>
</html>`;

    fs.writeFileSync(outputPath, html, 'utf-8');
    console.log(`✓ Built Swagger UI → ${path.basename(outputPath)}`);
  } catch (error) {
    console.error(`✗ Error building Swagger UI:`, error.message);
    throw error;
  }
}

/**
 * Copy OpenAPI spec to public directory
 */
function copyOpenAPISpec() {
  try {
    const sourceSpec = path.join(__dirname, '..', 'openapi.yaml');
    const destSpec = path.join(publicDir, 'openapi.yaml');
    
    if (fs.existsSync(sourceSpec)) {
      fs.copyFileSync(sourceSpec, destSpec);
      console.log(`✓ Copied openapi.yaml → ${path.basename(destSpec)}`);
    } else {
      console.warn(`⚠ Warning: openapi.yaml not found at ${sourceSpec}`);
    }
  } catch (error) {
    console.error(`✗ Error copying openapi.yaml:`, error.message);
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

    // Copy OpenAPI spec
    copyOpenAPISpec();

    // Build landing page
    await buildMarkdownFile(
      path.join(docsDir, 'landing.md'),
      path.join(publicDir, 'index.html')
    );

    // Build Swagger UI docs
    await buildSwaggerUI(
      path.join(publicDir, 'swagger-ui.html')
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

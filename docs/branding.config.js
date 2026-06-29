/**
 * Branding Configuration for devs.miami
 * Defines colors, fonts, and company information
 */

export const brandingConfig = {
  // Colors
  primaryColor: '#1a1a2e',      // Deep navy
  secondaryColor: '#16213e',    // Darker navy
  accentColor: '#00d4ff',       // Cyan accent
  textColor: '#ffffff',
  textSecondary: '#b0b0b0',
  backgroundColor: '#0f3460',
  
  // Typography
  fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif",
  headingFont: "'Poppins', 'Inter', sans-serif",
  codeFont: "'Fira Code', 'Courier New', monospace",
  
  // Company Information
  companyName: 'devs.miami',
  founderName: 'Robert Melrose',
  founderTitle: 'Software Engineer & Founder',
  companyWebsite: 'https://devs.miami',
  caseStudyUrl: 'https://devs.miami/finance',
  ed209Url: 'https://github.com/melroser/ed-209',
  
  // Social Links
  socialLinks: {
    github: 'https://github.com/melroser/sdn-openapi',
    twitter: 'https://twitter.com',
    linkedin: 'https://linkedin.com'
  },
  
  // Navigation
  navigation: [
    { label: 'ReDoc', href: '/docs.html' },
    { label: 'Swagger UI', href: '/swagger-ui.html' },
    { label: 'Usage Guide', href: '/usage-guide.html' },
    { label: 'About', href: '/about.html' },
    { label: 'Case Study', href: 'https://devs.miami/finance' },
    { label: 'ED 209', href: 'https://github.com/melroser/ed-209' },
    { label: 'GitHub', href: 'https://github.com/melroser/sdn-openapi' }
  ]
};

export default brandingConfig;

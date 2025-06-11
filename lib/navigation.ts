// Navigation configuration for the entire application
export interface NavItem {
  label: string;
  href: string;
  description?: string;
  external?: boolean;
  requiresAuth?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

// Main navigation items (header)
export const mainNavItems: NavItem[] = [
  { label: 'Features', href: '/features' },
  { label: 'Templates', href: '/templates' },
  { label: 'Examples', href: '/examples' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Docs', href: '/docs' },
];

// Footer navigation sections
export const footerNavSections: NavSection[] = [
  {
    title: 'Product',
    items: [
      { label: 'Features', href: '/features', description: 'Explore all VRUX features' },
      { label: 'Pricing', href: '/pricing', description: 'Simple, transparent pricing' },
      { label: 'Templates', href: '/templates', description: 'Pre-built component templates' },
      { label: 'Examples', href: '/examples', description: 'See what you can build' },
    ],
  },
  {
    title: 'Resources',
    items: [
      { label: 'Documentation', href: '/docs', description: 'Learn how to use VRUX' },
      { label: 'API Reference', href: '/api-reference', description: 'API documentation' },
      { label: 'Blog', href: '/blog', description: 'Latest updates and tutorials' },
      { label: 'Community', href: '/community', description: 'Join our community' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About', href: '/about', description: 'Learn about VRUX' },
      { label: 'Privacy', href: '/privacy', description: 'Privacy policy' },
      { label: 'Terms', href: '/terms', description: 'Terms of service' },
      { label: 'Contact', href: '/contact', description: 'Get in touch' },
    ],
  },
];

// Authenticated user navigation
export const userNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', requiresAuth: true },
  { label: 'Generate', href: '/generate', requiresAuth: true },
  { label: 'Templates', href: '/templates', requiresAuth: true },
  { label: 'Settings', href: '/settings', requiresAuth: true },
];

// Admin navigation
export const adminNavItems: NavItem[] = [
  { label: 'Operations', href: '/operations', requiresAuth: true },
  { label: 'Telemetry', href: '/telemetry', requiresAuth: true },
  { label: 'Diagnostic', href: '/diagnostic', requiresAuth: true },
];

// Social links
export const socialLinks = [
  { label: 'GitHub', href: 'https://github.com/ehudso7/vrux', external: true },
  { label: 'Twitter', href: 'https://twitter.com/vrux_dev', external: true },
  { label: 'Discord', href: 'https://discord.gg/vrux', external: true },
];

// Get all routes for sitemap
export function getAllRoutes(): string[] {
  const routes: string[] = ['/'];
  
  // Add main nav items
  mainNavItems.forEach(item => routes.push(item.href));
  
  // Add footer nav items
  footerNavSections.forEach(section => {
    section.items.forEach(item => routes.push(item.href));
  });
  
  // Add user nav items
  userNavItems.forEach(item => routes.push(item.href));
  
  // Add admin nav items
  adminNavItems.forEach(item => routes.push(item.href));
  
  // Remove duplicates
  return [...new Set(routes)];
}
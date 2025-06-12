// Mock Prisma Client enums and types
module.exports = {
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    project: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    component: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    analytics: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    template: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    sharedComponent: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  })),
  
  // Enums
  AuthProvider: {
    LOCAL: 'LOCAL',
    GOOGLE: 'GOOGLE',
    GITHUB: 'GITHUB',
    MICROSOFT: 'MICROSOFT',
  },
  
  SubscriptionTier: {
    FREE: 'FREE',
    PRO: 'PRO',
    ENTERPRISE: 'ENTERPRISE',
  },
  
  Framework: {
    REACT: 'REACT',
    VUE: 'VUE',
    ANGULAR: 'ANGULAR',
    SVELTE: 'SVELTE',
    SOLID: 'SOLID',
    QWIK: 'QWIK',
  },
  
  StylingOption: {
    TAILWIND: 'TAILWIND',
    CSS: 'CSS',
    SCSS: 'SCSS',
    STYLED_COMPONENTS: 'STYLED_COMPONENTS',
    EMOTION: 'EMOTION',
    CSS_MODULES: 'CSS_MODULES',
  },
  
  CollaboratorRole: {
    VIEWER: 'VIEWER',
    EDITOR: 'EDITOR',
    ADMIN: 'ADMIN',
  },
  
  AnalyticsEvent: {
    COMPONENT_GENERATED: 'COMPONENT_GENERATED',
    COMPONENT_EXPORTED: 'COMPONENT_EXPORTED',
    COMPONENT_SHARED: 'COMPONENT_SHARED',
    TEMPLATE_CREATED: 'TEMPLATE_CREATED',
    TEMPLATE_USED: 'TEMPLATE_USED',
    PROJECT_CREATED: 'PROJECT_CREATED',
    API_CALL: 'API_CALL',
    SUBSCRIPTION_UPGRADED: 'SUBSCRIPTION_UPGRADED',
  },
};
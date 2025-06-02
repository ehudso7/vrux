# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VRUX is a Next.js application that generates React/Tailwind UI components using AI. It has a hybrid structure with both Pages Router (`/pages`) and App Router (`/src/app`) directories, though the main functionality is currently in the Pages Router.

## Key Commands

```bash
# Development
npm run dev          # Start development server with Turbopack

# Build & Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint
```

## Architecture

### Routing Structure
- **Pages Router** (`/pages`): Contains the main application logic
  - `index.js`: Main page with AI chat interface and live preview
  - `api/generate-ui.js`: API endpoint that calls OpenAI to generate UI code

- **App Router** (`/src/app`): Contains default Next.js template (not yet integrated)

### Core Components
- `components/AIChatBox.jsx`: Input interface for describing UI requirements
- `components/Preview.jsx`: Live preview component using react-live
- `pages/api/generate-ui.js`: OpenAI API integration endpoint

### Key Dependencies Not Yet Installed
The codebase references these packages that need to be installed:
- `openai`: Required for API endpoint
- `react-live`: Required for Preview component
- UI components (`@/components/ui/input`, `@/components/ui/button`): Referenced but not implemented

### Environment Variables
Required in `.env.local`:
- `OPENAI_API_KEY`: For OpenAI API calls
- `ANTHROPIC_API_KEY`: Present but not currently used

### Path Aliases
- `@/*` maps to `./src/*` (configured in tsconfig.json)

## Development Notes

The project uses Tailwind CSS v4 with PostCSS. When developing:
- The main entry point is `/pages/index.js` (not `/src/app/page.tsx`)
- API routes are in `/pages/api/`
- Missing dependencies should be installed before running the app
- UI component library needs to be implemented or installed

## AI Generation Quality Standards

### Security Layers
- **Input Validation**: All prompts are validated using Zod schemas with malicious pattern detection
- **Code Sanitization**: Generated code is sanitized to remove dangerous patterns (eval, script tags, etc.)
- **Sandbox Validation**: Components are validated in an isolated VM environment using isolated-vm
- **CSP Headers**: Strict Content Security Policy headers are applied to all API responses

### Error Handling
- **Comprehensive Error Types**: Categorized errors (validation, rate limit, API, timeout, etc.)
- **Retry Strategies**: Automatic retry with exponential backoff for transient failures
- **Circuit Breaker**: Prevents cascading failures by temporarily blocking requests after repeated failures
- **Detailed Logging**: All errors are logged with context for debugging

### Performance Optimization
- **Response Caching**: Common prompts are cached for 5 minutes with LRU eviction
- **Prompt Optimization**: Automatically enhances prompts for better generation results
- **Request Queuing**: Manages concurrent generations with priority-based queue
- **Performance Monitoring**: Tracks generation time, token usage, and provides recommendations

### Quality Checks
- **Accessibility**: Checks for ARIA labels, alt text, keyboard navigation, heading hierarchy
- **Performance**: Analyzes component complexity, memoization usage, render optimization
- **Best Practices**: Validates TypeScript/PropTypes, error handling, key props, state management
- **SEO**: Ensures semantic HTML, proper heading structure, meta-friendly content

### Validation Libraries
- `zod`: Schema validation for API inputs
- `isomorphic-dompurify`: HTML sanitization
- `isolated-vm`: Secure code execution sandbox (replaced vm2 for security)

## Important Files

### Security & Validation
- `/lib/ai-validation.ts`: Input validation, sanitization, and security configurations
- `/lib/code-sandbox.ts`: Secure sandbox environment for code validation
- `/lib/ai-quality-checks.ts`: Component quality evaluation system

### Error Handling & Performance
- `/lib/ai-error-handler.ts`: Comprehensive error handling with retry logic
- `/lib/ai-performance.ts`: Performance optimization, caching, and monitoring

### API Endpoints
- `/pages/api/generate-ui.ts`: Enhanced with validation, error handling, and quality checks
- `/pages/api/generate-viewcomfy.ts`: Alternative generation endpoint
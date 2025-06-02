# VRUX - AI-Powered React Component Generator

<div align="center">
  <h3>Professional AI Component Generator for Modern Developers</h3>
  <p>Generate production-ready React components with AI. Build beautiful, accessible UIs 10x faster.</p>
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-06B6D4)](https://tailwindcss.com/)
</div>

## 🚀 Features

### Core Features
- **AI-Powered Generation**: Generate React components using GPT-4 with natural language descriptions
- **Multiple Variants**: Get 3 unique design variations for every component
- **Live Preview**: Real-time component preview with hot reload
- **Code Editor**: Built-in Monaco editor with syntax highlighting
- **Export Options**: Download components or copy to clipboard
- **Responsive Design**: All generated components are mobile-first and responsive

### Advanced Features
- **🔒 Security First**: Input validation, code sanitization, and sandbox execution
- **⚡ Performance Optimized**: Response caching, request queuing, and performance monitoring
- **♿ Accessibility**: Automatic ARIA labels, keyboard navigation, and WCAG compliance
- **🎨 Design System Ready**: Compatible with Tailwind CSS and custom design tokens
- **📊 Quality Metrics**: Real-time component quality scoring and recommendations
- **🚀 One-Click Deploy**: Deploy components directly to Vercel

## 🛠️ Tech Stack

- **Framework**: [Next.js 15.3.2](https://nextjs.org/) with Turbopack
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/)
- **AI Integration**: OpenAI GPT-4
- **Code Preview**: [React Live](https://github.com/FormidableLabs/react-live)
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Security**: isolated-vm for sandbox execution

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Git

## 🏃‍♂️ Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/vrux.git
   cd vrux
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` and add your OpenAI API key:
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   ```
   
   The app will automatically validate your environment on startup.

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🚀 Quick Start

1. **Describe your component**: Enter a natural language description of the UI component you want to create
2. **Generate**: Click "Generate" or press `Cmd/Ctrl + Enter`
3. **Preview**: See your component rendered in real-time
4. **Customize**: Switch between different style variants
5. **Export**: Copy the code or download as a file

### Example Prompts

- "Create a modern dashboard with charts and KPI cards"
- "Build a product gallery with filters and sorting"
- "Design a multi-step form with progress indicator"
- "Create a chat interface with message bubbles"

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/vrux)

1. Click the deploy button above
2. Configure environment variables in Vercel dashboard
3. Deploy!

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

## 📁 Project Structure

```
vrux/
├── pages/              # Next.js pages (Pages Router)
│   ├── api/           # API endpoints
│   └── index.tsx      # Main application page
├── components/         # React components
│   ├── ui/            # Base UI components
│   └── *.tsx          # Feature components
├── lib/               # Utility functions and libraries
│   ├── ai-*.ts        # AI-related utilities
│   └── *.ts           # Other utilities
├── public/            # Static assets
├── scripts/           # Build and utility scripts
└── tests/             # Test files
```

## 🔐 Security

VRUX implements multiple security layers:

- **Input Validation**: All prompts are validated using Zod schemas
- **Code Sanitization**: Generated code is sanitized to remove dangerous patterns
- **Sandbox Execution**: Components are validated in isolated VM environments
- **CSP Headers**: Strict Content Security Policy headers
- **Rate Limiting**: API rate limiting to prevent abuse
- **Environment Protection**: API keys are never exposed to the client

## ⚡ Performance

- **Response Caching**: Common prompts are cached for 5 minutes
- **Request Queuing**: Manages concurrent generations efficiently
- **Performance Monitoring**: Tracks generation time and provides optimization tips
- **Code Optimization**: Automatic code minification and optimization

## 🧪 Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## 📊 API Endpoints

### Generate UI Component
```
POST /api/generate-ui
Content-Type: application/json

{
  "prompt": "Create a pricing card component",
  "variants": 3
}
```

### Generate UI Stream (SSE)
```
POST /api/generate-ui-stream
Content-Type: application/json

{
  "prompt": "Create a dashboard component",
  "variants": 3
}
```

### Health Check
```
GET /api/health
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Vercel for hosting and Next.js
- The open-source community for amazing tools and libraries

## 📞 Support

- 📧 Email: support@vrux.app
- 💬 Discord: [Join our community](https://discord.gg/vrux)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/vrux/issues)

---

<div align="center">
  Made with ❤️ by developers, for developers
</div>
# VRUX - AI-Powered React Component Generator

<div align="center">
  <h3>Build production-ready React components with AI in seconds</h3>
  <p>Generate beautiful, accessible UI components with multiple design variations using natural language.</p>
  
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
  [![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-4.0-06B6D4)](https://tailwindcss.com/)
</div>

## 🚀 Features

- **AI-Powered Generation**: Create React components using natural language descriptions
- **Multiple Design Variants**: Get 3 unique variations for every component
- **Live Preview**: See your components rendered in real-time
- **Production Ready**: Clean, accessible code with TypeScript and Tailwind CSS
- **Smart Fallbacks**: Multi-provider AI system ensures high availability
- **Performance Monitoring**: Built-in analytics and health tracking
- **Enterprise Security**: Rate limiting, input validation, and secure execution

## 🎥 Demo

Try it live at [vrux.dev](https://vrux.dev) (coming soon)

## 🛠️ Tech Stack

- **Framework**: Next.js 15.3.2 with Turbopack
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI
- **AI**: OpenAI GPT-4, Anthropic Claude (with fallback)
- **Animation**: Framer Motion
- **Code Preview**: React Live + Monaco Editor

## 📋 Prerequisites

- Node.js 18+ and npm
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

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

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Usage

1. Enter a natural language description of your component
2. Press `Generate` or `Cmd/Ctrl + Enter`
3. View the generated component with live preview
4. Switch between design variants
5. Copy the code or download as a file

### Example Prompts

- "Create a modern pricing card with gradient background"
- "Build a responsive navigation menu with mobile hamburger"
- "Design a chat interface with message bubbles"
- "Make a dashboard with charts and statistics"

## 🚀 Deployment

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/vrux)

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
vrux/
├── components/         # React components
├── lib/               # Utilities and core logic
├── pages/             # Next.js pages
├── public/            # Static assets
├── styles/            # Global styles
└── tests/             # Test files
```

## 🔒 Security

- Input validation with Zod schemas
- Sandboxed code execution
- Rate limiting per IP/user
- Domain restriction in production
- Comprehensive error tracking

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for GPT-4 API
- Vercel for hosting and Next.js
- The open-source community

---

<div align="center">
  Made with ❤️ by developers, for developers
</div>
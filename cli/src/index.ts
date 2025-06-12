#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import gradient from 'gradient-string';
import updateNotifier from 'update-notifier';
import { readFileSync } from 'fs';
import { join } from 'path';
import { AuthCommand } from './commands/auth';
import { GenerateCommand } from './commands/generate';
import { InitCommand } from './commands/init';
import { ConfigCommand } from './commands/config';
import { TemplatesCommand } from './commands/templates';
import { WatchCommand } from './commands/watch';
import { ServeCommand } from './commands/serve';
import { ShareCommand } from './commands/share';
import { config } from './utils/config';

// Read package.json
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

// Check for updates
updateNotifier({ pkg: packageJson }).notify();

// ASCII Art Banner
console.log(
  gradient.pastel.multiline(
    figlet.textSync('VRUX', {
      font: 'ANSI Shadow',
      horizontalLayout: 'fitted',
      verticalLayout: 'default'
    })
  )
);
console.log(chalk.gray('  AI-Powered React Component Generator\n'));

// Create CLI program
const program = new Command();

program
  .name('vrux')
  .description('Generate React components with AI from your terminal')
  .version(packageJson.version, '-v, --version', 'Display version number')
  .helpOption('-h, --help', 'Display help for command');

// Global options
program
  .option('-k, --api-key <key>', 'Set API key for this command')
  .option('-u, --api-url <url>', 'Set API URL for this command')
  .option('--no-color', 'Disable colored output')
  .option('--quiet', 'Suppress non-error output')
  .option('--debug', 'Enable debug logging');

// Generate command (default)
program
  .command('generate [prompt]')
  .alias('g')
  .description('Generate a React component from a prompt')
  .option('-o, --output <path>', 'Output file path', './component.tsx')
  .option('-m, --model <model>', 'AI model to use', 'gpt-4o')
  .option('-t, --typescript', 'Generate TypeScript component', true)
  .option('-s, --stream', 'Enable streaming output', true)
  .option('-p, --preview', 'Open preview in browser after generation')
  .option('-w, --watch', 'Watch for changes and regenerate')
  .option('--no-format', 'Skip code formatting')
  .option('--no-types', 'Exclude TypeScript types')
  .option('--tailwind', 'Use Tailwind CSS for styling', true)
  .option('--styled', 'Use styled-components instead of Tailwind')
  .option('--variants <count>', 'Number of variants to generate', '1')
  .action(async (prompt, options) => {
    const command = new GenerateCommand();
    await command.execute(prompt, options);
  });

// Initialize project
program
  .command('init')
  .description('Initialize VRUX in your project')
  .option('-f, --force', 'Overwrite existing configuration')
  .option('--skip-install', 'Skip dependency installation')
  .option('--template <name>', 'Use a specific template')
  .action(async (options) => {
    const command = new InitCommand();
    await command.execute(options);
  });

// Authentication
const auth = program
  .command('auth')
  .description('Manage authentication');

auth
  .command('login')
  .description('Login to VRUX')
  .option('--token <token>', 'Use API token instead of interactive login')
  .action(async (options) => {
    const command = new AuthCommand();
    await command.login(options);
  });

auth
  .command('logout')
  .description('Logout from VRUX')
  .action(async () => {
    const command = new AuthCommand();
    await command.logout();
  });

auth
  .command('status')
  .description('Check authentication status')
  .action(async () => {
    const command = new AuthCommand();
    await command.status();
  });

// Configuration
const configCmd = program
  .command('config')
  .description('Manage configuration');

configCmd
  .command('get [key]')
  .description('Get configuration value')
  .action(async (key) => {
    const command = new ConfigCommand();
    await command.get(key);
  });

configCmd
  .command('set <key> <value>')
  .description('Set configuration value')
  .action(async (key, value) => {
    const command = new ConfigCommand();
    await command.set(key, value);
  });

configCmd
  .command('list')
  .description('List all configuration')
  .action(async () => {
    const command = new ConfigCommand();
    await command.list();
  });

configCmd
  .command('reset')
  .description('Reset configuration to defaults')
  .action(async () => {
    const command = new ConfigCommand();
    await command.reset();
  });

// Templates
program
  .command('templates')
  .alias('t')
  .description('Browse and use component templates')
  .option('-c, --category <name>', 'Filter by category')
  .option('-s, --search <query>', 'Search templates')
  .option('--list', 'List all available templates')
  .action(async (options) => {
    const command = new TemplatesCommand();
    await command.execute(options);
  });

// Watch mode
program
  .command('watch [path]')
  .alias('w')
  .description('Watch files and regenerate on changes')
  .option('-p, --pattern <glob>', 'File pattern to watch', '**/*.{js,jsx,ts,tsx}')
  .option('--ignore <patterns>', 'Patterns to ignore', 'node_modules/**,dist/**')
  .option('--debounce <ms>', 'Debounce time in milliseconds', '1000')
  .action(async (path, options) => {
    const command = new WatchCommand();
    await command.execute(path || '.', options);
  });

// Development server
program
  .command('serve [path]')
  .alias('s')
  .description('Start a development server with hot reload')
  .option('-p, --port <port>', 'Port to serve on', '3000')
  .option('--host <host>', 'Host to bind to', 'localhost')
  .option('--open', 'Open browser automatically')
  .option('--https', 'Use HTTPS')
  .action(async (path, options) => {
    const command = new ServeCommand();
    await command.execute(path || '.', options);
  });

// Share component
program
  .command('share <file>')
  .description('Share a component publicly')
  .option('-n, --name <name>', 'Component name')
  .option('-d, --description <desc>', 'Component description')
  .option('--private', 'Make component private')
  .option('--tags <tags>', 'Comma-separated tags')
  .action(async (file, options) => {
    const command = new ShareCommand();
    await command.execute(file, options);
  });

// Interactive mode (default when no command)
program
  .action(async () => {
    const command = new GenerateCommand();
    await command.interactive();
  });

// Error handling
process.on('unhandledRejection', (error: Error) => {
  console.error(chalk.red('\n✖ Error:'), error.message);
  if (program.opts().debug) {
    console.error(error.stack);
  }
  process.exit(1);
});

// Parse arguments
program.parse(process.argv);

// Show help if no arguments
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
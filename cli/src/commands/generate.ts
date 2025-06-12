import { input, select, confirm, checkbox } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import open from 'open';
import { VruxClient } from '../utils/client';
import { config } from '../utils/config';
import { formatCode } from '../utils/formatter';
import { createPreviewServer } from '../utils/preview';

export class GenerateCommand {
  private client: VruxClient;

  constructor() {
    this.client = new VruxClient(
      config.get('apiUrl'),
      config.get('apiKey')
    );
  }

  async execute(prompt?: string, options: any = {}) {
    try {
      // Get prompt if not provided
      if (!prompt) {
        prompt = await input({
          message: 'Describe the component you want to generate:',
          validate: (value) => value.trim() ? true : 'Please enter a description'
        });
      }

      // Get or confirm options
      const finalOptions = await this.confirmOptions(options);

      // Start generation
      const spinner = ora({
        text: 'Generating component...',
        spinner: 'dots'
      }).start();

      let generatedCode = '';
      let progress = 0;

      try {
        // Generate component
        const result = await this.client.generate(prompt, {
          model: finalOptions.model,
          streaming: finalOptions.stream,
          onProgress: (percent) => {
            progress = percent;
            spinner.text = `Generating component... ${Math.round(percent)}%`;
          },
          onToken: (token) => {
            if (finalOptions.stream && !finalOptions.quiet) {
              process.stdout.write(token);
            }
          }
        });

        generatedCode = result.code;
        spinner.succeed(chalk.green('✓ Component generated successfully!'));

        // Show metrics
        if (!finalOptions.quiet && result.metrics) {
          console.log(chalk.gray(`
  Model: ${result.model}
  Provider: ${result.provider}
  Tokens: ${result.metrics.promptTokens + result.metrics.completionTokens}
  Time: ${(result.metrics.generationTime / 1000).toFixed(2)}s
`));
        }

        // Format code if needed
        if (!finalOptions.noFormat) {
          spinner.start('Formatting code...');
          generatedCode = await formatCode(generatedCode, {
            parser: finalOptions.typescript ? 'typescript' : 'babel',
            semi: true,
            singleQuote: true,
            tabWidth: 2
          });
          spinner.succeed('Code formatted');
        }

        // Save to file
        const outputPath = path.resolve(finalOptions.output);
        await fs.ensureDir(path.dirname(outputPath));
        await fs.writeFile(outputPath, generatedCode, 'utf-8');
        
        console.log(chalk.green(`\n✓ Component saved to: ${chalk.bold(outputPath)}`));

        // Open preview if requested
        if (finalOptions.preview) {
          spinner.start('Starting preview server...');
          const { url, close } = await createPreviewServer(generatedCode, {
            port: 3001,
            open: true
          });
          spinner.succeed(`Preview server running at ${chalk.blue(url)}`);
          
          // Wait for user to close
          await confirm({
            message: 'Press Enter to stop the preview server',
            default: true
          });
          
          await close();
        }

        // Watch mode
        if (finalOptions.watch) {
          console.log(chalk.yellow('\n👁  Watching for changes...'));
          await this.watchMode(outputPath, prompt, finalOptions);
        }

      } catch (error) {
        spinner.fail(chalk.red('Failed to generate component'));
        throw error;
      }

    } catch (error: any) {
      console.error(chalk.red('\n✖ Error:'), error.message);
      if (options.debug) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async interactive() {
    console.log(chalk.cyan('\n🚀 Welcome to VRUX Interactive Mode!\n'));

    const action = await select({
      message: 'What would you like to do?',
      choices: [
        { name: '✨ Generate a new component', value: 'generate' },
        { name: '📚 Browse templates', value: 'templates' },
        { name: '🔧 Configure settings', value: 'config' },
        { name: '📤 Share a component', value: 'share' },
        { name: '❌ Exit', value: 'exit' }
      ]
    });

    switch (action) {
      case 'generate':
        await this.execute();
        break;
      case 'templates':
        // Delegate to templates command
        const { TemplatesCommand } = await import('./templates');
        const templatesCmd = new TemplatesCommand();
        await templatesCmd.execute({ interactive: true });
        break;
      case 'config':
        // Delegate to config command
        const { ConfigCommand } = await import('./config');
        const configCmd = new ConfigCommand();
        await configCmd.interactive();
        break;
      case 'share':
        // Delegate to share command
        const file = await input({
          message: 'Enter the path to the component file:',
          validate: (value) => fs.existsSync(value) ? true : 'File not found'
        });
        const { ShareCommand } = await import('./share');
        const shareCmd = new ShareCommand();
        await shareCmd.execute(file, {});
        break;
      case 'exit':
        console.log(chalk.gray('\nGoodbye! 👋\n'));
        process.exit(0);
    }
  }

  private async confirmOptions(options: any) {
    const defaults = {
      output: './component.tsx',
      model: 'gpt-4o',
      typescript: true,
      stream: true,
      preview: false,
      watch: false,
      noFormat: false,
      noTypes: false,
      tailwind: true,
      styled: false,
      variants: 1,
      quiet: false
    };

    // Merge with provided options
    const finalOptions = { ...defaults, ...options };

    // Interactive mode - confirm important options
    if (!options.quiet && process.stdin.isTTY) {
      const features = await checkbox({
        message: 'Select features:',
        choices: [
          { name: 'TypeScript', value: 'typescript', checked: finalOptions.typescript },
          { name: 'Tailwind CSS', value: 'tailwind', checked: finalOptions.tailwind },
          { name: 'Streaming output', value: 'stream', checked: finalOptions.stream },
          { name: 'Preview in browser', value: 'preview', checked: finalOptions.preview },
          { name: 'Watch mode', value: 'watch', checked: finalOptions.watch }
        ]
      });

      // Update options based on selections
      finalOptions.typescript = features.includes('typescript');
      finalOptions.tailwind = features.includes('tailwind');
      finalOptions.stream = features.includes('stream');
      finalOptions.preview = features.includes('preview');
      finalOptions.watch = features.includes('watch');

      // Model selection
      const model = await select({
        message: 'Select AI model:',
        choices: [
          { name: 'GPT-4 Omni (Recommended)', value: 'gpt-4o' },
          { name: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
          { name: 'GPT-3.5 Turbo (Fast)', value: 'gpt-3.5-turbo' },
          { name: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022' },
          { name: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro' }
        ],
        default: finalOptions.model
      });
      finalOptions.model = model;
    }

    return finalOptions;
  }

  private async watchMode(filePath: string, prompt: string, options: any) {
    const chokidar = await import('chokidar');
    
    const watcher = chokidar.watch(filePath, {
      persistent: true,
      ignoreInitial: true
    });

    let regenerating = false;

    watcher.on('change', async () => {
      if (regenerating) return;
      regenerating = true;

      console.log(chalk.yellow('\n🔄 File changed, regenerating...'));
      
      try {
        // Read current content
        const currentContent = await fs.readFile(filePath, 'utf-8');
        
        // Extract user modifications
        const modifiedPrompt = `${prompt}\n\nUpdate the component based on these changes:\n${currentContent}`;
        
        // Regenerate
        await this.execute(modifiedPrompt, { ...options, watch: false });
      } catch (error) {
        console.error(chalk.red('Regeneration failed:'), error);
      } finally {
        regenerating = false;
      }
    });

    // Keep process alive
    process.on('SIGINT', () => {
      watcher.close();
      process.exit(0);
    });
  }
}
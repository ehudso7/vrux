import * as vscode from 'vscode';
import { VruxClient } from './vruxClient';
import { ComponentExplorerProvider } from './providers/componentExplorer';
import { HistoryProvider } from './providers/historyProvider';
import { MarketplaceProvider } from './providers/marketplaceProvider';
import { PreviewPanel } from './panels/previewPanel';
import { ComponentGenerator } from './generators/componentGenerator';

let vruxClient: VruxClient;
let previewPanel: PreviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('VRUX extension is now active!');

    // Initialize VRUX client
    const config = vscode.workspace.getConfiguration('vrux');
    vruxClient = new VruxClient(
        config.get('apiUrl') || 'https://vrux.dev',
        config.get('apiKey') || ''
    );

    // Initialize providers
    const componentExplorer = new ComponentExplorerProvider(context, vruxClient);
    const historyProvider = new HistoryProvider(context, vruxClient);
    const marketplaceProvider = new MarketplaceProvider(vruxClient);

    // Register tree data providers
    vscode.window.registerTreeDataProvider('vrux.componentExplorer', componentExplorer);
    vscode.window.registerTreeDataProvider('vrux.history', historyProvider);
    vscode.window.registerTreeDataProvider('vrux.marketplace', marketplaceProvider);

    // Command: Generate Component
    const generateCommand = vscode.commands.registerCommand('vrux.generateComponent', async () => {
        const prompt = await vscode.window.showInputBox({
            prompt: 'Describe the component you want to generate',
            placeHolder: 'e.g., A modern login form with email and password fields',
            ignoreFocusOut: true
        });

        if (!prompt) return;

        // Show progress
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: 'Generating component...',
            cancellable: true
        }, async (progress, token) => {
            try {
                const generator = new ComponentGenerator(vruxClient, context);
                const result = await generator.generate(prompt, {
                    model: config.get('defaultModel') || 'gpt-4o',
                    streaming: config.get('streamingEnabled') !== false,
                    onProgress: (percent) => {
                        progress.report({ increment: percent });
                    }
                });

                if (result) {
                    // Create new file with generated component
                    const fileName = await vscode.window.showInputBox({
                        prompt: 'Component file name',
                        value: 'NewComponent.tsx',
                        validateInput: (value) => {
                            if (!value.match(/^[a-zA-Z][a-zA-Z0-9]*\.(tsx|jsx)$/)) {
                                return 'Invalid file name. Use PascalCase with .tsx or .jsx extension';
                            }
                            return null;
                        }
                    });

                    if (fileName) {
                        await createComponentFile(fileName, result.code);
                        
                        // Show preview if enabled
                        if (config.get('autoPreview')) {
                            showPreview(result.code);
                        }

                        // Update history
                        historyProvider.addToHistory({
                            prompt,
                            code: result.code,
                            model: result.model,
                            timestamp: new Date()
                        });

                        vscode.window.showInformationMessage(`Component generated successfully!`);
                    }
                }
            } catch (error: any) {
                vscode.window.showErrorMessage(`Failed to generate component: ${error.message}`);
            }
        });
    });

    // Command: Generate from Selection
    const generateFromSelectionCommand = vscode.commands.registerCommand('vrux.generateFromSelection', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const selection = editor.document.getText(editor.selection);
        if (!selection) {
            vscode.window.showWarningMessage('Please select some code first');
            return;
        }

        const action = await vscode.window.showQuickPick([
            { label: '$(sparkle) Enhance Component', value: 'enhance' },
            { label: '$(sync) Convert to TypeScript', value: 'typescript' },
            { label: '$(paintcan) Add Tailwind Styling', value: 'styling' },
            { label: '$(zap) Add Interactivity', value: 'interactive' },
            { label: '$(accessibility) Improve Accessibility', value: 'a11y' }
        ], {
            placeHolder: 'What would you like to do with the selected code?'
        });

        if (!action) return;

        const generator = new ComponentGenerator(vruxClient, context);
        const result = await generator.enhance(selection, action.value);

        if (result) {
            editor.edit(editBuilder => {
                editBuilder.replace(editor.selection, result.code);
            });
        }
    });

    // Command: Show History
    const showHistoryCommand = vscode.commands.registerCommand('vrux.showHistory', async () => {
        const history = historyProvider.getHistory();
        const selected = await vscode.window.showQuickPick(
            history.map(item => ({
                label: item.prompt,
                description: new Date(item.timestamp).toLocaleString(),
                detail: `Model: ${item.model}`,
                item
            })),
            {
                placeHolder: 'Select a component from history'
            }
        );

        if (selected) {
            const action = await vscode.window.showQuickPick([
                { label: '$(file) Create New File', value: 'create' },
                { label: '$(eye) Preview', value: 'preview' },
                { label: '$(copy) Copy to Clipboard', value: 'copy' }
            ]);

            if (action) {
                switch (action.value) {
                    case 'create':
                        await createComponentFile('Component.tsx', selected.item.code);
                        break;
                    case 'preview':
                        showPreview(selected.item.code);
                        break;
                    case 'copy':
                        await vscode.env.clipboard.writeText(selected.item.code);
                        vscode.window.showInformationMessage('Component copied to clipboard');
                        break;
                }
            }
        }
    });

    // Command: Open in Browser
    const openInBrowserCommand = vscode.commands.registerCommand('vrux.openInBrowser', () => {
        vscode.env.openExternal(vscode.Uri.parse('https://vrux.dev'));
    });

    // Command: Select Model
    const selectModelCommand = vscode.commands.registerCommand('vrux.selectModel', async () => {
        const models = [
            { label: 'GPT-4 Omni', value: 'gpt-4o', description: 'Latest and fastest' },
            { label: 'GPT-4 Turbo', value: 'gpt-4-turbo', description: 'High quality' },
            { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo', description: 'Fast and efficient' },
            { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet-20241022', description: 'Best practices' },
            { label: 'Claude 3 Opus', value: 'claude-3-opus-20240229', description: 'Highest quality' },
            { label: 'Gemini 1.5 Pro', value: 'gemini-1.5-pro', description: 'Large context' },
            { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash', description: 'Very fast' }
        ];

        const selected = await vscode.window.showQuickPick(models, {
            placeHolder: 'Select default AI model'
        });

        if (selected) {
            await vscode.workspace.getConfiguration('vrux').update('defaultModel', selected.value, true);
            vscode.window.showInformationMessage(`Default model set to ${selected.label}`);
        }
    });

    // Register commands
    context.subscriptions.push(
        generateCommand,
        generateFromSelectionCommand,
        showHistoryCommand,
        openInBrowserCommand,
        selectModelCommand
    );

    // Status bar item
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'vrux.generateComponent';
    statusBarItem.text = '$(sparkle) VRUX';
    statusBarItem.tooltip = 'Generate AI Component';
    statusBarItem.show();
    context.subscriptions.push(statusBarItem);

    // Configuration change listener
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('vrux')) {
                const config = vscode.workspace.getConfiguration('vrux');
                vruxClient.updateConfig(
                    config.get('apiUrl') || 'https://vrux.dev',
                    config.get('apiKey') || ''
                );
            }
        })
    );
}

async function createComponentFile(fileName: string, code: string) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage('No workspace folder open');
        return;
    }

    const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, 'components', fileName);
    
    try {
        await vscode.workspace.fs.writeFile(uri, Buffer.from(code, 'utf8'));
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc);
    } catch (error: any) {
        vscode.window.showErrorMessage(`Failed to create file: ${error.message}`);
    }
}

function showPreview(code: string) {
    if (!previewPanel) {
        previewPanel = new PreviewPanel();
    }
    previewPanel.show(code);
}

export function deactivate() {
    if (previewPanel) {
        previewPanel.dispose();
    }
}
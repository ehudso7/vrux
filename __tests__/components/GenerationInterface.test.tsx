import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GenerationInterface } from '../../components/GenerationInterface';
import { useAuth } from '../../lib/auth-context';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('../../lib/auth-context');
jest.mock('react-hot-toast');
jest.mock('@monaco-editor/react', () => ({
  __esModule: true,
  default: ({ value, onChange }: any) => (
    <textarea
      data-testid="monaco-editor"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

// Mock fetch
global.fetch = jest.fn();

const mockUser = { id: '1', email: 'test@example.com', name: 'Test User' };

describe('GenerationInterface', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
    });
    (fetch as jest.Mock).mockClear();
  });

  it('renders the generation interface correctly', () => {
    render(<GenerationInterface />);
    
    expect(screen.getByPlaceholderText(/describe the ui component/i)).toBeInTheDocument();
    expect(screen.getByText(/generate ui/i)).toBeInTheDocument();
    expect(screen.getByText(/preview/i)).toBeInTheDocument();
    expect(screen.getByText(/code/i)).toBeInTheDocument();
  });

  it('handles prompt input', async () => {
    const user = userEvent.setup();
    render(<GenerationInterface />);
    
    const promptInput = screen.getByPlaceholderText(/describe the ui component/i);
    await user.type(promptInput, 'Create a button component');
    
    expect(promptInput).toHaveValue('Create a button component');
  });

  it('generates UI component successfully', async () => {
    const user = userEvent.setup();
    const mockGeneratedCode = `
      export default function Button() {
        return <button className="px-4 py-2 bg-blue-500 text-white rounded">Click me</button>;
      }
    `;
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: mockGeneratedCode,
        componentName: 'Button',
        dependencies: [],
      }),
    });

    render(<GenerationInterface />);
    
    const promptInput = screen.getByPlaceholderText(/describe the ui component/i);
    const generateButton = screen.getByText(/generate ui/i);
    
    await user.type(promptInput, 'Create a button component');
    await user.click(generateButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/generate-ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Create a button component',
          framework: 'react',
          styling: 'tailwind',
          typescript: true,
        }),
      });
    });

    await waitFor(() => {
      const codeEditor = screen.getByTestId('monaco-editor');
      expect(codeEditor).toHaveValue(mockGeneratedCode);
    });
  });

  it('handles generation error', async () => {
    const user = userEvent.setup();
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Generation failed' }),
    });

    render(<GenerationInterface />);
    
    const promptInput = screen.getByPlaceholderText(/describe the ui component/i);
    const generateButton = screen.getByText(/generate ui/i);
    
    await user.type(promptInput, 'Create a button component');
    await user.click(generateButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Generation failed');
    });
  });

  it('switches between preview and code tabs', async () => {
    const user = userEvent.setup();
    render(<GenerationInterface />);
    
    const codeTab = screen.getByText(/code/i);
    const previewTab = screen.getByText(/preview/i);
    
    // Initially on preview tab
    expect(screen.getByText(/your generated component will appear here/i)).toBeInTheDocument();
    
    // Switch to code tab
    await user.click(codeTab);
    expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    
    // Switch back to preview
    await user.click(previewTab);
    expect(screen.getByText(/your generated component will appear here/i)).toBeInTheDocument();
  });

  it('exports generated code', async () => {
    const user = userEvent.setup();
    const mockGeneratedCode = `export default function Button() { return <button>Click me</button>; }`;
    
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        code: mockGeneratedCode,
        componentName: 'Button',
        dependencies: [],
      }),
    });

    render(<GenerationInterface />);
    
    // Generate component first
    const promptInput = screen.getByPlaceholderText(/describe the ui component/i);
    const generateButton = screen.getByText(/generate ui/i);
    
    await user.type(promptInput, 'Create a button');
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toHaveValue(mockGeneratedCode);
    });

    // Export code
    const exportButton = screen.getByText(/export/i);
    await user.click(exportButton);

    expect(toast.success).toHaveBeenCalledWith('Code copied to clipboard!');
  });

  it('handles template selection', async () => {
    const user = userEvent.setup();
    render(<GenerationInterface />);
    
    const templateButton = screen.getByText(/templates/i);
    await user.click(templateButton);
    
    // Should show template modal
    expect(screen.getByText(/choose a template/i)).toBeInTheDocument();
  });

  it('validates user authentication for premium features', async () => {
    const user = userEvent.setup();
    (useAuth as jest.Mock).mockReturnValue({
      user: null, // No user logged in
    });

    render(<GenerationInterface />);
    
    const generateButton = screen.getByText(/generate ui/i);
    await user.click(generateButton);

    expect(toast.error).toHaveBeenCalledWith('Please sign in to generate components');
  });
});
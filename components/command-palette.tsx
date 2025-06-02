import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search,
  FileCode,
  History,
  Download,
  Copy,
  RefreshCw,
  Settings,
  Sparkles,
  Archive,
  Share2,
  Command as CommandIcon,
  X
} from 'lucide-react';
import { useStore } from '../lib/store';
import toast from 'react-hot-toast';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAction?: (action: string) => void;
}

export default function CommandPalette({ open, onOpenChange, onAction }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const { 
    savedComponents,
    currentVariants,
    undo,
    redo,
    canUndo,
    canRedo,
    toggleShowCode
  } = useStore();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }

      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleAction = (action: string) => {
    onAction?.(action);
    onOpenChange(false);
    
    switch (action) {
      case 'copy-code':
        if (currentVariants.length > 0) {
          navigator.clipboard.writeText(currentVariants[0].code);
          toast.success('Code copied to clipboard!');
        }
        break;
      case 'toggle-code':
        toggleShowCode();
        break;
      case 'undo':
        if (canUndo()) undo();
        break;
      case 'redo':
        if (canRedo()) redo();
        break;
      case 'new-component':
        window.location.reload();
        break;
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Command Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-50"
          >
            <Command className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
              {/* Header */}
              <div className="flex items-center border-b border-gray-200 px-4">
                <Search className="w-5 h-5 text-gray-400 mr-3" />
                <Command.Input
                  value={search}
                  onValueChange={setSearch}
                  placeholder="Type a command or search..."
                  className="flex-1 py-4 bg-transparent outline-none text-gray-800 placeholder-gray-400"
                />
                <button
                  onClick={() => onOpenChange(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Command List */}
              <Command.List className="max-h-[400px] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-gray-500">
                  No results found.
                </Command.Empty>

                {/* Quick Actions */}
                <Command.Group heading="Quick Actions" className="p-2">
                  <CommandItem
                    onSelect={() => handleAction('new-component')}
                    icon={<Sparkles className="w-4 h-4" />}
                    title="New Component"
                    description="Start fresh with a new prompt"
                    shortcut="⌘N"
                  />
                  <CommandItem
                    onSelect={() => handleAction('copy-code')}
                    icon={<Copy className="w-4 h-4" />}
                    title="Copy Code"
                    description="Copy current component to clipboard"
                    shortcut="⌘C"
                  />
                  <CommandItem
                    onSelect={() => handleAction('toggle-code')}
                    icon={<FileCode className="w-4 h-4" />}
                    title="Toggle Code View"
                    description="Show or hide the code editor"
                    shortcut="⌘/"
                  />
                  <CommandItem
                    onSelect={() => handleAction('download')}
                    icon={<Download className="w-4 h-4" />}
                    title="Download Component"
                    description="Save component as JSX file"
                    shortcut="⌘S"
                  />
                </Command.Group>

                {/* History */}
                <Command.Group heading="History" className="p-2">
                  <CommandItem
                    onSelect={() => handleAction('undo')}
                    disabled={!canUndo()}
                    icon={<RefreshCw className="w-4 h-4 rotate-180" />}
                    title="Undo"
                    description="Revert to previous version"
                    shortcut="⌘Z"
                  />
                  <CommandItem
                    onSelect={() => handleAction('redo')}
                    disabled={!canRedo()}
                    icon={<RefreshCw className="w-4 h-4" />}
                    title="Redo"
                    description="Restore next version"
                    shortcut="⌘⇧Z"
                  />
                  <CommandItem
                    onSelect={() => handleAction('view-history')}
                    icon={<History className="w-4 h-4" />}
                    title="View History"
                    description="See all component versions"
                  />
                </Command.Group>

                {/* Saved Components */}
                {savedComponents.length > 0 && (
                  <Command.Group heading="Saved Components" className="p-2">
                    {savedComponents.slice(0, 5).map((component) => (
                      <CommandItem
                        key={component.id}
                        onSelect={() => handleAction(`load-${component.id}`)}
                        icon={<Archive className="w-4 h-4" />}
                        title={component.prompt.slice(0, 50) + '...'}
                        description={new Date(component.timestamp).toLocaleDateString()}
                      />
                    ))}
                  </Command.Group>
                )}

                {/* Settings */}
                <Command.Group heading="Settings" className="p-2">
                  <CommandItem
                    onSelect={() => handleAction('preferences')}
                    icon={<Settings className="w-4 h-4" />}
                    title="Preferences"
                    description="Configure app settings"
                    shortcut="⌘,"
                  />
                  <CommandItem
                    onSelect={() => handleAction('share')}
                    icon={<Share2 className="w-4 h-4" />}
                    title="Share Component"
                    description="Get a shareable link"
                  />
                </Command.Group>
              </Command.List>

              {/* Footer */}
              <div className="border-t border-gray-200 px-4 py-2 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <CommandIcon className="w-3 h-3" />
                    <span>+</span>
                    <span>K</span>
                  </div>
                  <span>to open</span>
                </div>
                <div className="flex items-center space-x-4">
                  <span>↑↓ to navigate</span>
                  <span>↵ to select</span>
                  <span>esc to close</span>
                </div>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface CommandItemProps {
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  description: string;
  shortcut?: string;
  disabled?: boolean;
}

function CommandItem({ onSelect, icon, title, description, shortcut, disabled }: CommandItemProps) {
  return (
    <Command.Item
      onSelect={onSelect}
      disabled={disabled}
      className={`
        flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'hover:bg-gray-100 data-[selected]:bg-gray-100'
        }
      `}
    >
      <div className="flex items-center space-x-3">
        <div className="text-gray-600">{icon}</div>
        <div>
          <div className="font-medium text-gray-900">{title}</div>
          <div className="text-sm text-gray-500">{description}</div>
        </div>
      </div>
      {shortcut && (
        <kbd className="px-2 py-1 text-xs bg-gray-100 border border-gray-300 rounded">
          {shortcut}
        </kbd>
      )}
    </Command.Item>
  );
}
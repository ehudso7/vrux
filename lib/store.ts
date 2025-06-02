import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GeneratedComponent {
  id: string;
  prompt: string;
  code: string;
  timestamp: Date;
  variant?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  components?: GeneratedComponent[];
}

interface ComponentHistory {
  past: GeneratedComponent[];
  present: GeneratedComponent | null;
  future: GeneratedComponent[];
}

interface AppState {
  // Chat state
  messages: ChatMessage[];
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  
  // Component generation state
  isGenerating: boolean;
  setIsGenerating: (value: boolean) => void;
  streamingContent: string;
  setStreamingContent: (content: string) => void;
  
  // Current components (multi-variant)
  currentVariants: GeneratedComponent[];
  selectedVariant: number;
  setCurrentVariants: (variants: GeneratedComponent[]) => void;
  selectVariant: (index: number) => void;
  
  // History management
  history: ComponentHistory;
  pushToHistory: (component: GeneratedComponent) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Project management
  savedComponents: GeneratedComponent[];
  saveComponent: (component: GeneratedComponent) => void;
  deleteComponent: (id: string) => void;
  
  // UI state
  showCode: boolean;
  toggleShowCode: () => void;
  selectedTab: 'preview' | 'code' | 'history';
  setSelectedTab: (tab: 'preview' | 'code' | 'history') => void;
  devicePreview: 'desktop' | 'tablet' | 'mobile';
  setDevicePreview: (device: 'desktop' | 'tablet' | 'mobile') => void;
  
  // Command palette
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Chat state
      messages: [],
      addMessage: (message) => set((state) => ({
        messages: [...state.messages, {
          ...message,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date()
        }]
      })),
      updateMessage: (id, updates) => set((state) => ({
        messages: state.messages.map(msg => 
          msg.id === id ? { ...msg, ...updates } : msg
        )
      })),
      
      // Component generation state
      isGenerating: false,
      setIsGenerating: (value) => set({ isGenerating: value }),
      streamingContent: '',
      setStreamingContent: (content) => set({ streamingContent: content }),
      
      // Current components
      currentVariants: [],
      selectedVariant: 0,
      setCurrentVariants: (variants) => set({ 
        currentVariants: variants,
        selectedVariant: 0 
      }),
      selectVariant: (index) => set({ selectedVariant: index }),
      
      // History management
      history: { past: [], present: null, future: [] },
      pushToHistory: (component) => set((state) => ({
        history: {
          past: state.history.present 
            ? [...state.history.past, state.history.present]
            : state.history.past,
          present: component,
          future: []
        }
      })),
      undo: () => set((state) => {
        if (state.history.past.length === 0) return state;
        const previous = state.history.past[state.history.past.length - 1];
        return {
          history: {
            past: state.history.past.slice(0, -1),
            present: previous,
            future: state.history.present 
              ? [state.history.present, ...state.history.future]
              : state.history.future
          }
        };
      }),
      redo: () => set((state) => {
        if (state.history.future.length === 0) return state;
        const next = state.history.future[0];
        return {
          history: {
            past: state.history.present
              ? [...state.history.past, state.history.present]
              : state.history.past,
            present: next,
            future: state.history.future.slice(1)
          }
        };
      }),
      canUndo: () => get().history.past.length > 0,
      canRedo: () => get().history.future.length > 0,
      
      // Project management
      savedComponents: [],
      saveComponent: (component) => set((state) => ({
        savedComponents: [...state.savedComponents, component]
      })),
      deleteComponent: (id) => set((state) => ({
        savedComponents: state.savedComponents.filter(c => c.id !== id)
      })),
      
      // UI state
      showCode: false,
      toggleShowCode: () => set((state) => ({ showCode: !state.showCode })),
      selectedTab: 'preview',
      setSelectedTab: (tab) => set({ selectedTab: tab }),
      devicePreview: 'desktop',
      setDevicePreview: (device) => set({ devicePreview: device }),
      
      // Command palette
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open })
    }),
    {
      name: 'vrux-storage',
      partialize: (state) => ({
        savedComponents: state.savedComponents,
        messages: state.messages
      })
    }
  )
);
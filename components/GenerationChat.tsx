import { useState } from 'react';
import { Send } from 'lucide-react';
import type { ChatMessage } from '../lib/store';

interface GenerationChatProps {
  messages: ChatMessage[];
  onGenerate: (prompt: string) => void;
  isGenerating: boolean;
}

export default function GenerationChat({ messages, onGenerate, isGenerating }: GenerationChatProps) {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isGenerating) {
      onGenerate(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : message.role === 'system'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              {message.components && message.components.length > 0 && (
                <div className="mt-2 p-2 bg-gray-900 text-green-400 rounded text-xs font-mono">
                  <pre className="whitespace-pre-wrap">{message.components[0].code}</pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input Form */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the component you want to generate..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isGenerating}
          />
          <button
            type="submit"
            disabled={!input.trim() || isGenerating}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}
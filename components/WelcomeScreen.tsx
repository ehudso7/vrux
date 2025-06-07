import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface WelcomeScreenProps {
  onSelectTemplate: (prompt: string) => void;
}

const templates = [
  { id: 'dashboard', icon: '📊', title: 'Dashboard with charts', category: 'Analytics' },
  { id: 'gallery', icon: '🛍️', title: 'Product gallery', category: 'E-commerce' },
  { id: 'pricing', icon: '💳', title: 'Pricing cards', category: 'Marketing' },
  { id: 'hero', icon: '🎯', title: 'Hero section', category: 'Landing' },
  { id: 'form', icon: '📝', title: 'Multi-step form', category: 'Forms' },
  { id: 'chat', icon: '💬', title: 'Chat interface', category: 'Communication' },
  { id: 'kanban', icon: '📋', title: 'Kanban board', category: 'Productivity' },
  { id: 'picker', icon: '🎨', title: 'Color picker', category: 'Tools' }
];

export default function WelcomeScreen({ onSelectTemplate }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              What would you like to build today?
            </h1>
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Describe your component and let AI do the heavy lifting
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {templates.map((template, index) => (
            <motion.button
              key={template.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onSelectTemplate(template.title)}
              className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
            >
              <div className="text-4xl mb-2">{template.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                {template.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {template.category}
              </p>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

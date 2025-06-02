import { motion } from 'framer-motion';
import { Clock, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useStore } from '../lib/store';
import { formatDistanceToNow } from 'date-fns';

export default function HistoryTimeline() {
  const { history, undo, redo, canUndo, canRedo } = useStore();
  const allItems = [...history.past, ...(history.present ? [history.present] : []), ...history.future];
  const currentIndex = history.past.length;

  if (allItems.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <Clock className="w-5 h-5 text-gray-600" />
          <span>Version History</span>
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={undo}
            disabled={!canUndo()}
            className={`
              p-2 rounded-lg transition-all
              ${canUndo() 
                ? 'hover:bg-gray-100 text-gray-700' 
                : 'opacity-50 cursor-not-allowed text-gray-400'
              }
            `}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo()}
            className={`
              p-2 rounded-lg transition-all
              ${canRedo() 
                ? 'hover:bg-gray-100 text-gray-700' 
                : 'opacity-50 cursor-not-allowed text-gray-400'
              }
            `}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative">
        {/* Timeline Line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Timeline Items */}
        <div className="space-y-4">
          {allItems.map((item, index) => {
            const isCurrent = index === currentIndex;
            const isPast = index < currentIndex;
            const isFuture = index > currentIndex;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`
                  relative pl-10 
                  ${isCurrent ? 'opacity-100' : 'opacity-60'}
                `}
              >
                {/* Timeline Dot */}
                <div
                  className={`
                    absolute left-2 top-2 w-4 h-4 rounded-full border-2
                    ${isCurrent 
                      ? 'bg-purple-500 border-purple-500 ring-4 ring-purple-100' 
                      : isPast
                        ? 'bg-white border-gray-300'
                        : 'bg-gray-100 border-gray-300 border-dashed'
                    }
                  `}
                />

                {/* Content */}
                <button
                  onClick={() => {
                    if (isPast) {
                      // Go back to this version
                      for (let i = 0; i < currentIndex - index; i++) {
                        undo();
                      }
                    } else if (isFuture) {
                      // Go forward to this version
                      for (let i = 0; i < index - currentIndex; i++) {
                        redo();
                      }
                    }
                  }}
                  disabled={isCurrent}
                  className={`
                    w-full text-left p-4 rounded-xl border transition-all
                    ${isCurrent 
                      ? 'bg-purple-50 border-purple-200 cursor-default' 
                      : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm cursor-pointer'
                    }
                  `}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">
                        {item.prompt}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                  </div>
                </button>

                {/* Future indicator */}
                {isFuture && (
                  <div className="absolute top-0 right-0 -mr-2 -mt-2">
                    <RotateCcw className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
        <span>{history.past.length} past versions</span>
        <span>{history.future.length} future versions</span>
      </div>
    </div>
  );
}
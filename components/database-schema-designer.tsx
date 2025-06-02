import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Key,
  Hash,
  Type,
  Calendar,
  ToggleLeft,
  Braces,
  Sparkles
} from 'lucide-react';
import { Button } from './ui/button';
import { 
  TableDefinition, 
  generateCreateTableSQL, 
  generateTableTypes,
  generateCRUDOperations,
  generateDataHook,
  parseSchemaFromPrompt
} from '../lib/supabase-generator';
import toast from 'react-hot-toast';

interface DatabaseSchemaDesignerProps {
  onSchemaGenerated: (tables: TableDefinition[], code: string) => void;
  darkMode?: boolean;
}

const columnTypes = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'integer', label: 'Number', icon: Hash },
  { value: 'boolean', label: 'Boolean', icon: ToggleLeft },
  { value: 'timestamp', label: 'Date/Time', icon: Calendar },
  { value: 'uuid', label: 'UUID', icon: Key },
  { value: 'json', label: 'JSON', icon: Braces },
  { value: 'float', label: 'Decimal', icon: Hash },
];

export default function DatabaseSchemaDesigner({ 
  onSchemaGenerated, 
  darkMode = false 
}: DatabaseSchemaDesignerProps) {
  const [tables, setTables] = useState<TableDefinition[]>([]);
  const [editingTable, setEditingTable] = useState<number | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const addTable = () => {
    const newTable: TableDefinition = {
      name: `table_${tables.length + 1}`,
      columns: [
        { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'uuid_generate_v4()' },
        { name: 'created_at', type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
      ],
    };
    setTables([...tables, newTable]);
    setEditingTable(tables.length);
  };

  const updateTable = (index: number, updated: TableDefinition) => {
    const newTables = [...tables];
    newTables[index] = updated;
    setTables(newTables);
  };

  const deleteTable = (index: number) => {
    setTables(tables.filter((_, i) => i !== index));
    if (editingTable === index) setEditingTable(null);
  };

  const addColumn = (tableIndex: number) => {
    const table = tables[tableIndex];
    const newColumn = {
      name: `column_${table.columns.length + 1}`,
      type: 'text' as const,
      nullable: true,
    };
    updateTable(tableIndex, {
      ...table,
      columns: [...table.columns, newColumn],
    });
  };

  const generateFromAI = async () => {
    if (!aiPrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const generatedTables = parseSchemaFromPrompt(aiPrompt);
      setTables(generatedTables);
      toast.success(`Generated ${generatedTables.length} table(s) from your description!`);
    } catch {
      toast.error('Failed to generate schema');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateCode = () => {
    if (tables.length === 0) {
      toast.error('Please add at least one table');
      return;
    }

    let fullCode = `// Supabase Database Schema and Operations\n\n`;
    
    // SQL Schema
    fullCode += `// 1. SQL Schema\n`;
    fullCode += `// Run these commands in Supabase SQL editor:\n\n`;
    tables.forEach(table => {
      fullCode += `${generateCreateTableSQL(table)}\n\n`;
    });

    // TypeScript Types
    fullCode += `\n// 2. TypeScript Types\n`;
    fullCode += `// Save as: types/database.ts\n\n`;
    tables.forEach(table => {
      fullCode += `${generateTableTypes(table)}\n\n`;
    });

    // CRUD Operations
    fullCode += `\n// 3. Database Operations\n`;
    tables.forEach(table => {
      fullCode += `\n// Save as: lib/db/${table.name}.ts\n`;
      fullCode += `${generateCRUDOperations(table)}\n`;
    });

    // React Hooks
    fullCode += `\n// 4. React Hooks\n`;
    tables.forEach(table => {
      fullCode += `\n// Save as: hooks/use-${table.name}.ts\n`;
      fullCode += `${generateDataHook(table)}\n`;
    });

    onSchemaGenerated(tables, fullCode);
    toast.success('Database schema and code generated!');
  };

  return (
    <div className={`space-y-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* AI Generator */}
      <div className={`rounded-xl p-6 ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      } border`}>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Generate Schema with AI
        </h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generateFromAI()}
            placeholder="Describe your database needs (e.g., 'blog with users and posts')"
            className={`flex-1 px-4 py-2 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            } focus:ring-2 focus:ring-purple-500 focus:border-transparent`}
          />
          <Button
            onClick={generateFromAI}
            disabled={isGenerating || !aiPrompt.trim()}
            className="gradient-primary text-white"
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </Button>
        </div>
      </div>

      {/* Tables */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Tables
          </h3>
          <Button onClick={addTable} size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Table
          </Button>
        </div>

        <AnimatePresence>
          {tables.map((table, tableIndex) => (
            <motion.div
              key={tableIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`rounded-lg border ${
                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              } overflow-hidden`}
            >
              {/* Table Header */}
              <div className={`px-4 py-3 flex items-center justify-between ${
                darkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                {editingTable === tableIndex ? (
                  <input
                    type="text"
                    value={table.name}
                    onChange={(e) => updateTable(tableIndex, { ...table, name: e.target.value })}
                    className={`px-2 py-1 rounded border ${
                      darkMode 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'bg-white border-gray-300'
                    }`}
                    autoFocus
                  />
                ) : (
                  <h4 className="font-medium">{table.name}</h4>
                )}
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingTable(editingTable === tableIndex ? null : tableIndex)}
                    className={`p-1.5 rounded hover:bg-gray-600 ${
                      darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}
                  >
                    {editingTable === tableIndex ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteTable(tableIndex)}
                    className="p-1.5 rounded hover:bg-red-100 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Columns */}
              <div className="p-4 space-y-2">
                {table.columns.map((column, colIndex) => (
                  <div key={colIndex} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={column.name}
                      onChange={(e) => {
                        const newColumns = [...table.columns];
                        newColumns[colIndex] = { ...column, name: e.target.value };
                        updateTable(tableIndex, { ...table, columns: newColumns });
                      }}
                      className={`flex-1 px-3 py-1.5 rounded border text-sm ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                      placeholder="Column name"
                    />
                    
                    <select
                      value={column.type}
                      onChange={(e) => {
                        const newColumns = [...table.columns];
                        newColumns[colIndex] = { 
                          ...column, 
                          type: e.target.value as 'text' | 'integer' | 'boolean' | 'timestamp' | 'uuid' | 'json' | 'float' 
                        };
                        updateTable(tableIndex, { ...table, columns: newColumns });
                      }}
                      className={`px-3 py-1.5 rounded border text-sm ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    >
                      {columnTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const newColumns = [...table.columns];
                          newColumns[colIndex] = { 
                            ...column, 
                            primaryKey: !column.primaryKey 
                          };
                          updateTable(tableIndex, { ...table, columns: newColumns });
                        }}
                        className={`p-1.5 rounded ${
                          column.primaryKey 
                            ? 'bg-purple-100 text-purple-600' 
                            : darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}
                        title="Primary Key"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => {
                          const newColumns = table.columns.filter((_, i) => i !== colIndex);
                          updateTable(tableIndex, { ...table, columns: newColumns });
                        }}
                        className="p-1.5 rounded hover:bg-red-100 text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={() => addColumn(tableIndex)}
                  className={`w-full py-2 rounded border-2 border-dashed ${
                    darkMode 
                      ? 'border-gray-600 hover:border-gray-500 text-gray-400' 
                      : 'border-gray-300 hover:border-gray-400 text-gray-600'
                  } flex items-center justify-center gap-2 transition-colors`}
                >
                  <Plus className="w-4 h-4" />
                  Add Column
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {tables.length === 0 && (
          <div className={`text-center py-12 rounded-lg border-2 border-dashed ${
            darkMode ? 'border-gray-700 text-gray-400' : 'border-gray-300 text-gray-500'
          }`}>
            <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No tables yet. Add a table or use AI to generate a schema.</p>
          </div>
        )}
      </div>

      {/* Generate Button */}
      {tables.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={generateCode}
            size="lg"
            className="gradient-primary text-white"
          >
            Generate Supabase Code
          </Button>
        </div>
      )}
    </div>
  );
}
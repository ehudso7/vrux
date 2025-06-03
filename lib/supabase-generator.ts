import { z } from 'zod';

// Schema for database table definition
export const tableSchema = z.object({
  name: z.string(),
  columns: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'integer', 'boolean', 'timestamp', 'uuid', 'json', 'float']),
    primaryKey: z.boolean().optional(),
    unique: z.boolean().optional(),
    nullable: z.boolean().optional(),
    defaultValue: z.string().optional(),
    references: z.object({
      table: z.string(),
      column: z.string(),
    }).optional(),
  })),
  relationships: z.array(z.object({
    type: z.enum(['one-to-many', 'many-to-one', 'many-to-many']),
    relatedTable: z.string(),
    foreignKey: z.string().optional(),
    junctionTable: z.string().optional(),
  })).optional(),
});

export type TableDefinition = z.infer<typeof tableSchema>;

// Generate Supabase client setup code
export function generateSupabaseClient(): string {
  return `import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Type definitions will be generated based on your schema
export type Database = {
  public: {
    Tables: {
      // Table types will be inserted here
    }
  }
}`;
}

// Generate SQL for creating tables
export function generateCreateTableSQL(table: TableDefinition): string {
  const columns = table.columns.map(col => {
    let sql = `  ${col.name} ${col.type.toUpperCase()}`;
    
    if (col.primaryKey) sql += ' PRIMARY KEY';
    if (col.unique) sql += ' UNIQUE';
    if (!col.nullable) sql += ' NOT NULL';
    if (col.defaultValue) sql += ` DEFAULT ${col.defaultValue}`;
    if (col.references) {
      sql += ` REFERENCES ${col.references.table}(${col.references.column})`;
    }
    
    return sql;
  }).join(',\n');
  
  return `CREATE TABLE IF NOT EXISTS ${table.name} (\n${columns}\n);`;
}

// Generate TypeScript types for a table
export function generateTableTypes(table: TableDefinition): string {
  const typeMap: Record<string, string> = {
    text: 'string',
    integer: 'number',
    boolean: 'boolean',
    timestamp: 'string',
    uuid: 'string',
    json: 'any',
    float: 'number',
  };
  
  const fields = table.columns.map(col => {
    const tsType = typeMap[col.type] || 'any';
    const nullable = col.nullable ? ' | null' : '';
    return `  ${col.name}: ${tsType}${nullable}`;
  }).join('\n');
  
  return `export interface ${table.name} {\n${fields}\n}`;
}

// Generate CRUD operations for a table
export function generateCRUDOperations(table: TableDefinition): string {
  const tableName = table.name;
  const typeName = tableName.charAt(0).toUpperCase() + tableName.slice(1);
  
  return `import { supabase } from './supabase-client'
import type { ${typeName} } from './types'

// Create
export async function create${typeName}(data: Omit<${typeName}, 'id' | 'created_at'>) {
  const { data: result, error } = await supabase
    .from('${tableName}')
    .insert(data)
    .select()
    .single()
  
  if (error) throw error
  return result
}

// Read (single)
export async function get${typeName}(id: string) {
  const { data, error } = await supabase
    .from('${tableName}')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) throw error
  return data
}

// Read (list)
export async function list${typeName}s(filters?: Partial<${typeName}>) {
  let query = supabase.from('${tableName}').select('*')
  
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value)
      }
    })
  }
  
  const { data, error } = await query
  if (error) throw error
  return data
}

// Update
export async function update${typeName}(id: string, updates: Partial<${typeName}>) {
  const { data, error } = await supabase
    .from('${tableName}')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}

// Delete
export async function delete${typeName}(id: string) {
  const { error } = await supabase
    .from('${tableName}')
    .delete()
    .eq('id', id)
  
  if (error) throw error
}

// Real-time subscription
export function subscribe${typeName}s(callback: (payload: any) => void) {
  return supabase
    .channel('${tableName}_changes')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: '${tableName}'
    }, callback)
    .subscribe()
}`;
}

// Generate React hook for data fetching
export function generateDataHook(table: TableDefinition): string {
  const tableName = table.name;
  const typeName = tableName.charAt(0).toUpperCase() + tableName.slice(1);
  
  return `import { useEffect, useState } from 'react'
import { supabase } from './supabase-client'
import type { ${typeName} } from './types'

export function use${typeName}s() {
  const [data, setData] = useState<${typeName}[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetchData()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('${tableName}_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: '${tableName}'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setData(prev => [...prev, payload.new as ${typeName}])
        } else if (payload.eventType === 'UPDATE') {
          setData(prev => prev.map(item => 
            item.id === payload.new.id ? payload.new as ${typeName} : item
          ))
        } else if (payload.eventType === 'DELETE') {
          setData(prev => prev.filter(item => item.id !== payload.old.id))
        }
      })
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: result, error } = await supabase
        .from('${tableName}')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setData(result || [])
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, error, refetch: fetchData }
}`;
}

// Parse natural language to database schema
export function parseSchemaFromPrompt(prompt: string): TableDefinition[] {
  const tables: TableDefinition[] = [];
  
  // Common patterns for detecting tables and fields
  const tablePatterns = [
    /(?:table|entity|model) (?:for |called |named )?(\w+)/gi,
    /(\w+) (?:table|entity|model)/gi,
    /create (?:a |an )?(\w+)/gi,
  ];
  
  // Extract potential table names
  const tableNames = new Set<string>();
  tablePatterns.forEach(pattern => {
    const matches = prompt.matchAll(pattern);
    for (const match of Array.from(matches)) {
      tableNames.add(match[1].toLowerCase());
    }
  });
  
  // Common field patterns
  // const fieldPatterns = [
  //   /with (?:fields?|columns?|properties|props?):?\s*([^.]+)/gi,
  //   /(?:include|add|have) (?:fields?|columns?|properties|props?) (?:for |like |such as )?([^.]+)/gi,
  // ];
  
  // If specific tables are mentioned, use them
  if (tableNames.size > 0) {
    tableNames.forEach(name => {
      tables.push(createDefaultTable(name));
    });
  } else {
    // Otherwise, create default tables based on common patterns
    if (prompt.toLowerCase().includes('user') || prompt.toLowerCase().includes('auth')) {
      tables.push(createUserTable());
    }
    
    if (prompt.toLowerCase().includes('blog') || prompt.toLowerCase().includes('post')) {
      tables.push(createPostTable());
    }
    
    if (prompt.toLowerCase().includes('product') || prompt.toLowerCase().includes('ecommerce')) {
      tables.push(createProductTable());
    }
    
    if (prompt.toLowerCase().includes('todo') || prompt.toLowerCase().includes('task')) {
      tables.push(createTodoTable());
    }
  }
  
  // If no specific patterns found, create a generic table
  if (tables.length === 0) {
    tables.push(createDefaultTable('items'));
  }
  
  return tables;
}

// Helper functions to create common table schemas
function createDefaultTable(name: string): TableDefinition {
  return {
    name,
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'uuid_generate_v4()' },
      { name: 'created_at', type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
      { name: 'name', type: 'text', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'status', type: 'text', defaultValue: "'active'" },
    ],
  };
}

function createUserTable(): TableDefinition {
  return {
    name: 'users',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'uuid_generate_v4()' },
      { name: 'email', type: 'text', unique: true, nullable: false },
      { name: 'full_name', type: 'text', nullable: true },
      { name: 'avatar_url', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    ],
  };
}

function createPostTable(): TableDefinition {
  return {
    name: 'posts',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'uuid_generate_v4()' },
      { name: 'title', type: 'text', nullable: false },
      { name: 'content', type: 'text', nullable: false },
      { name: 'slug', type: 'text', unique: true, nullable: false },
      { name: 'author_id', type: 'uuid', nullable: false, references: { table: 'users', column: 'id' } },
      { name: 'published', type: 'boolean', defaultValue: 'false' },
      { name: 'created_at', type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    ],
  };
}

function createProductTable(): TableDefinition {
  return {
    name: 'products',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'uuid_generate_v4()' },
      { name: 'name', type: 'text', nullable: false },
      { name: 'description', type: 'text', nullable: true },
      { name: 'price', type: 'float', nullable: false },
      { name: 'stock', type: 'integer', defaultValue: '0' },
      { name: 'category', type: 'text', nullable: true },
      { name: 'image_url', type: 'text', nullable: true },
      { name: 'created_at', type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    ],
  };
}

function createTodoTable(): TableDefinition {
  return {
    name: 'todos',
    columns: [
      { name: 'id', type: 'uuid', primaryKey: true, defaultValue: 'uuid_generate_v4()' },
      { name: 'title', type: 'text', nullable: false },
      { name: 'completed', type: 'boolean', defaultValue: 'false' },
      { name: 'user_id', type: 'uuid', nullable: false, references: { table: 'users', column: 'id' } },
      { name: 'created_at', type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
      { name: 'updated_at', type: 'timestamp', defaultValue: 'CURRENT_TIMESTAMP' },
    ],
  };
}
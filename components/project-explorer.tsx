import React, { useState, useCallback } from 'react';
import { 
  ChevronRight, 
  ChevronDown, 
  File, 
  Folder, 
  Plus, 
  Trash2, 
  Edit2,
  FileCode,
  FileText,
  FileJson,
  Settings,
  Package
} from 'lucide-react';
import { FileTreeNode, ProjectFile } from '@/lib/project-manager';
import { cn } from '@/lib/utils';

interface ProjectExplorerProps {
  fileTree: FileTreeNode;
  selectedFile?: string;
  onFileSelect: (file: ProjectFile) => void;
  onFileCreate: (path: string, type: 'file' | 'directory') => void;
  onFileDelete: (path: string) => void;
  onFileRename: (oldPath: string, newPath: string) => void;
  files: ProjectFile[];
}

export function ProjectExplorer({
  fileTree,
  selectedFile,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  files
}: ProjectExplorerProps) {
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/']));
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [creatingIn, setCreatingIn] = useState<string | null>(null);
  const [createType, setCreateType] = useState<'file' | 'directory'>('file');
  const [createName, setCreateName] = useState('');

  const toggleDir = useCallback((path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const getFileIcon = (node: FileTreeNode) => {
    if (node.type === 'directory') {
      return expandedDirs.has(node.path) ? ChevronDown : ChevronRight;
    }

    const ext = node.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
        return FileCode;
      case 'json':
        return FileJson;
      case 'md':
        return FileText;
      case 'config':
        return Settings;
      default:
        if (node.name === 'package.json') return Package;
        return File;
    }
  };

  const handleRename = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && renamingPath && newName) {
      const dir = renamingPath.substring(0, renamingPath.lastIndexOf('/'));
      const newPath = dir ? `${dir}/${newName}` : newName;
      onFileRename(renamingPath, newPath);
      setRenamingPath(null);
      setNewName('');
    } else if (e.key === 'Escape') {
      setRenamingPath(null);
      setNewName('');
    }
  };

  const handleCreate = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && creatingIn && createName) {
      const newPath = creatingIn === '/' ? createName : `${creatingIn}/${createName}`;
      onFileCreate(newPath, createType);
      setCreatingIn(null);
      setCreateName('');
    } else if (e.key === 'Escape') {
      setCreatingIn(null);
      setCreateName('');
    }
  };

  const renderNode = (node: FileTreeNode, level: number = 0) => {
    const Icon = getFileIcon(node);
    const isSelected = selectedFile === node.path;
    const isExpanded = expandedDirs.has(node.path);
    const isRenaming = renamingPath === node.path;

    const file = files.find(f => f.path === node.path);

    return (
      <div key={node.path}>
        <div
          className={cn(
            'group flex items-center gap-1 px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-sm',
            isSelected && 'bg-blue-100 dark:bg-blue-900/20'
          )}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => {
            if (node.type === 'directory') {
              toggleDir(node.path);
            } else if (file) {
              onFileSelect(file);
            }
          }}
        >
          {node.type === 'directory' ? (
            <Icon className="w-4 h-4 text-gray-500" />
          ) : (
            <Icon className="w-4 h-4 text-gray-600" />
          )}
          
          {isRenaming ? (
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={handleRename}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 px-1 py-0 text-sm border rounded"
              autoFocus
            />
          ) : (
            <>
              <span className="flex-1">{node.name}</span>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                {node.type === 'directory' && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCreatingIn(node.path);
                        setCreateType('file');
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      title="New file"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCreatingIn(node.path);
                        setCreateType('directory');
                      }}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                      title="New folder"
                    >
                      <Folder className="w-3 h-3" />
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingPath(node.path);
                    setNewName(node.name);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                  title="Rename"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileDelete(node.path);
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-red-500"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </>
          )}
        </div>

        {node.type === 'directory' && isExpanded && creatingIn === node.path && (
          <div
            className="flex items-center gap-1 px-2 py-1"
            style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
          >
            {createType === 'directory' ? (
              <Folder className="w-4 h-4 text-gray-500" />
            ) : (
              <File className="w-4 h-4 text-gray-600" />
            )}
            <input
              type="text"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={handleCreate}
              placeholder={createType === 'directory' ? 'folder name' : 'file name'}
              className="flex-1 px-1 py-0 text-sm border rounded"
              autoFocus
            />
          </div>
        )}

        {node.type === 'directory' && isExpanded && node.children?.map(child => 
          renderNode(child, level + 1)
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900 border-r overflow-y-auto">
      <div className="p-2 border-b flex items-center justify-between">
        <h3 className="text-sm font-semibold">Project Explorer</h3>
        <div className="flex gap-1">
          <button
            onClick={() => {
              setCreatingIn('/');
              setCreateType('file');
            }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="New file"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setCreatingIn('/');
              setCreateType('directory');
            }}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
            title="New folder"
          >
            <Folder className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="py-1">
        {fileTree.children?.map(child => renderNode(child))}
      </div>
    </div>
  );
}
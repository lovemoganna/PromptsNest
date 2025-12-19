import React, { useState } from 'react';
import { X, Trash2, FolderInput, Download, FileJson, FileText, FileSpreadsheet, Check } from 'lucide-react';
import { Collection } from '../types';

interface BatchActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDelete: () => void;
  onMoveToCollection: (collectionId: string) => void;
  onExport: (format: 'json' | 'md' | 'csv') => void;
  onBatchTag: (tag: string) => void;
  collections: Collection[];
}

const BatchActionBar: React.FC<BatchActionBarProps> = ({
  selectedCount,
  onClearSelection,
  onDelete,
  onMoveToCollection,
  onExport,
  onBatchTag,
  collections
}) => {
  const [showMoveMenu, setShowMoveMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [newTag, setNewTag] = useState('');

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="bg-slate-900 text-white shadow-xl shadow-slate-900/20 rounded-xl p-2 pl-4 pr-2 flex items-center gap-4 border border-slate-700/50 backdrop-blur-md ring-1 ring-white/10">

        <div className="flex items-center gap-3 border-r border-slate-700 pr-4">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
              {selectedCount}
            </span>
            <span className="text-sm font-medium text-slate-200">已选择</span>
          </div>
          <button
            onClick={onClearSelection}
            className="text-slate-400 hover:text-white transition-colors"
            title="取消选择"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {/* Move to Collection */}
          <div className="relative">
            <button
              onClick={() => { setShowMoveMenu(!showMoveMenu); setShowExportMenu(false); }}
              className={`p-2 rounded-lg hover:bg-slate-800 transition-colors flex flex-col items-center gap-1 min-w-[60px] ${showMoveMenu ? 'bg-slate-800 text-blue-400' : 'text-slate-300'}`}
            >
              <FolderInput size={18} />
              <span className="text-[10px] font-medium">移动</span>
            </button>

            {showMoveMenu && (
              <div className="absolute bottom-full left-0 mb-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1">
                <div className="px-3 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700 mb-1">
                  移动到集合...
                </div>
                <div className="max-h-48 overflow-y-auto">
                  <button
                    onClick={() => { onMoveToCollection(''); setShowMoveMenu(false); }}
                    className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <span className="opacity-50">🚫</span> 移出集合
                  </button>
                  {collections.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { onMoveToCollection(c.id); setShowMoveMenu(false); }}
                      className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 truncate"
                    >
                      📁 {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => { setShowExportMenu(!showExportMenu); setShowMoveMenu(false); }}
              className={`p-2 rounded-lg hover:bg-slate-800 transition-colors flex flex-col items-center gap-1 min-w-[60px] ${showExportMenu ? 'bg-slate-800 text-green-400' : 'text-slate-300'}`}
            >
              <Download size={18} />
              <span className="text-[10px] font-medium">导出</span>
            </button>

            {showExportMenu && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden py-1">
                <button onClick={() => { onExport('json'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                  <FileJson size={14} className="text-yellow-500" /> JSON
                </button>
                <button onClick={() => { onExport('md'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                  <FileText size={14} className="text-blue-500" /> Markdown
                </button>
                <button onClick={() => { onExport('csv'); setShowExportMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                  <FileSpreadsheet size={14} className="text-green-500" /> CSV
                </button>
              </div>
            )}
          </div>

          {/* Batch Tagging */}
          <div className="relative">
            <button
              onClick={() => { setShowTagMenu(!showTagMenu); setShowMoveMenu(false); setShowExportMenu(false); }}
              className={`p-2 rounded-lg hover:bg-slate-800 transition-colors flex flex-col items-center gap-1 min-w-[60px] ${showTagMenu ? 'bg-slate-800 text-purple-400' : 'text-slate-300'}`}
            >
              <Check size={18} />
              <span className="text-[10px] font-medium">标签</span>
            </button>

            {showTagMenu && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden p-3 animate-in fade-in slide-in-from-bottom-2">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">添加批量标签</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="标签名称..."
                    className="flex-1 text-xs px-2 py-1.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-purple-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newTag.trim()) {
                        onBatchTag(newTag.trim());
                        setNewTag('');
                        setShowTagMenu(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => {
                      if (newTag.trim()) {
                        onBatchTag(newTag.trim());
                        setNewTag('');
                        setShowTagMenu(false);
                      }
                    }}
                    className="bg-purple-600 text-white p-1 rounded hover:bg-purple-700 transition-colors"
                  >
                    <Check size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-8 bg-slate-700 mx-1"></div>

          {/* Delete */}
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-900/30 text-red-400 hover:text-red-300 transition-colors flex flex-col items-center gap-1 min-w-[60px]"
          >
            <Trash2 size={18} />
            <span className="text-[10px] font-medium">删除</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default BatchActionBar;
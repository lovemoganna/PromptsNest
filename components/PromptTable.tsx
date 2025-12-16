import React from 'react';
import { PromptEntry } from '../types';
import { Edit2, Trash2, ExternalLink, Copy, Check, Square, CheckSquare } from 'lucide-react';
import TagBadge from './TagBadge';

interface PromptTableProps {
  prompts: PromptEntry[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
  selectedIds?: Set<string>;
  onSelect?: (id: string) => void;
}

const PromptTable: React.FC<PromptTableProps> = ({ 
  prompts, onEdit, onDelete, onTagClick, 
  selectedIds, onSelect 
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            <tr>
              {onSelect && <th className="px-4 py-3 w-10"></th>}
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">标题与类型</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 w-1/3 min-w-[300px]">提示词 (英/中)</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">场景与标签</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">数据</th>
              <th className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-300 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {prompts.map((prompt) => (
              <tr 
                key={prompt.id} 
                className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group ${selectedIds?.has(prompt.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
              >
                {/* Checkbox */}
                {onSelect && (
                    <td className="px-4 py-3 align-top">
                        <button 
                            onClick={() => onSelect(prompt.id)}
                            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors pt-1"
                        >
                            {selectedIds?.has(prompt.id) ? (
                                <CheckSquare size={16} className="text-blue-600 dark:text-blue-400" />
                            ) : (
                                <Square size={16} />
                            )}
                        </button>
                    </td>
                )}

                {/* Title & Type */}
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2" title={prompt.title}>{prompt.title}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 w-fit">
                      {prompt.outputType}
                    </span>
                    {prompt.collectionId && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                         📁 集合
                      </span>
                    )}
                  </div>
                </td>

                {/* Prompts */}
                <td className="px-4 py-3 align-top">
                   <div className="flex flex-col gap-2">
                      <div className="relative group/p">
                        <p className="text-xs text-slate-600 dark:text-slate-300 font-mono line-clamp-2" title={prompt.promptEn}>{prompt.promptEn}</p>
                        <button 
                          onClick={() => handleCopy(prompt.promptEn, `en-${prompt.id}`)}
                          className="absolute right-0 top-0 opacity-0 group-hover/p:opacity-100 bg-white/90 dark:bg-slate-800/90 p-1 rounded border border-slate-200 dark:border-slate-700 shadow-sm text-slate-400 hover:text-blue-600 dark:hover:text-blue-400"
                        >
                          {copiedId === `en-${prompt.id}` ? <Check size={10} className="text-green-500" /> : <Copy size={10} />}
                        </button>
                      </div>
                      {prompt.promptCn && (
                        <p className="text-xs text-slate-400 line-clamp-1">{prompt.promptCn}</p>
                      )}
                   </div>
                </td>

                {/* Tags */}
                <td className="px-4 py-3 align-top">
                  <div className="flex flex-col gap-2">
                     <div className="flex items-center gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">场景:</span>
                        <TagBadge label={prompt.sceneTag} type="scene" onClick={() => onTagClick(prompt.sceneTag)} />
                     </div>
                     <div className="flex flex-wrap gap-1">
                       {prompt.techTags.slice(0, 2).map(t => <TagBadge key={t} label={t} type="tech" onClick={() => onTagClick(t)}/>)}
                       {prompt.styleTags.slice(0, 2).map(t => <TagBadge key={t} label={t} type="style" onClick={() => onTagClick(t)}/>)}
                       {(prompt.techTags.length + prompt.styleTags.length) > 4 && (
                         <span className="text-[10px] text-slate-400 px-1">+{prompt.techTags.length + prompt.styleTags.length - 4} 更多</span>
                       )}
                     </div>
                  </div>
                </td>

                {/* Stats / Metadata */}
                <td className="px-4 py-3 align-top whitespace-nowrap">
                   <div className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
                      {prompt.rating && (
                        <div className="flex gap-2">
                           <span title="稳定性">🎯 {prompt.rating.stability}</span>
                           <span title="创造力">⚡ {prompt.rating.creativity}</span>
                        </div>
                      )}
                      {prompt.model && <span>🤖 {prompt.model}</span>}
                   </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-3 align-top text-right">
                   <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {prompt.previewUrl && (
                        <a href={prompt.previewUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded">
                          <ExternalLink size={14} />
                        </a>
                      )}
                      <button onClick={() => onEdit(prompt.id)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => onDelete(prompt.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded">
                        <Trash2 size={14} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
            {prompts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500 dark:text-slate-400">
                  未找到匹配的提示词。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PromptTable;
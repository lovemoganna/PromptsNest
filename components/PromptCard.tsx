import React, { useState } from 'react';
import { PromptEntry, OutputType } from '../types';
import { Copy, ExternalLink, Edit2, Trash2, Check, Zap, Target, Play, RotateCcw, Eye, Square, CheckSquare } from 'lucide-react';
import TagBadge from './TagBadge';
import CopyMenu from './CopyMenu';

interface PromptCardProps {
  prompt: PromptEntry;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onTagClick: (tag: string) => void;
  onCopy?: (id: string) => void;
  isZenMode?: boolean;
  selected?: boolean;
  onSelect?: (id: string) => void;
  selectionMode?: boolean;
}

const PromptCard: React.FC<PromptCardProps> = ({
  prompt, onEdit, onDelete, onTagClick, onCopy,
  isZenMode = false,
  selected = false,
  onSelect,
  selectionMode = false
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPlayground, setShowPlayground] = useState(false);
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getOutputColor = (type: OutputType) => {
    switch (type) {
      case OutputType.IMAGE: return 'bg-emerald-500';
      case OutputType.VIDEO: return 'bg-indigo-500';
      case OutputType.AUDIO: return 'bg-orange-500';
      case OutputType.TEXT: return 'bg-slate-500';
      default: return 'bg-gray-500';
    }
  };

  const renderRating = () => {
    if (!prompt.rating) return null;
    return (
      <div className="flex gap-3 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded border border-slate-100 dark:border-slate-700 mt-2">
        <div className="flex items-center gap-1" title="稳定性">
          <Target size={10} className="text-blue-500" />
          <span className="font-medium">{prompt.rating.stability}/10</span>
        </div>
        <div className="flex items-center gap-1" title="创造力">
          <Zap size={10} className="text-amber-500" />
          <span className="font-medium">{prompt.rating.creativity}/10</span>
        </div>
      </div>
    );
  };

  // Helper to inject variables
  const getCompiledPrompt = () => {
    let text = prompt.promptEn;
    if (!prompt.variables) return text;
    prompt.variables.forEach(v => {
      const val = variableValues[v.key] || v.defaultValue || `[${v.key}]`;
      text = text.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), val);
    });
    return text;
  };

  const hasVariables = prompt.variables && prompt.variables.length > 0;

  const handleCardClick = (e: React.MouseEvent) => {
    if (isZenMode) {
      onEdit(prompt.id);
      return;
    }
    if (selectionMode && onSelect) {
      onSelect(prompt.id);
    }
  };

  return (
    <div
      className={`group relative bg-white dark:bg-slate-900 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border overflow-hidden flex flex-col h-full 
        ${selected ? 'border-blue-500 ring-1 ring-blue-500 dark:border-blue-400' : 'border-slate-100 dark:border-slate-800'}
        ${isZenMode ? 'hover:scale-[1.02] cursor-pointer' : ''}
      `}
      onClick={handleCardClick}
    >
      {/* Header Image/Preview Area */}
      <div className={`relative bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 ${isZenMode ? 'h-56' : 'h-40'}`}>
        {prompt.previewUrl ? (
          <img
            src={prompt.previewUrl}
            alt={prompt.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            暂无预览
          </div>
        )}
        <div className={`absolute top-3 left-3 px-2 py-1 rounded text-white text-xs font-bold ${getOutputColor(prompt.outputType)} shadow-sm z-10`}>
          {prompt.outputType}
        </div>

        {/* Selection Checkbox */}
        {!isZenMode && onSelect && (
          <div
            className={`absolute top-3 left-3 z-20 ${selected || selectionMode ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
            onClick={(e) => { e.stopPropagation(); onSelect(prompt.id); }}
          >
            {selected ? (
              <div className="bg-blue-600 text-white rounded-md p-1 shadow-sm">
                <CheckSquare size={16} />
              </div>
            ) : (
              <div className="bg-white/80 dark:bg-slate-800/80 text-slate-500 hover:text-blue-600 rounded-md p-1 backdrop-blur-sm cursor-pointer shadow-sm">
                <Square size={16} />
              </div>
            )}
          </div>
        )}

        {/* Actions overlay - Hidden in Zen Mode */}
        {!isZenMode && (
          <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(prompt.id); }}
              className="p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-full hover:bg-blue-50 dark:hover:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm backdrop-blur-sm border border-transparent dark:border-slate-700"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(prompt.id); }}
              className="p-1.5 bg-white/90 dark:bg-slate-800/90 rounded-full hover:bg-red-50 dark:hover:bg-slate-700 text-red-600 dark:text-red-400 shadow-sm backdrop-blur-sm border border-transparent dark:border-slate-700"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}

        {isZenMode && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-black/50 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm flex items-center gap-2">
              <Eye size={12} /> 查看
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="mb-3">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg line-clamp-1 flex-1" title={prompt.title}>{prompt.title}</h3>
            {!isZenMode && hasVariables && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowPlayground(!showPlayground); }}
                className={`ml-2 p-1 rounded-md transition-colors ${showPlayground ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                title="切换变量测试"
              >
                {showPlayground ? <RotateCcw size={14} /> : <Play size={14} />}
              </button>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="font-medium text-slate-600 dark:text-slate-300">{prompt.sceneTag}</span>
              {prompt.model && <span>• {prompt.model}</span>}
            </div>
          </div>
          {renderRating()}
        </div>

        {/* Prompts Section */}
        <div className="space-y-3 mb-4 flex-1">
          {/* Variable Inputs (Playground) - Hidden in Zen Mode */}
          {showPlayground && hasVariables && !isZenMode && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50 mb-2 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200" onClick={e => e.stopPropagation()}>
              <div className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide mb-1">变量</div>
              {prompt.variables!.map(v => (
                <div key={v.key} className="flex flex-col">
                  <label className="text-[10px] font-medium text-blue-600 dark:text-blue-400 mb-0.5">{v.label || v.key}</label>
                  <input
                    type="text"
                    placeholder={v.defaultValue || '值...'}
                    value={variableValues[v.key] || ''}
                    onChange={(e) => setVariableValues(prev => ({ ...prev, [v.key]: e.target.value }))}
                    className="text-xs px-2 py-1.5 border border-blue-200 dark:border-blue-800 rounded focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 dark:text-slate-200"
                  />
                </div>
              ))}
            </div>
          )}

          <div className={`bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 relative group/prompt ${showPlayground ? 'ring-2 ring-blue-500 ring-offset-1 dark:ring-offset-slate-900' : ''}`}>
            <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-4 font-mono text-xs break-words">
              {showPlayground ? (
                // Render compiled string
                getCompiledPrompt()
              ) : (
                // Render raw template with highlighted variables
                prompt.promptEn.split(/(\{\{.*?\}\})/).map((part, i) =>
                  part.startsWith('{{') ? <span key={i} className="text-blue-600 dark:text-blue-400 font-semibold">{part}</span> : part
                )
              )}
            </p>
            <button
              onClick={(e) => { e.stopPropagation(); handleCopy(showPlayground ? getCompiledPrompt() : prompt.promptEn, 'en'); }}
              className="absolute top-2 right-2 p-1 text-slate-400 hover:text-blue-500 opacity-0 group-hover/prompt:opacity-100 transition-opacity"
              title={showPlayground ? "复制结果" : "复制模版"}
            >
              {copiedField === 'en' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>

          {prompt.promptCn && !showPlayground && (
            <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700 relative group/promptcn">
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 text-xs">{prompt.promptCn}</p>
              <button
                onClick={(e) => { e.stopPropagation(); handleCopy(prompt.promptCn, 'cn'); }}
                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-blue-500 opacity-0 group-hover/promptcn:opacity-100 transition-opacity"
                title="复制中文"
              >
                {copiedField === 'cn' ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>

        {/* Tags Footer */}
        <div className="mt-auto pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex flex-wrap gap-1 max-h-12 overflow-hidden flex-1">
              {prompt.techTags.slice(0, 3).map(t => <TagBadge key={t} label={t} type="tech" onClick={isZenMode ? undefined : (e) => { e?.stopPropagation(); onTagClick(t); }} />)}
              {prompt.styleTags.slice(0, 2).map(t => <TagBadge key={t} label={t} type="style" onClick={isZenMode ? undefined : (e) => { e?.stopPropagation(); onTagClick(t); }} />)}
            </div>
            {!isZenMode && (
              <div onClick={e => e.stopPropagation()}>
                <CopyMenu prompt={prompt} compact onCopied={() => onCopy?.(prompt.id)} />
              </div>
            )}
          </div>
        </div>

        {prompt.source && !isZenMode && (
          <div className="mt-2 text-xs text-slate-400 flex items-center justify-end truncate">
            <ExternalLink size={10} className="mr-1" />
            <span className="truncate max-w-[150px]">{prompt.source}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptCard;
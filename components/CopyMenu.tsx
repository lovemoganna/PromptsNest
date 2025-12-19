import React, { useState, useRef, useEffect } from 'react';
import { Copy, ChevronDown, FileText, Languages, Braces, Check } from 'lucide-react';
import { PromptEntry, PromptVariable } from '../types';

interface CopyMenuProps {
    prompt: PromptEntry;
    onCopied?: () => void;
    compact?: boolean;
}

type CopyFormat = 'en' | 'cn' | 'both' | 'markdown' | 'json';

const CopyMenu: React.FC<CopyMenuProps> = ({ prompt, onCopied, compact = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [justCopied, setJustCopied] = useState<CopyFormat | null>(null);
    const [showVariableModal, setShowVariableModal] = useState(false);
    const [variableValues, setVariableValues] = useState<Record<string, string>>({});
    const menuRef = useRef<HTMLDivElement>(null);

    // Initialize variable values
    useEffect(() => {
        if (prompt.variables && prompt.variables.length > 0) {
            const defaults: Record<string, string> = {};
            prompt.variables.forEach(v => {
                defaults[v.key] = v.defaultValue || '';
            });
            setVariableValues(defaults);
        }
    }, [prompt.variables]);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const replaceVariables = (text: string): string => {
        if (!prompt.variables || prompt.variables.length === 0) return text;

        let result = text;
        prompt.variables.forEach(v => {
            const value = variableValues[v.key] || v.defaultValue || `{{${v.key}}}`;
            result = result.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), value);
        });
        return result;
    };

    const copyToClipboard = async (format: CopyFormat, withVariables: boolean = false) => {
        let content = '';
        const en = withVariables ? replaceVariables(prompt.promptEn) : prompt.promptEn;
        const cn = withVariables ? replaceVariables(prompt.promptCn) : prompt.promptCn;

        switch (format) {
            case 'en':
                content = en;
                break;
            case 'cn':
                content = cn || en;
                break;
            case 'both':
                content = `${en}\n\n---\n\n${cn}`;
                break;
            case 'markdown':
                content = `# ${prompt.title}\n\n## English\n\`\`\`\n${en}\n\`\`\`\n\n## 中文\n\`\`\`\n${cn}\n\`\`\`\n\n> **Tags**: ${[...prompt.techTags, ...prompt.styleTags].join(', ')}`;
                break;
            case 'json':
                content = JSON.stringify({
                    title: prompt.title,
                    promptEn: en,
                    promptCn: cn,
                    tags: [...prompt.techTags, ...prompt.styleTags],
                    model: prompt.model
                }, null, 2);
                break;
        }

        try {
            await navigator.clipboard.writeText(content);
            setJustCopied(format);
            setTimeout(() => setJustCopied(null), 1500);
            setIsOpen(false);
            onCopied?.();
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const hasVariables = prompt.variables && prompt.variables.length > 0;

    const menuItems: { format: CopyFormat; label: string; icon: React.ReactNode }[] = [
        { format: 'en', label: '复制英文', icon: <FileText size={14} /> },
        { format: 'cn', label: '复制中文', icon: <Languages size={14} /> },
        { format: 'both', label: '复制双语', icon: <FileText size={14} /> },
        { format: 'markdown', label: 'Markdown 格式', icon: <FileText size={14} /> },
        { format: 'json', label: 'JSON 格式', icon: <Braces size={14} /> },
    ];

    return (
        <div className="relative" ref={menuRef}>
            <div className="flex">
                {/* Main copy button (copies English by default) */}
                <button
                    onClick={() => copyToClipboard('en')}
                    className={`flex items-center gap-1 ${compact
                        ? 'p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-l-lg'
                        : 'px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-l-lg text-sm font-medium'
                        } transition-colors`}
                    title="复制英文提示词"
                >
                    {justCopied === 'en' ? <Check size={compact ? 14 : 16} /> : <Copy size={compact ? 14 : 16} />}
                    {!compact && <span>复制</span>}
                </button>

                {/* Dropdown toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`${compact
                        ? 'p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-r-lg border-l border-slate-200 dark:border-slate-700'
                        : 'px-2 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-r-lg border-l border-blue-100 dark:border-blue-800'
                        } transition-colors`}
                >
                    <ChevronDown size={compact ? 12 : 14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
            </div>

            {/* Dropdown menu */}
            {isOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50 animate-in slide-in-from-top-2 fade-in">
                    {menuItems.map(item => (
                        <button
                            key={item.format}
                            onClick={() => copyToClipboard(item.format)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            {justCopied === item.format ? <Check size={14} className="text-green-500" /> : item.icon}
                            <span>{item.label}</span>
                        </button>
                    ))}

                    {hasVariables && (
                        <>
                            <div className="border-t border-slate-100 dark:border-slate-700 my-1" />
                            <button
                                onClick={() => { setShowVariableModal(true); setIsOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            >
                                <Braces size={14} />
                                <span>填充变量后复制</span>
                            </button>
                        </>
                    )}
                </div>
            )}

            {/* Variable replacement modal */}
            {showVariableModal && hasVariables && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowVariableModal(false)}>
                    <div
                        className="bg-white dark:bg-slate-900 rounded-xl p-6 max-w-md w-full shadow-2xl"
                        onClick={e => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">填充变量</h3>

                        <div className="space-y-3 mb-6">
                            {prompt.variables!.map(variable => (
                                <div key={variable.key}>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        {variable.label || variable.key}
                                    </label>
                                    <input
                                        type="text"
                                        value={variableValues[variable.key] || ''}
                                        onChange={e => setVariableValues(prev => ({ ...prev, [variable.key]: e.target.value }))}
                                        placeholder={variable.defaultValue || `输入 ${variable.key}`}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => setShowVariableModal(false)}
                                className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                                取消
                            </button>
                            <button
                                onClick={() => { copyToClipboard('en', true); setShowVariableModal(false); }}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                复制英文
                            </button>
                            <button
                                onClick={() => { copyToClipboard('both', true); setShowVariableModal(false); }}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                复制双语
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CopyMenu;

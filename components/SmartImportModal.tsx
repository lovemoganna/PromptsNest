import React, { useState } from 'react';
import { X, Sparkles, Loader2, Clipboard, Save } from 'lucide-react';
import { PromptEntry, OutputType, ApplicationScene } from '../types';
import { magicFillPrompt, translateText } from '../services/geminiService';

interface SmartImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (prompt: PromptEntry) => void;
    addNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

const SmartImportModal: React.FC<SmartImportModalProps> = ({ isOpen, onClose, onImport, addNotification }) => {
    const [rawText, setRawText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [parsedResult, setParsedResult] = useState<Partial<PromptEntry> | null>(null);

    if (!isOpen) return null;

    const handleParse = async () => {
        if (!rawText.trim()) return;
        setIsLoading(true);
        try {
            // 1. Magic Fill (Metadata Extraction)
            const res = await magicFillPrompt(rawText);

            if (res) {
                // 2. Auto-translate if needed (Assume raw text is what user wants as En or Cn)
                // If it looks like English, we'll set it as promptEn and translate to Cn
                const isEnglish = /^[A-Za-z0-9\s.,!?'"]+$/.test(rawText.slice(0, 100));
                let promptEn = isEnglish ? rawText : '';
                let promptCn = !isEnglish ? rawText : '';

                if (isEnglish) {
                    promptCn = await translateText(rawText, 'zh');
                } else {
                    promptEn = await translateText(rawText, 'en');
                }

                // Check for API errors returned as strings
                if (promptCn.includes('API 额度') || promptEn.includes('API 额度') || promptCn.startsWith('Gemini 服务异常') || promptEn.startsWith('Gemini 服务异常')) {
                    addNotification('error', promptCn.includes('API 额度') ? promptCn : (promptEn.includes('API 额度') ? promptEn : (promptCn.startsWith('Gemini') ? promptCn : promptEn)));
                    setIsLoading(false);
                    return;
                }

                const newPrompt: Partial<PromptEntry> = {
                    id: crypto.randomUUID(),
                    title: res.title,
                    promptEn,
                    promptCn,
                    outputType: res.outputType as OutputType,
                    sceneTag: res.sceneTag as ApplicationScene,
                    techTags: res.techTags,
                    styleTags: res.styleTags,
                    usageNote: res.usageNote,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    rating: { stability: 5, creativity: 5 },
                    history: []
                };
                setParsedResult(newPrompt);
                addNotification('success', 'AI 解析成功！');
            } else {
                addNotification('error', 'AI 无法解析该内容，请尝试更清晰的文本。');
            }
        } catch (error: any) {
            addNotification('error', error.message || '解析失败，请检查网络或 API 配置。');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = () => {
        if (parsedResult) {
            onImport(parsedResult as PromptEntry);
            setRawText('');
            setParsedResult(null);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-600/5 to-indigo-600/5">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg text-blue-600 dark:text-blue-400">
                            <Sparkles size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI 智能导入</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">粘贴原始提示词，AI 将自动为您补全元数据</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                            <Clipboard size={14} className="text-blue-500" /> 原始文本
                        </label>
                        <textarea
                            value={rawText}
                            onChange={(e) => setRawText(e.target.value)}
                            placeholder="在这里粘贴你的提示词... (例如: Cinematic drone shot flying through a neon-lit Tokyo...)"
                            className="w-full h-40 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none font-mono text-sm shadow-inner"
                        />
                    </div>

                    {parsedResult && (
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl p-5 space-y-4 animate-in slide-in-from-top-4 duration-300">
                            <div className="flex items-center justify-between border-b border-blue-100 dark:border-blue-900/30 pb-3">
                                <h3 className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                                    <Sparkles size={16} /> 解析结果预览
                                </h3>
                                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold rounded uppercase">Auto Generated</span>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">标题</span>
                                    <p className="text-sm font-semibold dark:text-white truncate">{parsedResult.title}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">类型 / 场景</span>
                                    <p className="text-sm dark:text-slate-300">{parsedResult.outputType} · {parsedResult.sceneTag}</p>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">提取标签</span>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                        {[...(parsedResult.techTags || []), ...(parsedResult.styleTags || [])].map(t => (
                                            <span key={t} className="px-2 py-0.5 bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-900/30 text-[11px] text-blue-600 dark:text-blue-400 rounded-md font-medium shadow-sm">
                                                #{t}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-sm"
                    >
                        取消
                    </button>
                    {!parsedResult ? (
                        <button
                            onClick={handleParse}
                            disabled={isLoading || !rawText.trim()}
                            className="flex-[2] py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:grayscale flex items-center justify-center gap-2 text-sm"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                            立即智能解析
                        </button>
                    ) : (
                        <button
                            onClick={handleSave}
                            className="flex-[2] py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2 text-sm"
                        >
                            <Save size={18} />
                            确认导入并保存
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SmartImportModal;

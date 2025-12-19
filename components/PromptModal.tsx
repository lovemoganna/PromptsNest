import React, { useState, useEffect, useRef } from 'react';
import { PromptEntry, OutputType, ApplicationScene, Collection, PromptVersion } from '../types';
import { X, Sparkles, Languages, Loader2, Plus, Variable, Target, Zap, FolderOpen, Wand2, Image as ImageIcon, UploadCloud, Link as LinkIcon, Command, Play, Terminal, Eye, History, Clock, ArrowRight, Save, RotateCcw, Copy, Tag } from 'lucide-react';
import { translateText, polishPrompt, magicFillPrompt, generatePromptFromImage, runPromptTest, generateVariations, suggestTags } from '../services/geminiService';
import { SUGGESTED_STYLE_TAGS, SUGGESTED_TECH_TAGS } from '../constants';

interface PromptModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (prompt: PromptEntry) => void;
    initialData?: PromptEntry;
    collections: Collection[];
    onAddCollection: (name: string) => void;
    addNotification: (type: 'success' | 'error' | 'info', message: string) => void;
    isReadOnly?: boolean; // For Zen Mode view
}

const emptyPrompt: PromptEntry = {
    id: '',
    title: '',
    promptEn: '',
    promptCn: '',
    outputType: OutputType.IMAGE,
    sceneTag: ApplicationScene.CHARACTER,
    techTags: [],
    styleTags: [],
    customTags: [],
    previewUrl: '',
    source: '',
    model: '',
    usageNote: '',
    precautions: '',
    createdAt: 0,
    updatedAt: 0,
    rating: { stability: 5, creativity: 5 },
    variables: [],
    history: []
};

const PromptModal: React.FC<PromptModalProps> = ({ isOpen, onClose, onSave, initialData, collections, onAddCollection, addNotification, isReadOnly = false }) => {
    const [formData, setFormData] = useState<PromptEntry>(emptyPrompt);
    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [newCollectionName, setNewCollectionName] = useState('');
    const [showAddCollection, setShowAddCollection] = useState(false);
    const [activeTab, setActiveTab] = useState<'edit' | 'test'>('edit');

    // Playground State
    const [testVariables, setTestVariables] = useState<Record<string, string>>({});
    const [testOutput, setTestOutput] = useState<string>('');

    // Image Upload State
    const [imageTab, setImageTab] = useState<'url' | 'upload'>('url');
    const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Phase 10: History & Variations
    const [showHistory, setShowHistory] = useState(false);
    const [variations, setVariations] = useState<string[]>([]);
    const [comparingVersion, setComparingVersion] = useState<PromptVersion | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialData ? { ...initialData } : { ...emptyPrompt, id: crypto.randomUUID(), createdAt: Date.now() });
            setShowAddCollection(false);
            setNewCollectionName('');
            setUploadedImageBase64(null);
            setImageTab(initialData?.previewUrl?.startsWith('data:') ? 'upload' : 'url');
            setActiveTab(isReadOnly ? 'test' : 'edit');
            setTestOutput('');
            setTestVariables({});
            setShowHistory(false);
            setVariations([]);
        }
    }, [isOpen, initialData, isReadOnly]);

    // Keyboard Shortcuts
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ctrl/Cmd + Enter to Save (only if not readonly)
            if (!isReadOnly && (e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                if (formData.title) {
                    handleSave();
                } else {
                    addNotification('error', '标题不能为空');
                }
            }
            // Esc to Close
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, formData, isReadOnly]);

    // Auto-detect variables
    useEffect(() => {
        if (!formData.promptEn) return;
        const regex = /\{\{([^}]+)\}\}/g;
        const matches = [...formData.promptEn.matchAll(regex)];
        const detectedVars = Array.from(new Set(matches.map(m => m[1])));

        // Update form data variables
        const newVariables = detectedVars.map(key => {
            const existing = formData.variables?.find(v => v.key === key);
            return existing || { key, label: key.charAt(0).toUpperCase() + key.slice(1), defaultValue: '' };
        });

        const currentKeys = formData.variables?.map(v => v.key).sort().join(',');
        const newKeys = newVariables.map(v => v.key).sort().join(',');

        if (currentKeys !== newKeys) {
            setFormData(prev => ({ ...prev, variables: newVariables }));
        }
    }, [formData.promptEn]);


    if (!isOpen) return null;

    const handleChange = (field: keyof PromptEntry, value: any) => {
        if (isReadOnly) return;
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTagChange = (field: 'techTags' | 'styleTags' | 'customTags', value: string) => {
        if (isReadOnly) return;
        const tags = value.split(',').map(t => t.trim()).filter(Boolean);
        setFormData(prev => ({ ...prev, [field]: tags }));
    };

    const handleRatingChange = (type: 'stability' | 'creativity', value: number) => {
        if (isReadOnly) return;
        setFormData(prev => ({
            ...prev,
            rating: { ...prev.rating!, [type]: value }
        }));
    };

    const handleAIAction = async (action: 'translate' | 'polish' | 'magicFill' | 'imageToPrompt' | 'variations') => {
        if (isReadOnly) return;
        setLoadingAction(action);
        try {
            if (action === 'translate') {
                if (!formData.promptEn && formData.promptCn) {
                    const res = await translateText(formData.promptCn, 'en');
                    handleChange('promptEn', res);
                    addNotification('success', '翻译完成');
                } else if (formData.promptEn && !formData.promptCn) {
                    const res = await translateText(formData.promptEn, 'zh');
                    handleChange('promptCn', res);
                    addNotification('success', '翻译完成');
                }
            } else if (action === 'polish') {
                if (formData.promptEn) {
                    const res = await polishPrompt(formData.promptEn);
                    handleChange('promptEn', res);
                    addNotification('success', '提示词润色完成');
                }
            } else if (action === 'magicFill') {
                const promptToAnalyze = formData.promptEn || formData.promptCn;
                if (promptToAnalyze) {
                    const res = await magicFillPrompt(promptToAnalyze);
                    if (res) {
                        setFormData(prev => ({
                            ...prev,
                            title: prev.title || res.title, // Only fill if empty
                            outputType: res.outputType as OutputType,
                            sceneTag: res.sceneTag as ApplicationScene,
                            techTags: Array.from(new Set([...prev.techTags, ...res.techTags])), // Merge unique
                            styleTags: Array.from(new Set([...prev.styleTags, ...res.styleTags])), // Merge unique
                            usageNote: prev.usageNote || res.usageNote
                        }));
                        addNotification('success', '智能填充完成');
                    } else {
                        addNotification('error', '无法分析提示词');
                    }
                }
            } else if (action === 'imageToPrompt') {
                if (uploadedImageBase64) {
                    const base64Data = uploadedImageBase64.split(',')[1];
                    const mimeType = uploadedImageBase64.split(';')[0].split(':')[1];
                    const generatedPrompt = await generatePromptFromImage(base64Data, mimeType);
                    handleChange('promptEn', generatedPrompt);
                    addNotification('success', '从图片生成提示词完成');
                }
            } else if (action === 'variations') {
                if (formData.promptEn) {
                    const vars = await generateVariations(formData.promptEn);
                    setVariations(vars);
                }
            }
        } catch (err: any) {
            addNotification('error', err.message || 'AI 操作失败，请检查 API Key。');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleTestRun = async () => {
        setLoadingAction('testRun');
        setTestOutput('');
        try {
            // 1. Compile Prompt
            let compiledPrompt = formData.promptEn;
            formData.variables?.forEach(v => {
                const val = testVariables[v.key] || v.defaultValue || '';
                compiledPrompt = compiledPrompt.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), val);
            });

            if (!compiledPrompt) {
                addNotification('error', '提示词为空');
                return;
            }

            // 2. Run
            const result = await runPromptTest(compiledPrompt);
            setTestOutput(result);
        } catch (e) {
            setTestOutput('运行测试时出错。');
        } finally {
            setLoadingAction(null);
        }
    };

    const handleCreateCollection = () => {
        if (newCollectionName.trim()) {
            onAddCollection(newCollectionName.trim());
            setNewCollectionName('');
            setShowAddCollection(false);
            addNotification('success', `集合 "${newCollectionName.trim()}" 创建成功`);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setUploadedImageBase64(base64);
                handleChange('previewUrl', base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        // Create version snapshot if prompt changed from initial
        let updatedHistory = formData.history || [];
        if (initialData) {
            const hasChanged = initialData.promptEn !== formData.promptEn || initialData.promptCn !== formData.promptCn || initialData.title !== formData.title;
            if (hasChanged) {
                const newVersion: PromptVersion = {
                    id: crypto.randomUUID(),
                    timestamp: Date.now(),
                    title: initialData.title,
                    promptEn: initialData.promptEn,
                    promptCn: initialData.promptCn
                };
                updatedHistory = [newVersion, ...updatedHistory];
            }
        }

        onSave({ ...formData, history: updatedHistory, updatedAt: Date.now() });
        onClose();
        addNotification('success', initialData ? '提示词已更新' : '提示词已创建');
    };

    const restoreVersion = (version: PromptVersion) => {
        if (confirm(`恢复到版本 ${new Date(version.timestamp).toLocaleString()}? 当前未保存的更改将会丢失。`)) {
            setFormData(prev => ({
                ...prev,
                title: version.title,
                promptEn: version.promptEn,
                promptCn: version.promptCn
            }));
            setShowHistory(false);
            addNotification('success', '版本已恢复');
        }
    };

    const applyVariation = (variation: string) => {
        setFormData(prev => ({ ...prev, promptEn: variation }));
        setVariations([]); // Close variations panel
        addNotification('success', '变体已应用');
    };

    // Simple Diff Logic
    const renderDiff = (oldText: string, newText: string) => {
        if (!oldText) return <span className="text-green-600">{newText}</span>;

        // This is a very basic word-based diff
        const oldWords = oldText.split(/(\s+)/);
        const newWords = newText.split(/(\s+)/);

        // For simplicity in this demo, let's just show side by side or a unified view if possible
        // Actually, let's just show side-by-side versions for now, it's cleaner for prompts
        return (
            <div className="grid grid-cols-2 gap-4 h-full min-h-[300px]">
                <div className="flex flex-col">
                    <div className="text-[10px] font-bold text-red-500 uppercase mb-1 flex items-center gap-1">
                        <ArrowRight size={10} className="rotate-180" /> 旧版本 ({new Date(comparingVersion?.timestamp || 0).toLocaleDateString()})
                    </div>
                    <div className="flex-1 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg text-sm font-mono text-slate-700 dark:text-slate-300 overflow-y-auto whitespace-pre-wrap">
                        {oldText}
                    </div>
                </div>
                <div className="flex flex-col">
                    <div className="text-[10px] font-bold text-green-500 uppercase mb-1 flex items-center gap-1">
                        <ArrowRight size={10} /> 当前/新版本
                    </div>
                    <div className="flex-1 p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg text-sm font-mono text-slate-700 dark:text-slate-300 overflow-y-auto whitespace-pre-wrap">
                        {newText}
                    </div>
                </div>
            </div>
        );
    };

    const saveVariationAsNew = (variation: string) => {
        const newPrompt = {
            ...formData,
            id: crypto.randomUUID(),
            title: `${formData.title} (变体)`,
            promptEn: variation,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        onSave(newPrompt);
        addNotification('success', '变体已另存为新提示词');
    };

    const renderEditContent = () => (
        <div className="space-y-6">
            {/* Top Row: Title, Type, Scene */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-6">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">标题 *</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => handleChange('title', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-slate-800 dark:text-slate-100 disabled:opacity-70"
                        placeholder="例如：赛博朋克雨夜街道"
                    />
                </div>
                <div className="md:col-span-3">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">输出类型</label>
                    <select
                        value={formData.outputType}
                        onChange={(e) => handleChange('outputType', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                    >
                        {Object.values(OutputType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <div className="md:col-span-3">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">场景 (L1)</label>
                    <select
                        value={formData.sceneTag}
                        onChange={(e) => handleChange('sceneTag', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                    >
                        {Object.values(ApplicationScene).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            {/* Details Row: Image & Collection */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Image Input Section */}
                <div className="md:col-span-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <ImageIcon size={14} /> 参考 / 预览图
                        </label>
                        {!isReadOnly && (
                            <div className="flex bg-white dark:bg-slate-800 rounded-lg p-0.5 border border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setImageTab('url')}
                                    className={`px-2 py-0.5 text-xs rounded-md ${imageTab === 'url' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}
                                >
                                    链接
                                </button>
                                <button
                                    onClick={() => setImageTab('upload')}
                                    className={`px-2 py-0.5 text-xs rounded-md ${imageTab === 'upload' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 font-medium' : 'text-slate-500 dark:text-slate-400'}`}
                                >
                                    上传
                                </button>
                            </div>
                        )}
                    </div>

                    {!isReadOnly && imageTab === 'url' ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={formData.previewUrl || ''}
                                onChange={(e) => handleChange('previewUrl', e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
                                placeholder="https://..."
                            />
                        </div>
                    ) : !isReadOnly && (
                        <div className="flex gap-2">
                            <label className="flex-1 flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 border-dashed rounded-lg cursor-pointer bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                    <UploadCloud size={14} />
                                    {uploadedImageBase64 ? '更换图片' : '选择文件'}
                                </span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                />
                            </label>
                        </div>
                    )}

                    {/* Preview & Action */}
                    {formData.previewUrl && (
                        <div className={`mt-3 relative group ${isReadOnly ? 'h-64' : 'h-32'}`}>
                            <img
                                src={formData.previewUrl}
                                alt="Preview"
                                className="w-full h-full object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                            />
                            {!isReadOnly && uploadedImageBase64 && (
                                <button
                                    onClick={() => handleAIAction('imageToPrompt')}
                                    disabled={!!loadingAction}
                                    className="absolute bottom-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-black/70 text-white rounded-full text-xs font-bold backdrop-blur-sm hover:bg-black/80 transition-all"
                                >
                                    {loadingAction === 'imageToPrompt' ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                                    提取提示词
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Collection & Ratings */}
                <div className="md:col-span-6 space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                            <FolderOpen size={14} /> 集合
                        </label>
                        <div className="flex gap-2">
                            <select
                                value={formData.collectionId || ''}
                                onChange={(e) => handleChange('collectionId', e.target.value)}
                                disabled={isReadOnly}
                                className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 dark:text-slate-100 text-sm outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                            >
                                <option value="">-- 无集合 --</option>
                                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {!isReadOnly && (
                                <button
                                    onClick={() => setShowAddCollection(!showAddCollection)}
                                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                    title="创建新集合"
                                >
                                    <Plus size={18} />
                                </button>
                            )}
                        </div>
                        {showAddCollection && !isReadOnly && (
                            <div className="mt-2 flex gap-2">
                                <input
                                    type="text"
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    placeholder="新集合名称"
                                    className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
                                />
                                <button
                                    onClick={handleCreateCollection}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium"
                                >
                                    添加
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                                <Target size={14} className="text-blue-500" /> 稳定性
                            </label>
                            <input
                                type="range" min="1" max="10"
                                value={formData.rating?.stability || 5}
                                onChange={(e) => handleRatingChange('stability', parseInt(e.target.value))}
                                disabled={isReadOnly}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer disabled:cursor-default"
                            />
                            <div className="text-right text-xs text-slate-500 dark:text-slate-400">{formData.rating?.stability || 5}/10</div>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                                <Zap size={14} className="text-amber-500" /> 创造力
                            </label>
                            <input
                                type="range" min="1" max="10"
                                value={formData.rating?.creativity || 5}
                                onChange={(e) => handleRatingChange('creativity', parseInt(e.target.value))}
                                disabled={isReadOnly}
                                className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer disabled:cursor-default"
                            />
                            <div className="text-right text-xs text-slate-500 dark:text-slate-400">{formData.rating?.creativity || 5}/10</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Prompts Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* History Sidebar - Absolute positioned */}
                {showHistory && (
                    <div className="absolute right-0 top-10 z-20 w-80 max-h-[400px] overflow-y-auto bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 animate-in slide-in-from-right-5">
                        <div className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                            <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400">版本历史</h4>
                            <button onClick={() => setShowHistory(false)}><X size={14} className="text-slate-400" /></button>
                        </div>
                        {formData.history && formData.history.length > 0 ? (
                            <div className="divide-y divide-slate-100 dark:divide-slate-700">
                                {formData.history.map((ver) => (
                                    <div key={ver.id} className="p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                                                {new Date(ver.timestamp).toLocaleString()}
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setComparingVersion(ver)}
                                                    className="text-purple-600 dark:text-purple-400 text-xs hover:underline opacity-0 group-hover:opacity-100"
                                                >
                                                    对比
                                                </button>
                                                <button
                                                    onClick={() => restoreVersion(ver)}
                                                    className="text-blue-600 dark:text-blue-400 text-xs hover:underline opacity-0 group-hover:opacity-100"
                                                >
                                                    恢复
                                                </button>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-slate-400 truncate">{ver.promptEn}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-xs text-slate-400">暂无历史记录</div>
                        )}
                    </div>
                )}

                {/* Diff Overlay */}
                {comparingVersion && (
                    <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-2xl z-30 mb-4 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <History size={20} className="text-purple-600" /> 版本差异对比
                            </h3>
                            <button onClick={() => setComparingVersion(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                                <X size={20} className="text-slate-400" />
                            </button>
                        </div>
                        {renderDiff(comparingVersion.promptEn, formData.promptEn)}
                        <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={() => setComparingVersion(null)}
                                className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                            >
                                关闭预览
                            </button>
                            <button
                                onClick={() => restoreVersion(comparingVersion)}
                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-purple-500/20 transition-all"
                            >
                                确认还原到此版本
                            </button>
                        </div>
                    </div>
                )}

                {/* Variations Panel */}
                {variations.length > 0 && (
                    <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-900/10 dark:to-fuchsia-900/10 p-4 rounded-xl border border-violet-100 dark:border-violet-800/30 mb-2 animate-in slide-in-from-top-2">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-violet-800 dark:text-violet-300 flex items-center gap-2">
                                <Sparkles size={14} /> 生成的变体
                            </h4>
                            <button onClick={() => setVariations([])}><X size={14} className="text-violet-400" /></button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {variations.map((v, idx) => (
                                <div key={idx} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-violet-100 dark:border-violet-800 shadow-sm flex flex-col">
                                    <p className="text-xs text-slate-600 dark:text-slate-300 mb-3 flex-1 line-clamp-4">{v}</p>
                                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                                        <button onClick={() => applyVariation(v)} className="flex-1 text-[10px] py-1 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300 rounded hover:bg-violet-100 dark:hover:bg-violet-900/50 font-medium">应用</button>
                                        <button onClick={() => saveVariationAsNew(v)} className="flex-1 text-[10px] py-1 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 rounded hover:bg-slate-50 dark:hover:bg-slate-700">另存为新</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* English Prompt */}
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">英文提示词 (English Prompt)</label>
                        {!isReadOnly && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowHistory(!showHistory)}
                                    className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${showHistory ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                    title="查看版本历史"
                                >
                                    <History size={12} />
                                </button>
                                <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1 self-center"></div>
                                <button
                                    onClick={() => handleAIAction('variations')}
                                    disabled={!formData.promptEn || !!loadingAction}
                                    className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/30 px-2 py-1 rounded hover:bg-violet-100 dark:hover:bg-violet-900/50 disabled:opacity-50"
                                    title="生成AI变体"
                                >
                                    {loadingAction === 'variations' ? <Loader2 className="animate-spin" size={12} /> : <Wand2 size={12} />}
                                    变体生成
                                </button>
                                <button
                                    onClick={() => handleAIAction('polish')}
                                    disabled={!formData.promptEn || !!loadingAction}
                                    className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded hover:bg-purple-100 dark:hover:bg-purple-900/50 disabled:opacity-50"
                                >
                                    {loadingAction === 'polish' ? <Loader2 className="animate-spin" size={12} /> : <Sparkles size={12} />}
                                    润色
                                </button>
                            </div>
                        )}
                    </div>
                    <textarea
                        value={formData.promptEn}
                        onChange={(e) => handleChange('promptEn', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full flex-1 min-h-[160px] p-3 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-70 disabled:bg-slate-100 dark:disabled:bg-slate-900"
                        placeholder="输入提示词... 使用 {{variable}} 作为动态变量"
                    />

                    {/* Detected Variables */}
                    {formData.variables && formData.variables.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                            {formData.variables.map(v => (
                                <span key={v.key} className="flex items-center gap-1 text-[10px] bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-100 dark:border-blue-800">
                                    <Variable size={10} /> {v.key}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Chinese Prompt */}
                <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">中文提示词</label>
                        {!isReadOnly && (
                            <button
                                onClick={() => handleAIAction('translate')}
                                disabled={(!formData.promptEn && !formData.promptCn) || !!loadingAction}
                                className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 disabled:opacity-50"
                            >
                                {loadingAction === 'translate' ? <Loader2 className="animate-spin" size={12} /> : <Languages size={12} />}
                                自动翻译
                            </button>
                        )}
                    </div>
                    <textarea
                        value={formData.promptCn}
                        onChange={(e) => handleChange('promptCn', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full flex-1 min-h-[160px] p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-slate-50 dark:bg-slate-800 dark:text-slate-100 disabled:opacity-70 disabled:bg-slate-100 dark:disabled:bg-slate-900"
                        placeholder="输入中文提示词..."
                    />
                </div>
            </div>

            {/* Tags Section */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-4 border border-slate-100 dark:border-slate-700">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">标签</span>
                    {!isReadOnly && (
                        <button
                            onClick={async () => {
                                const promptText = formData.promptEn || formData.promptCn;
                                if (!promptText) {
                                    addNotification('error', '请先填写提示词');
                                    return;
                                }
                                setLoadingAction('suggestTags');
                                try {
                                    const suggestions = await suggestTags(promptText);
                                    if (suggestions) {
                                        setFormData(prev => ({
                                            ...prev,
                                            techTags: Array.from(new Set([...prev.techTags, ...suggestions.techTags])),
                                            styleTags: Array.from(new Set([...prev.styleTags, ...suggestions.styleTags]))
                                        }));
                                        addNotification('success', 'AI标签推荐成功');
                                    }
                                } catch (err) {
                                    addNotification('error', '标签推荐失败');
                                } finally {
                                    setLoadingAction(null);
                                }
                            }}
                            disabled={!!loadingAction || (!formData.promptEn && !formData.promptCn)}
                            className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 disabled:opacity-50 transition-colors"
                        >
                            {loadingAction === 'suggestTags' ? <Loader2 className="animate-spin" size={12} /> : <Tag size={12} />}
                            AI推荐标签
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">技术标签 (Tech Tags)</label>
                        <input
                            type="text"
                            value={formData.techTags.join(', ')}
                            onChange={(e) => handleTagChange('techTags', e.target.value)}
                            disabled={isReadOnly}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 dark:text-slate-100 disabled:opacity-70"
                            placeholder="逗号分隔"
                        />
                        {!isReadOnly && (
                            <div className="mt-1 flex flex-wrap gap-1">
                                {SUGGESTED_TECH_TAGS.slice(0, 4).map(t => (
                                    <button key={t} onClick={() => {
                                        if (!formData.techTags.includes(t)) handleChange('techTags', [...formData.techTags, t])
                                    }} className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">+ {t}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">风格标签 (Style Tags)</label>
                        <input
                            type="text"
                            value={formData.styleTags.join(', ')}
                            onChange={(e) => handleTagChange('styleTags', e.target.value)}
                            disabled={isReadOnly}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 dark:text-slate-100 disabled:opacity-70"
                            placeholder="逗号分隔"
                        />
                        {!isReadOnly && (
                            <div className="mt-1 flex flex-wrap gap-1">
                                {SUGGESTED_STYLE_TAGS.slice(0, 4).map(t => (
                                    <button key={t} onClick={() => {
                                        if (!formData.styleTags.includes(t)) handleChange('styleTags', [...formData.styleTags, t])
                                    }} className="text-[10px] bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400">+ {t}</button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">自定义标签 (Custom Tags)</label>
                        <input
                            type="text"
                            value={formData.customTags.join(', ')}
                            onChange={(e) => handleTagChange('customTags', e.target.value)}
                            disabled={isReadOnly}
                            className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded text-sm bg-white dark:bg-slate-800 dark:text-slate-100 disabled:opacity-70"
                            placeholder="逗号分隔"
                        />
                    </div>
                </div>
            </div>

            {/* Details Row: Model & Source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">模型</label>
                    <input
                        type="text"
                        value={formData.model || ''}
                        onChange={(e) => handleChange('model', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-100 disabled:opacity-70"
                        placeholder="例如：Midjourney v6"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">来源</label>
                    <input
                        type="text"
                        value={formData.source || ''}
                        onChange={(e) => handleChange('source', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-100 disabled:opacity-70"
                        placeholder="例如：Twitter @artist"
                    />
                </div>
            </div>

            {/* Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">使用说明 (Usage Notes)</label>
                    <textarea
                        value={formData.usageNote || ''}
                        onChange={(e) => handleChange('usageNote', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm h-20 resize-none bg-white dark:bg-slate-800 dark:text-slate-100 disabled:opacity-70"
                        placeholder="使用技巧..."
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">注意事项 (Precautions)</label>
                    <textarea
                        value={formData.precautions || ''}
                        onChange={(e) => handleChange('precautions', e.target.value)}
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm h-20 resize-none border-l-4 border-l-amber-400 bg-white dark:bg-slate-800 dark:text-slate-100 disabled:opacity-70"
                        placeholder="避坑指南..."
                    />
                </div>
            </div>
        </div>
    );

    const renderTestContent = () => (
        <div className="space-y-6 h-full flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Input Side */}
                <div className="flex flex-col gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Variable size={16} className="text-blue-600 dark:text-blue-400" />
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase">变量</h3>
                        </div>
                        {formData.variables && formData.variables.length > 0 ? (
                            <div className="space-y-3">
                                {formData.variables.map(v => (
                                    <div key={v.key}>
                                        <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 block">{v.label || v.key}</label>
                                        <input
                                            type="text"
                                            placeholder={v.defaultValue || '输入值...'}
                                            value={testVariables[v.key] || ''}
                                            onChange={(e) => setTestVariables(prev => ({ ...prev, [v.key]: e.target.value }))}
                                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 dark:text-slate-100"
                                        />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400 italic">未检测到变量。</p>
                        )}
                    </div>

                    <div className="flex-1 flex flex-col bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Terminal size={16} className="text-purple-600 dark:text-purple-400" />
                            <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm uppercase">预览</h3>
                        </div>
                        <div className="flex-1 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono text-slate-700 dark:text-slate-300 whitespace-pre-wrap overflow-y-auto max-h-[200px]">
                            {(() => {
                                let compiled = formData.promptEn;
                                formData.variables?.forEach(v => {
                                    const val = testVariables[v.key] || v.defaultValue || `{{${v.key}}}`;
                                    compiled = compiled.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), val);
                                });
                                return compiled || <span className="text-slate-400 italic">提示词为空</span>;
                            })()}
                        </div>
                        <button
                            onClick={handleTestRun}
                            disabled={!!loadingAction || !formData.promptEn}
                            className="mt-4 w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loadingAction === 'testRun' ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} />}
                            运行测试
                        </button>
                    </div>
                </div>

                {/* Output Side */}
                <div className="flex flex-col bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 shadow-inner">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-amber-400" />
                            <h3 className="font-bold text-slate-200 text-sm uppercase">AI 响应</h3>
                        </div>
                        <div className="text-xs text-slate-500 font-mono">model: gemini-2.0-flash</div>
                    </div>
                    <div className="flex-1 overflow-y-auto whitespace-pre-wrap font-mono text-sm leading-relaxed p-2">
                        {testOutput ? (
                            testOutput
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                <Sparkles size={32} className="mb-2 opacity-20" />
                                <p>运行测试以在此查看AI输出。</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-black/70 backdrop-blur-sm p-4 overflow-y-auto">
            <div className={`bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col transition-opacity border border-slate-200 dark:border-slate-800 ${loadingAction ? 'opacity-90 pointer-events-none' : ''}`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
                    <div className="flex items-center gap-4">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            {isReadOnly ? <Eye className="text-blue-500" /> : null}
                            {isReadOnly ? formData.title || '查看提示词' : (initialData ? '编辑提示词' : '新建提示词')}
                        </h2>

                        {/* Tab Switcher */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('edit')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'edit' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                编辑
                            </button>
                            <button
                                onClick={() => setActiveTab('test')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${activeTab === 'test' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            >
                                <Play size={10} /> 测试运行
                            </button>
                        </div>

                        {/* Magic Fill Button (Only in Edit) */}
                        {!isReadOnly && activeTab === 'edit' && (
                            <button
                                onClick={() => handleAIAction('magicFill')}
                                disabled={(!formData.promptEn && !formData.promptCn) || !!loadingAction}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-full text-xs font-bold shadow-md hover:shadow-lg transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:shadow-none ml-2"
                                title="智能填充标题、标签和类型"
                            >
                                {loadingAction === 'magicFill' ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                                智能填充
                            </button>
                        )}
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
                        <X size={24} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-slate-900">
                    {activeTab === 'edit' ? renderEditContent() : renderTestContent()}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900">
                    <div className="text-xs text-slate-400 flex gap-4">
                        {!isReadOnly && <span className="flex items-center gap-1"><Command size={10} /> + Enter 保存</span>}
                        <span>Esc 关闭</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition-colors"
                        >
                            {isReadOnly ? '关闭' : '取消'}
                        </button>
                        {!isReadOnly && (
                            <button
                                onClick={handleSave}
                                disabled={!formData.title}
                                className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 dark:shadow-blue-900/20 disabled:opacity-50 disabled:shadow-none transition-all transform hover:-translate-y-0.5"
                            >
                                保存提示词
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default PromptModal;
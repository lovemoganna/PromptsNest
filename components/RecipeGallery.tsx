import React from 'react';
import { X, BookOpen, ChevronRight, PlusCircle, Sparkles } from 'lucide-react';
import { PROMPT_RECIPES } from '../constants';
import { PromptEntry, OutputType, ApplicationScene } from '../types';

interface RecipeGalleryProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (recipe: any) => void;
}

const RecipeGallery: React.FC<RecipeGalleryProps> = ({ isOpen, onClose, onApply }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-600/5 to-purple-600/5">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-xl text-indigo-600 dark:text-indigo-400 shadow-sm border border-indigo-200/50">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">提示词食谱库</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Selected Prompt Recipes Gallery</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/30 dark:bg-slate-950/20">
                    {PROMPT_RECIPES.map((recipe) => (
                        <div
                            key={recipe.id}
                            className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 hover:shadow-xl hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer flex flex-col relative overflow-hidden"
                            onClick={() => onApply(recipe)}
                        >
                            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
                                <Sparkles size={64} className="text-indigo-600" />
                            </div>

                            <div className="flex items-center gap-2 mb-4">
                                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black rounded-lg uppercase border border-indigo-100 dark:border-indigo-800">
                                    {recipe.outputType}
                                </span>
                                <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] font-black rounded-lg uppercase border border-slate-200 dark:border-slate-600">
                                    {recipe.sceneTag}
                                </span>
                            </div>

                            <h3 className="text-lg font-black text-slate-900 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                {recipe.title}
                            </h3>

                            <div className="flex-1 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 mb-6">
                                <p className="text-xs font-mono text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-3 italic">
                                    "{recipe.promptEn}"
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-2">
                                    {recipe.styleTags.map(t => (
                                        <span key={t} className="text-[10px] font-bold text-slate-400">#{t}</span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-black text-sm group-hover:translate-x-1 transition-transform">
                                    立即使用 <ChevronRight size={16} strokeWidth={3} />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-center italic text-xs text-slate-400 font-medium tracking-wide">
                    提示：点击食谱即可将其应用到新的提示词编辑器中。
                </div>
            </div>
        </div>
    );
};

export default RecipeGallery;

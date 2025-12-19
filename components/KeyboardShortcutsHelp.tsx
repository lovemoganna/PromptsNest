import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutItem {
    keys: string[];
    description: string;
}

interface KeyboardShortcutsHelpProps {
    isOpen: boolean;
    onClose: () => void;
}

const shortcuts: ShortcutItem[] = [
    { keys: ['Ctrl', 'N'], description: '新建提示词' },
    { keys: ['Ctrl', 'F'], description: '聚焦搜索框' },
    { keys: ['Ctrl', 'E'], description: '切换沉浸模式' },
    { keys: ['Ctrl', '/'], description: '显示快捷键帮助' },
    { keys: ['Ctrl', 'S'], description: '保存当前编辑' },
    { keys: ['Escape'], description: '关闭弹窗' },
];

const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <Keyboard className="text-blue-600 dark:text-blue-400" size={20} />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">快捷键</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                {/* Shortcuts List */}
                <div className="p-4 space-y-3">
                    {shortcuts.map((shortcut, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between py-2"
                        >
                            <span className="text-slate-700 dark:text-slate-300">
                                {shortcut.description}
                            </span>
                            <div className="flex items-center gap-1">
                                {shortcut.keys.map((key, keyIndex) => (
                                    <React.Fragment key={keyIndex}>
                                        <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600 text-sm font-mono shadow-sm">
                                            {key}
                                        </kbd>
                                        {keyIndex < shortcut.keys.length - 1 && (
                                            <span className="text-slate-400 text-xs">+</span>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        按 <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">Esc</kbd> 关闭此窗口
                    </p>
                </div>
            </div>
        </div>
    );
};

export default KeyboardShortcutsHelp;

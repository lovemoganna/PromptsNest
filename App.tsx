import React, { useState, useEffect, useMemo } from 'react';
import { PromptEntry, OutputType, FilterState, Collection, SortOption } from './types';
import { INITIAL_PROMPTS, INITIAL_COLLECTIONS } from './constants';
import PromptCard from './components/PromptCard';
import PromptTable from './components/PromptTable';
import PromptMatrix from './components/PromptMatrix';
import PromptModal from './components/PromptModal';
import StatsDashboard from './components/StatsDashboard';
import NotificationToast, { Notification, NotificationType } from './components/NotificationToast';
import BatchActionBar from './components/BatchActionBar';
import { Plus, Search, Filter, Download, Upload, LayoutGrid, List, X, FolderOpen, Table, Grid3X3, Settings, Trash2, Save, ArrowUpDown, Moon, Sun, Eye, EyeOff, CheckSquare, Square, Maximize2, Minimize2 } from 'lucide-react';

type ViewMode = 'grid' | 'table' | 'matrix';

const App: React.FC = () => {
  // --- State ---
  const [prompts, setPrompts] = useState<PromptEntry[]>(() => {
    const saved = localStorage.getItem('promptnest_data');
    return saved ? JSON.parse(saved) : INITIAL_PROMPTS;
  });

  const [collections, setCollections] = useState<Collection[]>(() => {
    const saved = localStorage.getItem('promptnest_collections');
    return saved ? JSON.parse(saved) : INITIAL_COLLECTIONS;
  });

  const [filter, setFilter] = useState<FilterState>({
    searchTerm: '',
    outputType: 'All',
    selectedTags: [],
    collectionId: 'All',
    model: 'All'
  });

  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<PromptEntry | undefined>(undefined);
  const [showStats, setShowStats] = useState(false); // Default hidden
  
  // UX / Visual State
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
      const saved = localStorage.getItem('promptnest_theme');
      return (saved as 'light' | 'dark') || 'light';
  });
  const [isZenMode, setIsZenMode] = useState(false);
  
  // Batch Selection State
  const [selectedPromptIds, setSelectedPromptIds] = useState<Set<string>>(new Set());

  // Notification State
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // Collection Manager State
  const [isCollectionMgrOpen, setIsCollectionMgrOpen] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [editCollectionName, setEditCollectionName] = useState('');

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem('promptnest_data', JSON.stringify(prompts));
  }, [prompts]);

  useEffect(() => {
    localStorage.setItem('promptnest_collections', JSON.stringify(collections));
  }, [collections]);

  // Dark Mode Injection
  useEffect(() => {
      const root = window.document.documentElement;
      if (theme === 'dark') {
          root.classList.add('dark');
      } else {
          root.classList.remove('dark');
      }
      localStorage.setItem('promptnest_theme', theme);
  }, [theme]);

  // --- Handlers ---
  const toggleTheme = () => {
      setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const toggleZenMode = () => {
      setIsZenMode(prev => !prev);
      // If entering Zen Mode, ensure we are in grid view for best experience
      if (!isZenMode) {
          setViewMode('grid');
          setShowStats(false);
          setSelectedPromptIds(new Set()); // Clear selection when entering Zen mode
      } else {
          // When exiting Zen mode, restore stats visibility if it was intended to be shown? 
          // For now, let's keep it hidden unless user explicitly toggles it, or set to true if we want to restore previous context.
          // Given the request "Only show when clicking eye icon", we probably shouldn't auto-show it here unless previously shown.
          // But to be safe and simple, let's leave it as is or set to true (assuming 'normal' mode has stats).
          // However, user said "default hidden". So exiting Zen Mode shouldn't force show it.
          // Let's remove the force true.
          // setShowStats(true); // Removed to respect manual toggle
      }
  };

  const addNotification = (type: NotificationType, message: string) => {
    setNotifications(prev => [...prev, { id: crypto.randomUUID(), type, message }]);
  };
  
  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleSavePrompt = (prompt: PromptEntry) => {
    if (editingPrompt) {
      setPrompts(prev => prev.map(p => p.id === prompt.id ? prompt : p));
    } else {
      setPrompts(prev => [prompt, ...prev]);
    }
  };

  const handleDeletePrompt = (id: string) => {
    if (confirm('确定要删除此提示词吗？')) {
      setPrompts(prev => prev.filter(p => p.id !== id));
      setSelectedPromptIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
      });
      addNotification('info', '提示词已删除');
    }
  };

  const handleEditPrompt = (id: string) => {
    const prompt = prompts.find(p => p.id === id);
    if (prompt) {
      setEditingPrompt(prompt);
      setIsModalOpen(true);
    }
  };

  const handleAddCollection = (name: string) => {
    const newCol: Collection = {
        id: crypto.randomUUID(),
        name,
        createdAt: Date.now()
    };
    setCollections(prev => [...prev, newCol]);
  };

  const handleRenameCollection = (id: string) => {
    if (editCollectionName.trim()) {
      setCollections(prev => prev.map(c => c.id === id ? { ...c, name: editCollectionName } : c));
      setEditingCollectionId(null);
      addNotification('success', '集合已重命名');
    }
  };

  const handleDeleteCollection = (id: string) => {
    if (confirm('删除此集合？集合内的提示词将变为未分类。')) {
      setCollections(prev => prev.filter(c => c.id !== id));
      // Reset prompts that were in this collection
      setPrompts(prev => prev.map(p => p.collectionId === id ? { ...p, collectionId: undefined } : p));
      if (filter.collectionId === id) {
        setFilter(prev => ({ ...prev, collectionId: 'All' }));
      }
      addNotification('info', '集合已删除');
    }
  };

  const handleTagClick = (tag: string) => {
    if (!filter.selectedTags.includes(tag)) {
        setFilter(prev => ({ ...prev, selectedTags: [...prev.selectedTags, tag] }));
    }
  };

  const removeTagFilter = (tag: string) => {
    setFilter(prev => ({ ...prev, selectedTags: prev.selectedTags.filter(t => t !== tag) }));
  };

  // --- Batch Handlers ---
  const toggleSelection = (id: string) => {
      setSelectedPromptIds(prev => {
          const next = new Set(prev);
          if (next.has(id)) {
              next.delete(id);
          } else {
              next.add(id);
          }
          return next;
      });
  };

  const selectAllFiltered = () => {
      if (selectedPromptIds.size === filteredAndSortedPrompts.length) {
          setSelectedPromptIds(new Set()); // Deselect all
      } else {
          setSelectedPromptIds(new Set(filteredAndSortedPrompts.map(p => p.id)));
      }
  };

  const handleBatchDelete = () => {
      if (confirm(`删除 ${selectedPromptIds.size} 个提示词？此操作不可撤销。`)) {
          setPrompts(prev => prev.filter(p => !selectedPromptIds.has(p.id)));
          setSelectedPromptIds(new Set());
          addNotification('success', '批量删除成功');
      }
  };

  const handleBatchMove = (collectionId: string) => {
      setPrompts(prev => prev.map(p => {
          if (selectedPromptIds.has(p.id)) {
              return { ...p, collectionId: collectionId || undefined };
          }
          return p;
      }));
      setSelectedPromptIds(new Set());
      addNotification('success', '提示词移动成功');
  };

  const generateMarkdownExport = (exportPrompts: PromptEntry[]) => {
      let md = `# PromptNest 导出\n生成时间: ${new Date().toLocaleDateString()}\n\n`;
      
      exportPrompts.forEach(p => {
          md += `## ${p.title}\n`;
          md += `> **类型**: ${p.outputType} | **场景**: ${p.sceneTag} | **模型**: ${p.model || 'N/A'}\n`;
          md += `> **标签**: ${[...p.techTags, ...p.styleTags].map(t => `#${t}`).join(' ')}\n\n`;
          
          md += `### 英文提示词\n\`\`\`\n${p.promptEn}\n\`\`\`\n\n`;
          
          if (p.promptCn) {
              md += `### 中文提示词\n\`\`\`\n${p.promptCn}\n\`\`\`\n\n`;
          }

          if (p.usageNote) md += `**注意**: ${p.usageNote}\n\n`;
          md += `---\n\n`;
      });
      return md;
  };

  const generateCSVExport = (exportPrompts: PromptEntry[]) => {
     const headers = ['标题', '类型', '场景', '英文提示词', '中文提示词', '模型', '标签'];
     const rows = exportPrompts.map(p => [
         p.title,
         p.outputType,
         p.sceneTag,
         `"${p.promptEn.replace(/"/g, '""')}"`,
         `"${p.promptCn.replace(/"/g, '""')}"`,
         p.model || '',
         `"${[...p.techTags, ...p.styleTags].join(',')}"`
     ]);
     return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  };

  const handleExport = (format: 'json' | 'md' | 'csv' = 'json') => {
    try {
      // Determine what to export: Selected items OR All Filtered items (if no selection) OR All items
      let promptsToExport: PromptEntry[] = [];
      
      if (selectedPromptIds.size > 0) {
          promptsToExport = prompts.filter(p => selectedPromptIds.has(p.id));
      } else if (filteredAndSortedPrompts.length !== prompts.length) {
           // If user has filtered, export the filtered view
           promptsToExport = filteredAndSortedPrompts;
      } else {
           promptsToExport = prompts;
      }

      let content = '';
      let mimeType = '';
      let ext = '';

      if (format === 'json') {
          const data = { prompts: promptsToExport, collections }; // Export collections too if JSON
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          ext = 'json';
      } else if (format === 'md') {
          content = generateMarkdownExport(promptsToExport);
          mimeType = 'text/markdown';
          ext = 'md';
      } else if (format === 'csv') {
          content = generateCSVExport(promptsToExport);
          mimeType = 'text/csv';
          ext = 'csv';
      }

      const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
      const url = URL.createObjectURL(blob);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", url);
      downloadAnchorNode.setAttribute("download", `promptnest_export_${new Date().toISOString().split('T')[0]}.${ext}`);
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      URL.revokeObjectURL(url); // Clean up
      
      addNotification('success', `已导出 ${promptsToExport.length} 项到 ${ext.toUpperCase()}`);
    } catch (e) {
      addNotification('error', '导出失败');
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target?.result as string);
          if (Array.isArray(imported)) {
            setPrompts(imported);
            addNotification('success', '旧版导入成功！(仅提示词)');
          } else if (imported.prompts && Array.isArray(imported.prompts)) {
             setPrompts(imported.prompts);
             if (imported.collections) setCollections(imported.collections);
             addNotification('success', '完整备份导入成功！');
          }
        } catch (error) {
          addNotification('error', '无效的 JSON 文件格式');
        }
      };
      reader.readAsText(file);
    }
  };

  // --- Derived State ---
  const allModels = useMemo(() => {
    return Array.from(new Set(prompts.map(p => p.model).filter(Boolean))) as string[];
  }, [prompts]);

  const filteredAndSortedPrompts = useMemo(() => {
    // 1. Filter
    let result = prompts.filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
        p.promptEn.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
        p.promptCn.toLowerCase().includes(filter.searchTerm.toLowerCase()) ||
        p.techTags.some(t => t.toLowerCase().includes(filter.searchTerm.toLowerCase()));

      const matchesType = filter.outputType === 'All' || p.outputType === filter.outputType;

      const matchesTags = filter.selectedTags.length === 0 || 
        filter.selectedTags.every(t => 
            p.techTags.includes(t) || p.styleTags.includes(t) || p.customTags.includes(t)
        );

      const matchesCollection = filter.collectionId === 'All' || p.collectionId === filter.collectionId;
      
      const matchesModel = filter.model === 'All' || p.model === filter.model;

      return matchesSearch && matchesType && matchesTags && matchesCollection && matchesModel;
    });

    // 2. Sort
    result.sort((a, b) => {
       switch (sortOption) {
           case 'newest': return b.createdAt - a.createdAt;
           case 'oldest': return a.createdAt - b.createdAt;
           case 'updated': return b.updatedAt - a.updatedAt;
           case 'rating': 
              const ratingA = (a.rating?.stability || 0) + (a.rating?.creativity || 0);
              const ratingB = (b.rating?.stability || 0) + (b.rating?.creativity || 0);
              return ratingB - ratingA;
           default: return 0;
       }
    });

    return result;
  }, [prompts, filter, sortOption]);

  // --- View Renderer ---
  const renderContent = () => {
    if (filteredAndSortedPrompts.length === 0) {
      return (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
           <div className="bg-slate-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
             <Filter className="text-slate-400" size={32} />
           </div>
           <h3 className="text-lg font-medium text-slate-900 dark:text-slate-200">未找到提示词</h3>
           <p className="text-slate-500 dark:text-slate-400 mt-1">尝试调整过滤条件或搜索关键词。</p>
        </div>
      );
    }

    switch (viewMode) {
      case 'table':
        return (
          <PromptTable 
            prompts={filteredAndSortedPrompts} 
            onEdit={handleEditPrompt}
            onDelete={handleDeletePrompt}
            onTagClick={handleTagClick}
            selectedIds={selectedPromptIds}
            onSelect={isZenMode ? undefined : toggleSelection}
          />
        );
      case 'matrix':
        return (
          <PromptMatrix 
            prompts={filteredAndSortedPrompts}
            onEdit={handleEditPrompt} 
          />
        );
      case 'grid':
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedPrompts.map(prompt => (
              <PromptCard 
                key={prompt.id} 
                prompt={prompt} 
                onEdit={handleEditPrompt}
                onDelete={handleDeletePrompt}
                onTagClick={handleTagClick}
                isZenMode={isZenMode}
                selected={selectedPromptIds.has(prompt.id)}
                onSelect={toggleSelection}
                selectionMode={selectedPromptIds.size > 0}
              />
            ))}
          </div>
        );
    }
  };

  // --- Render ---
  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300`}>
      
      {/* Toast Container */}
      <NotificationToast notifications={notifications} onDismiss={dismissNotification} />

      {/* Batch Action Bar */}
      <BatchActionBar 
         selectedCount={selectedPromptIds.size}
         onClearSelection={() => setSelectedPromptIds(new Set())}
         onDelete={handleBatchDelete}
         onMoveToCollection={handleBatchMove}
         onExport={handleExport}
         collections={collections}
      />

      {/* Navigation Bar */}
      <nav className={`border-b sticky top-0 z-30 shadow-sm transition-all duration-300 ${isZenMode ? 'bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-transparent' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/30">
              P
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
              PromptNest
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
             {/* Zen Mode Toggle (Switched to Maximize/Minimize) */}
             <button 
                onClick={toggleZenMode}
                className={`p-2 rounded-lg transition-colors ${isZenMode ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                title={isZenMode ? "退出沉浸模式" : "进入沉浸模式"}
             >
                {isZenMode ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
             </button>

             {/* Dark Mode Toggle */}
             <button 
                onClick={toggleTheme}
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="切换主题"
             >
                {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
             </button>

             {!isZenMode && (
                 <>
                    <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
                    {/* Stats Toggle (Switched to Eye Icon) */}
                    <button 
                        onClick={() => setShowStats(!showStats)} 
                        className={`p-2 rounded-lg transition-colors ${showStats ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        title={showStats ? "隐藏数据面板" : "显示数据面板"}
                    >
                        {showStats ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                    <button onClick={() => handleExport('json')} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" title="快速导出 JSON">
                    <Download size={20} />
                    </button>
                    <label className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer" title="导入 JSON">
                    <Upload size={20} />
                    <input type="file" className="hidden" accept=".json" onChange={handleImport} />
                    </label>
                    <button 
                    onClick={() => { setEditingPrompt(undefined); setIsModalOpen(true); }}
                    className="ml-2 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm font-medium"
                    >
                    <Plus size={18} />
                    <span>新建提示词</span>
                    </button>
                 </>
             )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Statistics Section (Hidden in Zen Mode) */}
        {!isZenMode && showStats && <StatsDashboard prompts={prompts} />}

        {/* Filter Bar (Hidden in Zen Mode, only Search remains if desired, but spec says hide complex filters) */}
        <div className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 mb-8 sticky top-20 z-20 transition-all ${isZenMode ? 'hidden' : 'block'}`}>
          <div className="flex flex-col gap-4">
             {/* Top Row: Search and Tabs */}
             <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
                
                <div className="flex flex-col md:flex-row gap-4 w-full xl:w-auto">
                    {/* Search */}
                    <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text" 
                        placeholder="搜索提示词、标签..." 
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm bg-white dark:bg-slate-800 dark:text-slate-200"
                        value={filter.searchTerm}
                        onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                      />
                    </div>

                    {/* Collection Dropdown & Manager */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <div className="relative flex-1 md:w-48">
                            <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select 
                                value={filter.collectionId}
                                onChange={(e) => setFilter(prev => ({ ...prev, collectionId: e.target.value }))}
                                className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm"
                            >
                                <option value="All">所有集合</option>
                                {collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <button 
                            onClick={() => setIsCollectionMgrOpen(!isCollectionMgrOpen)}
                            className={`p-2 rounded-lg border border-slate-200 dark:border-slate-700 ${isCollectionMgrOpen ? 'bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400' : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                            title="管理集合"
                        >
                            <Settings size={20} />
                        </button>
                    </div>

                    {/* Model Dropdown */}
                    <div className="relative w-full md:w-48">
                        <select 
                            value={filter.model}
                            onChange={(e) => setFilter(prev => ({ ...prev, model: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm"
                        >
                            <option value="All">所有模型</option>
                            {allModels.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-4 w-full xl:w-auto justify-between xl:justify-end">
                    {/* Sort Dropdown */}
                    <div className="relative">
                        <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <select 
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value as SortOption)}
                            className="pl-9 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none text-sm cursor-pointer"
                        >
                            <option value="newest">最新</option>
                            <option value="oldest">最旧</option>
                            <option value="updated">最近更新</option>
                            <option value="rating">最高评分</option>
                        </select>
                    </div>

                    {/* View Switcher */}
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-200 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="网格视图"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('table')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-200 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="表格视图"
                        >
                            <Table size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('matrix')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'matrix' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-200 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="矩阵视图"
                        >
                            <Grid3X3 size={18} />
                        </button>
                    </div>
                </div>
             </div>
             
             {/* Collection Manager Overlay */}
             {isCollectionMgrOpen && (
                 <div className="border-t border-slate-100 dark:border-slate-800 pt-3 mt-1 animate-in slide-in-from-top-2">
                     <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">管理集合</div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                         {collections.map(c => (
                             <div key={c.id} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700 group">
                                 {editingCollectionId === c.id ? (
                                     <>
                                         <input 
                                             type="text" 
                                             value={editCollectionName}
                                             onChange={(e) => setEditCollectionName(e.target.value)}
                                             className="flex-1 text-sm px-2 py-1 rounded border border-blue-300 dark:border-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-slate-900 dark:text-white"
                                             autoFocus
                                         />
                                         <button onClick={() => handleRenameCollection(c.id)} className="text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 p-1 rounded"><Save size={14} /></button>
                                         <button onClick={() => setEditingCollectionId(null)} className="text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 p-1 rounded"><X size={14} /></button>
                                     </>
                                 ) : (
                                     <>
                                         <span className="flex-1 text-sm text-slate-700 dark:text-slate-300 truncate font-medium">{c.name}</span>
                                         <span className="text-xs text-slate-400 mr-2">{prompts.filter(p => p.collectionId === c.id).length} 项</span>
                                         <button 
                                            onClick={() => { setEditingCollectionId(c.id); setEditCollectionName(c.name); }}
                                            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="重命名"
                                         >
                                            <Settings size={14} />
                                         </button>
                                         <button 
                                            onClick={() => handleDeleteCollection(c.id)}
                                            className="text-slate-400 hover:text-red-600 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="删除"
                                         >
                                            <Trash2 size={14} />
                                         </button>
                                     </>
                                 )}
                             </div>
                         ))}
                     </div>
                 </div>
             )}

             {/* Selected Tags */}
             {filter.selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">当前过滤:</span>
                    {filter.selectedTags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs font-medium border border-blue-100 dark:border-blue-800">
                            {tag}
                            <button onClick={() => removeTagFilter(tag)} className="hover:text-blue-900 dark:hover:text-blue-200"><X size={12} /></button>
                        </span>
                    ))}
                    <button onClick={() => setFilter(prev => ({...prev, selectedTags: []}))} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline ml-2">清除所有</button>
                </div>
             )}
             
             {/* Selection Bar (Active Filters / Select All) */}
             <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
                 <div className="flex overflow-x-auto gap-2">
                    {['All', ...Object.values(OutputType)].map((type) => (
                        <button
                        key={type}
                        onClick={() => setFilter(prev => ({ ...prev, outputType: type as OutputType | 'All' }))}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                            filter.outputType === type 
                            ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-800 dark:border-slate-100' 
                            : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        }`}
                        >
                        {type === 'All' ? '全部' : type}
                        </button>
                    ))}
                 </div>

                 {/* Select All Toggle */}
                 {!isZenMode && (viewMode === 'grid' || viewMode === 'table') && filteredAndSortedPrompts.length > 0 && (
                     <button 
                        onClick={selectAllFiltered}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            selectedPromptIds.size === filteredAndSortedPrompts.length && filteredAndSortedPrompts.length > 0
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                     >
                        {selectedPromptIds.size === filteredAndSortedPrompts.length && filteredAndSortedPrompts.length > 0 ? <CheckSquare size={14}/> : <Square size={14}/>}
                        全选
                     </button>
                 )}
             </div>

          </div>
        </div>
        
        {/* Search Bar for Zen Mode (minimal version) */}
        {isZenMode && (
           <div className="mb-8 flex justify-center animate-in slide-in-from-top-5">
              <div className="relative w-full max-w-lg shadow-lg">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="寻找灵感..." 
                    className="w-full pl-12 pr-4 py-3 rounded-full border-none bg-white dark:bg-slate-800/80 backdrop-blur-md text-slate-800 dark:text-white shadow-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-base"
                    value={filter.searchTerm}
                    onChange={(e) => setFilter(prev => ({ ...prev, searchTerm: e.target.value }))}
                  />
              </div>
           </div>
        )}

        {/* View Content */}
        {renderContent()}

      </main>

      {/* Edit/Create Modal */}
      <PromptModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePrompt}
        initialData={editingPrompt}
        collections={collections}
        onAddCollection={handleAddCollection}
        addNotification={addNotification}
        isReadOnly={isZenMode}
      />
    </div>
  );
};

export default App;
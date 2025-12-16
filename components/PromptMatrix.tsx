import React, { useMemo } from 'react';
import { PromptEntry, ApplicationScene } from '../types';
import { Plus } from 'lucide-react';

interface PromptMatrixProps {
  prompts: PromptEntry[];
  onEdit: (id: string) => void;
}

const PromptMatrix: React.FC<PromptMatrixProps> = ({ prompts, onEdit }) => {
  
  // 1. Identify Top Styles (Dynamic Y-Axis)
  // We want to find the most frequent style tags to form our rows
  const topStyles = useMemo(() => {
    const styleCounts: Record<string, number> = {};
    prompts.forEach(p => {
      p.styleTags.forEach(tag => {
        styleCounts[tag] = (styleCounts[tag] || 0) + 1;
      });
    });
    
    // Sort by frequency and take top 8, plus 'Other'
    return Object.entries(styleCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(entry => entry[0]);
  }, [prompts]);

  const scenes = Object.values(ApplicationScene);

  // 2. Build the Matrix Data
  const getPromptsForCell = (scene: string, style: string) => {
    return prompts.filter(p => p.sceneTag === scene && p.styleTags.includes(style));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-x-auto">
      <div className="min-w-[800px] p-6">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-6">
           知识矩阵 (场景 vs 热门风格)
        </h3>
        
        <div className="grid" style={{ gridTemplateColumns: `150px repeat(${scenes.length}, minmax(120px, 1fr))` }}>
           {/* Header Row: Scenes */}
           <div className="p-3 font-bold text-slate-400 dark:text-slate-500 text-xs uppercase tracking-wider text-right border-b border-r border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              风格 \ 场景
           </div>
           {scenes.map(scene => (
             <div key={scene} className="p-3 font-semibold text-slate-700 dark:text-slate-300 text-xs border-b border-slate-100 dark:border-slate-800 text-center bg-slate-50/30 dark:bg-slate-800/30">
                {scene}
             </div>
           ))}

           {/* Rows: Styles */}
           {topStyles.map(style => (
             <React.Fragment key={style}>
               {/* Row Header */}
               <div className="p-3 font-medium text-slate-600 dark:text-slate-300 text-xs border-r border-slate-100 dark:border-slate-800 border-b dark:border-slate-800 flex items-center justify-end bg-slate-50/30 dark:bg-slate-800/30">
                 {style}
               </div>
               
               {/* Cells */}
               {scenes.map(scene => {
                 const cellPrompts = getPromptsForCell(scene, style);
                 const count = cellPrompts.length;
                 
                 // Heatmap color logic
                 let bgClass = 'bg-white dark:bg-slate-900';
                 if (count > 0) bgClass = 'bg-blue-50 dark:bg-blue-900/20';
                 if (count > 2) bgClass = 'bg-blue-100 dark:bg-blue-900/40';
                 if (count > 5) bgClass = 'bg-blue-200 dark:bg-blue-900/60';

                 return (
                   <div key={`${style}-${scene}`} className={`p-2 border-b border-slate-100 dark:border-slate-800 border-r border-slate-50 dark:border-slate-800/50 ${bgClass} transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/30`}>
                      {count > 0 ? (
                        <div className="flex flex-col gap-1.5 h-full min-h-[60px]">
                           {cellPrompts.slice(0, 2).map(p => (
                             <div 
                               key={p.id} 
                               onClick={() => onEdit(p.id)}
                               className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded px-2 py-1 text-[10px] dark:text-slate-300 shadow-sm cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:shadow truncate"
                               title={p.title}
                             >
                               {p.title}
                             </div>
                           ))}
                           {count > 2 && (
                             <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium text-center">
                               +{count - 2} 更多
                             </div>
                           )}
                        </div>
                      ) : (
                        <div className="h-full min-h-[60px] flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></div>
                        </div>
                      )}
                   </div>
                 );
               })}
             </React.Fragment>
           ))}
        </div>
        
        {topStyles.length === 0 && (
           <div className="text-center py-10 text-slate-400 dark:text-slate-600 italic">
              添加一些带有风格标签的提示词以生成矩阵。
           </div>
        )}
      </div>
    </div>
  );
};

export default PromptMatrix;
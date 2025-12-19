import React from 'react';
import { PromptEntry, OutputType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { COLOR_PALETTE } from '../constants';
import { Copy, Eye, TrendingUp, Flame } from 'lucide-react';

interface StatsDashboardProps {
  prompts: PromptEntry[];
}

const StatsDashboard: React.FC<StatsDashboardProps> = ({ prompts }) => {

  // Prepare Data for Type Distribution
  const typeData = Object.values(OutputType).map(type => ({
    name: type,
    value: prompts.filter(p => p.outputType === type).length
  })).filter(d => d.value > 0);

  // Prepare Data for Scene Distribution
  const sceneCounts: Record<string, number> = {};
  prompts.forEach(p => {
    const scene = p.sceneTag;
    sceneCounts[scene] = (sceneCounts[scene] || 0) + 1;
  });
  const sceneData = Object.entries(sceneCounts).map(([name, value]) => ({ name, value }));

  // Hot Prompts - sorted by copy count
  const hotPrompts = [...prompts]
    .sort((a, b) => (b.copyCount || 0) - (a.copyCount || 0))
    .slice(0, 5);

  // Total stats
  const totalCopies = prompts.reduce((sum, p) => sum + (p.copyCount || 0), 0);
  const totalViews = prompts.reduce((sum, p) => sum + (p.viewCount || 0), 0);

  const COLORS = [COLOR_PALETTE.primary, COLOR_PALETTE.success, COLOR_PALETTE.warning, COLOR_PALETTE.danger, COLOR_PALETTE.secondary];

  if (prompts.length === 0) return null;

  return (
    <div className="mb-8 space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <TrendingUp size={14} />
            <span>总提示词</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{prompts.length}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Copy size={14} />
            <span>总复制次数</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalCopies}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Eye size={14} />
            <span>总浏览次数</span>
          </div>
          <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalViews}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-1">
            <Flame size={14} />
            <span>热门率</span>
          </div>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {prompts.length > 0 ? Math.round((hotPrompts.filter(p => (p.copyCount || 0) > 0).length / prompts.length) * 100) : 0}%
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Type Distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">输出类型分布</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {typeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {typeData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }}></span>
                <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Scene Distribution */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">应用场景</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sceneData} layout="vertical" margin={{ left: 10 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9', opacity: 0.2 }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                  {sceneData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLOR_PALETTE.primary} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Hot Prompts Leaderboard */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Flame size={14} className="text-orange-500" />
            热门提示词
          </h3>
          <div className="space-y-2">
            {hotPrompts.length === 0 || hotPrompts.every(p => !p.copyCount) ? (
              <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
                暂无使用数据
              </div>
            ) : (
              hotPrompts.map((prompt, index) => (
                <div
                  key={prompt.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                      index === 1 ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400' :
                        index === 2 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' :
                          'bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                    }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                      {prompt.title}
                    </div>
                    <div className="text-xs text-slate-400">{prompt.outputType}</div>
                  </div>
                  <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                    <Copy size={12} />
                    <span className="text-sm font-medium">{prompt.copyCount || 0}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
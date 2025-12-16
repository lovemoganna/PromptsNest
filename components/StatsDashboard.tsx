import React from 'react';
import { PromptEntry, OutputType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { COLOR_PALETTE } from '../constants';
import * as d3 from 'd3-scale'; 

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

  const COLORS = [COLOR_PALETTE.primary, COLOR_PALETTE.success, COLOR_PALETTE.warning, COLOR_PALETTE.danger, COLOR_PALETTE.secondary];

  if (prompts.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Type Distribution */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">输出类型分布</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
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
        <div className="flex justify-center gap-4 mt-2">
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
        <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-4">热门应用场景</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sceneData} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={100} 
                tick={{ fontSize: 11, fill: '#64748b' }} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                 cursor={{ fill: '#f1f5f9', opacity: 0.2 }}
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                 {sceneData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLOR_PALETTE.primary} opacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default StatsDashboard;
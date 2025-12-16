import React from 'react';

interface TagBadgeProps {
  label: string;
  type?: 'scene' | 'tech' | 'style' | 'custom';
  onClick?: (e: React.MouseEvent) => void;
}

const TagBadge: React.FC<TagBadgeProps> = ({ label, type = 'custom', onClick }) => {
  const getStyles = () => {
    switch (type) {
      case 'scene':
        return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-900/50';
      case 'tech':
        return 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800 dark:hover:bg-purple-900/50';
      case 'style':
        return 'bg-pink-100 text-pink-800 border-pink-200 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800 dark:hover:bg-pink-900/50';
      case 'custom':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700';
    }
  };

  return (
    <span 
      onClick={onClick}
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border transition-colors ${getStyles()} ${onClick ? 'cursor-pointer' : ''} mr-1 mb-1`}
    >
      {label}
    </span>
  );
};

export default TagBadge;
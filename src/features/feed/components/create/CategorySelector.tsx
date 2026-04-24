import React from 'react';
import { 
  FileText, 
  CheckSquare, 
  BarChart3, 
  Megaphone,
  Calendar 
} from 'lucide-react';
import { PostCategory } from '../../types';

import { motion } from 'framer-motion';

interface CategorySelectorProps {
  selected: PostCategory;
  onSelect: (category: PostCategory) => void;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({ selected, onSelect }) => {
  const categories = [
    { id: PostCategory.NORMAL, label: 'Feed', icon: FileText, color: 'var(--primary)' },
    { id: PostCategory.TASK, label: 'Task', icon: CheckSquare, color: '#f59e0b' },
    { id: PostCategory.EVENT, label: 'Event', icon: Calendar, color: '#8b5cf6' },
    { id: PostCategory.POLL, label: 'Poll', icon: BarChart3, color: '#10b981' },
    { id: PostCategory.ANNOUNCEMENT, label: 'Announcement', icon: Megaphone, color: '#ef4444' },
  ];

  return (
    <div className="category-selector">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isActive = selected === cat.id;

        return (
          <button
            key={cat.id}
            className={`category-pill ${isActive ? 'active' : ''}`}
            onClick={() => onSelect(cat.id)}
            style={{ '--active-color': cat.color } as React.CSSProperties}
          >
            {isActive && (
              <motion.div
                layoutId="active-category-pill"
                className="category-active-bg"
                initial={false}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <div className="category-pill-content">
              <Icon size={18} color={isActive ? cat.color : 'var(--text-muted)'} />
              <span>{cat.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
};

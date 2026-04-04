import React, { useState } from 'react';
import { 
  Check, 
  Clock, 
  AlertCircle, 
  MoreHorizontal 
} from 'lucide-react';
import type { Post as PostType } from '../../feed/types';
import { TaskStatus } from '../../feed/types';
import { useFormatDate } from '../../../common/hooks/useFormatDate';
import '../pages/TasksPage.css';

interface TaskCardProps {
  post: PostType;
}

export const TaskCard: React.FC<TaskCardProps> = ({ post: initialPost }) => {
  const [post, setPost] = useState(initialPost);
  const { format } = useFormatDate();
  
  const task = post.task;
  if (!task) return null;

  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isOverdue = task.dueAt && new Date(task.dueAt) < new Date() && !isCompleted;
  const isUrgent = task.priority === 'URGENT' || task.priority === 'High';

  const toggleComplete = () => {
    if (!post.task) return;
    
    setPost(prev => ({
      ...prev,
      task: prev.task ? {
        ...prev.task,
        status: prev.task.status === TaskStatus.COMPLETED ? TaskStatus.OPEN : TaskStatus.COMPLETED
      } : undefined
    }));
  };

  return (
    <div className={`task-card ${isCompleted ? 'completed' : ''}`}>
      <div 
        className={`task-checkbox ${isCompleted ? 'checked' : ''}`}
        onClick={toggleComplete}
      >
        {isCompleted && <Check size={14} color="#ffffff" strokeWidth={3} />}
      </div>

      <div className="task-card-content">
        <div className="task-title">{task.title}</div>
        
        <div className="task-meta">
          <div className={`task-badge ${isUrgent ? 'urgent' : 'medium'}`}>
            {task.priority}
          </div>
          {task.dueAt && (
            <div className={`task-deadline ${isOverdue ? 'overdue' : ''}`}>
              {isOverdue ? <AlertCircle size={12} /> : <Clock size={12} />}
              <span>Due: {format(task.dueAt)}</span>
            </div>
          )}
          <div className="task-category">{post.postCategory}</div>
        </div>
      </div>

      <button className="more-btn" style={{ position: 'absolute', top: '16px', right: '16px' }}>
        <MoreHorizontal size={18} color="var(--text-sidebar)" />
      </button>
    </div>
  );
};


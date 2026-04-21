import React from 'react';
import { TaskCard } from '../components/TaskCard';
import { demoFeedItems } from '../../feed/data';
import { PostCategory, TaskStatus } from '../../feed/types';
import { 
  Filter, 
  Plus, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import './TasksPage.css';

export const TasksPage: React.FC = () => {
  const taskPosts = demoFeedItems.filter(p => p.postCategory === PostCategory.TASK);
  const outstandingTasks = taskPosts.filter(p => p.task?.status !== TaskStatus.COMPLETED);
  const finalizedTasks = taskPosts.filter(p => p.task?.status === TaskStatus.COMPLETED);

  return (
    <div className="tasks-page">
        <header className="tasks-header">
          <div className="header-text">
            <h2>Sync Tasks</h2>
          </div>
          <div className="header-actions" style={{ display: 'flex', gap: '12px' }}>
            <button className="icon-btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', fontSize: '14px', fontWeight: '500' }}>
              <Filter size={18} />
              <span>Filter</span>
            </button>
            <button className="primary-btn compact" style={{ gap: '8px' }}>
              <Plus size={18} />
              <span>New Task</span>
            </button>
          </div>
        </header>

        <section className="tasks-stats">
          <div className="stat-card">
            <div className="label">Active Projects</div>
            <div className="value">{taskPosts.length}</div>
          </div>
          <div className="stat-card">
            <div className="label">Tasks Pending</div>
            <div className="value">{outstandingTasks.length}</div>
          </div>
          <div className="stat-card overdue">
            <div className="label">Overdue Items</div>
            <div className="value">3</div>
          </div>
        </section>

        <div className="tasks-container">
          <div className="tasks-section">
            <h3 className="tasks-section-title">
              <Clock size={18} color="var(--primary)" />
              <span>Outstanding Syncs</span>
            </h3>
            <div className="tasks-grid">
              {outstandingTasks.map(post => (
                <TaskCard key={post.id} post={post} />
              ))}
            </div>
          </div>

          <div className="tasks-section" style={{ marginTop: '40px' }}>
            <h3 className="tasks-section-title">
              <CheckCircle2 size={18} color="#22c55e" />
              <span>Finalized Syncs</span>
            </h3>
            <div className="tasks-grid">
              {finalizedTasks.map(post => (
                <TaskCard key={post.id} post={post} />
              ))}
            </div>
          </div>
        </div>
      </div>
  );
};


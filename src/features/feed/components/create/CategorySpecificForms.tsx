import React from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PostCategory } from '../../types';
import { PostPriority } from '../../types/post-request.types';

interface Props {
  category: PostCategory;
  data: any;
  onChange: (data: any) => void;
}

export const CategorySpecificForms: React.FC<Props> = ({ category, data, onChange }) => {
  const [focusedField, setFocusedField] = React.useState<string | null>(null);

  if (category === PostCategory.NORMAL) return null;

  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const SelectionHint: React.FC<{ id: string; text: string; hasValue: boolean }> = ({ id, text, hasValue }) => (
    <AnimatePresence>
      {(focusedField !== id && hasValue) && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, height: 0 }}
          animate={{ opacity: 1, scale: 1, height: 'auto' }}
          exit={{ opacity: 0, scale: 0.95, height: 0 }}
          className="context-info-hint selection-summary"
        >
          <div className="hint-text">{text}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const renderTaskForm = () => (
    <div className="specific-form task-form">
      <h3>Assign New Task</h3>
      <div className="form-group">
        <label>Task Title</label>
        <input 
          type="text" 
          placeholder="What needs to be done?"
          value={data.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
        />
      </div>
      <div className="form-row">
        <div className="form-group half">
          <label><Calendar size={14} /> Deadline</label>
          <input 
            type="datetime-local" 
            value={data.dueAt || ''}
            min={new Date().toISOString().slice(0, 16)}
            onChange={(e) => updateField('dueAt', e.target.value)}
            onFocus={() => setFocusedField('dueAt')}
            onBlur={() => setFocusedField(null)}
          />
        </div>
        <div className="form-group half">
          <label><AlertCircle size={14} /> Priority</label>
          <select 
            value={data.priority || PostPriority.MEDIUM}
            onChange={(e) => updateField('priority', e.target.value)}
            onFocus={() => setFocusedField('prio-task')}
            onBlur={() => setFocusedField(null)}
          >
            {Object.values(PostPriority).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <SelectionHint 
            id="prio-task" 
            text={(data.priority === PostPriority.HIGH || data.priority === PostPriority.CRITICAL) 
              ? "• High/Critical will trigger push notification to assignees."
              : `${data.priority || 'Medium'} priority selects designated alert level.`}
            hasValue={true} 
          />
        </div>
      </div>
    </div>
  );

  const renderPollForm = () => {
    const options = data.options || ['', ''];
    
    const updateOption = (index: number, val: string) => {
      const newOptions = [...options];
      newOptions[index] = val;
      updateField('options', newOptions);
    };

    const addOption = () => updateField('options', [...options, '']);
    const removeOption = (index: number) => updateField('options', options.filter((_: any, i: number) => i !== index));

    return (
      <div className="specific-form poll-form">
        <h3>Interactive Poll Options</h3>
        <div className="form-group">
          <label>Poll Question</label>
          <input 
            type="text" 
            placeholder="Ask your organization..."
            value={data.question || ''}
            onChange={(e) => updateField('question', e.target.value)}
          />
        </div>
        <div className="options-grid">
          {options.map((opt: string, i: number) => (
            <div key={i} className="poll-option-input">
              <input 
                type="text" 
                placeholder={`Option ${i + 1}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
              />
              {options.length > 2 && (
                <button onClick={() => removeOption(i)}><Trash2 size={14} /></button>
              )}
            </div>
          ))}
          <button className="add-option-btn" onClick={addOption}>
            <Plus size={14} /> Add Option
          </button>
        </div>
      </div>
    );
  };

  const renderAnnouncementForm = () => {
    return (
      <div className="specific-form announcement-form structured">
        <h3>Official Announcement Setup</h3>
        
        <div className="form-row">
          <div className="form-group full">
            <label><AlertCircle size={14} /> Priority Level</label>
            <select 
              value={data.priority || PostPriority.MEDIUM}
              onChange={(e) => updateField('priority', e.target.value)}
              onFocus={() => setFocusedField('prio-announcement')}
              onBlur={() => setFocusedField(null)}
            >
              <option value={PostPriority.LOW}>Information</option>
              <option value={PostPriority.MEDIUM}>Standard</option>
              <option value={PostPriority.HIGH}>Important</option>
              <option value={PostPriority.CRITICAL}>Urgent</option>
            </select>
            <SelectionHint 
              id="prio-announcement" 
              text={(data.priority === PostPriority.HIGH || data.priority === PostPriority.CRITICAL) 
                ? "• High/Critical will trigger push notification to assignees."
                : `Priority set to ${data.priority || 'Medium'}. High/Urgent pins to feed.`} 
              hasValue={true} 
            />
          </div>
        </div>

        <div className="form-footer-options">
          <label className="checkbox-group">
            <input 
              type="checkbox" 
              checked={data.requiresAcknowledgement || false}
              onChange={(e) => updateField('requiresAcknowledgement', e.target.checked)}
            />
            <span>Requires Mandatory Acknowledgment</span>
          </label>
          
          <label className="checkbox-group">
            <input 
              type="checkbox" 
              checked={data.isPinned || false}
              onChange={(e) => updateField('isPinned', e.target.checked)}
            />
            <span>Pin this Announcement</span>
          </label>
        </div>

        {data.isPinned && (
          <div className="form-group animated-entry">
            <label>Auto-unpin After</label>
            <input 
              type="datetime-local" 
              value={data.unpinAt || ''}
              min={new Date().toISOString().slice(0, 16)}
              onChange={(e) => updateField('unpinAt', e.target.value)}
              onFocus={() => setFocusedField('unpinAt')}
              onBlur={() => setFocusedField(null)}
            />
            <SelectionHint id="unpinAt" text="• Auto-unpin scheduled. Announcement will move to standard feed." hasValue={!!data.unpinAt} />
          </div>
        )}
      </div>
    );
  };

  const renderEventForm = () => (
    <div className="specific-form event-form">
      <h3>Sync New Event</h3>
      <div className="form-group">
        <label>Event Title</label>
        <input 
          type="text" 
          placeholder="e.g. Weekly Standup, Product Launch..."
          value={data.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
        />
      </div>
      <div className="form-group">
        <label>Description (Optional)</label>
        <textarea 
          placeholder="Provide more details about the event..."
          value={data.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          rows={2}
        />
      </div>
      
      <div className="form-row">
        <div className="form-group half">
          <label><Calendar size={14} /> Start Time</label>
          <input 
            type="datetime-local" 
            value={data.startTime || ''}
            min={new Date().toISOString().slice(0, 16)}
            onChange={(e) => updateField('startTime', e.target.value)}
            onFocus={() => setFocusedField('startTime')}
            onBlur={() => setFocusedField(null)}
          />
          <SelectionHint id="startTime" text="• Sync scheduled. Active for targeted audience." hasValue={!!data.startTime} />
        </div>
        <div className="form-group half">
          <label><Clock size={14} /> End Time</label>
          <input 
            type="datetime-local" 
            value={data.endTime || ''}
            min={data.startTime || new Date().toISOString().slice(0, 16)}
            onChange={(e) => updateField('endTime', e.target.value)}
            onFocus={() => setFocusedField('endTime')}
            onBlur={() => setFocusedField(null)}
          />
          <SelectionHint id="endTime" text="• Conclusion time set. Will move to archives." hasValue={!!data.endTime} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group half">
          <label>Location / Venue</label>
          <input 
            type="text" 
            placeholder="e.g. Room 402, Zoom Link..."
            value={data.location || ''}
            onChange={(e) => updateField('location', e.target.value)}
          />
        </div>
        <div className="form-group half">
          <label>Max Participants</label>
          <input 
            type="number" 
            placeholder="No limit"
            value={data.maxParticipants || ''}
            onChange={(e) => updateField('maxParticipants', e.target.value ? parseInt(e.target.value) : undefined)}
            onFocus={() => setFocusedField('maxParticipants')}
            onBlur={() => setFocusedField(null)}
          />
          <SelectionHint id="maxParticipants" text={`• Attendance limited to ${data.maxParticipants}.`} hasValue={!!data.maxParticipants} />
        </div>
      </div>

      <div className="form-footer-options">
        <div className="toggle-group-modern">
          <label className="checkbox-group">
            <input 
              type="checkbox" 
              checked={data.isVirtual || false}
              onChange={(e) => updateField('isVirtual', e.target.checked)}
            />
            <span>Virtual Event</span>
          </label>
          
          {data.isVirtual && (
            <div className="nested-input animated-entry">
               <input 
                type="text" 
                placeholder="Meeting Link (Zoom, Teams, etc.)"
                value={data.joinUrl || ''}
                onChange={(e) => updateField('joinUrl', e.target.value)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="category-forms-container">
      {category === PostCategory.TASK && renderTaskForm()}
      {category === PostCategory.EVENT && renderEventForm()}
      {category === PostCategory.POLL && renderPollForm()}
      {category === PostCategory.ANNOUNCEMENT && renderAnnouncementForm()}
    </div>
  );
};

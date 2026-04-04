import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Trash2, 
  Calendar, 
  AlertCircle,
  Search,
  Users,
  X
} from 'lucide-react';
import { PostCategory } from '../../types';
import { PostPriority, AnnouncementScope } from '../../types/post-request.types';
import { mockDepartments, mockTeams } from '../../data';

interface Props {
  category: PostCategory;
  data: any;
  onChange: (data: any) => void;
}

export const CategorySpecificForms: React.FC<Props> = ({ category, data, onChange }) => {
  if (category === PostCategory.NORMAL) return null;

  const updateField = (field: string, value: any) => {
    onChange({ ...data, [field]: value });
  };

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
            onChange={(e) => updateField('dueAt', e.target.value)}
          />
        </div>
        <div className="form-group half">
          <label><AlertCircle size={14} /> Priority</label>
          <select 
            value={data.priority || PostPriority.MEDIUM}
            onChange={(e) => updateField('priority', e.target.value)}
          >
            {Object.values(PostPriority).map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
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
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const unifiedPool = useMemo(() => [
      ...mockDepartments.map(d => ({ ...d, id: d.id, name: d.name, type: 'DEPT', code: (d as any).code })),
      ...mockTeams.map(t => ({ ...t, id: t.id, name: t.name, type: 'TEAM' }))
    ], []);

    const filteredTargets = useMemo(() => {
      const query = searchQuery.toLowerCase();
      if (!query) return [];
      return unifiedPool.filter(t => t.name.toLowerCase().includes(query));
    }, [searchQuery, unifiedPool]);

    const selectedTargets = data.targets || [];

    const handleSelectTarget = (target: any) => {
      if (selectedTargets.some((t: any) => t.id === target.id)) return;
      
      onChange({ 
        ...data, 
        targets: [...selectedTargets, { id: target.id, name: target.name, type: target.type }] 
      });
      setSearchQuery('');
    };

    const handleRemoveTarget = (id: string) => {
      onChange({ 
        ...data, 
        targets: selectedTargets.filter((t: any) => t.id !== id) 
      });
    };

    return (
      <div className="specific-form announcement-form structured">
        <h3>Official Announcement Setup</h3>
        <div className="form-group">
          <label>Announcement Title</label>
          <input 
            type="text" 
            placeholder="e.g. Q3 Financial Update, Office Relocation..."
            value={data.title || ''}
            onChange={(e) => updateField('title', e.target.value)}
          />
        </div>
        <div className="form-row">
          <div className="form-group half">
            <label>Visibility Scope</label>
            <select 
              value={data.scope || AnnouncementScope.ORGANIZATION}
              onChange={(e) => {
                onChange({
                  ...data,
                  scope: e.target.value,
                  targets: []
                });
              }}
            >
              <option value={AnnouncementScope.ORGANIZATION}>Entire Organization</option>
              <option value={AnnouncementScope.DEPARTMENT}>Targeted Communication</option>
            </select>
          </div>
          <div className="form-group half">
            <label><AlertCircle size={14} /> Priority Level</label>
            <select 
              value={data.priority || PostPriority.MEDIUM}
              onChange={(e) => updateField('priority', e.target.value)}
            >
              <option value={PostPriority.LOW}>Information</option>
              <option value={PostPriority.MEDIUM}>Standard</option>
              <option value={PostPriority.HIGH}>Important</option>
              <option value={PostPriority.CRITICAL}>Urgent</option>
            </select>
          </div>
        </div>

        {/* Dynamic Target Selection (Multi-select) */}
        {data.scope === AnnouncementScope.DEPARTMENT && (
          <div className="form-group target-selector-group multiselect">
            <label>Recipient Departments & Teams</label>
            
            {selectedTargets.length > 0 && (
              <div className="selected-targets-tray">
                {selectedTargets.map((target: any) => (
                  <span key={target.id} className="target-pill-interactive">
                    <span className={`type-badge-mini ${target.type}`}>{target.type}</span>
                    <span className="name">{target.name}</span>
                    <button onClick={() => handleRemoveTarget(target.id)} className="pill-remove">
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="target-search-container">
              <div className="target-search-input-wrapper">
                <Search size={14} />
                <input 
                  type="text" 
                  placeholder="Type to add departments or teams..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                />
              </div>
              
              {isDropdownOpen && (searchQuery || filteredTargets.length > 0) && (
                <div className="target-results-dropdown shadow-xl">
                  {filteredTargets.map(target => (
                    <button 
                      key={target.id}
                      className="target-result-item"
                      onClick={() => handleSelectTarget(target)}
                    >
                      <div className="item-left-content">
                        <Users size={14} className="type-icon" />
                        <div className="target-info">
                          <span className="target-name">{target.name}</span>
                          <span className={`target-type-label ${target.type}`}>
                            {target.type === 'DEPT' ? 'Department' : 'Team'}
                          </span>
                        </div>
                      </div>
                      {selectedTargets.some((t: any) => t.id === target.id) && (
                        <span className="already-added">Added</span>
                      )}
                    </button>
                  ))}
                  {filteredTargets.length === 0 && searchQuery && (
                    <div className="target-no-results">No entities found for "{searchQuery}"</div>
                  ) }
                </div>
              )}
            </div>
            {isDropdownOpen && <div className="target-dropdown-backdrop" onClick={() => setIsDropdownOpen(false)} />}
          </div>
        )}

        <div className="form-group">
          <label>Official Statement Body</label>
          <textarea 
            className="announcement-content"
            placeholder="Detailed official communication content..."
            value={data.content || ''}
            onChange={(e) => updateField('content', e.target.value)}
            rows={6}
          />
        </div>
        <div className="form-footer-options">
          <label className="checkbox-group">
            <input 
              type="checkbox" 
              id="req-ack"
              checked={data.requiresAcknowledgement || false}
              onChange={(e) => updateField('requiresAcknowledgement', e.target.checked)}
            />
            <span>Requires Mandatory Acknowledgment</span>
          </label>
        </div>
      </div>
    );
  };

  const renderEventForm = () => (
    <div className="specific-form event-form">
      <h3>Sync New Event</h3>
      <div className="form-group">
        <label>Event Name</label>
        <input 
          type="text" 
          placeholder="e.g. Weekly Standup, Product Launch..."
          value={data.title || ''}
          onChange={(e) => updateField('title', e.target.value)}
        />
      </div>
      <div className="form-row">
        <div className="form-group half">
          <label><Calendar size={14} /> Start {data.isAllDay ? 'Date' : 'Time'}</label>
          <input 
            type={data.isAllDay ? "date" : "datetime-local"} 
            value={data.startAt || ''}
            onChange={(e) => updateField('startAt', e.target.value)}
          />
        </div>
        <div className="form-group half">
          <label><Calendar size={14} /> End {data.isAllDay ? 'Date' : 'Time'}</label>
          <input 
            type={data.isAllDay ? "date" : "datetime-local"} 
            value={data.endAt || ''}
            onChange={(e) => updateField('endAt', e.target.value)}
          />
        </div>
      </div>
      <div className="form-footer-options">
        <label className="checkbox-group">
          <input 
            type="checkbox" 
            id="all-day-check"
            checked={data.isAllDay || false}
            onChange={(e) => updateField('isAllDay', e.target.checked)}
          />
          <span>All-day Event</span>
        </label>
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

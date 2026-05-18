import React, { useState } from 'react';
import TopBar from '../components/TopBar';
import { useOutletContext } from 'react-router-dom';
import { LayoutContextType } from '../App';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Edit2, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  template_name: string;
  description: string;
  project_id: string;
  recurrence_rule: string;
}

export default function RecurringTemplatesView() {
  const { onMenuClick } = useOutletContext<LayoutContextType>();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);

  // Form State
  const [templateName, setTemplateName] = useState('');
  const [description, setDescription] = useState('');
  const [recurrenceRule, setRecurrenceRule] = useState('Daily');

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ['templates'],
    queryFn: async () => {
      const token = localStorage.getItem('taskops_token');
      const res = await fetch('/api/templates', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    }
  });

  const createMutation = useMutation({
    mutationFn: async (newTemplate: Partial<Template>) => {
      const token = localStorage.getItem('taskops_token');
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newTemplate)
      });
      if (!res.ok) throw new Error('Failed to create template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template created successfully');
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (updated: Partial<Template> & { id: string }) => {
      const token = localStorage.getItem('taskops_token');
      const res = await fetch(`/api/templates/${updated.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updated)
      });
      if (!res.ok) throw new Error('Failed to update template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template updated successfully');
      resetForm();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = localStorage.getItem('taskops_token');
      const res = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete template');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success('Template deleted successfully');
    }
  });

  const resetForm = () => {
    setTemplateName('');
    setDescription('');
    setRecurrenceRule('Daily');
    setEditingTemplate(null);
    setIsModalOpen(false);
  };

  const handleEdit = (t: Template) => {
    setEditingTemplate(t);
    setTemplateName(t.template_name || '');
    setDescription(t.description || '');
    setRecurrenceRule(t.recurrence_rule || 'Daily');
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) {
      toast.error('Template name is required');
      return;
    }

    const payload = {
      template_name: templateName,
      description,
      recurrence_rule: recurrenceRule
    };

    if (editingTemplate) {
      updateMutation.mutate({ id: editingTemplate.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <TopBar title="Recurring Templates" icon="templates" onMenuClick={onMenuClick} />
      
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-black text-slate-800">Task Templates</h2>
            <p className="text-sm font-medium text-slate-500">Manage recurring task schedules</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl font-bold transition-all shadow-glow active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">New Template</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-[2rem] border border-slate-100 shadow-soft">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-black text-slate-700 mb-2">No Templates Yet</h3>
            <p className="text-sm text-slate-500 font-medium">Create your first recurring task template to automate workflows.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {templates.map(t => (
              <div key={t.id} className="bg-white p-5 rounded-[1.5rem] shadow-soft border border-slate-100 relative group">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold text-slate-800 text-lg">{t.template_name}</h3>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(t)}
                      className="p-2 bg-slate-50 hover:bg-primary-50 hover:text-primary-600 rounded-lg transition-colors text-slate-400"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm('Delete this template?')) {
                          deleteMutation.mutate(t.id);
                        }
                      }}
                      className="p-2 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors text-slate-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {t.description && (
                  <p className="text-sm text-slate-500 mb-4 line-clamp-2">{t.description}</p>
                )}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-bold w-max border border-indigo-100">
                  <Clock className="w-3.5 h-3.5" />
                  {t.recurrence_rule || 'Daily'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] p-6 shadow-2xl relative overflow-hidden">
            <h3 className="text-xl font-black text-slate-800 mb-6">
              {editingTemplate ? 'Edit Template' : 'New Template'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Template Name</label>
                <input 
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="e.g., Morning Display Check"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Description (Optional)</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full h-24 resize-none bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-primary-500/20"
                  placeholder="Details of the task"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest pl-1">Recurrence Schedule</label>
                <select 
                  value={recurrenceRule.startsWith('Custom Weekly') ? 'Custom Weekly' : recurrenceRule}
                  onChange={e => setRecurrenceRule(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="Daily">Daily</option>
                  <option value="Daily (Skip Mondays)">Daily (Skip Mondays)</option>
                  <option value="Daily (Skip Tuesdays)">Daily (Skip Tuesdays)</option>
                  <option value="Daily (Skip Wednesdays)">Daily (Skip Wednesdays)</option>
                  <option value="Daily (Skip Thursdays)">Daily (Skip Thursdays)</option>
                  <option value="Daily (Skip Fridays)">Daily (Skip Fridays)</option>
                  <option value="Daily (Skip Saturdays)">Daily (Skip Saturdays)</option>
                  <option value="Daily (Skip Sundays)">Daily (Skip Sundays)</option>
                  <option value="Daily (Skip Saturdays & Sundays)">Daily (Skip Sat & Sun)</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                  <option value="Custom Weekly">Custom Weekly...</option>
                </select>
                
                {recurrenceRule.startsWith('Custom Weekly') && (
                  <div className="mt-3 p-3 bg-white border border-slate-200 rounded-xl">
                    <p className="text-xs font-bold text-slate-500 mb-2">Select Active Days:</p>
                    <div className="flex flex-wrap gap-2">
                       {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                          const isCustomWeeklyExact = recurrenceRule === 'Custom Weekly';
                          const currentDays = isCustomWeeklyExact ? [] : recurrenceRule.replace('Custom Weekly (', '').replace(')', '').split(', ').filter(Boolean);
                          const isActive = currentDays.includes(day);
                          
                          return (
                            <button
                              type="button"
                              key={day}
                              onClick={() => {
                                 let newDays = [...currentDays];
                                 if (newDays.includes(day)) {
                                    newDays = newDays.filter(d => d !== day);
                                 } else {
                                    newDays.push(day);
                                 }
                                 
                                 if (newDays.length === 0) {
                                    setRecurrenceRule('Custom Weekly');
                                 } else {
                                    // sort days based on standard week order
                                    const weekOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                                    newDays.sort((a, b) => weekOrder.indexOf(a) - weekOrder.indexOf(b));
                                    setRecurrenceRule(`Custom Weekly (${newDays.join(', ')})`);
                                 }
                              }}
                              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${isActive ? 'bg-primary-100 text-primary-700 border border-primary-200' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:bg-slate-100'}`}
                            >
                              {day}
                            </button>
                          )
                       })}
                    </div>
                  </div>
                )}
                
                <p className="text-xs text-slate-500 font-medium pl-1 mt-1">This defines when this task is automatically generated for assignees.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-3 bg-primary-600 text-white text-sm font-black rounded-xl hover:bg-primary-700 transition-all shadow-glow active:scale-95 disabled:opacity-50"
                >
                  {editingTemplate ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import TopBar from '../components/TopBar';
import { useOutletContext } from 'react-router-dom';
import { LayoutContextType } from '../App';
import { Download, FileSpreadsheet, FileText, CheckCircle2, Loader2, Table2, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

type PreviewType = 'tasks' | 'members' | 'projects' | 'audit';

const PREVIEW_DATA = {
  tasks: [
    { task_id: 'tsk_001', title: 'Restock dairy section', status: 'done', priority: 'high', assignee_name: 'Linda (Employee)', department_name: 'Logistics', due_date: '2026-04-20T12:00:00Z', completed_at: '2026-04-20T11:45:00Z', requires_approval: 'true', approver_name: 'David (Manager)', proof_type: 'photo', proof_uploaded: 'true', time_spent_seconds: '1800', geofence_breach: 'false', checklist_completed: '3', checklist_total: '3' },
    { task_id: 'tsk_002', title: 'Clean front windows', status: 'inProgress', priority: 'medium', assignee_name: 'Tom (Employee)', department_name: 'Maintenance', due_date: '2026-04-21T17:00:00Z', completed_at: 'null', requires_approval: 'false', approver_name: 'null', proof_type: 'none', proof_uploaded: 'false', time_spent_seconds: '450', geofence_breach: 'false', checklist_completed: '0', checklist_total: '0' }
  ],
  members: [
    { user_id: 'usr_001', name: 'Moksheet Shah', email: 'moksheet@demo.com', role: 'owner', department_name: 'All', join_date: '2026-01-15T09:00:00Z', is_active: 'true', active_tasks: '0', completed_tasks: '45', avg_completion_days: '0.8', geofence_compliance_rate: '100' },
    { user_id: 'usr_002', name: 'David', email: 'david@globaltech.demo', role: 'manager', department_name: 'Logistics', join_date: '2026-02-01T10:30:00Z', is_active: 'true', active_tasks: '5', completed_tasks: '120', avg_completion_days: '1.2', geofence_compliance_rate: '98.5' }
  ],
  projects: [
    { project_id: 'prj_001', name: 'Diwali Sale Prep', status: 'Active', is_private: 'false', department_names: 'Sales, Logistics', total_tasks: '42', completed_tasks: '18', completion_rate: '42.8', total_time_hours: '45.5' },
    { project_id: 'prj_002', name: 'Q3 Inventory Audit', status: 'On Hold', is_private: 'true', department_names: 'Inventory', total_tasks: '15', completed_tasks: '0', completion_rate: '0.0', total_time_hours: '0.0' }
  ],
  audit: [
    { event_id: 'evt_991', timestamp: '2026-04-19T08:15:22Z', event_key: 'USER_LOGIN', severity: 'Info', acting_user_name: 'Moksheet Shah', acting_user_role: 'owner', resource_type: 'user', resource_id: 'usr_001', description: 'User authenticated into the app', ip_address: '192.168.1.100' },
    { event_id: 'evt_992', timestamp: '2026-04-19T10:42:01Z', event_key: 'GEOFENCE_BREACH', severity: 'Warning', acting_user_name: 'Tom (Employee)', acting_user_role: 'employee', resource_type: 'task', resource_id: 'tsk_002', description: 'Task completed outside allowed radius', ip_address: '10.0.0.55' }
  ]
};

export default function ExportDataView() {
  const { onMenuClick } = useOutletContext<LayoutContextType>();
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);
  const [activePreview, setActivePreview] = useState<PreviewType>('tasks');

  const handleExport = (format: string) => {
    setIsExporting(true);
    setExportComplete(false);
    
    setTimeout(() => {
      setIsExporting(false);
      setExportComplete(true);
      toast.success(`Demo data exported successfully in ${format} format.`);
    }, 1500);
  };

  const renderPreviewTable = () => {
    const data = PREVIEW_DATA[activePreview];
    if (!data || data.length === 0) return null;
    
    const headers = Object.keys(data[0]);

    return (
      <div className="overflow-x-auto pb-4 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {headers.map(h => (
                <th key={h} className="px-3 py-2 text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 border-b border-slate-200 whitespace-nowrap">
                  {h.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors border-b border-slate-100 last:border-0">
                {headers.map(h => (
                  <td key={h} className="px-3 py-3 text-xs font-medium text-slate-700 whitespace-nowrap">
                    {(row as any)[h]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <TopBar title="Export Data" onMenuClick={onMenuClick} />
      
      <div className="p-4 sm:p-5 flex-1 overflow-y-auto no-scrollbar pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
            <div className="p-6 sm:p-8 text-center border-b border-slate-100 relative z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-inner border border-indigo-100">
                <Download className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 mb-2 tracking-tight">Export Workspace Data</h2>
              <p className="text-sm font-bold text-slate-500 max-w-sm mx-auto uppercase tracking-widest">
                Download your records in standard formats
              </p>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 relative z-10">
              <button 
                onClick={() => !isExporting && handleExport('CSV')}
                disabled={isExporting}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 text-left transition-all active:scale-[0.98] group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600 group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-sm">Download CSV</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Spreadsheet Format</p>
                </div>
              </button>

              <button 
                onClick={() => !isExporting && handleExport('PDF')}
                disabled={isExporting}
                className="flex items-center gap-4 p-4 rounded-2xl border-2 border-slate-100 hover:border-rose-500 hover:bg-rose-50 text-left transition-all active:scale-[0.98] group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center group-hover:bg-rose-500 transition-colors">
                  <FileText className="w-5 h-5 text-rose-600 group-hover:text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-sm">Download PDF</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document Summary</p>
                </div>
              </button>
            </div>

            <AnimatePresence>
              {exportComplete && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mx-6 mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span className="text-sm font-bold text-emerald-800">Demo export generated. Check your console.</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Data Preview Section */}
          <div className="bg-white rounded-3xl shadow-soft border border-slate-100 overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                  <Table2 className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="font-black text-slate-800">Export Schema Previews</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sample of what you will receive</p>
                </div>
              </div>
            </div>

            <div className="flex overflow-x-auto border-b border-slate-100 no-scrollbar">
              {(['tasks', 'members', 'projects', 'audit'] as PreviewType[]).map(type => (
                <button
                  key={type}
                  onClick={() => setActivePreview(type)}
                  className={`px-6 py-4 text-sm font-bold uppercase tracking-widest whitespace-nowrap border-b-2 transition-colors ${activePreview === type ? 'border-primary-500 text-primary-600 bg-primary-50/30' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="p-0 bg-slate-50/30">
              {renderPreviewTable()}
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1">
                Showing 2 demo records out of total <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

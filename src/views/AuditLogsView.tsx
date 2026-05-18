import React, { useState } from 'react';
import TopBar from '../components/TopBar';
import { useOutletContext } from 'react-router-dom';
import { LayoutContextType } from '../App';
import { Activity, Clock, User, Download, AlertTriangle, Info, AlertCircle, Search, Filter } from 'lucide-react';
import { format, subMinutes, subHours, subDays } from 'date-fns';

interface AuditLog {
  event_id: string;
  timestamp: Date;
  event_key: string;
  severity: 'Info' | 'Warning' | 'Critical';
  acting_user_name: string;
  acting_user_role: string;
  resource_type: string;
  description: string;
  ip_address?: string;
  device?: string;
}

const now = new Date();

const DEMO_LOGS: AuditLog[] = [
  { event_id: 'evt_001', timestamp: subMinutes(now, 5), event_key: 'TASK_APPROVED', severity: 'Info', acting_user_name: 'David', acting_user_role: 'Manager', resource_type: 'task', description: 'Task approved by manager/admin', ip_address: '192.168.1.4', device: 'iOS 17.2' },
  { event_id: 'evt_002', timestamp: subMinutes(now, 45), event_key: 'LOCATION_SPOOF_DETECTED', severity: 'Critical', acting_user_name: 'Robert', acting_user_role: 'Employee', resource_type: 'task', description: 'Mock GPS location detected during task execution. System flagged account.', ip_address: '10.0.0.8', device: 'Android 14 (Pixel 8)' },
  { event_id: 'evt_003', timestamp: subHours(now, 2), event_key: 'GEOFENCE_BREACH', severity: 'Warning', acting_user_name: 'Ananya', acting_user_role: 'Employee', resource_type: 'task', description: 'Task completed outside allowed 50m radius (logged radius: 84m)', ip_address: '10.0.0.12', device: 'Android 13' },
  { event_id: 'evt_004', timestamp: subHours(now, 5), event_key: 'MEMBER_REMOVED', severity: 'Warning', acting_user_name: 'Moksheet Shah', acting_user_role: 'Owner', resource_type: 'user', description: 'Member permanently removed from workspace (ID: usr_042)', ip_address: '192.168.1.101', device: 'macOS Chrome' },
  { event_id: 'evt_005', timestamp: subHours(now, 6), event_key: 'PROJECT_CREATED', severity: 'Info', acting_user_name: 'Sarah', acting_user_role: 'Admin', resource_type: 'project', description: 'New project created in workspace (Diwali Sale Prep)', ip_address: '192.168.1.99', device: 'Windows Edge' },
  { event_id: 'evt_006', timestamp: subDays(now, 1), event_key: 'WORKSPACE_DEACTIVATED', severity: 'Critical', acting_user_name: 'System Admin', acting_user_role: 'System', resource_type: 'workspace', description: 'Workspace soft-disabled due to billing failure', ip_address: 'System', device: 'Server' },
  { event_id: 'evt_007', timestamp: subDays(now, 1), event_key: 'WORKSPACE_REACTIVATED', severity: 'Critical', acting_user_name: 'Moksheet Shah', acting_user_role: 'Owner', resource_type: 'workspace', description: 'Workspace restored from deactivated state (Payment confirmed)', ip_address: '192.168.1.101', device: 'macOS Chrome' },
  { event_id: 'evt_008', timestamp: subDays(now, 2), event_key: 'AI_DRAFT_CONFIRMED', severity: 'Info', acting_user_name: 'Elena', acting_user_role: 'Manager', resource_type: 'task', description: 'AI-generated task draft confirmed by user (Source: WhatsApp)', ip_address: '10.0.0.4', device: 'iOS 16.5' },
  { event_id: 'evt_009', timestamp: subDays(now, 3), event_key: 'USER_LOGIN', severity: 'Info', acting_user_name: 'Linda', acting_user_role: 'Employee', resource_type: 'user', description: 'User authenticated into the app', ip_address: '10.0.0.19', device: 'Android 14 (S24)' },
  { event_id: 'evt_010', timestamp: subDays(now, 5), event_key: 'OWNERSHIP_TRANSFERRED', severity: 'Critical', acting_user_name: 'Alice', acting_user_role: 'Owner', resource_type: 'workspace', description: 'Workspace ownership moved to new user (Moksheet Shah)', ip_address: '192.168.1.55', device: 'Windows Chrome' }
];

export default function AuditLogsView() {
  const { onMenuClick } = useOutletContext<LayoutContextType>();
  const [searchTerm, setSearchTerm] = useState('');

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-rose-100 text-rose-700 border-rose-200';
      case 'Warning': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Info': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'Critical': return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case 'Warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'Info': return <Info className="w-5 h-5 text-blue-500" />;
      default: return <Activity className="w-5 h-5 text-slate-500" />;
    }
  };

  const filteredLogs = DEMO_LOGS.filter(log => 
    log.event_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.acting_user_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#f8fafc]">
      <TopBar title="Audit Logs" onMenuClick={onMenuClick} />
      
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        {/* Banner */}
        <div className="bg-slate-900 text-white p-6 sm:p-8">
          <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black mb-2 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                Immutable Audit Trail
              </h2>
              <p className="text-slate-400 font-medium max-w-lg text-sm">
                Cryptographically chained event history. Records cannot be edited or deleted by any user or API endpoint.
              </p>
            </div>
            
            <button className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 w-full md:w-auto px-6 py-3 rounded-xl font-bold transition-colors">
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
          
          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search by event key or user name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              />
            </div>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Logs List */}
          <div className="bg-white rounded-2xl shadow-soft border border-slate-100 overflow-hidden">
            {filteredLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-medium">No audit logs match your search.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <div key={log.event_id} className="p-4 sm:p-6 hover:bg-slate-50/50 transition-colors group">
                    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                      
                      {/* Left: Icon & Event Key */}
                      <div className="flex items-start gap-4 sm:w-1/3 shrink-0">
                        <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${getSeverityColor(log.severity)} bg-opacity-50`}>
                          {getSeverityIcon(log.severity)}
                        </div>
                        <div>
                          <div className="font-black text-slate-800 text-sm mb-1 tracking-tight">{log.event_key}</div>
                          <div className="flex gap-2 items-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest border ${getSeverityColor(log.severity)}`}>
                              {log.severity}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">
                              {log.resource_type}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-700 font-medium text-sm mb-3">
                          {log.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                          <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
                            <User className="w-3.5 h-3.5" />
                            <span className="font-bold text-slate-700">{log.acting_user_name}</span>
                            <span className="text-slate-400">({log.acting_user_role})</span>
                          </div>
                          {log.ip_address && (
                            <div className="font-mono text-slate-400">
                              IP: {log.ip_address}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right: Timestamp */}
                      <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 sm:gap-1 text-xs">
                        <div className="flex items-center gap-1 font-bold text-slate-500">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {format(log.timestamp, 'MMM d, yyyy')}
                        </div>
                        <div className="text-slate-400 font-medium">
                          {format(log.timestamp, 'h:mm:ss a')}
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}

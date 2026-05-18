import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { useRoles } from '../context/RolesContext';
import { useWorkspaces } from '../context/WorkspaceContext';
import { useLanguage } from '../context/LanguageContext';
import { Link, useLocation } from 'react-router-dom';
import { X, LayoutDashboard, CheckSquare, CalendarDays, FolderKanban, Settings, LogOut, Activity, Users, ClipboardCheck, Building2, FileText, BarChart2, Zap } from 'lucide-react';

import Logo from './Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { hasPermission } = useRoles();
  const { activeWorkspace } = useWorkspaces();
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { id: '/', icon: LayoutDashboard, label: t('home'), permission: null },
    { id: '/activity', icon: Activity, label: t('activity' as any) || 'Activity', permission: 'view_audit_logs' },
    { id: '/tasks', icon: CheckSquare, label: t('tasks'), permission: null },
    { id: '/approvals', icon: ClipboardCheck, label: t('approvals' as any) || 'Approvals', permission: 'approve_tasks' },
    { id: '/calendar', icon: CalendarDays, label: t('schedule'), permission: null },
    { id: '/projects', icon: FolderKanban, label: t('projects' as any) || 'Projects', permission: 'view_projects' },
    { id: '/drafts', icon: FileText, label: t('drafts' as any) || 'Drafts', permission: null },
    { id: '/team', icon: Users, label: t('team' as any) || 'Team', permission: 'manage_members', hideOnSolo: true },
    { id: '/departments', icon: Building2, label: t('departments' as any) || 'Departments', permission: 'manage_departments', hideOnSolo: true },
    { id: '/audit-logs', icon: FileText, label: t('audit_logs' as any) || 'Audit Logs', permission: 'view_audit_logs' },
    { id: '/reports', icon: BarChart2, label: t('reports' as any) || 'Reports', permission: 'view_reports' },
    { id: '/settings', icon: Settings, label: t('settings'), permission: null },
  ].filter(item => {
    if (!user) return false;
    if (item.hideOnSolo && activeWorkspace?.org_type === 'solo') return false;
    if (!item.permission) return true;
    return hasPermission(user.role, item.permission, user.roleId);
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 left-0 bottom-0 w-[85%] max-w-sm bg-[#f8fafc] dark:bg-slate-900 z-50 shadow-2xl flex flex-col overflow-hidden rounded-r-[2.5rem] border-r border-slate-100 dark:border-slate-800 transition-colors"
          >
            <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm relative z-10 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 flex items-center justify-center relative overflow-hidden">
                  <Logo className="w-full h-full drop-shadow-md" />
                </div>
                <div>
                  <h2 className="font-black text-slate-800 dark:text-white text-xl tracking-tight">Routine</h2>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Task Manager</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 flex flex-col gap-2 no-scrollbar relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary-50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
              
              {navItems.map((item) => {
                const isActive = location.pathname === item.id;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.id}
                    to={item.id}
                    onClick={onClose}
                    className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all group relative overflow-hidden ${
                      isActive 
                        ? 'bg-white shadow-soft text-primary-600' 
                        : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'
                    }`}
                  >
                    {isActive && (
                      <motion.div 
                        layoutId="activeNavIndicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-primary-500 rounded-r-full"
                      />
                    )}
                    <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-primary-50 text-primary-600' : 'bg-transparent text-slate-400 group-hover:bg-slate-100 group-hover:text-slate-600'}`}>
                      <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                    </div>
                    <span className={`font-bold ${isActive ? 'text-primary-700' : ''}`}>{item.label}</span>
                  </Link>
                );
              })}
            </div>

            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.05)] relative z-10 transition-colors">
              <div className="flex items-center gap-4 mb-5 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="size-12 rounded-xl border-2 border-white dark:border-slate-700 shadow-sm overflow-hidden bg-white dark:bg-slate-900">
                  <img alt="Profile" className="w-full h-full object-cover" src={`https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=007BA7&color=fff&bold=true`} referrerPolicy="no-referrer" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-slate-800 dark:text-white truncate transition-colors">{user?.name || 'User'}</p>
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500 truncate transition-colors">{user?.email || 'user@example.com'}</p>
                </div>
              </div>
              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-3.5 text-sm font-black text-rose-600 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/30 rounded-2xl transition-all active:scale-95 border border-rose-100 dark:border-rose-900/30"
              >
                <LogOut className="w-5 h-5" />
                Log Out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

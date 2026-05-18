import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  ChevronRight, 
  CheckCircle2, 
  Briefcase, 
  Users, 
  Target, 
  Loader2, 
  Sparkles, 
  Send, 
  Building2, 
  ArrowLeft,
  X,
  MessageSquare,
  ClipboardList,
  CheckSquare
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { chatWithBot, generateOnboardingTemplates } from '../services/geminiService';
import { useWorkspaces } from '../context/WorkspaceContext';
import { useDepartments } from '../context/DepartmentContext';
import { useRoles } from '../context/RolesContext';
import { useTasks } from '../context/TaskContext';
import { useProjects } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const INDUSTRIES_DATA = {
  'Retail': ['Clothing', 'Grocery', 'Electronics', 'Footwear', 'Pharmacy', 'Other'],
  'Hospitality': ['Restaurant', 'Hotel', 'Cafe', 'Catering', 'Event Management', 'Other'],
  'Construction': ['Residential', 'Commercial', 'Civil Engineering', 'Renovation', 'Other'],
  'Logistics': ['Warehousing', 'Last Mile Delivery', 'Fleet Management', 'Freight', 'Other'],
  'Healthcare': ['Clinic', 'Hospital', 'Diagnostic Center', 'Pharmacy', 'Other'],
  'Professional Services': ['IT Services', 'Marketing Agency', 'Accounting', 'Legal', 'Consulting', 'Other'],
  'Other': ['General Business']
};

const TEAM_SIZES = ['Just me', '2 - 10', '11 - 50', '50 - 200', '200+'];

const USE_CASES = [
  { id: 'dispatching', label: 'Dispatching tasks' },
  { id: 'proof', label: 'Proof of work validations' },
  { id: 'scheduling', label: 'Shift scheduling' },
  { id: 'approvals', label: 'Multi-step approvals' }
];

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

export default function OnboardingView() {
  const [mode, setMode] = useState<'form' | 'chat'>('form');
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('Retail');
  const [subIndustry, setSubIndustry] = useState('Clothing');
  const [teamSize, setTeamSize] = useState('11 - 50');
  const [useCases, setUseCases] = useState<string[]>(['dispatching', 'proof']);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedData, setGeneratedData] = useState<any>(null);
  const [isapplying, setIsApplying] = useState(false);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { addWorkspace } = useWorkspaces();
  const { addDepartment } = useDepartments();
  const { addRole } = useRoles();
  const { addTask } = useTasks();
  const { addProject } = useProjects();

  useEffect(() => {
    if (chatMessages.length === 0 && mode === 'chat') {
      setChatMessages([
        { role: 'bot', content: "Hi! I'm Routine AI. I can help you set up your workspace perfectly. What's the name of your company, and what do you do?" }
      ]);
    }
  }, [mode, chatMessages.length]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    const userMsg = userInput;
    setUserInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await chatWithBot(`The user is in the onboarding phase. 
      Help them define their: 
      1. Company Name
      2. Industry & Sub-industry
      3. Departments
      4. Roles
      5. Common Tasks
      
      User message: ${userMsg}
      
      Keep it structured and helpful. If you have enough info, say "I have enough info to generate your setup! Should I proceed?"`);
      
      setChatMessages(prev => [...prev, { role: 'bot', content: response }]);

      if (response.toLowerCase().includes("i have enough info to generate your setup")) {
        // We could theoretically parse the chat history here to extract info, 
        // but for now let's just stick to the generate logic if they want.
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startGeneration = async () => {
    setIsGenerating(true);
    try {
      const result = await generateOnboardingTemplates(
        companyName || 'My Workspace', 
        industry, 
        subIndustry, 
        teamSize, 
        useCases
      );
      setGeneratedData(result);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate templates. Using defaults.");
      setGeneratedData({
        departments: [{ name: 'Operations', description: 'Main operations' }],
        roles: [{ name: 'Manager', description: 'Department manager', level: 'Manager' }],
        taskTemplates: [],
        kanbanColumns: ['To Do', 'In Progress', 'Done']
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySetup = async () => {
    if (!generatedData) return;
    setIsApplying(true);
    
    try {
      // 1. Create Workspace if needed (or update current)
      // Usually the user already has a default workspace, we just use it.
      
      // 2. Create Departments & Projects
      for (const dept of generatedData.departments) {
        // We generate IDs on client so we can link if needed, though server generates them too.
        await addDepartment({
          name: dept.name,
          // manager_id: user?.id // Optional: assign owner as manager initially
        });

        // Create a matching project for each department to house the kanban flow
        await addProject({
          title: `Project: ${dept.name}`,
          description: `Workflows for ${dept.name} department at ${companyName}.`,
          bgClass: 'bg-primary-500',
          iconName: 'Building2',
          kanban_columns: JSON.stringify(generatedData.kanbanColumns)
        });
      }
      
      // 3. Create Roles
      const defaultPermissions = ['create_tasks', 'view_projects', 'manage_chat', 'use_ai'];
      const managerPermissions = [...defaultPermissions, 'manage_tasks', 'approve_tasks', 'manage_projects'];
      
      for (const role of generatedData.roles) {
        await addRole({
          name: role.name,
          description: role.description,
          permissions: (role.level === 'Manager' || role.name.toLowerCase().includes('manager')) ? managerPermissions : defaultPermissions,
          color: (role.level === 'Manager' || role.name.toLowerCase().includes('manager')) ? '#6366f1' : '#94a3b8'
        });
      }
      
      // 4. Create initial tasks
      for (const task of generatedData.taskTemplates) {
        await addTask({
          ...task,
          project: `Project: ${generatedData.departments[0]?.name || 'Operations'}`, // Assign to first project
          status: generatedData.kanbanColumns[0], // Start in first column
          assignees: [user?.id || ''],
          tags: [],
          dueDate: task.dueDate || 'Today'
        });
      }
      
      toast.success("Workspace configured successfully!");
      navigate('/');
    } catch (err) {
      console.error(err);
      toast.error("Setup completed with some minor issues. You can fix them in settings.");
      navigate('/');
    } finally {
      setIsApplying(false);
    }
  };

  const canProceed = useMemo(() => {
    if (step === 1) return companyName.trim().length > 0;
    return true;
  }, [step, companyName]);

  if (isGenerating) {
    return (
      <div className="fixed inset-0 bg-[#f8fafc] z-50 flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-primary-500 rounded-full blur-2xl opacity-20 animate-pulse"></div>
          <div className="w-24 h-24 bg-primary-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-primary-600/30 relative z-10 mx-auto mb-8">
            <Bot className="w-12 h-12 text-white animate-bounce" />
          </div>
        </motion.div>
        
        <h2 className="text-2xl font-black text-slate-800 mb-3 text-center tracking-tight">
          Routine AI is Crafting Your Workspace
        </h2>
        <p className="text-slate-500 font-medium text-center max-w-xs mb-8">
          Analyzing {subIndustry} ({industry}) workflows to build a high-performance setup for {companyName}.
        </p>

        <div className="space-y-4 w-full max-w-sm">
          <LoadingStep text="Designing organizational roles..." delay={0.5} />
          <LoadingStep text="Structuring operational pipelines..." delay={1.5} />
          <LoadingStep text="Mapping industry best practices..." delay={2.5} />
        </div>
      </div>
    );
  }

  if (generatedData) {
    return (
      <div className="fixed inset-0 bg-[#f8fafc] z-50 flex flex-col pt-16 px-6 pb-8 overflow-y-auto no-scrollbar">
        <div className="w-full max-w-md mx-auto flex-1 flex flex-col">
          <motion.div 
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-6"
          >
            <CheckCircle2 className="w-8 h-8 text-white" />
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-3xl font-black text-slate-800 mb-2 tracking-tight"
          >
            Ready for Launch!
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 font-medium mb-8"
          >
            Routine AI has generated a custom blueprint for <strong>{companyName}</strong>. 
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="space-y-4 mb-auto"
          >
            {/* Suggested Setup Blocks */}
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-50 rounded-xl"><Building2 className="w-5 h-5 text-blue-600" /></div>
                <h3 className="font-black text-slate-800 tracking-tight">Departments</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {generatedData.departments.map((d: any) => (
                  <span key={d.name} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600">{d.name}</span>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 rounded-xl"><Users className="w-5 h-5 text-purple-600" /></div>
                <h3 className="font-black text-slate-800 tracking-tight">Operational Roles</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {generatedData.roles.map((r: any) => (
                  <span key={r.name} className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold text-slate-600">{r.name}</span>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-50 rounded-xl"><Target className="w-5 h-5 text-amber-600" /></div>
                <h3 className="font-black text-slate-800 tracking-tight">Pipeline Stages</h3>
              </div>
              <div className="flex gap-2 text-xs font-bold text-slate-500 overflow-x-auto pb-2 no-scrollbar whitespace-nowrap">
                {generatedData.kanbanColumns.map((col: string, i: number) => (
                  <React.Fragment key={col}>
                    <span className={`px-3 py-1 border-b-2 ${i === 0 ? 'border-primary-500 text-primary-600' : 'border-slate-200'}`}>{col}</span>
                    {i < generatedData.kanbanColumns.length - 1 && <ChevronRight className="w-4 h-4 text-slate-300 self-center" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-soft">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-50 rounded-xl"><ClipboardList className="w-5 h-5 text-emerald-600" /></div>
                <h3 className="font-black text-slate-800 tracking-tight">System-Ready Tasks</h3>
              </div>
              <div className="space-y-2">
                {generatedData.taskTemplates.slice(0, 3).map((task: any) => (
                  <div key={task.title} className="flex items-center gap-3 p-2 bg-slate-50 rounded-xl text-sm font-bold text-slate-700">
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    {task.title}
                  </div>
                ))}
                {generatedData.taskTemplates.length > 3 && (
                  <p className="text-xs text-slate-400 font-bold pl-2">+ {generatedData.taskTemplates.length - 3} more professional templates</p>
                )}
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 pt-4 pb-6"
          >
            <button
              onClick={handleApplySetup}
              disabled={isapplying}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] flex justify-center items-center gap-2 group"
            >
              {isapplying ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Sparkles className="w-5 h-5 group-hover:scale-125 transition-transform" /> Apply & Begin Workflow</>}
            </button>
            <button 
              onClick={() => navigate('/')}
              className="w-full text-center text-sm font-bold text-slate-500 mt-4 underline underline-offset-4"
            >
              Skip to Dashboard
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#f8fafc] z-50 flex flex-col safe-top overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-12 pb-6 border-b border-white bg-white/30 backdrop-blur-md sticky top-0 z-20">
        <div className="w-full max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight">Routine AI</h1>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Setup Assistant Active</p>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setMode(mode === 'form' ? 'chat' : 'form')}
            className={`p-2.5 rounded-xl border-2 transition-all ${mode === 'chat' ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600'}`}
            title={mode === 'form' ? "Switch to AI Chat Setup" : "Switch to Form Setup"}
          >
            {mode === 'form' ? <MessageSquare className="w-5 h-5" /> : <ClipboardList className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="w-full max-w-md mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            {mode === 'form' ? (
              <motion.div 
                key="form-mode"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-8"
              >
                {/* Step 1: Basics */}
                {step === 1 && (
                  <section className="space-y-6">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Build your foundation</h2>
                      <p className="text-sm font-medium text-slate-500">Every routine starts with a name. What should we call your workspace?</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Business Name</label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <input 
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="e.g. Global Tech Solutions"
                            className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-700 focus:border-primary-500 outline-none shadow-sm transition-all placeholder:text-slate-300"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Industrial Context</label>
                        <div className="grid grid-cols-1 gap-3">
                          <div className="relative">
                            <select 
                              value={industry}
                              onChange={(e) => {
                                setIndustry(e.target.value);
                                setSubIndustry(INDUSTRIES_DATA[e.target.value as keyof typeof INDUSTRIES_DATA][0]);
                              }}
                              className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl appearance-none font-bold text-slate-700 outline-none focus:border-primary-500 transition-all shadow-sm"
                            >
                              {Object.keys(INDUSTRIES_DATA).map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronRight className="w-5 h-5 text-slate-400 rotate-90" />
                            </div>
                          </div>

                          <div className="relative">
                            <select 
                              value={subIndustry}
                              onChange={(e) => setSubIndustry(e.target.value)}
                              className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl appearance-none font-bold text-slate-700 outline-none focus:border-primary-500 transition-all shadow-sm"
                            >
                              {INDUSTRIES_DATA[industry as keyof typeof INDUSTRIES_DATA].map(si => <option key={si} value={si}>{si}</option>)}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none">
                              <ChevronRight className="w-5 h-5 text-slate-400 rotate-90" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}

                {/* Step 2: Scale & Goals */}
                {step === 2 && (
                  <section className="space-y-8">
                    <div className="space-y-2">
                       <button onClick={() => setStep(1)} className="flex items-center gap-1 text-primary-600 font-bold text-xs mb-2">
                         <ArrowLeft className="w-4 h-4" /> Go Back
                       </button>
                      <h2 className="text-2xl font-black text-slate-800 tracking-tight">Scale & Objectives</h2>
                      <p className="text-sm font-medium text-slate-500">Help Routine AI understand your team volume and primary operational targets.</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">Total Daily Users</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {TEAM_SIZES.map(size => (
                            <button
                              key={size}
                              onClick={() => setTeamSize(size)}
                              className={`py-3 px-2 rounded-xl border-2 font-bold text-xs transition-all ${
                                teamSize === size 
                                  ? 'border-primary-500 bg-primary-50 text-primary-700' 
                                  : 'border-slate-100 bg-white text-slate-600 hover:border-slate-200'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1 font-bold">Automation Priorities</label>
                        <div className="grid grid-cols-1 gap-2">
                          {USE_CASES.map(uc => {
                            const isActive = useCases.includes(uc.id);
                            return (
                              <button
                                key={uc.id}
                                onClick={() => {
                                  if (isActive) setUseCases(useCases.filter(u => u !== uc.id));
                                  else setUseCases([...useCases, uc.id]);
                                }}
                                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                                  isActive ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-slate-100 bg-white text-slate-600 shadow-sm'
                                }`}
                              >
                                <span className="font-bold text-sm">{uc.label}</span>
                                {isActive && <CheckCircle2 className="w-5 h-5 text-primary-500" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </section>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="chat-mode"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col h-[60vh] bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl font-medium text-sm leading-relaxed ${
                        msg.role === 'user' 
                          ? 'bg-primary-600 text-white rounded-tr-none' 
                          : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-slate-100 p-4 rounded-2xl rounded-tl-none border border-slate-200">
                        <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  <div className="relative flex items-center gap-2">
                    <input 
                      type="text"
                      value={userInput}
                      onChange={(e) => setUserInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Ask AI to help setup..."
                      className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-primary-500/20 outline-none"
                    />
                    <button 
                      onClick={handleSendMessage}
                      className="p-3 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-600/20 active:scale-90 transition-transform"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Action Button / Navigation */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#f8fafc] via-[#f8fafc] to-transparent pt-12 z-30">
        <div className="max-w-md mx-auto w-full">
          {mode === 'form' ? (
            <button
              onClick={() => {
                if (step === 1) setStep(2);
                else startGeneration();
              }}
              disabled={!canProceed}
              className={`w-full font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] ${
                canProceed ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-600/30' : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
              }`}
            >
              {step === 1 ? (
                <>Next Step <ChevronRight className="w-5 h-5" /></>
              ) : (
                <><Sparkles className="w-5 h-5" /> Generate My Setup</>
              )}
            </button>
          ) : (
             <button
              onClick={startGeneration}
              className="w-full bg-slate-900 hover:bg-black text-white font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98]"
            >
              <Sparkles className="w-5 h-5" /> I'm Ready, Generate Setup
            </button>
          )}
          
          <div className="flex justify-center gap-2 mt-4">
            <span className={`w-2 h-2 rounded-full transition-all ${step === 1 ? 'w-6 bg-primary-500' : 'bg-slate-200'}`}></span>
            <span className={`w-2 h-2 rounded-full transition-all ${step === 2 ? 'w-6 bg-primary-500' : 'bg-slate-200'}`}></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingStep({ text, delay }: { text: string, delay: number }) {
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShow(true), delay * 1000);
    const d = setTimeout(() => setDone(true), (delay + 1.2) * 1000);
    return () => { clearTimeout(t); clearTimeout(d); };
  }, [delay]);

  if (!show) return null;

  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm"
    >
      {done ? (
        <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      ) : (
        <Loader2 className="w-6 h-6 text-primary-500 animate-spin shrink-0" />
      )}
      <span className="font-bold text-slate-700 text-sm">{text}</span>
    </motion.div>
  );
}

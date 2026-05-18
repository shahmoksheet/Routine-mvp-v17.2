import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Logo from '../components/Logo';

export function SplashView() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 150);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-[#f8fafc] dark:bg-slate-900 flex flex-col items-center justify-center overflow-hidden transition-colors duration-500">
      {/* Background decorative elements with gentle movement */}
      <motion.div 
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary-400/20 rounded-full blur-[120px]"
      />
      <motion.div 
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-400/20 rounded-full blur-[120px]"
      />

      <div className="flex flex-col items-center z-10 w-full max-w-xs">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="w-32 h-32 mb-8"
        >
          <Logo className="w-full h-full drop-shadow-2xl" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter mb-1">
            Routine
          </h1>
          <p className="text-slate-400 dark:text-slate-500 font-bold tracking-[0.3em] text-[10px] uppercase">
            Operational Excellence
          </p>
        </motion.div>

        {/* Professional Loading Bar */}
        <motion.div 
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "100%" }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-full space-y-4"
        >
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden relative">
            <motion.div 
              className="absolute top-0 left-0 h-full bg-primary-600 dark:bg-primary-500 rounded-full shadow-[0_0_12px_rgba(79,70,229,0.5)]"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between items-center px-1">
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-widest">
              Initializing
            </p>
            <p className="text-primary-600 dark:text-primary-400 text-[10px] font-black tabular-nums">
              {Math.round(progress)}%
            </p>
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-12"
      >
        <p className="text-slate-400 dark:text-slate-600 text-[9px] font-bold uppercase tracking-[0.2em]">
          v2.4.0 • Enterprise Edition
        </p>
      </motion.div>
    </div>
  );
}

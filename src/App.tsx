/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signIn } from './lib/firebase';
import Navbar from './components/Navbar';
import DashboardList from './components/DashboardList';
import DashboardEditor from './components/DashboardEditor';
import { BarChart3, ChevronLeft, Layout as LayoutIcon, LogIn, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, loading] = useAuthState(auth);
  const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="h-screen w-full bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-full bg-background bg-dot-pattern flex flex-col">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl px-4"
          >
            <div className="w-16 h-16 bg-brand rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-slate-900/10">
              <LayoutIcon className="text-white w-8 h-8" />
            </div>
            <h1 className="text-6xl font-black text-slate-900 tracking-tighter mb-6">
              Visual Intelligence <span className="text-accent underline decoration-slate-200 underline-offset-8">Mastered.</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 leading-relaxed font-light max-w-lg mx-auto">
              Transform raw data into meaningful narratives with Loom's masterful visualization engine and AI-powered insights.
            </p>
            <button
              onClick={signIn}
              className="group relative inline-flex items-center gap-3 bg-brand text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-900/20"
            >
              <LogIn className="w-5 h-5" />
              Launch Your Workspace
            </button>

            <div className="grid grid-cols-3 gap-12 mt-24">
              {[
                { label: "Interactive", icon: <BarChart3 className="w-5 h-5"/>, desc: "Fluid Layouts" },
                { label: "Intelligent", icon: <Sparkles className="w-5 h-5"/>, desc: "Gemini Analysis" },
                { label: "Collaborative", icon: <LayoutIcon className="w-5 h-5"/>, desc: "Team Sharing" }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-xl bg-surface border border-border flex items-center justify-center text-slate-900 mb-4 shadow-sm">
                    {item.icon}
                  </div>
                  <h3 className="text-slate-900 font-bold mb-1 tracking-tight">{item.label}</h3>
                  <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">{item.desc}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-background flex flex-col overflow-hidden text-slate-900">
      <Navbar />
      
      <main className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {!selectedDashboardId ? (
            <motion.div
              key="list"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full flex items-center justify-center p-8 bg-dot-pattern overflow-y-auto custom-scrollbar"
            >
              <div className="max-w-xl w-full">
                <DashboardList onSelect={setSelectedDashboardId} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="h-full flex flex-col"
            >
              <DashboardEditor 
                dashboardId={selectedDashboardId} 
                onBack={() => setSelectedDashboardId(null)} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

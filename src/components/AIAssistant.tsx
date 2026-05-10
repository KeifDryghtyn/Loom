import { useState } from 'react';
import { Sparkles, Loader2, FileText, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeDataset } from '../lib/gemini';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import ReactMarkdown from 'react-markdown';

export default function AIAssistant({ datasetId, data, columns }: { datasetId: string; data: any[]; columns: string[] }) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeDataset(data, columns);
      setReport(result);
      await addDoc(collection(db, 'analyses'), {
        datasetId,
        report: result,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-brand border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-8 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight uppercase tracking-widest text-sm">Expert Intelligence</h2>
            <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mt-1">Masterful Analysis via Gemini</p>
          </div>
        </div>
        {!report && (
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20"
          >
            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
            Generate Intelligence
          </button>
        )}
      </div>

      <AnimatePresence>
        {report && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="p-10 prose prose-invert prose-indigo max-w-none bg-slate-900/50"
          >
            <div className="markdown-body text-slate-300 leading-relaxed font-light">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
            <button 
              onClick={() => setReport(null)}
              className="mt-10 text-slate-500 hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2 transition-colors border border-white/10 px-4 py-2 rounded-lg"
            >
              Recalibrate Insights <ChevronRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      {!report && !isAnalyzing && (
        <div className="p-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6">
            <FileText className="w-8 h-8 text-white/20" />
          </div>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-[0.3em]">System ready for Deep Scan</p>
        </div>
      )}
    </div>
  );
}

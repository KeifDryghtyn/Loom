import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Dashboard, Dataset } from '../types';
import { Plus, Layout as LayoutIcon, BarChart3, Trash2, ExternalLink } from 'lucide-react';
import { motion } from 'motion/react';
import { formatDate } from '../lib/utils';

export default function DashboardList({ onSelect }: { onSelect: (id: string) => void }) {
  const [user] = useAuthState(auth);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'dashboards'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setDashboards(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Dashboard)));
    });
    return unsub;
  }, [user]);

  const createDashboard = async () => {
    if (!user) return;
    setIsCreating(true);
    try {
      const newDash = {
        name: "Untitled Dashboard",
        userId: user.uid,
        widgets: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'dashboards'), newDash);
      onSelect(docRef.id);
    } catch (error) {
      console.error(error);
    } finally {
      setIsCreating(false);
    }
  };

  const deleteDashboard = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Delete this dashboard?")) {
      await deleteDoc(doc(db, 'dashboards', id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <LayoutIcon className="w-3 h-3" />
          Available Dashboards
        </h2>
        <button
          onClick={createDashboard}
          disabled={isCreating}
          className="flex items-center gap-2 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-900 px-3 py-1.5 rounded-lg transition-colors border border-border"
        >
          <Plus className="w-3 h-3" />
          Create New
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {dashboards.map((dash) => (
          <motion.div
            key={dash.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => onSelect(dash.id)}
            className="group p-5 bg-surface border border-border rounded-2xl cursor-pointer hover:border-accent hover:shadow-xl hover:shadow-blue-600/5 transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-accent/5 group-hover:text-accent transition-colors">
                <BarChart3 className="w-6 h-6 text-slate-400 group-hover:text-accent transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 group-hover:text-accent transition-colors">{dash.name}</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold mt-0.5">{dash.widgets.length} Widgets • {formatDate(dash.createdAt)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => deleteDashboard(e, dash.id)}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <ExternalLink className="w-4 h-4 text-slate-300" />
            </div>
          </motion.div>
        ))}
        {dashboards.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center border border-dashed border-border rounded-2xl bg-slate-50/50">
            <LayoutIcon className="w-10 h-10 text-slate-200 mb-4" />
            <p className="text-slate-400 text-sm font-medium">Your hub is empty. Let's build something.</p>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, serverTimestamp, collection, query, where, getDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Dashboard, Dataset, WidgetConfig } from '../types';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import Widget from './Widget';
import DatasetUploader from './DatasetUploader';
import { Settings, Plus, Layout as LayoutIcon, Share2, Grid3X3, Save, Loader2, Sparkles, X, UserPlus, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { generateWidgetSuggestions } from '../lib/gemini';
import AIAssistant from './AIAssistant';

import '/node_modules/react-grid-layout/css/styles.css';
import '/node_modules/react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default function DashboardEditor({ dashboardId, onBack }: { dashboardId: string; onBack: () => void }) {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeDataset, setActiveDataset] = useState<Dataset | null>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [tempName, setTempName] = useState("");
  const [isAddingWidget, setIsAddingWidget] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'dashboards', dashboardId), (snap) => {
      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() } as Dashboard;
        setDashboard(data);
        setTempName(data.name);
      }
      setLoading(false);
    });

    const datasetUnsub = onSnapshot(query(collection(db, 'datasets'), where('userId', '==', auth.currentUser?.uid)), (snap) => {
      setDatasets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Dataset)));
    });

    return () => {
      unsub();
      datasetUnsub();
    };
  }, [dashboardId]);

  // Auto-name sync: If it's an untitled dashboard and we have a dataset, use its name
  useEffect(() => {
    if (dashboard && dashboard.name === "Untitled Dashboard" && activeDataset && !editingTitle) {
      updateDoc(doc(db, 'dashboards', dashboardId), { name: activeDataset.name });
    }
  }, [dashboard?.name, activeDataset, dashboardId, editingTitle]);

  useEffect(() => {
    if (dashboard?.widgets.length && datasets.length) {
      // Find the first dataset used in widgets to show in the sidebar assistant
      const firstDatasetId = dashboard.widgets[0].datasetId;
      const found = datasets.find(d => d.id === firstDatasetId);
      if (found) setActiveDataset(found);
    }
  }, [dashboard?.widgets, datasets]);

  const updateLayout = async (layout: any) => {
    if (!dashboard) return;
    const newWidgets = dashboard.widgets.map(w => {
      const l = layout.find((i: any) => i.i === w.id);
      return l ? { ...w, layout: { x: l.x, y: l.y, w: l.w, h: l.h } } : w;
    });
    await updateDoc(doc(db, 'dashboards', dashboard.id), { 
      widgets: newWidgets,
      updatedAt: serverTimestamp()
    });
  };

  const handleAutoSuggest = async (dataset: Dataset) => {
    setIsGenerating(true);
    try {
      const suggestions = await generateWidgetSuggestions(dataset.columns);
      const newWidgets: WidgetConfig[] = suggestions.map((s: any, index: number) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: s.title,
        type: s.type,
        datasetId: dataset.id,
        config: { 
          xField: s.xField ?? null, 
          yField: s.yField ?? null,
          labelField: s.labelField ?? null,
          valueField: s.valueField ?? null
        },
        layout: { x: (index % 2) * 6, y: Math.floor(index / 2) * 4, w: 6, h: 4 }
      }));

      await updateDoc(doc(db, 'dashboards', dashboardId), {
        widgets: [...(dashboard?.widgets || []), ...newWidgets],
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveName = async () => {
    await updateDoc(doc(db, 'dashboards', dashboardId), { name: tempName, updatedAt: serverTimestamp() });
    setEditingTitle(false);
  };

  const [isSharing, setIsSharing] = useState(false);
  const [shareEmail, setShareEmail] = useState("");

  const handleShare = async () => {
    if (!shareEmail || !dashboard) return;
    const currentShared = dashboard.sharedWith || [];
    if (!currentShared.includes(shareEmail)) {
      await updateDoc(doc(db, 'dashboards', dashboardId), {
        sharedWith: [...currentShared, shareEmail],
        updatedAt: serverTimestamp()
      });
      setShareEmail("");
      setIsSharing(false);
      alert(`Shared with ${shareEmail}`);
    }
  };

  if (loading) return <div className="p-10 text-slate-400 flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin"/> Establishing workspace...</div>;
  if (!dashboard) return <div className="p-10 text-red-500">Dashboard not found.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-73px)] overflow-hidden">
      {/* Add Widget Modal */}
      <AnimatePresence>
        {isAddingWidget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-accent" />
                  Add Visual Widget
                </h3>
                <button onClick={() => setIsAddingWidget(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X className="w-5 h-5"/></button>
              </div>
              
              <div className="space-y-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Select Dataset</p>
                <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto custom-scrollbar pr-2">
                   {datasets.map(ds => (
                     <button 
                       key={ds.id}
                       onClick={() => {
                         handleAutoSuggest(ds);
                         setIsAddingWidget(false);
                       }}
                       className="p-4 text-left border border-border rounded-xl hover:bg-slate-50 hover:border-accent transition-all flex items-center justify-between group"
                     >
                       <div className="flex flex-col">
                         <span className="text-sm font-bold text-slate-900">{ds.name}</span>
                         <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-0.5">{ds.data.length} records</span>
                       </div>
                       <Sparkles className="w-4 h-4 text-slate-200 group-hover:text-accent transition-colors" />
                     </button>
                   ))}
                   {datasets.length === 0 && (
                     <div className="py-8 text-center border-2 border-dashed border-border rounded-xl text-slate-400 text-xs italic">
                        Upload a dataset first
                     </div>
                   )}
                </div>
                <p className="text-[10px] text-slate-500 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl">Gemini will analyze your data structure and suggest the most impactful visualizations automatically.</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {isSharing && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border rounded-2xl p-8 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-accent" />
                  Collaborate
                </h3>
                <button onClick={() => setIsSharing(false)} className="text-slate-400 hover:text-slate-900 transition-colors"><X className="w-5 h-5"/></button>
              </div>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">Invite teammates to this dashboard. Shared members gain full editing permissions to widgets and layouts.</p>
              
              <div className="space-y-4">
                <input 
                  type="email"
                  placeholder="teammate@loom.com"
                  className="w-full bg-slate-50 border border-border rounded-xl px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-accent outline-none transition-colors"
                  value={shareEmail}
                  onChange={e => setShareEmail(e.target.value)}
                />
                <button 
                  onClick={handleShare}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10"
                >
                  <Share2 className="w-4 h-4"/>
                  Invite Member
                </button>
              </div>

              {dashboard.sharedWith && dashboard.sharedWith.length > 0 && (
                <div className="mt-8 pt-8 border-t border-border">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Current Collaborators</h4>
                  <div className="space-y-3">
                    {dashboard.sharedWith.map(email => (
                      <div key={email} className="flex items-center justify-between text-sm py-1">
                        <div className="flex items-center gap-2">
                           <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                           <span className="text-slate-700 font-medium">{email}</span>
                        </div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">Active</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dashboard Sub-Header */}
      <div className="bg-surface border-b border-border px-8 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors border-r border-border pr-4 mr-2"
            title="Back to Hub"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            {editingTitle ? (
              <div className="flex items-center gap-2">
                <input 
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  autoFocus
                  className="bg-slate-50 text-slate-900 px-3 py-1 rounded-lg border border-accent outline-none font-bold"
                />
                <button onClick={saveName} className="p-1.5 hover:text-green-600 transition-colors"><Save className="w-4 h-4"/></button>
                <button onClick={() => setEditingTitle(false)} className="p-1.5 hover:text-red-500 transition-colors"><X className="w-4 h-4"/></button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 
                  onClick={() => setEditingTitle(true)}
                  className="text-xl font-bold text-slate-900 tracking-tighter cursor-pointer hover:text-accent transition-colors"
                >
                  {dashboard.name}
                </h1>
                <span className="px-2 py-0.5 bg-blue-50 text-accent text-[10px] font-bold rounded uppercase tracking-widest">Master</span>
              </div>
            )}
            <div className="h-4 w-[1px] bg-border mx-2" />
            <div className="flex items-center gap-2 text-slate-400 text-[10px] uppercase tracking-[0.2em] font-bold">
              <LayoutIcon className="w-3.5 h-3.5" />
              {dashboard.widgets.length} Objects
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsSharing(true)}
            className="flex items-center gap-2 text-[10px] font-bold border border-border hover:bg-slate-50 text-slate-900 px-4 py-2 rounded-lg transition-all"
          >
            <Share2 className="w-3.5 h-3.5" />
            Collaborate
          </button>
          <button 
            onClick={() => setIsAddingWidget(true)}
            className="flex items-center gap-2 text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-lg transition-all shadow-lg shadow-slate-900/10"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Widget
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-surface border-r border-border flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          <div className="p-6 space-y-8">
            <section>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Data Sources</h3>
              <div className="space-y-3">
                {datasets.map(ds => (
                  <div 
                    key={ds.id} 
                    onClick={() => setActiveDataset(ds)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer shadow-sm ${activeDataset?.id === ds.id ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-border bg-white text-slate-600 hover:border-slate-300'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className={`font-bold text-xs truncate ${activeDataset?.id === ds.id ? 'text-accent' : 'text-slate-900'}`}>{ds.name}</div>
                      <div className={`w-1.5 h-1.5 rounded-full ${activeDataset?.id === ds.id ? 'bg-accent' : 'bg-slate-200'}`}></div>
                    </div>
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{ds.columns.length} columns • {ds.data.length} rows</div>
                    
                    {activeDataset?.id === ds.id && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAutoSuggest(ds); }}
                        disabled={isGenerating}
                        className="mt-4 w-full py-2 bg-accent text-white text-[10px] font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
                      >
                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3" />}
                        Generate Intelligence
                      </button>
                    )}
                  </div>
                ))}
                
                <DatasetUploader onUploaded={(id) => {}} />
              </div>
            </section>

            {activeDataset && (
              <section>
                <div className="flex items-center justify-between mb-4">
                   <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Inventory</h3>
                   <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 uppercase">{activeDataset.columns.length} Fields</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {activeDataset.columns.map(col => (
                    <div key={col} className="text-[9px] font-bold px-2 py-1.5 bg-slate-50 text-slate-500 rounded-md border border-slate-100 truncate hover:border-slate-200 transition-colors">
                      {col}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 bg-background overflow-y-auto p-12 custom-scrollbar relative bg-dot-pattern">
           {dashboard.widgets.length === 0 ? (
             <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto">
                <div className="w-20 h-20 rounded-3xl bg-white border border-border shadow-xl flex items-center justify-center mb-8 rotate-3">
                  <Grid3X3 className="w-8 h-8 text-slate-200" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Masterful Canvas</h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  Your workspace is ready. Select a dataset from the inventory and let Gemini auto-generate your masterful visual structures.
                </p>
                <div className="flex gap-2">
                   <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
                   <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                   <div className="w-2 h-2 bg-slate-100 rounded-full"></div>
                </div>
             </div>
           ) : (
            <div className="max-w-[1600px] mx-auto">
              <ResponsiveGridLayout
                className="layout"
                layouts={{ lg: dashboard.widgets.map(w => ({ i: w.id, ...w.layout })) }}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                rowHeight={80}
                onLayoutChange={(c, all) => updateLayout(all.lg)}
                draggableHandle=".widget-handle"
                margin={[24, 24]}
              >
                {dashboard.widgets.map((widget) => {
                  const ds = datasets.find(d => d.id === widget.datasetId);
                  return (
                    <div key={widget.id} className="bg-surface border border-border rounded-2xl shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all group p-4 overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-1.5 widget-handle cursor-move group-hover:bg-accent/40 transition-colors rounded-t-full" />
                      {ds ? (
                        <Widget widget={widget} data={ds.data} />
                      ) : (
                        <div className="h-full flex items-center justify-center text-slate-300 text-xs font-bold uppercase tracking-widest italic">
                          Object Missing
                        </div>
                      )}
                    </div>
                  );
                })}
              </ResponsiveGridLayout>
              
              <div className="mt-24 max-w-4xl">
                {activeDataset && (
                  <AIAssistant 
                    datasetId={activeDataset.id} 
                    data={activeDataset.data} 
                    columns={activeDataset.columns} 
                  />
                )}
              </div>
            </div>
           )}
        </div>
      </div>
    </div>
  );
}

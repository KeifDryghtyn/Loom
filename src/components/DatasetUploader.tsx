import { useState } from 'react';
import { Upload, FileText, Check, Loader2 } from 'lucide-react';
import Papa from 'papaparse';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { cn } from '../lib/utils';

export default function DatasetUploader({ onUploaded }: { onUploaded: (id: string) => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      complete: async (results) => {
        try {
          if (results.errors.length > 0) {
            throw new Error("Error parsing CSV");
          }

          const dataset = {
            name: file.name,
            userId: auth.currentUser?.uid,
            data: results.data,
            columns: results.meta.fields || [],
            createdAt: serverTimestamp(),
          };

          const docRef = await addDoc(collection(db, 'datasets'), dataset);
          onUploaded(docRef.id);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to upload dataset");
        } finally {
          setIsUploading(false);
        }
      },
      error: (err) => {
        setError(err.message);
        setIsUploading(false);
      }
    });
  };

  return (
    <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 hover:border-accent transition-all group cursor-pointer relative shadow-inner">
      <input
        type="file"
        accept=".csv,.json"
        className="absolute inset-0 opacity-0 cursor-pointer"
        onChange={handleFileUpload}
        disabled={isUploading}
      />
      
      {isUploading ? (
        <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
      ) : (
        <Upload className="w-10 h-10 text-slate-300 group-hover:text-accent group-hover:scale-110 transition-all mb-4" />
      )}
      
      <h3 className="text-sm font-bold text-slate-900 mb-1 uppercase tracking-widest">Master Import</h3>
      <p className="text-slate-400 text-[10px] mb-4 text-center max-w-xs font-bold uppercase tracking-wider">
        Drag/Drop CSV or JSON
      </p>

      {error && <p className="text-red-500 text-[10px] font-bold mt-2 uppercase">{error}</p>}
    </div>
  );
}

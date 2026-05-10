import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, signIn, logOut } from '../lib/firebase';
import { LogIn, LogOut, Layout as LayoutIcon, Plus } from 'lucide-react';
import { motion } from 'motion/react';

export default function Navbar() {
  const [user] = useAuthState(auth);

  return (
    <nav className="border-b border-border bg-surface px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
          <LayoutIcon className="text-white w-5 h-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">Loom</span>
      </div>

      <div className="flex items-center gap-6">
        {user ? (
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-semibold text-slate-900">{user.displayName}</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-medium">{user.email}</span>
            </div>
            {user.photoURL && (
              <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-border" />
            )}
            <button
              onClick={logOut}
              className="p-2 text-slate-400 hover:text-slate-900 transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <button
            onClick={signIn}
            className="flex items-center gap-2 bg-brand text-white px-4 py-2 rounded-md font-medium hover:bg-slate-800 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
        )}
      </div>
    </nav>
  );
}

import React from 'react';
import { useStore } from '../../../store/index.js';
import { Sparkles } from 'lucide-react';

export default function SignInModal({ isOpen, onClose, signInReason }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 text-center space-y-4">
        <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto border border-green-100">
          <Sparkles className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-base font-bold text-slate-800">Sign In Required</h3>
          <p className="text-xs text-slate-500 leading-relaxed px-1">
            {signInReason || "Please sign in with Google to analyze images and report civic issues."}
          </p>
        </div>
        
        <button
          type="button"
          onClick={async () => {
            try {
              await useStore.getState().loginWithGoogle();
              const currentUser = useStore.getState().user;
              if (currentUser) {
                onClose();
              }
            } catch (err) {
              console.error("Sign in failed:", err);
            }
          }}
          className="w-full flex items-center justify-center space-x-2.5 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs active:scale-98 transition-all cursor-pointer"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.4 3.68 1.49 7.57l3.92 3.04C6.38 7.57 8.94 5.04 12 5.04z" />
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.46c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.49z" />
            <path fill="#FBBC05" d="M5.41 10.61c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26L1.49 3.05C.54 4.95 0 7.07 0 9.3c0 2.23.54 4.35 1.49 6.25l3.92-3.04c-.24-.71-.38-1.47-.38-2.26z" />
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.66 1.09-3.06 0-5.62-2.53-6.59-5.57L1.13 15.8C3.04 19.69 6.99 23 12 23z" />
          </svg>
          <span>Sign in with Google</span>
        </button>
        
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold hover:bg-slate-50 rounded-xl transition-all"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

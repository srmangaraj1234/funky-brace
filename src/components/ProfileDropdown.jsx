import React, { useState, useEffect, useRef } from 'react';
import { Shield, LogOut, ChevronDown } from 'lucide-react';
import { getInitials, getFirstName } from '../utils/userDisplay.js';

export default function ProfileDropdown({ 
  user, 
  role, 
  onToggleRole, 
  onSignOutClick, 
  onOpen, 
  activeDropdown 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when activeDropdown shifts to something else
  useEffect(() => {
    if (activeDropdown !== 'profile') {
      setIsOpen(false);
    }
  }, [activeDropdown]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      onOpen?.();
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={handleToggle}
        className="flex items-center space-x-2 pl-2.5 pr-3 py-1.5 hover:bg-slate-50 rounded-full border border-slate-200/80 transition-all text-left cursor-pointer"
      >
        {user.avatar ? (
          <img 
            src={user.avatar} 
            alt={user.displayName} 
            referrerPolicy="no-referrer"
            className="w-7 h-7 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs uppercase">
            {getInitials(user.displayName)}
          </div>
        )}
        <div className="hidden sm:flex items-center space-x-1">
          <span className="text-xs font-bold text-slate-800">{getFirstName(user.displayName)}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-250 text-left">
          <div className="px-4 py-2 border-b border-slate-100">
            <p className="text-xs text-slate-400">Signed in as</p>
            <p className="text-sm font-semibold text-slate-800 truncate">{user.email}</p>
          </div>

          <div className="p-2 border-b border-slate-100">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
              Demo Control Panel
            </div>
            <button
              onClick={() => {
                onToggleRole();
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Shield className="w-4 h-4 text-green-600" />
                <span>Switch Mode</span>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold capitalize">
                {role === 'citizen' ? 'To Admin' : 'To Citizen'}
              </span>
            </button>
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                onSignOutClick();
                setIsOpen(false);
              }}
              className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-all text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

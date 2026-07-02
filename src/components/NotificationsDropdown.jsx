import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';

export default function NotificationsDropdown({ onOpen, activeDropdown }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const notifications = [
    {
      id: 1,
      title: "Issue Resolved! 🎉",
      message: "Streetlight on 12th Main Road has been marked as Resolved by Admin.",
      time: "2 hours ago",
      unread: true,
    },
    {
      id: 2,
      title: "New Upvote on your report",
      message: "Your reported Pothole has reached Community Verified status.",
      time: "1 day ago",
      unread: false,
    }
  ];

  // Close when activeDropdown shifts to something else
  useEffect(() => {
    if (activeDropdown !== 'notifications') {
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
        className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all relative border border-slate-100 cursor-pointer"
      >
        <Bell className="w-5 h-5" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 border border-white rounded-full"></span>
      </button>

      {isOpen && (
        <div className="absolute right-[-44px] sm:right-0 mt-3 w-72 sm:w-80 bg-white border border-slate-200/80 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-250">
          <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
            <span className="font-semibold text-sm text-slate-800">Notifications</span>
            <span className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full font-semibold">1 New</span>
          </div>
          <div className="max-h-72 overflow-y-auto">
            {notifications.map((notif) => (
              <div key={notif.id} className={`p-3.5 border-b border-slate-50 hover:bg-slate-50 transition-all text-left ${notif.unread ? 'bg-green-50/20' : ''}`}>
                <div className="flex items-start space-x-2.5">
                  <div className={`mt-0.5 w-2 h-2 rounded-full ${notif.unread ? 'bg-rose-500' : 'bg-transparent'}`} />
                  <div className="flex-1">
                    <p className="font-medium text-xs text-slate-800">{notif.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{notif.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

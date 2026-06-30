import React, { useState } from 'react';
import { useStore } from '../store/index.js';
import { MapPin, Search, Bell, Shield, LogOut, ChevronDown, X } from 'lucide-react';

export default function Navbar() {
  const { user, role, loginWithGoogle, logout, toggleDevRole, searchQuery, setSearchQuery } = useStore();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

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

  const handleToggleRole = () => {
    toggleDevRole();
    setShowProfileDropdown(false);
  };

  const handleSignIn = () => {
    loginWithGoogle();
  };

  const handleSignOut = () => {
    setShowSignOutConfirm(true);
    setShowProfileDropdown(false);
  };

  // Extract initials for the avatar placeholder
  const getInitials = (name) => {
    if (!name) return 'US';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getFirstName = (name) => {
    if (!name) return 'User';
    return name.split(' ')[0];
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-slate-200/60 shadow-xs px-4 md:px-8 py-3 flex items-center justify-between">
      {/* Brand Logo */}
      <div className="flex items-center space-x-2.5 select-none">
        <div className="bg-green-500 p-1.5 rounded-xl flex items-center justify-center text-white shadow-sm border border-green-400">
          <MapPin className="w-5 h-5 fill-white stroke-green-500 stroke-2" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-800">
          FixMy<span className="text-green-600">City</span>
        </span>
      </div>

      {/* Global Search */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          if (searchQuery && searchQuery.trim() !== '') {
            const element = document.getElementById("current-issues-feed");
            if (element) {
              element.scrollIntoView({ behavior: 'smooth' });
            }
          }
        }}
        className="hidden md:flex items-center flex-1 max-w-lg mx-8 relative"
      >
        <input
          type="text"
          placeholder="Search by title, category, location, or status..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`w-full pl-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-800 placeholder-slate-400 font-medium ${
            searchQuery ? 'pr-16' : 'pr-10'
          }`}
        />
        <div className="absolute right-2.5 flex items-center space-x-1">
          {searchQuery && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setSearchQuery('');
              }}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-all cursor-pointer"
              title="Clear Search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="p-1 text-slate-400 hover:text-green-600 rounded-lg transition-all cursor-pointer"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Action Tray */}
      <div className="flex items-center space-x-3">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileDropdown(false);
            }}
            className="p-2 text-slate-500 hover:bg-slate-50 rounded-full transition-all relative border border-slate-100"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 border border-white rounded-full"></span>
          </button>

          {showNotifications && (
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

        {/* Authentication & Profile Setup */}
        {user ? (
          <div className="relative">
            <button
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowNotifications(false);
              }}
              className="flex items-center space-x-2 pl-2.5 pr-3 py-1.5 hover:bg-slate-50 rounded-full border border-slate-200/80 transition-all text-left"
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

            {showProfileDropdown && (
              <div className="absolute right-0 mt-3 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-3 duration-250">
                <div className="px-4 py-2 border-b border-slate-100">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-semibold text-slate-800 truncate">{user.email}</p>
                </div>

                <div className="p-2 border-b border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1.5">
                    Demo Control Panel
                  </div>
                  <button
                    onClick={handleToggleRole}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-xl transition-all"
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
                    onClick={handleSignOut}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-xl transition-all text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSignIn}
              className="flex items-center space-x-2 px-4 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-full border border-slate-200 shadow-xs active:scale-98 transition-all"
            >
              {/* Google colorful logo */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.4 3.68 1.49 7.57l3.92 3.04C6.38 7.57 8.94 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.46c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.88 3.39-8.49z" />
                <path fill="#FBBC05" d="M5.41 10.61c-.24-.71-.38-1.47-.38-2.26s.14-1.55.38-2.26L1.49 3.05C.54 4.95 0 7.07 0 9.3c0 2.23.54 4.35 1.49 6.25l3.92-3.04c-.24-.71-.38-1.47-.38-2.26z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.66 1.09-3.06 0-5.62-2.53-6.59-5.57L1.13 15.8C3.04 19.69 6.99 23 12 23z" />
              </svg>
              <span>Sign in with Google</span>
            </button>
          </div>
        )}
      </div>

      {/* Beautiful Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 text-left">
            <h3 className="text-base font-bold text-slate-800">Sign Out</h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to sign out of FixMyCity? You will need to sign back in to report issues or upvote community reports.
            </p>
            <div className="flex items-center justify-end space-x-2.5 mt-5">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSignOutConfirm(false);
                  logout();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

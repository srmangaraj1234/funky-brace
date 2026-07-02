import React, { useState } from 'react';
import { useStore } from '../store/index.js';
import { MapPin } from 'lucide-react';

import SearchBar from './SearchBar.jsx';
import NotificationsDropdown from './NotificationsDropdown.jsx';
import ProfileDropdown from './ProfileDropdown.jsx';
import GoogleSignInButton from './GoogleSignInButton.jsx';
import SignOutConfirmModal from './SignOutConfirmModal.jsx';

export default function Navbar() {
  const { user, role, loginWithGoogle, logout, toggleDevRole, searchQuery, setSearchQuery } = useStore();
  
  // Track active dropdown to ensure mutual exclusivity
  const [activeDropdown, setActiveDropdown] = useState(null); // 'notifications' | 'profile' | null
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  const handleToggleRole = () => {
    toggleDevRole();
    setActiveDropdown(null);
  };

  const handleSignIn = () => {
    loginWithGoogle();
  };

  const handleSignOutClick = () => {
    setShowSignOutConfirm(true);
    setActiveDropdown(null);
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

      {/* Global Search Bar */}
      <SearchBar 
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Action Tray */}
      <div className="flex items-center space-x-3">
        {/* Notifications Dropdown */}
        <NotificationsDropdown 
          onOpen={() => setActiveDropdown('notifications')}
          activeDropdown={activeDropdown}
        />

        {/* Authentication & Profile Dropdown */}
        {user ? (
          <ProfileDropdown 
            user={user}
            role={role}
            onToggleRole={handleToggleRole}
            onSignOutClick={handleSignOutClick}
            onOpen={() => setActiveDropdown('profile')}
            activeDropdown={activeDropdown}
          />
        ) : (
          <GoogleSignInButton 
            onClick={handleSignIn}
          />
        )}
      </div>

      {/* Beautiful Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <SignOutConfirmModal 
          onCancel={() => setShowSignOutConfirm(false)}
          onConfirm={() => {
            setShowSignOutConfirm(false);
            logout();
          }}
        />
      )}
    </header>
  );
}

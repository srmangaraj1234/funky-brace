import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { signInWithPopup, signOut } from 'firebase/auth';
import { db, auth, googleProvider } from '../../services/firebase.js';

let isLoggingIn = false;

export const createAuthSlice = (set, get) => ({
  user: null,
  role: 'citizen', // 'citizen' | 'admin'

  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),

  // Authentication Actions
  loginWithGoogle: async () => {
    if (isLoggingIn) {
      console.warn('Google login is already in progress, ignoring duplicate request.');
      return;
    }
    isLoggingIn = true;
    set({ loading: true, error: null });
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      let userRole = 'citizen';
      
      // Fetch or create user role document (handles offline state gracefully)
      try {
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          try {
            await setDoc(userDocRef, {
              email: user.email,
              displayName: user.displayName || 'Anonymous Citizen',
              role: 'citizen',
              createdAt: new Date().toISOString()
            });
          } catch (setErr) {
            console.warn('Failed to create user doc in Firestore (offline):', setErr.message);
          }
        } else {
          userRole = userDoc.data().role || 'citizen';
        }
      } catch (dbErr) {
        if (dbErr.message && dbErr.message.includes('offline')) {
          console.warn('Firestore is offline during login. Falling back to default citizen role.');
        } else {
          console.error('Error syncing user profile in Firestore:', dbErr);
        }
      }

      set({ 
        user: {
          uid: user.uid,
          displayName: user.displayName || 'Anonymous Citizen',
          email: user.email,
          avatar: user.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80'
        },
        role: userRole,
        loading: false 
      });
    } catch (err) {
      if (err.message && err.message.includes('offline')) {
        console.warn('Authentication/Login failed because client is offline:', err.message);
        set({ error: err.message, loading: false });
      } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
        console.log('User closed or cancelled the authentication popup.');
        set({ loading: false }); // Do not set error for a simple user cancel
      } else {
        console.error('Login error:', err);
        set({ error: err.message, loading: false });
      }
    } finally {
      isLoggingIn = false;
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await signOut(auth);
      set({ user: null, role: 'citizen', loading: false });
    } catch (err) {
      console.error('Logout error:', err);
      set({ error: err.message, loading: false });
    }
  },

  // Manually Toggle Role for easy development / evaluation sandbox testing
  toggleDevRole: async () => {
    const currentRole = get().role;
    const nextRole = currentRole === 'citizen' ? 'admin' : 'citizen';
    set({ role: nextRole });
    
    // Persist to user doc in DB if logged in
    const currentUser = get().user;
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await updateDoc(userDocRef, { role: nextRole });
        console.log(`Updated Firestore user role to: ${nextRole}`);
      } catch (err) {
        console.warn('Could not update Firestore user role (permissions or non-existent doc):', err.message);
      }
    }
  },
});

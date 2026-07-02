import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase.js';

export default function useAuthSync(setUser, setRole) {
  useEffect(() => {
    // Monitor Firebase Auth state change
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        console.log('Firebase user authenticated:', firebaseUser.email);
        
        // Fetch or create user document in Firestore to check roles
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          let userRole = 'citizen';
          if (userDoc.exists()) {
            userRole = userDoc.data().role || 'citizen';
          }
          
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Anonymous Citizen',
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80'
          });
          setRole(userRole);
        } catch (dbErr) {
          if (dbErr.message && dbErr.message.includes('offline')) {
            console.warn('Firestore is offline. Proceeding with offline fallback user state.');
          } else {
            console.warn('Error fetching user document from Firestore (using fallback):', dbErr);
          }
          // Basic fallback if user collection permissions limit reading
          setUser({
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Anonymous Citizen',
            email: firebaseUser.email,
            avatar: firebaseUser.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=80'
          });
          setRole('citizen');
        }
      } else {
        console.log('Firebase user signed out.');
        setUser(null);
        setRole('citizen');
      }
    });

    return () => {
      unsubscribeAuth();
    };
  }, [setUser, setRole]);
}

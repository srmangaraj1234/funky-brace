// Zustand Global State Store for FixMyCity with Real-time Firestore Sync
import { create } from 'zustand';
import { 
  collection, 
  doc, 
  addDoc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  onSnapshot, 
  query, 
  orderBy,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut 
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, auth, googleProvider, storage } from '../services/firebase.js';



export const useStore = create((set, get) => {
  // Let's declare the subscription variable to prevent duplicates
  let unsubscribeIssues = null;
  let isLoggingIn = false;

  return {
    user: null,
    role: 'citizen', // 'citizen' | 'admin'
    issues: [],
    selectedIssueId: null,
    activeFilter: 'all', // 'all' | 'nearby' | 'trending' | 'new'
    searchQuery: '',
    loading: false,
    error: null,
    userLocation: null, // User's dynamic client-side geolocation coordinates

    // Get live computed stats directly from state.issues (derived from Firestore real-time listener)
    getStats: () => {
      const issues = get().issues;
      const total = issues.length;
      const resolved = issues.filter((i) => i.status === 'Resolved').length;
      const pending = total - resolved;

      // Calculate unique active citizens who have created or upvoted issues
      const activeCitizensSet = new Set();
      issues.forEach((issue) => {
        if (issue.createdBy && issue.createdBy !== 'anonymous_guest') {
          activeCitizensSet.add(issue.createdBy);
        }
        if (Array.isArray(issue.upvotedBy)) {
          issue.upvotedBy.forEach((uid) => {
            if (uid) activeCitizensSet.add(uid);
          });
        }
      });
      const activeCitizens = activeCitizensSet.size;

      return { total, pending, resolved, activeCitizens };
    },

    setUser: (user) => set({ user }),
    setRole: (role) => set({ role }),
    setIssues: (issues) => set({ issues }),
    setSelectedIssueId: (id) => set({ selectedIssueId: id }),
    setActiveFilter: (filter) => set({ activeFilter: filter }),
    setSearchQuery: (query) => set({ searchQuery: query }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
    setUserLocation: (userLocation) => set({ userLocation }),

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

    // Start Real-time synchronization of issues collection
    startSyncingIssues: () => {
      if (unsubscribeIssues) {
        console.log('Real-time sync already active.');
        return;
      }

      set({ loading: true });
      const issuesCollection = collection(db, 'issues');
      const q = query(issuesCollection, orderBy('createdAt', 'desc'));

      unsubscribeIssues = onSnapshot(q, (snapshot) => {
        const issuesList = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          issuesList.push({
            id: docSnap.id,
            upvotesCount: data.upvotesCount ?? 0,
            upvotedBy: data.upvotedBy || [],
            ...data
          });
        });

        set({ issues: issuesList, loading: false });
      }, (err) => {
        console.warn('Firestore real-time sync failed or permission denied:', err.message || err);
        set({ loading: false });
      });
    },

    stopSyncingIssues: () => {
      if (unsubscribeIssues) {
        unsubscribeIssues();
        unsubscribeIssues = null;
        console.log('Real-time sync stopped.');
      }
    },

    // Add a new reported issue to Firestore with Firebase Storage upload and rollback
    addIssue: async (newIssue, imageFile) => {
      set({ loading: true, error: null });
      console.log('[TRACE] addIssue(newIssue, imageFile) inside store is called.');
      if (imageFile) {
        console.log(`[TRACE] imageFile exists inside store: true | Name: "${imageFile.name}" | MIME: "${imageFile.type}" | Size: ${imageFile.size} bytes`);
      } else {
        console.log('[TRACE] imageFile exists inside store: false');
      }
      
      let uploadedRef = null;
      try {
        const issuesCollection = collection(db, 'issues');
        // Pre-allocate the Firestore document reference to obtain the unique issue ID
        const docRef = doc(issuesCollection);
        const issueId = docRef.id;

        let finalImageUrl = newIssue.imageUrl || null;

        // If an image file is provided, upload it to Firebase Storage under the deterministic path
        if (imageFile) {
          const fileRef = ref(storage, `issue-images/${issueId}/image.jpg`);
          try {
            console.log('[TRACE] Before uploadBytes().');
            await uploadBytes(fileRef, imageFile);
            console.log('[TRACE] After uploadBytes() succeeds.');
            uploadedRef = fileRef;
            
            console.log('[TRACE] Before getDownloadURL().');
            finalImageUrl = await getDownloadURL(fileRef);
            console.log('[TRACE] After getDownloadURL() succeeds, print the generated download URL:', finalImageUrl);
          } catch (storageErr) {
            console.error('[TRACE] Storage exception caught. Exact Error Code:', storageErr.code, '| Message:', storageErr.message, '| Full error:', storageErr);
            throw storageErr; // Throw original error directly to print exact details and not hide it
          }
        }

        const docData = {
          upvotesCount: 0,
          upvotedBy: [],
          createdAt: new Date().toISOString(),
          resolvedAt: null,
          adminNotes: '',
          ...newIssue,
          imageUrl: finalImageUrl
        };

        // Write the structured metadata to Firestore
        console.log('[TRACE] Before setDoc().');
        await setDoc(docRef, docData);
        console.log('[TRACE] After setDoc() succeeds.');
        console.log('New issue written to Firestore successfully:', issueId);
        
        const savedIssue = { id: issueId, ...docData };
        
        // Instantly update local state so the issue is visible, even if real-time sync is blocked
        set((state) => {
          if (state.issues.some((i) => i.id === savedIssue.id)) {
            return { loading: false };
          }
          return {
            issues: [savedIssue, ...state.issues],
            loading: false
          };
        });

        return savedIssue;
      } catch (err) {
        console.error('[TRACE] addIssue encountered an exception. Exact Error Code:', err.code, '| Message:', err.message, '| Full error:', err);
        
        // If the Firestore write fails, perform rollback logic to delete the uploaded image
        if (uploadedRef) {
          try {
            console.log('[TRACE] Before deleteObject() (rollback), if it is ever executed.');
            await deleteObject(uploadedRef);
            console.log('Successfully rolled back and deleted uploaded image due to Firestore failure.');
          } catch (rollbackErr) {
            console.error('Failed to roll back uploaded image. Error code:', rollbackErr.code, '| Message:', rollbackErr.message, '| Full error:', rollbackErr);
          }
        }

        set({ error: err.message || 'Failed to report issue', loading: false });
        throw err;
      }
    },

    // Toggle upvote/validation for a user in Firestore
    toggleUpvote: async (issueId, userUid) => {
      const issues = get().issues;
      const currentIssue = issues.find((i) => i.id === issueId);
      if (!currentIssue) {
        console.error('Issue does not exist.');
        return;
      }

      if (currentIssue.createdBy === userUid) {
        set({ error: 'You cannot upvote your own reported issues.' });
        return;
      }

      const upvotedBy = currentIssue.upvotedBy || [];
      const isUpvoted = upvotedBy.includes(userUid);
      
      let newUpvotedBy;
      if (isUpvoted) {
        newUpvotedBy = upvotedBy.filter((uid) => uid !== userUid);
      } else {
        newUpvotedBy = [...upvotedBy, userUid];
      }

      const newUpvotesCount = newUpvotedBy.length;
      
      // Auto-change status from "Reported" to "Verified" if upvotes >= 3
      let newStatus = currentIssue.status;
      if (currentIssue.status === 'Reported' && newUpvotesCount >= 3) {
        newStatus = 'Verified';
      } else if (currentIssue.status === 'Verified' && newUpvotesCount < 3) {
        newStatus = 'Reported';
      }

      // Update locally first for instant feedback & resilience
      set((state) => ({
        issues: state.issues.map((i) => 
          i.id === issueId 
            ? { ...i, upvotesCount: newUpvotesCount, upvotedBy: newUpvotedBy, status: newStatus } 
            : i
        )
      }));

      try {
        const issueRef = doc(db, 'issues', issueId);
        await updateDoc(issueRef, {
          upvotesCount: newUpvotesCount,
          upvotedBy: newUpvotedBy,
          status: newStatus
        });
        console.log('Upvote toggled successfully in Firestore.');
      } catch (err) {
        console.warn('Firestore upvote update failed (offline or permission denied):', err.message || err);
      }
    },

    // Update status (Admin exclusive action)
    updateIssueStatus: async (issueId, status, adminNotes = '') => {
      set({ loading: true, error: null });
      const issues = get().issues;
      const currentIssue = issues.find((i) => i.id === issueId);
      if (!currentIssue) {
        set({ error: 'Issue does not exist.', loading: false });
        return;
      }

      const resolvedAtLocal = status === 'Resolved' ? new Date().toISOString() : null;
      const resolvedBy = status === 'Resolved' ? (get().user?.uid || auth.currentUser?.uid || 'admin_user') : null;

      // Update locally first for instant feedback & resilience
      set((state) => ({
        issues: state.issues.map((i) => 
          i.id === issueId 
            ? { 
                ...i, 
                status, 
                adminNotes, 
                ...(status === 'Resolved' ? { resolvedAt: resolvedAtLocal, resolvedBy } : {}) 
              } 
            : i
        ),
        loading: false
      }));

      try {
        const issueRef = doc(db, 'issues', issueId);
        const updateData = {
          status,
          adminNotes,
        };
        if (status === 'Resolved') {
          updateData.resolvedAt = serverTimestamp();
          updateData.resolvedBy = resolvedBy;
        }
        await updateDoc(issueRef, updateData);
        console.log('Issue status updated in Firestore:', status);
      } catch (err) {
        console.warn('Firestore status update failed, utilizing local state fallback:', err.message || err);
      }

      // If marked as Resolved, dispatch an email notification using the server proxy
      if (status === 'Resolved') {
        const citizenEmail = currentIssue.creatorEmail || 'citizen@example.com';
        const issueTitle = currentIssue.title;

        // Fetch active user ID Token to authenticate Admin API requests
        const currentUser = auth.currentUser;
        let idToken = 'placeholder_token_admin'; // Fallback token if user isn't fully set up
        if (currentUser) {
          try {
            idToken = await currentUser.getIdToken();
          } catch (tokenErr) {
            console.warn('Failed to retrieve Firebase ID Token, using admin placeholder:', tokenErr);
          }
        }

        console.log(`Dispatched resolution email proxy request for ${citizenEmail}`);
        
        // Execute proxy API call
        try {
          const res = await fetch('/api/notifications/resolve', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              issueId,
              citizenEmail,
              issueTitle,
              adminNotes
            })
          });

          if (!res.ok) {
            console.error(`Proxy API returned error response status: ${res.status}`);
          }
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const proxyData = await res.json();
            console.log('Proxy API response:', proxyData);
          } else {
            console.log('Proxy API returned non-JSON response');
          }
        } catch (apiErr) {
          console.error('Failed to notify citizen via Resend proxy API:', apiErr);
        }
      }
    },

    // Delete issue (Admin exclusive action)
    deleteIssue: async (issueId) => {
      set({ loading: true, error: null });
      try {
        const issueRef = doc(db, 'issues', issueId);
        await deleteDoc(issueRef);
        console.log('Issue deleted from Firestore successfully:', issueId);
        
        set((state) => ({
          issues: state.issues.filter((i) => i.id !== issueId),
          loading: false
        }));
      } catch (err) {
        console.error('Error deleting issue from Firestore:', err);
        set({ error: err.message || 'Failed to delete issue', loading: false });
        throw err;
      }
    }
  };
});

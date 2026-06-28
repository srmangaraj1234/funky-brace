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

const initialIssues = [
  {
    id: 'bengaluru_issue_1',
    title: "Major water main burst on Koramangala 80 Feet Road",
    description: "Drinking water flooding the street near Sony World Signal. Millions of gallons being wasted since early morning.",
    category: "Water Leak",
    severity: "high",
    coordinates: { latitude: 12.9345, longitude: 77.6265 },
    address: "80 Feet Rd, 4th Block, Koramangala, Bengaluru, Karnataka",
    status: "Reported",
    createdBy: "citizen_km",
    creatorName: "Karthik Mehta",
    creatorEmail: "karthik.mehta@gmail.com",
    isAnonymous: false,
    upvotesCount: 45,
    upvotedBy: ["citizen_ms", "citizen_pa", "citizen_hs"],
    adminNotes: "",
    createdAt: "2026-06-26T22:23:00.000Z",
    resolvedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'bengaluru_issue_2',
    title: "Deep crater-sized potholes on Marathahalli flyover descent",
    description: "Severe craters on the descent towards Hope Farm/ORR. Two-wheelers are skidding daily trying to avoid these holes.",
    category: "Potholes",
    severity: "high",
    coordinates: { latitude: 12.9562, longitude: 77.6980 },
    address: "Outer Ring Rd, Marathahalli, Bengaluru, Karnataka",
    status: "In Progress",
    createdBy: "citizen_ms",
    creatorName: "Manjunath S.",
    creatorEmail: "manjunath.s@gmail.com",
    isAnonymous: false,
    upvotesCount: 112,
    upvotedBy: ["citizen_km", "citizen_pa", "citizen_hs", "citizen_vk"],
    adminNotes: "Asphalt patch team assigned to fill craters under BBMP zone work order #4829.",
    createdAt: "2026-06-26T14:15:00.000Z",
    resolvedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'bengaluru_issue_3',
    title: "Non-functional streetlights on ECC Road, Whitefield",
    description: "Over 8 streetlights in a row are completely dark. Absolutely unsafe for pedestrians walking back from ITPL after dusk.",
    category: "Streetlight Non-Functional",
    severity: "medium",
    coordinates: { latitude: 12.9840, longitude: 77.7400 },
    address: "ECC Rd, Pattandur Agrahara, Whitefield, Bengaluru, Karnataka",
    status: "Verified",
    createdBy: "citizen_pa",
    creatorName: "Pooja Amin",
    creatorEmail: "pooja.amin@gmail.com",
    isAnonymous: false,
    upvotesCount: 28,
    upvotedBy: ["citizen_km", "citizen_ms"],
    adminNotes: "Inspection by BESCOM confirmed local cable fault near transformer. Cable splicing scheduled.",
    createdAt: "2026-06-25T18:05:00.000Z",
    resolvedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'bengaluru_issue_4',
    title: "Illegal commercial garbage dumping near Sector 3 Park",
    description: "Large pile of rotting organic and plastic waste dumped on the roadside. Stray dog menace has increased significantly.",
    category: "Others",
    severity: "medium",
    coordinates: { latitude: 12.9115, longitude: 77.6385 },
    address: "14th Main Rd, Sector 3, HSR Layout, Bengaluru, Karnataka",
    status: "Reported",
    createdBy: "citizen_hs",
    creatorName: "Harish Sharma",
    creatorEmail: "harish.sharma@gmail.com",
    isAnonymous: false,
    upvotesCount: 19,
    upvotedBy: ["citizen_vk", "citizen_km"],
    adminNotes: "",
    createdAt: "2026-06-26T20:10:00.000Z",
    resolvedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'bengaluru_issue_5',
    title: "Sewage water backflow onto 36th Cross Road",
    description: "Blocked underground drainage causing sewage to bubble up onto the footpath, causing terrible stench and hygiene issues.",
    category: "Water Leak",
    severity: "high",
    coordinates: { latitude: 12.9238, longitude: 77.5891 },
    address: "36th Cross Rd, Jayanagar 4th T Block, Bengaluru, Karnataka",
    status: "Verified",
    createdBy: "citizen_vk",
    creatorName: "Vijay Kumar",
    creatorEmail: "vijay.kumar@gmail.com",
    isAnonymous: false,
    upvotesCount: 34,
    upvotedBy: ["citizen_hs", "citizen_km", "citizen_pa"],
    adminNotes: "BWSSB jetting machine dispatched to clear blockage. Root ingress in pipes detected.",
    createdAt: "2026-06-25T08:30:00.000Z",
    resolvedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'bengaluru_issue_6',
    title: "Dangerous potholes at Central Silk Board exit loop",
    description: "Massive road erosion where the flyover meets Outer Ring Road. Vehicles are forced to brake suddenly, worsening the jam.",
    category: "Potholes",
    severity: "high",
    coordinates: { latitude: 12.9176, longitude: 77.6244 },
    address: "Hosur Rd, Silk Board, Bengaluru, Karnataka",
    status: "In Progress",
    createdBy: "citizen_sd",
    creatorName: "Sandeep Divakar",
    creatorEmail: "sandeep.d@gmail.com",
    isAnonymous: false,
    upvotesCount: 256,
    upvotedBy: ["citizen_km", "citizen_ms", "citizen_pa", "citizen_hs", "citizen_vk", "citizen_na"],
    adminNotes: "Interim filling with wet mix complete. Micro-surfacing planned for overnight work.",
    createdAt: "2026-06-24T14:30:00.000Z",
    resolvedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'bengaluru_issue_7',
    title: "Streetlights not working under Electronic City Elevated Expressway",
    description: "The service road below the elevated highway has zero working lighting. High risk of accidents during night shifts.",
    category: "Streetlight Non-Functional",
    severity: "high",
    coordinates: { latitude: 12.8490, longitude: 77.6620 },
    address: "Hosur Rd, Phase 1, Electronic City, Bengaluru, Karnataka",
    status: "Reported",
    createdBy: "citizen_na",
    creatorName: "Nisha Ananth",
    creatorEmail: "nisha.ananth@gmail.com",
    isAnonymous: true,
    upvotesCount: 78,
    upvotedBy: ["citizen_sd", "citizen_km", "citizen_ms"],
    adminNotes: "",
    createdAt: "2026-06-26T18:15:00.000Z",
    resolvedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'bengaluru_issue_8',
    title: "Drinking water pipeline leak near Hebbal Flyover",
    description: "Water is constantly bubbling out from under the asphalt on the service lane. Local shops report low water pressure.",
    category: "Water Leak",
    severity: "medium",
    coordinates: { latitude: 13.0358, longitude: 77.5978 },
    address: "Bellary Rd, Hebbal, Bengaluru, Karnataka",
    status: "Reported",
    createdBy: "citizen_rk",
    creatorName: "Ramesh K.",
    creatorEmail: "ramesh.k@gmail.com",
    isAnonymous: false,
    upvotesCount: 15,
    upvotedBy: ["citizen_hs"],
    adminNotes: "",
    createdAt: "2026-06-26T21:00:00.000Z",
    resolvedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'bengaluru_issue_9',
    title: "Broken slab and open drain on Commercial Street",
    description: "A concrete block has caved in, leaving a 3-foot deep open hole in the middle of a highly crowded shopping footpath.",
    category: "Others",
    severity: "high",
    coordinates: { latitude: 12.9822, longitude: 77.6083 },
    address: "Commercial Street, Tasker Town, Shivaji Nagar, Bengaluru, Karnataka",
    status: "In Progress",
    createdBy: "citizen_ar",
    creatorName: "Ayesha Rahman",
    creatorEmail: "ayesha.r@gmail.com",
    isAnonymous: false,
    upvotesCount: 94,
    upvotedBy: ["citizen_km", "citizen_pa", "citizen_na"],
    adminNotes: "Area cordoned off. Custom concrete slab ordered for replacement tomorrow morning.",
    createdAt: "2026-06-26T10:30:00.000Z",
    resolvedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'bengaluru_issue_10',
    title: "Hazardous open transformer panel on 15th Cross Road",
    description: "A high-voltage power distribution transformer cabinet is wide open, with live copper terminals fully exposed at child height.",
    category: "Others",
    severity: "high",
    coordinates: { latitude: 12.9982, longitude: 77.5705 },
    address: "15th Cross Rd, Malleshwaram, Bengaluru, Karnataka",
    status: "Verified",
    createdBy: "citizen_ps",
    creatorName: "Prashant Sridhar",
    creatorEmail: "prashant.s@gmail.com",
    isAnonymous: false,
    upvotesCount: 140,
    upvotedBy: ["citizen_km", "citizen_pa", "citizen_vk", "citizen_rk"],
    adminNotes: "Emergency BESCOM field inspector dispatched. Safe locking latch to be welded onto cabinet.",
    createdAt: "2026-06-26T23:15:00.000Z",
    resolvedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'bengaluru_issue_11',
    title: "Series of deep craters near Varthur Lake Bridge",
    description: "Road has completely disintegrated due to heavy water tanker traffic. Extremely dusty during day, bone-rattling drive.",
    category: "Potholes",
    severity: "medium",
    coordinates: { latitude: 12.9430, longitude: 77.7470 },
    address: "Varthur Main Rd, Varthur, Bengaluru, Karnataka",
    status: "Reported",
    createdBy: "citizen_sk",
    creatorName: "Sanjay Karanth",
    creatorEmail: "sanjay.k@gmail.com",
    isAnonymous: false,
    upvotesCount: 22,
    upvotedBy: ["citizen_pa", "citizen_na"],
    adminNotes: "",
    createdAt: "2026-06-26T15:00:00.000Z",
    resolvedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'bengaluru_issue_12',
    title: "Dark stretch between EcoSpace and Bellandur flyover",
    description: "None of the high-mast highway lights are working. It's pitch black for commuters on two-wheelers merging onto ORR.",
    category: "Streetlight Non-Functional",
    severity: "high",
    coordinates: { latitude: 12.9272, longitude: 77.6800 },
    address: "EcoSpace Outer Ring Rd, Bellandur, Bengaluru, Karnataka",
    status: "In Progress",
    createdBy: "citizen_vs",
    creatorName: "Vikram Sen",
    creatorEmail: "vikram.sen@gmail.com",
    isAnonymous: false,
    upvotesCount: 165,
    upvotedBy: ["citizen_sd", "citizen_ms", "citizen_km", "citizen_vk"],
    adminNotes: "Power feeder panel replacement is underway. Complete restoration expected by tonight.",
    createdAt: "2026-06-25T14:30:00.000Z",
    resolvedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'bengaluru_issue_13',
    title: "Muddy and foul smelling municipal water supply",
    description: "Water coming from municipal taps is dark yellow/brown and has a distinct sewer-like smell. Affecting entire block.",
    category: "Water Leak",
    severity: "high",
    coordinates: { latitude: 12.9254, longitude: 77.5362 },
    address: "50 Feet Rd, Banashankari 3rd Stage, Bengaluru, Karnataka",
    status: "Reported",
    createdBy: "citizen_gk",
    creatorName: "Gopal Krishna",
    creatorEmail: "gopal.k@gmail.com",
    isAnonymous: false,
    upvotesCount: 31,
    upvotedBy: ["citizen_vk"],
    adminNotes: "",
    createdAt: "2026-06-27T00:30:00.000Z",
    resolvedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'bengaluru_issue_14',
    title: "Dangerous tyre-damaging pothole at Kaikondrahalli signal",
    description: "A sharp, deep pothole in the center lane right at the signal. Already caused multiple flat tyres this week.",
    category: "Potholes",
    severity: "high",
    coordinates: { latitude: 12.9138, longitude: 77.6782 },
    address: "Sarjapur Main Rd, Kaikondrahalli, Bengaluru, Karnataka",
    status: "Resolved",
    createdBy: "citizen_an",
    creatorName: "Anonymous Citizen",
    creatorEmail: "anonymous@fixmycity.org",
    isAnonymous: true,
    upvotesCount: 89,
    upvotedBy: ["citizen_km", "citizen_ms", "citizen_vs"],
    adminNotes: "Road engineering cell filled the pothole using quick-curing cold asphalt. Surface checked and verified clear.",
    createdAt: "2026-06-26T01:30:00.000Z",
    resolvedAt: "2026-06-26T22:30:00.000Z",
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: 'bengaluru_issue_15',
    title: "Heavy tree branch splintered and hanging over overhead power lines",
    description: "Following recent evening winds, a massive Gulmohar branch has cracked and is resting directly on high-tension wires.",
    category: "Others",
    severity: "medium",
    coordinates: { latitude: 12.9422, longitude: 77.5732 },
    address: "Bull Temple Rd, Basavanagudi, Bengaluru, Karnataka",
    status: "In Progress",
    createdBy: "citizen_sn",
    creatorName: "Shakuntala Naidu",
    creatorEmail: "shakuntala.n@gmail.com",
    isAnonymous: false,
    upvotesCount: 41,
    upvotedBy: ["citizen_gk", "citizen_vk"],
    adminNotes: "Forestry department team dispatched with tree-pruners. BESCOM safety shutdown coordinated.",
    createdAt: "2026-06-26T09:15:00.000Z",
    resolvedAt: null,
    imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400"
  }
];

export const useStore = create((set, get) => {
  // Let's declare the subscription variable to prevent duplicates
  let unsubscribeIssues = null;

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
        } else {
          console.error('Login error:', err);
        }
        set({ error: err.message, loading: false });
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

    // Seed 15 highly realistic Bengaluru issues into Firestore
    seedBengaluruIssues: async () => {
      set({ loading: true, error: null });
      try {
        const seedList = [
          {
            title: "Major water main burst on Koramangala 80 Feet Road",
            description: "Drinking water flooding the street near Sony World Signal. Millions of gallons being wasted since early morning.",
            category: "Water Leak",
            severity: "high",
            coordinates: { latitude: 12.9345, longitude: 77.6265 },
            address: "80 Feet Rd, 4th Block, Koramangala, Bengaluru, Karnataka",
            status: "Reported",
            createdBy: "citizen_km",
            creatorName: "Karthik Mehta",
            creatorEmail: "karthik.mehta@gmail.com",
            isAnonymous: false,
            upvotesCount: 45,
            upvotedBy: ["citizen_ms", "citizen_pa", "citizen_hs"],
            adminNotes: "",
            createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
            resolvedAt: null,
            imageUrl: "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&q=80&w=400"
          },
          {
            title: "Deep crater-sized potholes on Marathahalli flyover descent",
            description: "Severe craters on the descent towards Hope Farm/ORR. Two-wheelers are skidding daily trying to avoid these holes.",
            category: "Potholes",
            severity: "high",
            coordinates: { latitude: 12.9562, longitude: 77.6980 },
            address: "Outer Ring Rd, Marathahalli, Bengaluru, Karnataka",
            status: "In Progress",
            createdBy: "citizen_ms",
            creatorName: "Manjunath S.",
            creatorEmail: "manjunath.s@gmail.com",
            isAnonymous: false,
            upvotesCount: 112,
            upvotedBy: ["citizen_km", "citizen_pa", "citizen_hs", "citizen_vk"],
            adminNotes: "Asphalt patch team assigned to fill craters under BBMP zone work order #4829.",
            createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
            resolvedAt: null,
            imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400"
          },
          {
            title: "Non-functional streetlights on ECC Road, Whitefield",
            description: "Over 8 streetlights in a row are completely dark. Absolutely unsafe for pedestrians walking back from ITPL after dusk.",
            category: "Streetlight Non-Functional",
            severity: "medium",
            coordinates: { latitude: 12.9840, longitude: 77.7400 },
            address: "ECC Rd, Pattandur Agrahara, Whitefield, Bengaluru, Karnataka",
            status: "Verified",
            createdBy: "citizen_pa",
            creatorName: "Pooja Amin",
            creatorEmail: "pooja.amin@gmail.com",
            isAnonymous: false,
            upvotesCount: 28,
            upvotedBy: ["citizen_km", "citizen_ms"],
            adminNotes: "Inspection by BESCOM confirmed local cable fault near transformer. Cable splicing scheduled.",
            createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
            resolvedAt: null,
            imageUrl: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&q=80&w=400"
          },
          {
            title: "Illegal commercial garbage dumping near Sector 3 Park",
            description: "Large pile of rotting organic and plastic waste dumped on the roadside. Stray dog menace has increased significantly.",
            category: "Others",
            severity: "medium",
            coordinates: { latitude: 12.9115, longitude: 77.6385 },
            address: "14th Main Rd, Sector 3, HSR Layout, Bengaluru, Karnataka",
            status: "Reported",
            createdBy: "citizen_hs",
            creatorName: "Harish Sharma",
            creatorEmail: "harish.sharma@gmail.com",
            isAnonymous: false,
            upvotesCount: 19,
            upvotedBy: ["citizen_vk", "citizen_km"],
            adminNotes: "",
            createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
            resolvedAt: null,
            imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400"
          },
          {
            title: "Sewage water backflow onto 36th Cross Road",
            description: "Blocked underground drainage causing sewage to bubble up onto the footpath, causing terrible stench and hygiene issues.",
            category: "Water Leak",
            severity: "high",
            coordinates: { latitude: 12.9238, longitude: 77.5891 },
            address: "36th Cross Rd, Jayanagar 4th T Block, Bengaluru, Karnataka",
            status: "Verified",
            createdBy: "citizen_vk",
            creatorName: "Vijay Kumar",
            creatorEmail: "vijay.kumar@gmail.com",
            isAnonymous: false,
            upvotesCount: 34,
            upvotedBy: ["citizen_hs", "citizen_km", "citizen_pa"],
            adminNotes: "BWSSB jetting machine dispatched to clear blockage. Root ingress in pipes detected.",
            createdAt: new Date(Date.now() - 18 * 3600000).toISOString(),
            resolvedAt: null,
            imageUrl: "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&q=80&w=400"
          },
          {
            title: "Dangerous potholes at Central Silk Board exit loop",
            description: "Massive road erosion where the flyover meets Outer Ring Road. Vehicles are forced to brake suddenly, worsening the jam.",
            category: "Potholes",
            severity: "high",
            coordinates: { latitude: 12.9176, longitude: 77.6244 },
            address: "Hosur Rd, Silk Board, Bengaluru, Karnataka",
            status: "In Progress",
            createdBy: "citizen_sd",
            creatorName: "Sandeep Divakar",
            creatorEmail: "sandeep.d@gmail.com",
            isAnonymous: false,
            upvotesCount: 256,
            upvotedBy: ["citizen_km", "citizen_ms", "citizen_pa", "citizen_hs", "citizen_vk", "citizen_na"],
            adminNotes: "Interim filling with wet mix complete. Micro-surfacing planned for overnight work.",
            createdAt: new Date(Date.now() - 48 * 3600000).toISOString(),
            resolvedAt: null,
            imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400"
          },
          {
            title: "Streetlights not working under Electronic City Elevated Expressway",
            description: "The service road below the elevated highway has zero working lighting. High risk of accidents during night shifts.",
            category: "Streetlight Non-Functional",
            severity: "high",
            coordinates: { latitude: 12.8490, longitude: 77.6620 },
            address: "Hosur Rd, Phase 1, Electronic City, Bengaluru, Karnataka",
            status: "Reported",
            createdBy: "citizen_na",
            creatorName: "Nisha Ananth",
            creatorEmail: "nisha.ananth@gmail.com",
            isAnonymous: true,
            upvotesCount: 78,
            upvotedBy: ["citizen_sd", "citizen_km", "citizen_ms"],
            adminNotes: "",
            createdAt: new Date(Date.now() - 8 * 3600000).toISOString(),
            resolvedAt: null,
            imageUrl: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&q=80&w=400"
          },
          {
            title: "Drinking water pipeline leak near Hebbal Flyover",
            description: "Water is constantly bubbling out from under the asphalt on the service lane. Local shops report low water pressure.",
            category: "Water Leak",
            severity: "medium",
            coordinates: { latitude: 13.0358, longitude: 77.5978 },
            address: "Bellary Rd, Hebbal, Bengaluru, Karnataka",
            status: "Reported",
            createdBy: "citizen_rk",
            creatorName: "Ramesh K.",
            creatorEmail: "ramesh.k@gmail.com",
            isAnonymous: false,
            upvotesCount: 15,
            upvotedBy: ["citizen_hs"],
            adminNotes: "",
            createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
            resolvedAt: null,
            imageUrl: "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&q=80&w=400"
          },
          {
            title: "Broken slab and open drain on Commercial Street",
            description: "A concrete block has caved in, leaving a 3-foot deep open hole in the middle of a highly crowded shopping footpath.",
            category: "Others",
            severity: "high",
            coordinates: { latitude: 12.9822, longitude: 77.6083 },
            address: "Commercial Street, Tasker Town, Shivaji Nagar, Bengaluru, Karnataka",
            status: "In Progress",
            createdBy: "citizen_ar",
            creatorName: "Ayesha Rahman",
            creatorEmail: "ayesha.r@gmail.com",
            isAnonymous: false,
            upvotesCount: 94,
            upvotedBy: ["citizen_km", "citizen_pa", "citizen_na"],
            adminNotes: "Area cordoned off. Custom concrete slab ordered for replacement tomorrow morning.",
            createdAt: new Date(Date.now() - 14 * 3600000).toISOString(),
            resolvedAt: null,
            imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400"
          },
          {
            title: "Hazardous open transformer panel on 15th Cross Road",
            description: "A high-voltage power distribution transformer cabinet is wide open, with live copper terminals fully exposed at child height.",
            category: "Others",
            severity: "high",
            coordinates: { latitude: 12.9982, longitude: 77.5705 },
            address: "15th Cross Rd, Malleshwaram, Bengaluru, Karnataka",
            status: "Verified",
            createdBy: "citizen_ps",
            creatorName: "Prashant Sridhar",
            creatorEmail: "prashant.s@gmail.com",
            isAnonymous: false,
            upvotesCount: 140,
            upvotedBy: ["citizen_km", "citizen_pa", "citizen_vk", "citizen_rk"],
            adminNotes: "Emergency BESCOM field inspector dispatched. Safe locking latch to be welded onto cabinet.",
            createdAt: new Date(Date.now() - 3 * 3600000).toISOString(),
            resolvedAt: null,
            imageUrl: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&q=80&w=400"
          },
          {
            title: "Series of deep craters near Varthur Lake Bridge",
            description: "Road has completely disintegrated due to heavy water tanker traffic. Extremely dusty during day, bone-rattling drive.",
            category: "Potholes",
            severity: "medium",
            coordinates: { latitude: 12.9430, longitude: 77.7470 },
            address: "Varthur Main Rd, Varthur, Bengaluru, Karnataka",
            status: "Reported",
            createdBy: "citizen_sk",
            creatorName: "Sanjay Karanth",
            creatorEmail: "sanjay.k@gmail.com",
            isAnonymous: false,
            upvotesCount: 22,
            upvotedBy: ["citizen_pa", "citizen_na"],
            adminNotes: "",
            createdAt: new Date(Date.now() - 10 * 3600000).toISOString(),
            resolvedAt: null,
            imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400"
          },
          {
            title: "Dark stretch between EcoSpace and Bellandur flyover",
            description: "None of the high-mast highway lights are working. It's pitch black for commuters on two-wheelers merging onto ORR.",
            category: "Streetlight Non-Functional",
            severity: "high",
            coordinates: { latitude: 12.9272, longitude: 77.6800 },
            address: "EcoSpace Outer Ring Rd, Bellandur, Bengaluru, Karnataka",
            status: "In Progress",
            createdBy: "citizen_vs",
            creatorName: "Vikram Sen",
            creatorEmail: "vikram.sen@gmail.com",
            isAnonymous: false,
            upvotesCount: 165,
            upvotedBy: ["citizen_sd", "citizen_ms", "citizen_km", "citizen_vk"],
            adminNotes: "Power feeder panel replacement is underway. Complete restoration expected by tonight.",
            createdAt: new Date(Date.now() - 36 * 3600000).toISOString(),
            resolvedAt: null,
            imageUrl: "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&q=80&w=400"
          },
          {
            title: "Muddy and foul smelling municipal water supply",
            description: "Water coming from municipal taps is dark yellow/brown and has a distinct sewer-like smell. Affecting entire block.",
            category: "Water Leak",
            severity: "high",
            coordinates: { latitude: 12.9254, longitude: 77.5362 },
            address: "50 Feet Rd, Banashankari 3rd Stage, Bengaluru, Karnataka",
            status: "Reported",
            createdBy: "citizen_gk",
            creatorName: "Gopal Krishna",
            creatorEmail: "gopal.k@gmail.com",
            isAnonymous: false,
            upvotesCount: 31,
            upvotedBy: ["citizen_vk"],
            adminNotes: "",
            createdAt: new Date(Date.now() - 1 * 3600000).toISOString(),
            resolvedAt: null,
            imageUrl: "https://images.unsplash.com/photo-1542013936693-8848e574047a?auto=format&fit=crop&q=80&w=400"
          },
          {
            title: "Dangerous tyre-damaging pothole at Kaikondrahalli signal",
            description: "A sharp, deep pothole in the center lane right at the signal. Already caused multiple flat tyres this week.",
            category: "Potholes",
            severity: "high",
            coordinates: { latitude: 12.9138, longitude: 77.6782 },
            address: "Sarjapur Main Rd, Kaikondrahalli, Bengaluru, Karnataka",
            status: "Resolved",
            createdBy: "citizen_an",
            creatorName: "Anonymous Citizen",
            creatorEmail: "anonymous@fixmycity.org",
            isAnonymous: true,
            upvotesCount: 89,
            upvotedBy: ["citizen_km", "citizen_ms", "citizen_vs"],
            adminNotes: "Road engineering cell filled the pothole using quick-curing cold asphalt. Surface checked and verified clear.",
            createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
            resolvedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
            resolvedBy: "admin_user",
            imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?auto=format&fit=crop&q=80&w=400"
          },
          {
            title: "Heavy tree branch splintered and hanging over overhead power lines",
            description: "Following recent evening winds, a massive Gulmohar branch has cracked and is resting directly on high-tension wires.",
            category: "Others",
            severity: "medium",
            coordinates: { latitude: 12.9422, longitude: 77.5732 },
            address: "Bull Temple Rd, Basavanagudi, Bengaluru, Karnataka",
            status: "In Progress",
            createdBy: "citizen_sn",
            creatorName: "Shakuntala Naidu",
            creatorEmail: "shakuntala.n@gmail.com",
            isAnonymous: false,
            upvotesCount: 41,
            upvotedBy: ["citizen_gk", "citizen_vk"],
            adminNotes: "Forestry department team dispatched with tree-pruners. BESCOM safety shutdown coordinated.",
            createdAt: new Date(Date.now() - 15 * 3600000).toISOString(),
            resolvedAt: null,
            imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400"
          }
        ];

        console.log(`Client triggering seed of ${seedList.length} Bengaluru issues...`);
        const issuesCollection = collection(db, 'issues');
        for (let i = 0; i < seedList.length; i++) {
          const issue = seedList[i];
          const customId = `bengaluru_issue_${i + 1}`;
          await setDoc(doc(db, 'issues', customId), issue);
        }
        console.log('Seeding completed successfully from client store!');
        set({ loading: false });
        return true;
      } catch (err) {
        console.error('Seeding from store failed:', err);
        set({ error: err.message || 'Failed to seed issues', loading: false });
        throw err;
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

        // Seed with initialIssues if database is empty so map & feed are beautiful
        if (issuesList.length === 0) {
          console.log('Firestore issues collection is empty. Seeding standard initial issues...');
          set({ issues: initialIssues, loading: false });
          initialIssues.forEach(async (issue) => {
            try {
              const { id, ...issueData } = issue;
              await setDoc(doc(db, 'issues', id), issueData);
            } catch (err) {
              console.warn(`Failed to seed issue ${issue.id}:`, err.message);
            }
          });
        } else {
          set({ issues: issuesList, loading: false });
        }
      }, (err) => {
        console.warn('Firestore real-time sync failed or permission denied, using initial seeded issues fallback:', err.message || err);
        if (get().issues.length === 0) {
          set({ issues: initialIssues, loading: false });
        } else {
          set({ loading: false });
        }
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

          const proxyData = await res.json();
          console.log('Proxy API response:', proxyData);
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

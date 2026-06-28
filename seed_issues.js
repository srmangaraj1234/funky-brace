import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA3zVzEQA5gNRu2T_Up-xJy7F5pXRx_ni0",
  authDomain: "funky-brace-ffj47.firebaseapp.com",
  projectId: "funky-brace-ffj47",
  storageBucket: "funky-brace-ffj47.firebasestorage.app",
  messagingSenderId: "929069599605",
  appId: "1:929069599605:web:9970579c93d50c17f8e13c"
};

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, {}, "ai-studio-fixmycity-2df215f6-5b90-4680-ba4e-ee00c5b60c44");

const seedIssuesList = [
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
    createdAt: new Date(Date.now() - 4 * 3600000).toISOString(), // 4 hours ago
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
    createdAt: new Date(Date.now() - 12 * 3600000).toISOString(), // 12 hours ago
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
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), // 24 hours ago
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
    createdAt: new Date(Date.now() - 1 * 3600000).toISOString(), // 1 hour ago
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
    resolvedAt: new Date(Date.now() - 2 * 3600000).toISOString(), // resolved 2 hours ago
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

async function seed() {
  console.log(`Starting to seed ${seedIssuesList.length} highly realistic Bengaluru issues...`);
  const issuesCollection = collection(db, 'issues');
  for (let i = 0; i < seedIssuesList.length; i++) {
    const issue = seedIssuesList[i];
    const customId = `bengaluru_issue_${i + 1}`;
    console.log(`Writing issue ${i + 1}/${seedIssuesList.length}: ${issue.title}`);
    try {
      await setDoc(doc(db, 'issues', customId), issue);
    } catch (err) {
      console.error(`Error writing issue ${customId}:`, err);
    }
  }
  console.log("Seeding process completed successfully!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seeding failed with error:", err);
  process.exit(1);
});

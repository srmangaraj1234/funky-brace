# FixMyCity — Product Requirements Document (PRD)
### Version 3.0 | Hackathon Build | Solo Developer | 2-Day Sprint

---

## 1. Executive Summary & Vision

**FixMyCity** is a responsive, hyperlocal civic issue reporting web platform that empowers citizens to report local infrastructure problems (potholes, water leaks, broken streetlights) using an AI-assisted, friction-reduced intake flow. By combining browser geolocation, real-time map visualization, Gemini-powered image analysis, community upvoting, and administrative resolution workflows, the platform creates a transparent, accountable loop between citizens and municipal authorities.

**Core Demo Hook:** Upload a photo → Gemini AI extracts category, severity, and title in real-time → Issue pinned live on Google Maps → Community validates → Admin resolves → Citizen gets a real email.

---

## 2. Tech Stack & Environment

| Layer | Technology |
|---|---|
| **Frontend** | React 19 (Vite) + Tailwind CSS + Lucide Icons + motion/react |
| **Global State** | Zustand |
| **PDF Generation** | jsPDF (client-side) |
| **Backend** | Node.js + Express (Port 3000) |
| **Database** | Firebase Cloud Firestore (real-time) |
| **Authentication** | Firebase Auth — Google Sign-In only |
| **File Storage** | Firebase Storage |
| **AI Core** | Google Gemini API — gemini-3.5-flash (multimodal) |
| **Maps** | Google Maps JavaScript API + Places Library |
| **Email** | Resend API (transactional, server-side) |
| **Environment** | .env with VITE_GOOGLE_MAPS_API_KEY, GEMINI_API_KEY, RESEND_API_KEY, VITE_FIREBASE_* |

---

## 3. Roles & Permissions Matrix

| Action | Citizen | Admin |
|---|:---:|:---:|
| View map and issue pins | YES | YES |
| View live real-time stats | YES | YES |
| Report new issue | YES | NO |
| Upvote issues (once, not own) | YES | NO |
| Download PDF receipt | YES | NO |
| View own submissions feed | YES | NO |
| Change issue status | NO | YES |
| Add official resolution note | NO | YES |
| Delete spam issues | NO | YES |
| Trigger resolution email | NO | YES |

**Role Assignment:** role field in Firestore users/ document. Default: "citizen".
Admin promotion is performed manually via Firebase Console only. No UI for role promotion exists in the application.

**Demo Setup:** Use two separate Google accounts — one citizen, one admin — created before Day 1.

---

## 4. Core User Journeys

### 4.1 Citizen — Report an Issue
1. User lands on FixMyCity and sees Google Maps with existing issue pins and live stats bar above
2. Clicks "Report an Issue" button
3. Google Sign-In prompt appears (auth before upload — identity required for accountability)
4. After auth, user uploads or drags a photo (JPG/PNG, max 5MB)
5. Gemini AI instantly returns: category, severity, title, description
6. Results displayed in editable preview form — user confirms or adjusts
7. Location auto-captured via browser Geolocation API; if denied, user must type address manually
8. Duplicate check: System queries Firestore for existing issues within 200m radius using client-side Haversine formula, filtered by same category and non-resolved status
   - If duplicate found: non-blocking card appears beside upload panel showing thumbnail, category, severity, distance, days open, and two buttons: "Upvote this" or "Mine is different"
   - If no duplicate: proceed to submission
9. User submits and issue is written to Firestore with status "Reported"
10. Map pin appears in real-time as a red pin
11. PDF receipt auto-downloads via jsPDF

### 4.2 Citizen — Upvote an Issue
1. Citizen clicks any map pin or feed card
2. Issue detail view opens
3. Clicks "I see this too" upvote button
4. Firestore atomic write increments upvotesCount and appends UID to upvotedBy
5. If upvotesCount reaches 3, status auto-updates to "Verified" and pin turns yellow

### 4.3 Admin — Resolve an Issue
1. Admin logs in and sees same homepage but with extra controls on each issue card
2. Opens issue detail and sees status dropdown and resolution notes field
3. Changes status to "In Progress" or "Resolved"
4. If "Resolved", admin must enter official resolution note (required field)
5. On save, Firestore is updated with status, adminNotes, resolvedBy (admin UID), resolvedAt (server timestamp)
6. Express server calls Resend API and real email is dispatched to citizen's registered email
7. Homepage displays a prominent banner: "[Issue Title] has been resolved!"

---

## 5. Feature Specifications

### Feature 1: Authentication
- Google Sign-In via Firebase Auth
- On first login, create users/ document with role "citizen" if not exists
- Zustand store holds: user, role, isLoading
- Unauthenticated users can browse map and feed but cannot report or upvote

### Feature 2: AI-Powered Image Intake
- Drag-and-drop and file explorer upload (JPG, PNG, max 5MB)
- Frontend validates MIME type (image/jpeg, image/png) before upload
- Backend validates MIME type again before sending to Gemini
- gemini-3.5-flash analyzes image and returns structured JSON (see Section 6)
- If isAppropriate is false, image is suppressed from public display but text report is still allowed
- AI output displayed in editable form before submission
- If AI fails, graceful fallback to manual form entry

### Feature 3: Geospatial Map and Live Stats
- Google Maps JS API centered on user's geolocation
- Issue pins colored by status: Red = Reported, Yellow = Verified or In Progress, Green = Resolved
- Clicking a pin opens issue detail card
- Live Stats Bar above map (separate component) showing Total Reported, Pending, Resolved
- Stats derived in real-time from issues/ collection via onSnapshot — no separate stats collection

### Feature 4: Upvoting and Auto-Verification
- One upvote per user per issue (enforced via upvotedBy UID array)
- Citizens cannot upvote their own issues
- At 3 unique upvotes, status auto-sets to "Verified"
- Upvote button disabled and shows count after user votes

### Feature 5: Issue Lifecycle and Admin Controls
- Status pipeline: Reported → Verified → In Progress → Resolved
- Admin sees status dropdown and resolution notes field on issue detail page
- Same page as citizen view — admin controls conditionally rendered via role check in Zustand
- resolvedBy (admin UID) and resolvedAt (server timestamp) stored on resolution

### Feature 6: PDF Receipt
- Generated client-side via jsPDF immediately after successful submission
- Single A4 page with FixMyCity branding
- Fields: Citizen name, email, Issue ID, category, severity, AI-generated title, address, timestamp, current status

### Feature 7: Resend Email Notification
- Triggered when admin sets status to "Resolved"
- Express route POST /api/notifications/resolve calls Resend REST API
- Email contains: Issue ID, title, resolved timestamp, admin resolution note, link to issue
- No SMTP setup needed — Resend API key only (free tier: 3,000 emails/month)
- Resend verified sender domain must be configured before build

---

## 6. Gemini JSON Contract

Model: gemini-3.5-flash
Endpoint: Called via Express proxy at POST /api/intake/analyze

Request Schema sent to Gemini:
```json
{
  "type": "object",
  "properties": {
    "isAppropriate": {
      "type": "boolean",
      "description": "True if image is a genuine civic issue. False if offensive, spam, fake, or unrelated."
    },
    "title": {
      "type": "string",
      "description": "Short issue title, max 6 words."
    },
    "description": {
      "type": "string",
      "description": "Detailed description of the observed issue from visual contents."
    },
    "category": {
      "type": "string",
      "enum": ["Potholes", "Streetlight Non-Functional", "Water Leak", "Others"],
      "description": "The best match category for this issue."
    },
    "severity": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "description": "Estimated level of urgency or public danger."
    }
  },
  "required": ["isAppropriate", "title", "description", "category", "severity"]
}
```

Department Routing (hardcoded, not AI-decided):

| Category | Department |
|---|---|
| Potholes | PWD |
| Streetlight Non-Functional | Electricity Board |
| Water Leak | Water Board |
| Others | Municipality |

---

## 7. Firestore Data Schema

### Collection: users/
Document ID: Firebase Auth UID

```json
{
  "email": "citizen@example.com",
  "displayName": "Jane Doe",
  "role": "citizen",
  "createdAt": "2026-06-26T12:00:00.000Z"
}
```

### Collection: issues/
Document ID: Auto-generated

```json
{
  "title": "Deep Pothole on MG Road",
  "description": "Large pothole causing vehicles to swerve dangerously.",
  "category": "Potholes",
  "severity": "high",
  "imageUrl": "https://firebasestorage.googleapis.com/.../pothole.jpg",
  "imageIsSafe": true,
  "coordinates": {
    "latitude": 12.9716,
    "longitude": 77.5946
  },
  "address": "MG Road, Bengaluru, Karnataka",
  "status": "Reported",
  "createdBy": "auth_uid_123",
  "creatorName": "Jane Doe",
  "creatorEmail": "jane@example.com",
  "upvotesCount": 0,
  "upvotedBy": [],
  "adminNotes": null,
  "resolvedBy": null,
  "createdAt": "2026-06-26T12:15:00.000Z",
  "resolvedAt": null
}
```

**Schema Notes:**
- adminNotes, resolvedBy, and resolvedAt are null by default and only populated when admin resolves the issue
- resolvedAt must always be written using Firestore serverTimestamp() — never a client-side date — to avoid clock drift across devices
- isAnonymous field does not exist — all reporters are authenticated via Google Sign-In
- No separate stats/ collection exists — all counts derived from issues/ via onSnapshot

---

## 8. API Contracts

### POST /api/intake/analyze
Purpose: Analyze uploaded civic issue image via Gemini
Request: multipart/form-data with image field

Response:
```json
{
  "status": "success",
  "analysis": {
    "isAppropriate": true,
    "title": "Broken streetlamp next to crosswalk",
    "description": "The streetlamp is physically cracked and dark.",
    "category": "Streetlight Non-Functional",
    "severity": "high"
  }
}
```

### POST /api/notifications/resolve
Purpose: Send resolution email to citizen via Resend
Headers: Authorization: Bearer FirebaseIDToken (Admin only)

Request:
```json
{
  "issueId": "issue_doc_id_123",
  "citizenEmail": "citizen@example.com",
  "issueTitle": "Deep Pothole on MG Road",
  "adminNotes": "Repaired by PWD road-crew on June 26.",
  "resolvedAt": "2026-06-26T15:30:00.000Z"
}
```

Response:
```json
{
  "status": "success",
  "message": "Notification email dispatched successfully via Resend API"
}
```

---

## 9. Folder Structure

```
fixmycity/
├── src/
│   ├── features/
│   │   ├── auth/
│   │   │   └── index.jsx
│   │   ├── report/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.jsx
│   │   ├── map/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── index.jsx
│   │   ├── feed/
│   │   │   ├── components/
│   │   │   └── index.jsx
│   │   └── dashboard/
│   │       ├── components/
│   │       └── index.jsx
│   ├── services/
│   │   ├── firebase.js
│   │   ├── gemini.js
│   │   ├── maps.js
│   │   └── resend.js
│   ├── store/
│   │   └── index.js
│   ├── hooks/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── StatsBar.jsx
│   │   └── IssueCard.jsx
│   ├── utils/
│   │   ├── haversine.js
│   │   ├── constants.js
│   │   ├── formatDate.js
│   │   └── severityColor.js
│   ├── App.jsx
│   └── main.jsx
│
├── server/
│   ├── routes/
│   │   ├── intake.js
│   │   └── notifications.js
│   ├── controllers/
│   │   ├── intakeController.js
│   │   └── notificationController.js
│   ├── middleware/
│   │   └── verifyFirebaseToken.js
│   ├── services/
│   │   ├── geminiService.js
│   │   └── resendService.js
│   └── index.js
│
├── docs/
│   └── PRD.md
├── .env
├── .env.example
├── .gitignore
└── package.json
```

---

## 10. Implementation Milestones (2-Day Plan)

### Day 1
| Milestone | Status | Scope |
|---|---|---|
| A — Scaffold and Auth | DONE | Vite setup, folder structure, Firebase config, Google Sign-In, Zustand store, Navbar |
| B — Intake and Gemini | DONE | Express server, /api/intake/analyze, image upload UI, Gemini response preview form |
| C — Map and Geo | DONE | Google Maps integration, issue pins, geolocation capture, manual address fallback, StatsBar via onSnapshot |

### Day 2
| Milestone | Status | Scope |
|---|---|---|
| D — Duplicate Check | DONE | Haversine utility, 200m + category-filtered radius query, duplicate card UI |
| E — Admin Controls + Email | IN PROGRESS | Role-gated UI on issue detail, status dropdown, resolution notes (required on resolve), write resolvedBy + serverTimestamp() to Firestore, trigger Resend email, show resolution banner on homepage. Admin role read from Firestore — no UI role promotion. |
| F — PDF Receipt | DONE | jsPDF receipt auto-downloaded on submission (built inside report feature) |
| G — Polish and Deploy | PENDING | Seed 15 realistic Bengaluru issues, mobile responsive check, Firebase Hosting deploy, full demo run-through with citizen and admin accounts |

---

## 11. Known Technical Debt (Out of Scope for Hackathon)
- PDF generation is client-side — server-side generation preferred in production
- Business logic co-located in report/index.jsx — should be split into hooks and services in production
- No browser push notifications — resolution awareness only via email
- Upvote threshold (3) and duplicate radius (200m) are hardcoded constants — should be admin-configurable in production
- 16 useState hooks in report component — a reducer or Zustand slice would be cleaner at scale

---

## 12. Pre-Build Checklist
- [x] Two Google accounts created (citizen + admin)
- [x] Firebase project created, Firestore + Auth + Storage enabled
- [x] Google Maps API key generated, Maps JS API + Places API enabled
- [x] Gemini API key from Google AI Studio
- [ ] Resend account created, sender domain verified, API key added to secrets panel
- [x] GitHub repo created
- [x] .env file populated with all keys
- [x] FixMyCity_PRD_v3.md committed to docs/

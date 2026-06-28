import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { initializeFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Fetch credentials from the configuration
const firebaseConfig = {
  apiKey: "AIzaSyA3zVzEQA5gNRu2T_Up-xJy7F5pXRx_ni0",
  authDomain: "funky-brace-ffj47.firebaseapp.com",
  projectId: "funky-brace-ffj47",
  storageBucket: "funky-brace-ffj47.firebasestorage.app",
  messagingSenderId: "929069599605",
  appId: "1:929069599605:web:9970579c93d50c17f8e13c"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = initializeFirestore(app, {}, "ai-studio-fixmycity-2df215f6-5b90-4680-ba4e-ee00c5b60c44");

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Firestore persistence failed: failed-precondition (multiple tabs open)');
  } else if (err.code === 'unimplemented') {
    console.warn('Firestore persistence is unimplemented in this browser');
  } else {
    console.warn('Firestore persistence could not be enabled:', err);
  }
});

export const storage = getStorage(app);

export const googleProvider = new GoogleAuthProvider();

console.log('Firebase initialized successfully.');

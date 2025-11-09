import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics } from 'firebase/analytics';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCfQVgT1u2W1qd8Y8nm7v2QLR-S4fBqh4g",
  authDomain: "usfin-7d594.firebaseapp.com",
  projectId: "usfin-7d594",
  storageBucket: "usfin-7d594.firebasestorage.app",
  messagingSenderId: "1053038667491",
  appId: "1:1053038667491:web:d6068968f125784337c7d6",
  measurementId: "G-LSSMFMGBVL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (only in browser)
let analytics;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { analytics };
export default app;

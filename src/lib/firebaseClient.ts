// frontend/src/lib/firebaseClient.ts
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, runTransaction, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ... باقي الحقول
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, doc, getDoc, setDoc, runTransaction, onSnapshot };

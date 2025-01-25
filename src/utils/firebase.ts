import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCKnLLXRtyfyLwVDVs05-q1NLR2JidFzus",
  authDomain: "alacartes.firebaseapp.com",
  projectId: "alacartes",
  storageBucket: "alacartes.firebasestorage.app",
  messagingSenderId: "145893311915",
  appId: "1:145893311915:web:9cd7cb44eba542ffda3eee"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
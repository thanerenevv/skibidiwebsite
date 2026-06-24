import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDwgeUJXJ6mLdx4-HVdtNKcFvugl1RkFc4",
  authDomain: "gamewebsite-5d2a9.firebaseapp.com",
  projectId: "gamewebsite-5d2a9",
  storageBucket: "gamewebsite-5d2a9.firebasestorage.app",
  messagingSenderId: "789148235862",
  appId: "1:789148235862:web:6c844bbdb8c94c1bda23f7",
  measurementId: "G-YVPVED8Z28",
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

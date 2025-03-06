import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "firechain-nft-marketplace.firebaseapp.com",
  projectId: "firechain-nft-marketplace",
  storageBucket: "firechain-nft-marketplace.firebasestorage.app",
  messagingSenderId: process.env.MESSAGE_ID,
  appId: process.env.APP_ID
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

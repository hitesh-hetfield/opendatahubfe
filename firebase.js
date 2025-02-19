import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAaU9u3D9TzBqZXk-0EnKuxOoo3aFeeHC8",
  authDomain: "firechain-nft-marketplace.firebaseapp.com",
  projectId: "firechain-nft-marketplace",
  storageBucket: "firechain-nft-marketplace.firebasestorage.app",
  messagingSenderId: "678872325366",
  appId: "1:678872325366:web:198e7857dfa8c9e96b60d7"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

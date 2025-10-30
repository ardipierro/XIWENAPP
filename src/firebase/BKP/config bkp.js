import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAFYL-booTK8odJ2eOPOx6rCOaRb4xTTks",
  authDomain: "xiwen-app-2026.firebaseapp.com",
  projectId: "xiwen-app-2026",
  storageBucket: "xiwen-app-2026.firebasestorage.app",
  messagingSenderId: "755222942641",
  appId: "1:755222942641:web:f7ff3b2caf5ad677906390"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

export default app;
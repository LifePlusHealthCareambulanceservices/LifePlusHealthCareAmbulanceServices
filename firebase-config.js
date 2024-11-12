import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCjHWF3l2viXFUCs8e7EwNpy0i82hWtis0",
  authDomain: "pro1-41035.firebaseapp.com",
  projectId: "pro1-41035",
  storageBucket: "pro1-41035.firebasestorage.app",
  messagingSenderId: "80430133341",
  appId: "1:80430133341:web:db7a1a67ab4ac20d9dddb4",
  measurementId: "G-LWKWK2FZLD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export { app, db, auth, analytics }; 
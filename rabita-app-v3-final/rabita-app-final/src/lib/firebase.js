import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAwCWdn3CheiEhMxxfuxiJTTZfvJsIZWqE",
  authDomain: "rabita-app-6e398.firebaseapp.com",
  projectId: "rabita-app-6e398",
  storageBucket: "rabita-app-6e398.firebasestorage.app",
  messagingSenderId: "37908301221",
  appId: "1:37908301221:web:4eace787560845ea28d44c",
};

export const ADMIN_EMAILS = ["shadydawoud577@gmail.com"];

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

export const isAdminEmail = (email) =>
  ADMIN_EMAILS.includes((email || "").toLowerCase());

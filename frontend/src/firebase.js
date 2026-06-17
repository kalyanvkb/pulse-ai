import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const requiredFirebaseConfig = ["apiKey", "authDomain", "projectId", "storageBucket", "messagingSenderId", "appId"];
const missingConfig = requiredFirebaseConfig.filter((key) => !firebaseConfig[key]);

if (missingConfig.length > 0) {
  console.error(`❌ Missing Firebase configuration: ${missingConfig.join(", ")}`);
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Utility helper to detect restricted in-app WebViews
const isRestrictedWebView = () => {
  const ua = navigator.userAgent || navigator.vendor || window.opera;
  return (
    /LinkedInApp/i.test(ua) || 
    /FBAN/i.test(ua) || 
    /FBAV/i.test(ua) || 
    /Instagram/i.test(ua) ||
    ((/iPhone|iPod|iPad/i.test(ua)) && !/Safari/i.test(ua))
  );
};

export const loginWithGoogle = async () => {
  if (isRestrictedWebView()) {
    console.log("In-App WebView detected. Switching to Redirect Auth Flow...");
    // This redirects the entire browser window context out to Google and back
    return signInWithRedirect(auth, provider);
  }

  console.log("Standard browser detected. Using popup login...");
  return signInWithPopup(auth, provider);
};

export const logout = () => {
  return signOut(auth);
};

export {
  auth,
  provider,
  onAuthStateChanged,
  getRedirectResult,
};
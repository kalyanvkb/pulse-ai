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

// Load Firebase config from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate that all required Firebase config values are present
const requiredFirebaseConfig = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];
const missingConfig = requiredFirebaseConfig.filter(
  (key) => !firebaseConfig[key]
);

if (missingConfig.length > 0) {
  console.error(
    `❌ Missing Firebase configuration: ${missingConfig.join(", ")}. 
    Make sure these environment variables are set in .env.local: 
    VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, 
    VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID`
  );
}

const app = initializeApp(firebaseConfig);



const auth = getAuth(app);

const provider = new GoogleAuthProvider();

/*
export const loginWithGoogle = async () => {

  const isMobile =
    /Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent
    );

  if (isMobile) {

    await signInWithRedirect(auth, provider);

    return null;

  } else {

    return await signInWithPopup(auth, provider);

  }
};

*/

export const loginWithGoogle = async () => {

  console.log("Login started");

  const isMobile =
    /Android|iPhone|iPad|iPod/i.test(
      navigator.userAgent
    );

  console.log("isMobile:", isMobile);

  if (isMobile) {

    console.log("Using redirect auth");

    await signInWithRedirect(auth, provider);

    return;
  }

  console.log("Using popup auth");

  const result =
    await signInWithPopup(auth, provider);

  console.log(
    "Popup login success:",
    result.user.email
  );

  return result;
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
/**
 * Firebase Authentication client wrapper.
 * Uses Firebase JS SDK loaded via CDN ESM imports.
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence
} from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

let auth = null;
let currentUser = null;
let authReady = false;
const authListeners = [];

/**
 * Initialize Firebase with public config from the backend.
 */
export async function initFirebase(config) {
  const app = initializeApp({
    apiKey: config.apiKey,
    authDomain: config.authDomain,
    projectId: config.projectId
  });
  auth = getAuth(app);
  return auth;
}

/**
 * Wait for Firebase auth state to resolve.
 */
export function waitForAuth() {
  return new Promise((resolve) => {
    if (authReady) {
      resolve(currentUser);
      return;
    }
    authListeners.push(resolve);
    if (auth) {
      onAuthStateChanged(auth, (user) => {
        currentUser = user;
        authReady = true;
        authListeners.splice(0).forEach((fn) => fn(user));
      });
    }
  });
}

export function getCurrentUser() {
  return currentUser;
}

export async function getCurrentToken() {
  if (!currentUser) return null;
  return currentUser.getIdToken();
}

/**
 * Register with email and password.
 */
export async function registerWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

/**
 * Sign in with email and password.
 */
export async function loginWithEmail(email, password, remember = true) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  return signInWithEmailAndPassword(auth, email, password);
}

/**
 * Sign in with Google OAuth popup.
 */
export async function loginWithGoogle(remember = true) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

/**
 * Send password reset email.
 */
export async function resetPassword(email) {
  return sendPasswordResetEmail(auth, email);
}

/**
 * Sign out the current user.
 */
export async function logout() {
  await signOut(auth);
  currentUser = null;
}

/**
 * Redirect to login if not authenticated.
 */
export async function requireAuth(redirectTo = "/login.html") {
  const user = await waitForAuth();
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

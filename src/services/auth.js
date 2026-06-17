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
let authUnsubscribe = null;
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
  if (!authUnsubscribe) {
    authUnsubscribe = onAuthStateChanged(auth, (user) => {
      currentUser = user;
      authReady = true;
      console.log("[Auth] State changed:", user ? `${user.email}` : "logged out");
      authListeners.splice(0).forEach((fn) => fn(user));
    });
  }
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
    if (!auth) {
      // If auth not initialized yet, resolve with null after a short delay
      setTimeout(() => {
        console.warn("[Auth] Auth not initialized");
        authReady = true;
        authListeners.splice(0).forEach((fn) => fn(null));
      }, 100);
    }
  });
}

export function getCurrentUser() {
  return currentUser || auth?.currentUser || null;
}

export async function getCurrentToken() {
  const user = currentUser || auth?.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

/**
 * Register with email and password.
 */
export async function registerWithEmail(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  currentUser = credential.user;
  authReady = true;
  return credential;
}

/**
 * Sign in with email and password.
 */
export async function loginWithEmail(email, password, remember = true) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  const credential = await signInWithEmailAndPassword(auth, email, password);
  currentUser = credential.user;
  authReady = true;
  return credential;
}

/**
 * Sign in with Google OAuth popup.
 */
export async function loginWithGoogle(remember = true) {
  await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence);
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  currentUser = credential.user;
  authReady = true;
  return credential;
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
    console.log(`[Auth] No user found, redirecting to ${redirectTo}`);
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

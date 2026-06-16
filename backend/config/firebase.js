import admin from "firebase-admin";

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK using service account credentials from .env.
 * Returns null when credentials are missing (local dev without auth).
 */
export function getFirebaseAdmin() {
  if (firebaseApp) return firebaseApp;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase Admin credentials missing. JWT verification disabled.");
    return null;
  }

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey
    })
  });

  return firebaseApp;
}

/**
 * Verify a Firebase ID token and return the decoded payload.
 */
export async function verifyIdToken(token) {
  const app = getFirebaseAdmin();
  if (!app) {
    throw new Error("Firebase Admin is not configured");
  }
  return admin.auth(app).verifyIdToken(token);
}

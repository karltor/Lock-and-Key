import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const app = initializeApp({
    apiKey: "AIzaSyDdGSoiqa1_xf9RK-LeWe3ttepzpt-ocLs",
    authDomain: "lock-and-key-e96a1.firebaseapp.com",
    projectId: "lock-and-key-e96a1",
    storageBucket: "lock-and-key-e96a1.firebasestorage.app",
    messagingSenderId: "632843065326",
    appId: "1:632843065326:web:6dbe765294c3aefe7460ff"
});

export const db = getFirestore(app);
export const auth = getAuth(app);

// Signs in anonymously (reuses existing session if present).
// Returns a promise that resolves with the user's UID.
export function ensureAuth() {
    if (auth.currentUser) return Promise.resolve(auth.currentUser.uid);
    return signInAnonymously(auth).then(cred => cred.user.uid);
}

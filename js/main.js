// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// App Module Imports
import { state, setUsers, setGames, loadSavedGameData } from './state.js';
import { initializeHandlers } from './handlers.js';
import { renderInitialUI, updateAllViews, showModalMessage, changeTab } from './ui.js';

// --- Firebase Initialization ---
const firebaseConfig = {
    apiKey: "AIzaSyBwWqWxRy5JlcQwbc5KAXRvH0swd0pOzSg",
    authDomain: "edogawa-m-league-summary.firebaseapp.com",
    projectId: "edogawa-m-league-summary",
    storageBucket: "edogawa-m-league-summary.appspot.com",
    messagingSenderId: "587593171009",
    appId: "1:587593171009:web:b48dd5b809f2d2ce8886c0",
    measurementId: "G-XMYXPG06QF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
export const storage = getStorage(app); // Export for handlers.js

// --- App Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();
});

function initializeApplication() {
    renderInitialUI();
    initializeHandlers();
    setupAuthListener();
}

function setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            state.currentUser = user;
            document.getElementById('auth-status').textContent = `System Online // User: ${user.isAnonymous ? 'Guest' : user.uid.substring(0, 8)}`;
            await setupFirestoreListeners();
        } else {
            try {
                await signInAnonymously(auth);
            } catch (error) {
                console.error("Authentication failed:", error);
                document.getElementById('auth-status').textContent = 'Authentication Failure';
            }
        }
    });
}

async function setupFirestoreListeners() {
    const usersQuery = query(collection(db, 'users'));
    onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
        if (loadSavedGameData()) {
            showModalMessage("保存された対局データを読み込みました。");
            changeTab('game');
        }
        updateAllViews();
    });

    const gamesQuery = query(collection(db, 'games'), orderBy("createdAt", "desc"));
    onSnapshot(gamesQuery, (snapshot) => {
        const gamesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGames(gamesData);
        updateAllViews();
    });
}

// js/main.js

// Firebase関連の機能はすべて'./firebase.js'からインポートする
import {
    auth,
    db,
    onAuthStateChanged,
    signInAnonymously,
    collection,
    onSnapshot,
    query,
    orderBy
} from './firebase.js';

// App Module Imports
import { state, setUsers, setGames, loadSavedGameData } from './state.js';
import { initializeHandlers } from './handlers.js';
import { renderInitialUI, updateAllViews, showModalMessage, changeTab } from './ui.js';

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

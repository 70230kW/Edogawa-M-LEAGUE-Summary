import { auth, db } from './firebase.js';
import { onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { state, setUsers, setGames, loadSavedGameData } from './state.js';
import { initializeHandlers } from './handlers.js';
import { renderInitialUI, updateAllViews, showModalMessage } from './ui.js';

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
            document.getElementById('auth-status').textContent = `System Online // User: ${user.isAnonymous ? 'Guest' : user.uid}`;
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
        
        // ユーザーデータが読み込まれた後に、途中保存データを読み込む
        if (loadSavedGameData()) {
            showModalMessage("保存されたデータを読み込みました。");
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

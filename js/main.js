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

// DOM要素を最初に取得
const authStatusEl = document.getElementById('auth-status');

/**
 * アプリケーションの初期化
 */
async function initializeApplication() {
    console.log("Application initialization started...");
    authStatusEl.textContent = 'System initializing...';

    renderInitialUI();
    initializeHandlers();
    
    // 認証状態の監視を開始
    setupAuthListener();

    // 匿名認証を試みる
    try {
        console.log("Attempting anonymous sign-in...");
        // 既にサインインしているか確認
        if (!auth.currentUser) {
            await signInAnonymously(auth);
            console.log("Anonymous sign-in request successful. Waiting for state change.");
        } else {
            console.log("User is already signed in.", auth.currentUser.uid);
        }
    } catch (error) {
        console.error("CRITICAL: Anonymous sign-in failed.", error);
        authStatusEl.textContent = `Auth Error: ${error.code}. Please check Firebase console settings.`;
    }
}

/**
 * 認証状態の監視とデータリスナーの設定
 */
function setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            console.log("Auth state changed: User is signed in.", user.uid);
            state.currentUser = user;
            authStatusEl.textContent = `System Online // User: ${user.isAnonymous ? 'Guest' : user.uid.substring(0, 8)}`;
            
            // 認証が確立した後に、Firestoreのリスナーを設定
            await setupFirestoreListeners();

        } else {
            console.log("Auth state changed: User is signed out.");
            authStatusEl.textContent = 'Waiting for authentication...';
        }
    });
}

/**
 * Firestoreのデータ変更を監視するリスナーを設定
 */
async function setupFirestoreListeners() {
    console.log("Setting up Firestore listeners...");
    try {
        // ユーザーデータの監視
        const usersQuery = query(collection(db, 'users'));
        onSnapshot(usersQuery, (snapshot) => {
            console.log("Users data received.");
            const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUsers(usersData);

            if (loadSavedGameData()) {
                showModalMessage("保存された対局データを読み込みました。");
                changeTab('game');
            }
            updateAllViews();
        }, (error) => {
            console.error("Firestore Error (Users):", error);
            authStatusEl.textContent = `Database Error (Users): ${error.message}`;
        });

        // ゲームデータの監視
        const gamesQuery = query(collection(db, 'games'), orderBy("createdAt", "desc"));
        onSnapshot(gamesQuery, (snapshot) => {
            console.log("Games data received.");
            const gamesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setGames(gamesData);
            updateAllViews();
        }, (error) => {
            console.error("Firestore Error (Games):", error);
            authStatusEl.textContent = `Database Error (Games): ${error.message}`;
        });
        console.log("Firestore listeners setup complete.");
    } catch (error) {
        console.error("CRITICAL: Failed to set up Firestore listeners.", error);
        authStatusEl.textContent = `Database Connection Error: ${error.message}`;
    }
}

// --- アプリケーションの実行 ---
document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();
});

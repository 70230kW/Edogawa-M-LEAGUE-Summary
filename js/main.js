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
 * アプリケーションのエントリーポイント
 */
function main() {
    console.log("Application starting...");
    authStatusEl.textContent = 'Connecting to system...';

    // 先にUIの骨格とイベントハンドラを準備
    renderInitialUI();
    initializeHandlers();

    // onAuthStateChangedは認証に関するすべてのロジックの中心。
    // ページの読み込み時に一度、その後認証状態が変化するたびに実行される。
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // --- ユーザーがサインインしている場合 ---
            console.log("Authentication successful. User UID:", user.uid);
            state.currentUser = user;
            authStatusEl.textContent = `System Online // User: ${user.isAnonymous ? 'Guest' : user.uid.substring(0, 8)}`;
            
            // ユーザーが確認できたので、安全にデータベースの監視を開始
            await setupFirestoreListeners();

        } else {
            // --- ユーザーがサインアウトしている場合 ---
            console.log("User is not signed in. Attempting anonymous sign-in...");
            authStatusEl.textContent = 'Authenticating...';
            try {
                // 匿名でのサインインを試みる。成功すると、再度onAuthStateChangedが呼ばれ、
                // 上の if (user) ブロックが実行される。
                await signInAnonymously(auth);
            } catch (error) {
                // これは致命的なエラー。アプリがFirebase認証に接続できないことを意味する。
                // 最も一般的な原因は、Firebaseコンソールで「匿名認証」が有効になっていないこと。
                console.error("CRITICAL: Anonymous sign-in failed.", error);
                authStatusEl.textContent = `AUTH_ERROR: ${error.code}. Check Firebase settings.`;
            }
        }
    });
}

/**
 * Firestoreのデータリスナーを設定する。認証後にのみ呼び出すこと。
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

// --- DOMの準備ができたらアプリケーションを開始 ---
document.addEventListener('DOMContentLoaded', main);

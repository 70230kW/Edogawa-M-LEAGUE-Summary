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


/**
 * アプリケーションの初期化
 */
async function initializeApplication() {
    renderInitialUI();
    initializeHandlers();

    // 最初に匿名認証を試みる
    try {
        await signInAnonymously(auth);
    } catch (error) {
        console.error("匿名認証に失敗しました:", error);
        document.getElementById('auth-status').textContent = 'システムエラー: 認証に失敗しました。';
        return; // 認証に失敗した場合はここで処理を中断
    }
    
    // 認証状態の監視を開始
    setupAuthListener();
}

/**
 * 認証状態の監視とデータリスナーの設定
 */
function setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            // 認証成功
            state.currentUser = user;
            document.getElementById('auth-status').textContent = `システムオンライン // ユーザー: ${user.isAnonymous ? 'ゲスト' : user.uid.substring(0, 8)}`;
            
            // 認証が確立した後に、Firestoreのリスナーを設定
            await setupFirestoreListeners();

        } else {
            // 認証が切れた場合など（通常は発生しにくい）
            console.error("認証状態が無効になりました。");
            document.getElementById('auth-status').textContent = 'エラー: 認証が切れました。ページをリロードしてください。';
        }
    });
}

/**
 * Firestoreのデータ変更を監視するリスナーを設定
 */
async function setupFirestoreListeners() {
    // ユーザーデータの監視
    const usersQuery = query(collection(db, 'users'));
    onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);

        // ユーザーデータ読み込み後に、保存されたゲームデータを確認
        if (loadSavedGameData()) {
            showModalMessage("保存された対局データを読み込みました。");
            changeTab('game');
        }
        updateAllViews();
    });

    // ゲームデータの監視
    const gamesQuery = query(collection(db, 'games'), orderBy("createdAt", "desc"));
    onSnapshot(gamesQuery, (snapshot) => {
        const gamesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGames(gamesData);
        updateAllViews();
    });
}

// --- アプリケーションの実行 ---
document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();
});

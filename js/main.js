import { auth, db } from './firebase.js';
import { onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { state, setUsers, setGames, loadSavedGameData } from './state.js';
import { initializeHandlers } from './handlers.js';
import { renderInitialUI, updateAllViews, showModalMessage, changeTab } from './ui.js';

// ページの読み込みが完了したら、アプリケーションを初期化
document.addEventListener('DOMContentLoaded', () => {
    initializeApplication();
});

/**
 * アプリケーションの初期化処理
 */
function initializeApplication() {
    // 1. HTMLの骨格を最初に描画
    renderInitialUI();
    // 2. ボタンなどのクリックイベントを設定
    initializeHandlers();
    // 3. Firebaseの認証状態を監視開始
    setupAuthListener();
}

/**
 * Firebaseの認証状態を監視し、ログイン処理を行う
 */
function setupAuthListener() {
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            state.currentUser = user;
            document.getElementById('auth-status').textContent = `System Online // User: ${user.isAnonymous ? 'Guest' : user.uid.substring(0, 8)}`;
            // ログインが確認できたら、データベースの監視を開始
            await setupFirestoreListeners();
        } else {
            // ユーザーがいない場合は、匿名でサインインを試みる
            try {
                await signInAnonymously(auth);
            } catch (error) {
                console.error("Authentication failed:", error);
                document.getElementById('auth-status').textContent = 'Authentication Failure';
            }
        }
    });
}

/**
 * Firestoreデータベースの変更をリアルタイムで監視する
 */
async function setupFirestoreListeners() {
    // 'users' コレクションの監視
    const usersQuery = query(collection(db, 'users'));
    onSnapshot(usersQuery, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData); // 取得したユーザーデータをstateに保存

        // ユーザーデータが読み込まれた後に、ブラウザに保存された途中データを読み込む
        if (loadSavedGameData()) {
            showModalMessage("保存された対局データを読み込みました。");
            changeTab('game'); // 対局タブに移動
        }
        
        updateAllViews(); // 全てのUIを最新の状態に更新
    });

    // 'games' コレクションの監視
    const gamesQuery = query(collection(db, 'games'), orderBy("createdAt", "desc"));
    onSnapshot(gamesQuery, (snapshot) => {
        const gamesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setGames(gamesData); // 取得したゲームデータをstateに保存
        updateAllViews(); // 全てのUIを最新の状態に更新
    });
}

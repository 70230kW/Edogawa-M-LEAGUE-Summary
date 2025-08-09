import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import * as state from './state.js';

const firebaseConfig = {
  apiKey: "AIzaSyCleKavI0XicnYv2Hl1tkRNRikCBrb8is4",
  authDomain: "edogawa-m-league-results.firebaseapp.com",
  projectId: "edogawa-m-league-results",
  storageBucket: "edogawa-m-league-results.firebasestorage.app",
  messagingSenderId: "315224725184",
  appId: "1:315224725184:web:e0f8dbca47f04b2fa37f25",
  measurementId: "G-B3ZTXE1MYV"
};
/**
 * Firebaseアプリを初期化し、認証状態を監視します。
 * @param {Function} onAuthCallback - 認証状態が変更されたときに呼び出されるコールバック
 */
export function initializeAppAndAuth(onAuthCallback) {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getFirestore(app);
    const storage = getStorage(app);

    state.setDb(db);
    state.setAuth(auth);
    state.setStorage(storage);

    onAuthStateChanged(auth, (user) => {
        if (user) {
            // ユーザー情報があればコールバックを実行
            state.setCurrentUser(user);
            onAuthCallback(user);
        } else {
            // ユーザー情報がなければ匿名認証を実行
            signInAnonymously(auth).catch((error) => {
                console.error("Anonymous sign-in failed:", error);
                onAuthCallback(null);
            });
        }
    });
}

/**
 * Firestoreのデータ変更を監視するリスナーをセットアップします。
 * @param {Function} onUsersUpdate - ユーザーデータ更新時のコールバック
 * @param {Function} onGamesUpdate - ゲームデータ更新時のコールバック
 */
export function setupListeners(onUsersUpdate, onGamesUpdate) {
    const db = state.getDb();
    if (!db) return;

    // Users listener
    const usersCollectionRef = collection(db, `users`);
    onSnapshot(usersCollectionRef, (snapshot) => {
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        onUsersUpdate(usersData);
    });

    // Games listener
    const gamesCollectionRef = collection(db, `games`);
    const gamesQuery = query(gamesCollectionRef, orderBy("createdAt", "desc"));
    onSnapshot(gamesQuery, (snapshot) => {
        const gamesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        onGamesUpdate(gamesData);
    });
}

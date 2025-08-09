import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import * as state from './state.js';

const firebaseConfig = {
    apiKey: "AIzaSyCleKavI0XicnYv2Hl1tkRNRikCBrb8is4", // セキュリティのため、実際のキーに置き換えてください
    authDomain: "edogawa-m-league-summary.firebaseapp.com",
    projectId: "edogawa-m-league-summary",
    storageBucket: "edogawa-m-league-summary.appspot.com",
    messagingSenderId: "587593171009",
    appId: "1:587593171009:web:b48dd5b809f2d2ce8886c0",
    measurementId: "G-XMYXPG06QF"
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

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            state.setCurrentUser(user);
            onAuthCallback(user);
        } else {
            try {
                const userCredential = await signInAnonymously(auth);
                state.setCurrentUser(userCredential.user);
                // `onAuthStateChanged`が再度発火するので、ここではコールバックを呼ばない
            } catch (error) {
                console.error("Authentication failed:", error);
                onAuthCallback(null);
            }
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

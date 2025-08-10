// js/firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";

// Auth: 認証関連の機能をすべてインポート
import { getAuth, onAuthStateChanged, signInAnonymously } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// Firestore: Firestore関連の機能をすべてインポート
import { getFirestore, collection, onSnapshot, query, orderBy, addDoc, doc, updateDoc, deleteDoc, writeBatch, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Storage: Storage関連の機能をすべてインポート
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";

// Firebaseプロジェクトの設定情報
const firebaseConfig = {
    apiKey: "AIzaSyBwWqWxRy5JlcQwbc5KAXRvH0swd0pOzSg",
    authDomain: "edogawa-m-league-summary.firebaseapp.com",
    projectId: "edogawa-m-league-summary",
    storageBucket: "edogawa-m-league-summary.appspot.com",
    messagingSenderId: "587593171009",
    appId: "1:587593171009:web:b48dd5b809f2d2ce8886c0",
    measurementId: "G-XMYXPG06QF"
};

// Firebaseを初期化
const app = initializeApp(firebaseConfig);

// 各サービスを初期化してエクスポート
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// 他のファイルで利用するFirebaseの関数を再エクスポート
export {
    // Auth
    onAuthStateChanged,
    signInAnonymously,
    // Firestore
    collection,
    onSnapshot,
    query,
    orderBy,
    addDoc,
    doc,
    updateDoc,
    deleteDoc,
    writeBatch,
    where,
    getDocs,
    // Storage
    ref,
    uploadBytes,
    getDownloadURL
};

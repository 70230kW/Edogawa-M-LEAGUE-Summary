import { initializeAppAndAuth, setupListeners } from './firebase.js';
import { initializeEventHandlers } from './handlers.js';
import { renderAllInitialTabs, updateAllViews } from './dom.js';
import * as state from './state.js';
import { calculateAllPlayerStats } from './utils.js';

/**
 * アプリケーションのデータが更新されたときに呼び出される中心的な関数。
 * 統計を再計算し、すべてのUIビューを更新します。
 */
function masterUpdateLoop() {
    state.setCachedStats(calculateAllPlayerStats(state.getGames(), state.getUsers()));
    updateAllViews();
}

/**
 * Firestoreからユーザーデータが更新されたときのコールバック
 * @param {Array} usersData - Firestoreから取得したユーザーデータの配列
 */
function onUsersUpdate(usersData) {
    usersData.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    state.setUsers(usersData);
    
    // 選択中のプレイヤー情報も更新
    const currentSelected = state.getSelectedPlayers();
    const updatedSelected = currentSelected.map(sp => {
        const updatedUser = usersData.find(u => u.id === sp.id);
        return updatedUser ? { id: updatedUser.id, name: updatedUser.name, photoURL: updatedUser.photoURL } : sp;
    });
    state.setSelectedPlayers(updatedSelected);

    masterUpdateLoop();
}

/**
 * Firestoreからゲームデータが更新されたときのコールバック
 * @param {Array} gamesData - Firestoreから取得したゲームデータの配列
 */
function onGamesUpdate(gamesData) {
    state.setGames(gamesData);
    masterUpdateLoop();
}

// アプリケーションの初期化
document.addEventListener('DOMContentLoaded', () => {
    renderAllInitialTabs();
    initializeEventHandlers();
    initializeAppAndAuth(
        // onAuthStateChanged callback
        (user) => {
            if (user) {
                document.getElementById('auth-status').textContent = `System Online // User: ${user.isAnonymous ? 'Guest' : user.uid}`;
                setupListeners(onUsersUpdate, onGamesUpdate);
            } else {
                 document.getElementById('auth-status').textContent = 'Authentication Failure';
            }
        }
    );
});

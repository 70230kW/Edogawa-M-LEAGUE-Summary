import * as state from './state.js';
import * as dom from './dom.js';
import * as api from './api.js';
import * as charts from './charts.js';
import * as utils from './utils.js';
import { YAKUMAN_INCOMPATIBILITY, PENALTY_REASONS } from './constants.js';

//#################################################################
// Main Navigation & App Flow
//#################################################################

function changeTab(tabName) {
    ['game', 'leaderboard', 'trophy', 'data-analysis', 'personal-stats', 'history', 'head-to-head', 'history-raw', 'history-pt', 'users'].forEach(tab => {
        document.getElementById(`${tab}-tab`)?.classList.add('hidden');
        document.querySelector(`.tab-btn[data-tab="${tab}"]`)?.classList.remove('active');
    });

    document.getElementById(`${tabName}-tab`)?.classList.remove('hidden');
    document.querySelector(`.tab-btn[data-tab="${tabName}"]`)?.classList.add('active');

    // 特定のタブが選択されたときに追加で実行する処理
    if (tabName === 'data-analysis') {
        charts.updateDataAnalysisCharts();
    } else if (tabName === 'game' && state.getEditingGameId() === null) {
        loadSavedGameData();
    } else if (tabName === 'head-to-head') {
        dom.displayHeadToHeadStats();
    } else if (tabName === 'trophy') {
        dom.updateTrophyPage();
    }
}

function resetGame() {
    state.setSelectedPlayers([]);
    state.setHanchanScores([]);
    state.setEditingGameId(null);
    dom.renderGameTab();

    const saveBtn = document.getElementById('save-game-btn');
    if (saveBtn) {
        saveBtn.innerHTML = `<i class="fas fa-save mr-2"></i>Pt変換して保存`;
        saveBtn.classList.remove('cyber-btn-green');
        saveBtn.classList.add('cyber-btn-yellow');
    }
    changeTab('game');
}

//#################################################################
// User & Game Management (CRUD)
//#################################################################

async function addUser() {
    const nameInput = document.getElementById('new-user-name');
    const name = nameInput.value.trim();
    if (!name) {
        dom.showModalMessage("雀士名を入力してください。");
        return;
    }
    if (state.getUsers().some(u => u.name === name)) {
        dom.showModalMessage("同じ名前の雀士が既に存在します。");
        return;
    }
    try {
        await api.addUser(name);
        nameInput.value = '';
        dom.showModalMessage(`「${name}」さんを登録しました。`);
    } catch (error) {
        console.error("Error adding user: ", error);
        dom.showModalMessage("ユーザーの追加に失敗しました。");
    }
}

async function handlePhotoUpload(userId, inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    dom.showLoadingModal("写真をアップロード中...");
    try {
        await api.uploadUserPhoto(userId, file);
        dom.closeModal();
    } catch (error) {
        console.error("Photo upload failed:", error);
        dom.showModalMessage("写真のアップロードに失敗しました。");
    }
}

async function toggleEditUser(userId) {
    const input = document.getElementById(`user-name-input-${userId}`);
    const editBtn = document.getElementById(`edit-user-btn-${userId}`);
    const originalName = input.dataset.originalName;

    if (input.readOnly) {
        input.readOnly = false;
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
        editBtn.innerHTML = '<i class="fas fa-save"></i>';
        editBtn.classList.add('cyber-btn-green');
    } else {
        const newName = input.value.trim();
        let shouldUpdate = true;

        if (!newName) {
            dom.showModalMessage("雀士名は空にできません。");
            input.value = originalName;
            shouldUpdate = false;
        } else if (newName !== originalName && state.getUsers().some(u => u.name === newName && u.id !== userId)) {
            dom.showModalMessage("同じ名前の雀士が既に存在します。");
            input.value = originalName;
            shouldUpdate = false;
        }

        if (shouldUpdate && newName !== originalName) {
            try {
                dom.showLoadingModal("名前を更新中...");
                await api.updateUserName(userId, newName);
                
                // 進行中のゲームデータがあれば、そちらの名前も更新
                const playerInGame = state.getSelectedPlayers().find(p => p.id === userId);
                if (playerInGame) playerInGame.name = newName;
                
                input.dataset.originalName = newName;
                dom.showModalMessage("雀士名を更新しました。");
            } catch (error) {
                console.error("Error updating user name: ", error);
                dom.showModalMessage("名前の更新に失敗しました。");
                input.value = originalName;
            }
        }

        input.readOnly = true;
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.classList.remove('cyber-btn-green');
    }
}

function confirmDeleteUser(id) {
    const user = state.getUsers().find(u => u.id === id);
    if (!user) return;
    dom.showModal(`
        <h3 class="cyber-header text-xl font-bold text-red-400 mb-4">削除確認</h3>
        <p>「${user.name}」を削除しますか？<br>関連する全ての対局データも永久に削除されます。この操作は元に戻せません。</p>
        <div class="flex justify-end gap-4 mt-6">
            <button onclick="closeModal()" class="cyber-btn px-4 py-2">キャンセル</button>
            <button onclick="executeDeleteUser('${id}')" class="cyber-btn-red px-4 py-2">削除実行</button>
        </div>
    `);
}

async function executeDeleteUser(id) {
    dom.showLoadingModal("ユーザーと関連データを削除中...");
    try {
        await api.deleteUserAndGames(id);
        dom.showModalMessage(`ユーザーと関連データを削除しました。`);
        resetGame();
    } catch (error) {
        console.error("Error deleting user:", error);
        dom.showModalMessage("削除に失敗しました。");
    }
}

function confirmDeleteGame(gameId, date) {
    dom.showModal(`
        <h3 class="cyber-header text-xl font-bold text-red-400 mb-4">対局履歴 削除確認</h3>
        <p>${date} の対局データを削除しますか？<br>この操作は元に戻せません。</p>
        <div class="flex justify-end gap-4 mt-6">
            <button onclick="closeModal()" class="cyber-btn px-4 py-2">キャンセル</button>
            <button onclick="executeDeleteGame('${gameId}')" class="cyber-btn-red px-4 py-2">削除実行</button>
        </div>
    `);
}

async function executeDeleteGame(gameId) {
    dom.closeModal();
    try {
        await api.deleteGame(gameId);
        dom.showModalMessage("対局データを削除しました。");
    } catch (error) {
        console.error("Error deleting game: ", error);
        dom.showModalMessage("対局データの削除に失敗しました。");
    }
}

// ... 他のハンドラーも同様に記述

//#################################################################
// Global Event Handler Initialization
//#################################################################

/**
 * 全てのイベントハンドラを `window` オブジェクトに登録し、
 * `onclick` 属性から呼び出せるようにします。
 * また、主要な要素にイベントリスナーを設定します。
 */
export function initializeHandlers() {
    // タブ切り替え
    document.getElementById('tab-navigation').addEventListener('click', (e) => {
        const button = e.target.closest('.tab-btn');
        if (button) {
            changeTab(button.dataset.tab);
        }
    });
    
    // モーダル外クリックで閉じる
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') {
            dom.closeModal();
        }
    });

    // 動的に生成される要素内のイベントは、windowに登録した関数をonclickで呼び出す
    window.addUser = addUser;
    window.handlePhotoUpload = handlePhotoUpload;
    window.toggleEditUser = toggleEditUser;
    window.confirmDeleteUser = confirmDeleteUser;
    window.executeDeleteUser = executeDeleteUser;
    window.confirmDeleteGame = confirmDeleteGame;
    window.executeDeleteGame = executeDeleteGame;
    window.editGame = dom.editGame; // dom.js にロジックを移動
    window.showGameDetails = dom.showGameDetails;
    window.showPlayerStats = dom.showPlayerStats;
    window.displayPlayerStats = dom.displayPlayerStats;
    window.displayHeadToHeadStats = dom.displayHeadToHeadStats;
    window.updateHistoryList = dom.updateHistoryList;
    window.renderDetailedHistoryTables = dom.renderDetailedHistoryTables;
    window.updateTrophyPage = dom.updateTrophyPage;
    window.updateDataAnalysisCharts = charts.updateDataAnalysisCharts;
    window.updateComparisonCharts = charts.updateComparisonCharts;
    window.closeModal = dom.closeModal;

    // ゲームフロー関連
    window.moveToStep2 = dom.moveToStep2;
    window.moveToStep3 = dom.moveToStep3;
    window.backToStep1 = dom.backToStep1;
    window.backToStep2 = dom.backToStep2;
    window.setMLeagueRules = dom.setMLeagueRules;
    window.setTodayDate = dom.setTodayDate;
    window.togglePlayerSelection = dom.togglePlayerSelection;
    window.addHanchan = dom.addHanchan;
    window.deleteHanchan = dom.deleteHanchan;
    window.savePartialData = dom.savePartialData;
    window.showCurrentPtStatus = dom.showCurrentPtStatus;
    window.calculateAndSave = api.calculateAndSave;

    // スコア入力モーダル関連
    window.openScoreInputModal = dom.openScoreInputModal;
    window.openYakumanEventModal = dom.openYakumanEventModal;
    window.openPenaltyModal = dom.openPenaltyModal;
    window.addYakumanEvent = dom.addYakumanEvent;
    window.updateYakumanCheckboxes = dom.updateYakumanCheckboxes;
    window.updatePenaltyReasons = dom.updatePenaltyReasons;
    window.addPenalty = dom.addPenalty;
    window.setActiveInput = dom.setActiveInput;
    window.keypadInput = dom.keypadInput;
    window.saveScoresFromModal = dom.saveScoresFromModal;
}

import { state, resetGame, addHanchan, deleteHanchan, saveScoresFromModal, savePartialData } from './state.js';
import { db, storage } from './firebase.js'; // 修正: 新しいfirebase.jsから読み込む
import { collection, addDoc, doc, updateDoc, deleteDoc, writeBatch, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-storage.js";
import * as ui from './ui.js';
import { getGameDataFromForm } from './utils.js';

/**
 * すべてのイベントリスナーを初期化する
 */
export function initializeHandlers() {
    document.getElementById('tab-navigation').addEventListener('click', handleTabClick);
    document.getElementById('modal').addEventListener('click', handleModalClick);
    document.body.addEventListener('click', handleGlobalClick);
    document.body.addEventListener('change', handleGlobalChange);
    document.body.addEventListener('input', handleGlobalInput);
    document.body.addEventListener('focusin', handleGlobalFocus);
}

// =================================================================
// Event Listener Callbacks
// =================================================================

function handleTabClick(e) {
    if (e.target.matches('.tab-btn')) {
        ui.changeTab(e.target.dataset.tab);
    }
}

function handleModalClick(e) {
    if (e.target.id === 'modal' || e.target.id === 'modal-close-btn' || e.target.closest('#modal-close-btn')) {
        ui.closeModal();
    }
}

function handleGlobalChange(e) {
    const target = e.target;
    if (target.matches('.player-checkbox')) {
        togglePlayerSelectionHandler(target);
    }
    if (target.matches('input[type="file"][id^="photo-upload-"]')) {
        const userId = target.id.replace('photo-upload-', '');
        handlePhotoUpload(userId, target);
    }
    if (target.matches('#penalty-type-select')) {
        ui.updatePenaltyReasons();
    }
    if (target.matches('input[name="yakuman-checkbox"]')) {
        ui.updateYakumanCheckboxes();
    }
    if (target.matches('.comparison-checkbox')) {
        const mainPlayerId = document.getElementById('personal-stats-player-select').value;
        ui.renderStatsCharts(mainPlayerId);
    }
    if (target.matches('#leaderboard-period-select, #trophy-year-filter, #trophy-player-filter, #history-year-filter, #history-month-filter, #history-player-filter, #history-raw-year-filter, #history-raw-month-filter, #history-raw-player-filter, #history-pt-year-filter, #history-pt-month-filter, #history-pt-player-filter, #personal-stats-player-select, #bar-chart-metric-select, #h2h-player1, #h2h-player2')) {
        ui.updateAllViews();
    }
}

function handleGlobalClick(e) {
    const target = e.target;
    const button = target.closest('button');
    const clickableElement = target.closest('[data-action]');

    if (clickableElement) {
        const { action, userId, gameId, date, index, trophyId, trophyName } = clickableElement.dataset;

        if (action === 'show-player-stats') showPlayerStats(userId);
        if (action === 'show-game-details') ui.showGameDetails(gameId);
        if (action === 'edit-game') editGame(gameId);
        if (action === 'delete-game') confirmDeleteGame(gameId, date);
        if (action === 'edit-hanchan') openScoreInputModal(index);
        if (action === 'delete-hanchan') deleteHanchanHandler(index);
        if (action === 'save-modal-scores') saveScoresFromModalHandler(index);
        if (action === 'open-yakuman-modal') openYakumanEventModal(index);
        if (action === 'open-penalty-modal') openPenaltyModal(index);
        if (action === 'add-yakuman') addYakumanEvent(index);
        if (action === 'add-penalty') addPenalty(index);
        if (action === 'keypad') keypadInput(clickableElement.dataset.key);
        if (action === 'add-user') addUser();
        if (action === 'edit-user') toggleEditUser(userId);
        if (action === 'delete-user') confirmDeleteUser(userId);
        if (action === 'confirm-delete-user') executeDeleteUser(userId);
        if (action === 'confirm-delete-game') executeDeleteGame(gameId);
        if (action === 'show-trophy-achievers') showTrophyAchievers(trophyId, trophyName);
    }

    if (button) {
        if (button.id === 'to-step2-btn') moveToStep2();
        if (button.id === 'to-step3-btn') moveToStep3();
        if (button.id === 'back-to-step1-btn') backToStep1();
        if (button.id === 'back-to-step2-btn') backToStep2();
        if (button.id === 'set-mleague-rules-btn') setMLeagueRules();
        if (button.id === 'set-today-date-btn') setTodayDate();
        if (button.id === 'add-hanchan-btn') addHanchanHandler();
        if (button.id === 'save-partial-btn') savePartialDataHandler();
        if (button.id === 'show-pt-status-btn') showCurrentPtStatus();
        if (button.id === 'save-game-btn') calculateAndSave();
    }
}


function handleGlobalInput(e) {
    if (e.target.matches('#base-point, #return-point')) {
        ui.updateOkaDisplay();
    }
}

function handleGlobalFocus(e) {
    if (e.target.matches('.modal-score-input')) {
        setActiveInput(e.target.id);
    }
}

// =================================================================
// Game Flow Logic
// =================================================================

function togglePlayerSelectionHandler(checkbox) {
    const userId = checkbox.dataset.userId;
    const user = state.users.find(u => u.id === userId);
    if (!user) return;

    if (checkbox.checked) {
        if (state.selectedPlayers.length < 4) {
            state.selectedPlayers.push({ id: user.id, name: user.name, photoURL: user.photoURL });
        }
    } else {
        state.selectedPlayers = state.selectedPlayers.filter(p => p.id !== userId);
    }
    ui.renderPlayerSelection();
}

function moveToStep2() {
    ui.lockUnlockStep(1, true);
    const step2 = document.getElementById('step2-rule-settings');
    step2.classList.remove('hidden');
    step2.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function moveToStep3() {
    ui.lockUnlockStep(2, true);
    const step3 = document.getElementById('step3-score-input');
    step3.classList.remove('hidden');
    if (state.hanchanScores.length === 0) {
        addHanchan();
        ui.renderScoreDisplay();
    }
    step3.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function backToStep1() {
    if (state.editingGameId) return;
    document.getElementById('step2-rule-settings').classList.add('hidden');
    ui.lockUnlockStep(1, false);
    document.getElementById('step1-player-selection').scrollIntoView({ behavior: 'smooth', block: 'center' });
    localStorage.removeItem('edogawa-m-league-partial');
}

function backToStep2() {
    if (state.editingGameId) return;
    document.getElementById('step3-score-input').classList.add('hidden');
    ui.lockUnlockStep(2, false);
    document.getElementById('step2-rule-settings').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setMLeagueRules() {
    document.getElementById('base-point').value = 25000;
    document.getElementById('return-point').value = 30000;
    document.getElementById('uma-1').value = 30;
    document.getElementById('uma-2').value = 10;
    document.getElementById('uma-3').value = -10;
    document.getElementById('uma-4').value = -30;
    ui.updateOkaDisplay();
}

function setTodayDate() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    const dayOfWeek = ['日', '月', '火', '水', '木', '金', '土'][today.getDay()];
    document.getElementById('game-date').value = `${year}/${month}/${day}(${dayOfWeek})`;
}

function addHanchanHandler() {
    addHanchan();
    ui.renderScoreDisplay();
    setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
}

function deleteHanchanHandler(index) {
    if (deleteHanchan(index)) {
        ui.renderScoreDisplay();
    } else {
        ui.showModalMessage("最低1半荘は必要です。");
    }
}

function savePartialDataHandler() {
    savePartialData();
    ui.showModalMessage("途中データを保存しました！");
}

function showCurrentPtStatus() {
    const settings = {
        basePoint: Number(document.getElementById('base-point').value),
        returnPoint: Number(document.getElementById('return-point').value),
        uma: [
            Number(document.getElementById('uma-1').value),
            Number(document.getElementById('uma-2').value),
            Number(document.getElementById('uma-3').value),
            Number(document.getElementById('uma-4').value)
        ]
    };
    const gameData = getGameDataFromForm(true, settings); 
    if (gameData.error) {
        ui.showModalMessage(gameData.error);
        return;
    }

    const rankedPlayers = Object.entries(gameData.totalPoints)
        .map(([id, points]) => ({ id, name: state.selectedPlayers.find(p => p.id === id).name, points }))
        .sort((a, b) => b.points - a.points);

    let modalHtml = `<h3 class="cyber-header text-xl font-bold text-yellow-300 mb-4">現在のポイント状況</h3>
        <table class="min-w-full text-center">
            <thead><tr class="border-b border-gray-700"><th class="py-2">順位</th><th class="py-2">雀士</th><th class="py-2">ポイント</th></tr></thead><tbody>`;

    rankedPlayers.forEach((player, index) => {
        modalHtml += `<tr>
            <td class="py-2">${index + 1}</td>
            <td class="py-2">${player.name}</td>
            <td class="py-2 font-bold ${player.points >= 0 ? 'text-green-400' : 'text-red-400'}">${player.points.toFixed(1)}</td>
        </tr>`;
    });

    modalHtml += `</tbody></table><div class="flex justify-end mt-6"><button id="modal-close-btn" class="cyber-btn px-4 py-2">閉じる</button></div>`;
    ui.showModal(modalHtml);
}

async function calculateAndSave() {
    const gameDate = document.getElementById('game-date').value.trim();
    if (!gameDate) {
        ui.showModalMessage("対局日を入力してください。");
        return;
    }
    const settings = {
        basePoint: Number(document.getElementById('base-point').value),
        returnPoint: Number(document.getElementById('return-point').value),
        uma: [
            Number(document.getElementById('uma-1').value),
            Number(document.getElementById('uma-2').value),
            Number(document.getElementById('uma-3').value),
            Number(document.getElementById('uma-4').value)
        ]
    };
    const gameData = getGameDataFromForm(false, settings);
    if (gameData.error) {
        ui.showModalMessage(gameData.error);
        return;
    }

    const dataToSave = {
        gameDate: gameDate,
        playerIds: state.selectedPlayers.map(p => p.id),
        playerNames: state.selectedPlayers.map(p => p.name),
        settings: gameData.settings,
        scores: gameData.hanchanData,
        totalPoints: gameData.totalPoints
    };

    try {
        if (state.editingGameId) {
            const gameDocRef = doc(db, 'games', state.editingGameId);
            await updateDoc(gameDocRef, dataToSave);
            ui.showModalMessage("対局結果を更新しました！");
        } else {
            dataToSave.createdAt = new Date();
            await addDoc(collection(db, `games`), dataToSave);
            ui.showModalMessage("対局結果を保存しました！");
        }
        resetGame();
        ui.renderGameTab();
        ui.changeTab('game');
    } catch (error) {
        console.error("Error saving game: ", error);
        ui.showModalMessage("データの保存に失敗しました。");
    }
}

// =================================================================
// Score Input Modal Logic
// =================================================================

function openScoreInputModal(index) {
    ui.renderScoreInputModal(index);
    setActiveInput(`modal-score-${state.selectedPlayers[0].id}`);
    ui.updateModalTotal();
}

function saveScoresFromModalHandler(index) {
    const error = saveScoresFromModal(index);
    if (error) {
        ui.showModalMessage(error);
        return;
    }
    ui.renderScoreDisplay();
    ui.closeModal();
}

function setActiveInput(inputId) {
    state.activeInputId = inputId;
    document.querySelectorAll('.modal-score-input').forEach(el => el.classList.remove('ring-2', 'ring-yellow-400'));
    const activeEl = document.getElementById(inputId);
    if (activeEl) {
        activeEl.classList.add('ring-2', 'ring-yellow-400');
    }
}

function keypadInput(key) {
    const input = document.getElementById(state.activeInputId);
    if (!input) return;

    if (key === 'C') {
        input.value = '';
    } else if (key === 'マイナス') {
        if (!input.value.startsWith('-')) {
            input.value = '-' + input.value;
        }
    } else if (key === 'auto') {
        autoFillLastScore();
    } else {
        input.value += key;
    }
    ui.updateModalTotal();
}

function autoFillLastScore() {
    let total = 0;
    let emptyInput = null;
    let filledCount = 0;
    document.querySelectorAll('.modal-score-input').forEach(input => {
        if (input.value.trim() !== '' && input.value.trim() !== '-') {
            total += Number(input.value);
            filledCount++;
        } else {
            emptyInput = input;
        }
    });

    if (filledCount === 3 && emptyInput) {
        const basePoint = Number(document.getElementById('base-point').value);
        const targetTotal = basePoint * 4;
        emptyInput.value = targetTotal - total;
        ui.updateModalTotal();
    }
}

// =================================================================
// Yakuman & Penalty Modal Logic
// =================================================================

function openYakumanEventModal(hanchanIndex) {
    ui.renderYakumanModal(hanchanIndex);
}

function addYakumanEvent(hanchanIndex) {
    const playerId = document.getElementById('yakuman-player-select').value;
    const selectedYakuman = Array.from(document.querySelectorAll('input[name="yakuman-checkbox"]:checked')).map(cb => cb.value);

    if (!playerId || selectedYakuman.length === 0) {
        ui.showModalMessage("雀士と役満を選択してください。");
        return;
    }

    const hanchan = state.hanchanScores[hanchanIndex];
    if (!hanchan.yakumanEvents) hanchan.yakumanEvents = [];
    hanchan.yakumanEvents.push({ playerId, yakumans: selectedYakuman });

    ui.showModalMessage("役満を記録しました！");
    ui.renderScoreDisplay();
    setTimeout(() => openScoreInputModal(hanchanIndex), 1500);
}

function openPenaltyModal(hanchanIndex) {
    ui.renderPenaltyModal(hanchanIndex);
}

function addPenalty(hanchanIndex) {
    const playerId = document.getElementById('penalty-player-select').value;
    const type = document.getElementById('penalty-type-select').value;
    const reason = document.getElementById('penalty-reason-select').value;
    const count = parseInt(document.getElementById('penalty-count-input').value, 10);

    if (!playerId || !type || !reason || isNaN(count) || count < 1) {
        ui.showModalMessage("全ての項目を正しく入力してください。");
        return;
    }

    const hanchan = state.hanchanScores[hanchanIndex];
    if (!hanchan.penalties) hanchan.penalties = [];
    hanchan.penalties.push({ playerId, type, reason, count });

    ui.showModalMessage("ペナルティを記録しました。");
    ui.renderScoreDisplay();
    setTimeout(() => openScoreInputModal(hanchanIndex), 1500);
}

// =================================================================
// User Management Logic
// =================================================================

async function addUser() {
    const nameInput = document.getElementById('new-user-name');
    const name = nameInput.value.trim();
    if (!name) {
        ui.showModalMessage("雀士名を入力してください。");
        return;
    }
    if (state.users.some(u => u.name === name)) {
        ui.showModalMessage("同じ名前の雀士が既に存在します。");
        return;
    }
    try {
        await addDoc(collection(db, `users`), { name: name, createdAt: new Date(), photoURL: null });
        nameInput.value = '';
        ui.showModalMessage(`「${name}」さんを登録しました。`);
    } catch (error) {
        console.error("Error adding user: ", error);
        ui.showModalMessage("ユーザーの追加に失敗しました。");
    }
}

async function handlePhotoUpload(userId, inputElement) {
    const file = inputElement.files[0];
    if (!file) return;

    ui.showLoadingModal("写真をアップロード中...");
    const storageRef = ref(storage, `user-photos/${userId}/${file.name}`);

    try {
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        await updateDoc(doc(db, 'users', userId), { photoURL: downloadURL });
        ui.closeModal();
    } catch (error) {
        console.error("Photo upload failed:", error);
        ui.showModalMessage("写真のアップロードに失敗しました。");
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
        if (!newName) {
            ui.showModalMessage("雀士名は空にできません。");
            input.value = originalName;
        } else if (newName !== originalName && state.users.some(u => u.name === newName && u.id !== userId)) {
            ui.showModalMessage("同じ名前の雀士が既に存在します。");
            input.value = originalName;
        } else if (newName !== originalName) {
            try {
                await executeUserNameUpdate(userId, newName);
                ui.showModalMessage("雀士名を更新しました。");
            } catch (error) {
                console.error("Error updating user name: ", error);
                ui.showModalMessage("名前の更新に失敗しました。");
                input.value = originalName;
            }
        }
        input.readOnly = true;
        editBtn.innerHTML = '<i class="fas fa-edit"></i>';
        editBtn.classList.remove('cyber-btn-green');
    }
}

async function executeUserNameUpdate(userId, newName) {
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', userId), { name: newName });
    const gamesQuery = query(collection(db, 'games'), where('playerIds', 'array-contains', userId));
    const gamesSnapshot = await getDocs(gamesQuery);
    gamesSnapshot.forEach(gameDoc => {
        const gameData = gameDoc.data();
        const playerIndex = gameData.playerIds.indexOf(userId);
        if (playerIndex !== -1) {
            const newPlayerNames = [...gameData.playerNames];
            newPlayerNames[playerIndex] = newName;
            batch.update(gameDoc.ref, { playerNames: newPlayerNames });
        }
    });
    await batch.commit();
}

function confirmDeleteUser(userId) {
    const user = state.users.find(u => u.id === userId);
    if (!user) return;
    ui.showModal(`
        <h3 class="cyber-header text-xl font-bold text-red-400 mb-4">削除確認</h3>
        <p>「${user.name}」を削除しますか？<br>関連する全ての対局データも永久に削除されます。この操作は元に戻せません。</p>
        <div class="flex justify-end gap-4 mt-6">
            <button id="modal-close-btn" class="cyber-btn px-4 py-2">キャンセル</button>
            <button data-action="confirm-delete-user" data-user-id="${userId}" class="cyber-btn-red px-4 py-2">削除実行</button>
        </div>
    `);
}

async function executeDeleteUser(userId) {
    ui.closeModal();
    try {
        const batch = writeBatch(db);
        const gamesQuery = query(collection(db, `games`), where('playerIds', 'array-contains', userId));
        const gamesSnapshot = await getDocs(gamesQuery);
        gamesSnapshot.forEach(doc => batch.delete(doc.ref));
        batch.delete(doc(db, `users`, userId));
        await batch.commit();
        ui.showModalMessage(`ユーザーと関連データを削除しました。`);
        resetGame();
    } catch (error) {
        console.error("Error deleting user:", error);
        ui.showModalMessage("削除に失敗しました。");
    }
}

// =================================================================
// History Management Logic
// =================================================================

function editGame(gameId) {
    const game = state.games.find(g => g.id === gameId);
    if (!game) {
        ui.showModalMessage("ゲームが見つかりません。");
        return;
    }

    state.editingGameId = gameId;
    state.selectedPlayers = game.playerIds.map(pId => {
        const user = state.users.find(u => u.id === pId);
        return { id: user.id, name: user.name, photoURL: user.photoURL };
    });
    state.hanchanScores = game.scores.map(s => ({
        rawScores: s.rawScores,
        yakumanEvents: s.yakumanEvents || [],
        penalties: s.penalties || []
    }));

    ui.changeTab('game');

    ui.renderPlayerSelection();
    document.getElementById('to-step2-btn').disabled = false;
    ui.lockUnlockStep(1, true);

    document.getElementById('step2-rule-settings').classList.remove('hidden');
    document.getElementById('base-point').value = game.settings.basePoint;
    document.getElementById('return-point').value = game.settings.returnPoint;
    document.getElementById('uma-1').value = game.settings.uma[0];
    document.getElementById('uma-2').value = game.settings.uma[1];
    document.getElementById('uma-3').value = game.settings.uma[2];
    document.getElementById('uma-4').value = game.settings.uma[3];
    ui.updateOkaDisplay();
    ui.lockUnlockStep(2, true);

    document.getElementById('step3-score-input').classList.remove('hidden');
    document.getElementById('game-date').value = game.gameDate;
    ui.renderScoreDisplay();

    const saveBtn = document.getElementById('save-game-btn');
    saveBtn.innerHTML = `<i class="fas fa-sync-alt mr-2"></i>Pt変換して更新`;
    saveBtn.classList.remove('cyber-btn-yellow');
    saveBtn.classList.add('cyber-btn-green');

    document.getElementById('step3-score-input').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function confirmDeleteGame(gameId, date) {
    ui.showModal(`
        <h3 class="cyber-header text-xl font-bold text-red-400 mb-4">対局履歴 削除確認</h3>
        <p>${date} の対局データを削除しますか？<br>この操作は元に戻せません。</p>
        <div class="flex justify-end gap-4 mt-6">
            <button id="modal-close-btn" class="cyber-btn px-4 py-2">キャンセル</button>
            <button data-action="confirm-delete-game" data-game-id="${gameId}" class="cyber-btn-red px-4 py-2">削除実行</button>
        </div>
    `);
}

async function executeDeleteGame(gameId) {
    ui.closeModal();
    try {
        await deleteDoc(doc(db, "games", gameId));
        ui.showModalMessage("対局データを削除しました。");
    } catch (error) {
        console.error("Error deleting game: ", error);
        ui.showModalMessage("対局データの削除に失敗しました。");
    }
}

function showPlayerStats(playerId) {
    ui.changeTab('personal-stats');
    const select = document.getElementById('personal-stats-player-select');
    select.value = playerId;
    ui.displayPlayerStats(playerId);
}

function showTrophyAchievers(trophyId, trophyName) {
    const achievers = state.users.filter(user => state.playerTrophies[user.id]?.[trophyId]);
    
    if (achievers.length === 0) {
        ui.showModalMessage(`このトロフィーの獲得者はいません。`);
        return;
    }

    const achieversHtml = achievers.map(user => {
        return `<div class="flex items-center gap-3 bg-gray-800 p-2 rounded-md">
                    ${ui.getPlayerPhotoHtml(user.id, 'w-10 h-10')}
                    <span class="font-bold">${user.name}</span>
                </div>`;
    }).join('');

    const modalContent = `
        <h3 class="cyber-header text-xl font-bold text-yellow-300 mb-4">${trophyName}</h3>
        <p class="mb-4">獲得者一覧:</p>
        <div class="space-y-2 max-h-60 overflow-y-auto">
            ${achieversHtml}
        </div>
        <div class="flex justify-end mt-6">
            <button id="modal-close-btn" class="cyber-btn px-4 py-2">閉じる</button>
        </div>
    `;
    ui.showModal(modalContent);
}

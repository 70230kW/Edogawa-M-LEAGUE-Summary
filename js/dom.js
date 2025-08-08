import * as state from './state.js';
import * as charts from './charts.js';
import * as utils from './utils.js';
import { TROPHY_DEFINITIONS, YAKUMAN_LIST, PENALTY_REASONS } from './constants.js';

//#################################################################
// Main Update Entry Points
//#################################################################

/**
 * アプリケーションのすべてのビューを最新の状態に更新します。
 * main.js の masterUpdateLoop から呼び出されます。
 */
export function updateAllViews() {
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'game';

    // データの変更に伴い、常に更新が必要な可能性のあるコンポーネント
    updateLeaderboard();
    updateTrophyPage();
    updateHistoryTabFilters();
    updateHistoryList();
    renderDetailedHistoryTables();
    renderUserManagementList();
    
    // 現在表示中のタブに応じた更新処理
    if (activeTab === 'data-analysis') {
        charts.updateDataAnalysisCharts();
    } else if (activeTab === 'personal-stats') {
        // 選択中のプレイヤーがいれば、その統計を再描画
        const playerId = document.getElementById('personal-stats-player-select')?.value;
        if (playerId) {
            displayPlayerStats(playerId);
        } else {
             renderPersonalStatsTab(); // プレイヤーリストを更新して再描画
        }
    } else if (activeTab === 'game') {
        // 編集中の場合でもユーザー名などが更新される可能性があるため再描画
        renderPlayerSelection();
        if(!document.getElementById('step3-score-input').classList.contains('hidden')) {
            renderScoreDisplay();
        }
    } else if (activeTab === 'head-to-head') {
        displayHeadToHeadStats();
    }
}

/**
 * アプリケーション起動時に各タブの初期HTML構造をレンダリングします。
 */
export function renderAllInitialTabs() {
    renderGameTab();
    renderLeaderboardTab();
    renderTrophyTab();
    renderDataAnalysisTab();
    renderPersonalStatsTab();
    renderUserManagementTab();
    renderDetailedHistoryTabContainers();
    renderHeadToHeadTab();
    renderHistoryTab();
}

//#################################################################
// Reusable Components
//#################################################################

/**
 * プレイヤーの写真を表示するHTML文字列を生成します。
 * @param {string} playerId - プレイヤーID
 * @param {string} sizeClass - Tailwind CSSのサイズクラス (例: 'w-12 h-12')
 * @returns {string} HTML文字列
 */
export function getPlayerPhotoHtml(playerId, sizeClass = 'w-12 h-12') {
    const user = state.getUsers().find(u => u.id === playerId);
    const fontSize = parseInt(sizeClass.match(/w-(\d+)/)[1]) / 2.5;
    if (user && user.photoURL) {
        return `<img src="${user.photoURL}" class="${sizeClass} rounded-full object-cover bg-gray-800" alt="${user.name}" onerror="this.onerror=null;this.src='https://placehold.co/100x100/010409/8b949e?text=?';">`;
    }
    return `<div class="${sizeClass} rounded-full bg-gray-700 flex items-center justify-center">
                <i class="fas fa-user text-gray-500" style="font-size: ${fontSize}px;"></i>
            </div>`;
}

//#################################################################
// Initial Tab Rendering
//#################################################################

export function renderGameTab() {
    const container = document.getElementById('game-tab');
    container.innerHTML = `
        <div id="step1-player-selection" class="cyber-card p-4 sm:p-6">
            <h2 class="cyber-header text-xl font-bold mb-4 border-b border-gray-700 pb-2 text-blue-400">STEP 1: 雀士選択</h2>
            <div id="player-list-for-selection" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"></div>
            <div class="flex justify-end">
                <button id="to-step2-btn" class="cyber-btn px-6 py-2 rounded-lg" disabled>進む <i class="fas fa-arrow-right ml-2"></i></button>
            </div>
        </div>
        <div id="step2-rule-settings" class="cyber-card p-4 sm:p-6 hidden">
            <h2 class="cyber-header text-xl font-bold mb-4 border-b border-gray-700 pb-2 text-blue-400">STEP 2: ルール選択</h2>
            <div class="space-y-4">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label class="block text-sm font-medium text-gray-400">基準点</label><input type="number" id="base-point" value="25000" class="mt-1 block w-full rounded-md shadow-sm sm:text-sm"></div>
                    <div><label class="block text-sm font-medium text-gray-400">返し点</label><input type="number" id="return-point" value="30000" class="mt-1 block w-full rounded-md shadow-sm sm:text-sm"></div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-400">順位ウマ</label>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                        <input type="number" id="uma-1" placeholder="1位" value="30" class="w-full rounded-md shadow-sm sm:text-sm">
                        <input type="number" id="uma-2" placeholder="2位" value="10" class="w-full rounded-md shadow-sm sm:text-sm">
                        <input type="number" id="uma-3" placeholder="3位" value="-10" class="w-full rounded-md shadow-sm sm:text-sm">
                        <input type="number" id="uma-4" placeholder="4位" value="-30" class="w-full rounded-md shadow-sm sm:text-sm">
                    </div>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <button id="m-league-rules-btn" class="cyber-btn cyber-btn-green px-4 py-2 rounded-lg"><i class="fas fa-star mr-2"></i>Mリーグルール</button>
                    <div class="text-right"><p class="text-sm text-gray-400">オカ: <span id="oka-display" class="font-bold text-white">20</span></p></div>
                </div>
            </div>
            <div class="flex justify-between mt-6">
                <button id="back-to-step1-btn" class="cyber-btn px-6 py-2 rounded-lg"><i class="fas fa-arrow-left mr-2"></i>戻る</button>
                <button id="to-step3-btn" class="cyber-btn px-6 py-2 rounded-lg">進む <i class="fas fa-arrow-right ml-2"></i></button>
            </div>
        </div>
        <div id="step3-score-input" class="cyber-card p-4 sm:p-6 hidden">
            <h2 class="cyber-header text-xl font-bold mb-4 border-b border-gray-700 pb-2 text-blue-400">STEP 3: 素点入力</h2>
            <div class="mb-4">
                <label for="game-date" class="block text-sm font-medium text-gray-400 mb-1">対局日</label>
                <div class="flex gap-2">
                    <input type="text" id="game-date" class="flex-grow rounded-md shadow-sm sm:text-sm" placeholder="yyyy/m/d(aaa)">
                    <button id="today-date-btn" class="cyber-btn px-4 py-2 rounded-lg">今日</button>
                </div>
            </div>
            <div id="score-display-area" class="space-y-4"></div>
            <div class="flex flex-col sm:flex-row justify-between items-center mt-4 flex-wrap gap-4">
                <div class="flex gap-2 w-full sm:w-auto">
                    <button id="add-hanchan-btn" class="cyber-btn px-4 py-2 rounded-lg w-full"><i class="fas fa-plus mr-2"></i>半荘追加</button>
                    <button id="save-partial-btn" class="cyber-btn cyber-btn-green px-4 py-2 rounded-lg w-full"><i class="fas fa-floppy-disk mr-2"></i>途中保存</button>
                </div>
                <button id="show-current-pt-btn" class="cyber-btn px-4 py-2 rounded-lg order-first sm:order-none w-full sm:w-auto"><i class="fas fa-calculator mr-2"></i>現在のPT状況</button>
                <div class="flex gap-2 w-full sm:w-auto">
                    <button id="back-to-step2-btn" class="cyber-btn px-6 py-2 rounded-lg w-full"><i class="fas fa-arrow-left mr-2"></i>戻る</button>
                    <button id="save-game-btn" class="cyber-btn cyber-btn-yellow px-6 py-2 rounded-lg w-full"><i class="fas fa-save mr-2"></i>Pt変換して保存</button>
                </div>
            </div>
        </div>
    `;
    renderPlayerSelection();
    setupRuleEventListeners();
}

// ... 他の `render...Tab` 関数も同様に移植 ...

//#################################################################
// Dynamic Rendering & Updates
//#################################################################

/**
 * 順位表タブの内容を現在の状態で更新します。
 */
export function updateLeaderboard() {
    // ... (元の `updateLeaderboard` 関数のロジックをここに移植)
}

/**
 * 対局タブのプレイヤー選択UIを現在の状態で更新します。
 */
export function renderPlayerSelection() {
    const container = document.getElementById('player-list-for-selection');
    if (!container) return;
    const users = state.getUsers();
    const selectedPlayers = state.getSelectedPlayers();
    
    container.innerHTML = users.map(user => {
        const isSelected = selectedPlayers.some(p => p.id === user.id);
        const isDisabled = !isSelected && selectedPlayers.length >= 4;
        const photoHtml = getPlayerPhotoHtml(user.id, 'w-16 h-16');
        return `
            <div>
                <input type="checkbox" id="player-${user.id}" class="player-checkbox hidden" value="${user.id}" name="${user.name}" ${isSelected ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
                <label for="player-${user.id}" class="block text-center border-2 border-gray-600 rounded-lg p-3 cursor-pointer transition-colors duration-200 hover:border-blue-500">
                    <div class="w-16 h-16 mx-auto mb-2">${photoHtml}</div>
                    <span>${user.name}</span>
                </label>
            </div>
        `;
    }).join('');
}

// ... 他の動的更新関数 (`renderScoreDisplay`, `updateHistoryList` など) も同様に移植 ...

//#################################################################
// Modal Logic
//#################################################################

export function showModal(content) {
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal').classList.remove('hidden');
}

export function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modal-content').innerHTML = ''; // メモリリーク防止のため内容をクリア
}

export function showModalMessage(message) {
    showModal(`
        <p class="text-lg text-center">${message}</p>
        <div class="flex justify-end mt-6">
            <button class="cyber-btn px-6 py-2" onclick="closeModal()">閉じる</button>
        </div>
    `);
}

export function showLoadingModal(message) {
    showModal(`
        <div class="flex justify-center items-center flex-col gap-4">
            <p class="text-lg text-center">${message}</p>
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
        </div>
    `);
}

// ... 他のモーダル関連関数 (`openScoreInputModal` など) も同様に移植 ...

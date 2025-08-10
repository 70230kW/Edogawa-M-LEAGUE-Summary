import { state } from './state.js';
import { getGameYears, calculateAllPlayerStats, calculateHanchanRanksAndPoints, checkAllTrophies, getPlayerPointHistory } from './utils.js';
import { TROPHY_DEFINITIONS } from './constants.js';

// =================================================================
// Master UI Update Functions
// =================================================================

/**
 * アプリケーション全体のUIを更新するマスター関数
 */
export function updateAllViews() {
    // データが更新されたので、統計を再計算
    state.cachedStats = calculateAllPlayerStats(state.games);

    // 現在表示中のタブを特定
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'game';

    // 各タブの表示を更新
    if (activeTab === 'leaderboard') updateLeaderboard();
    if (activeTab === 'trophy') updateTrophyPage();
    if (activeTab === 'history') updateHistoryList();
    if (activeTab === 'history-raw' || activeTab === 'history-pt') renderDetailedHistoryTables();
    if (activeTab === 'users') renderUserManagementList();
    if (activeTab === 'personal-stats') {
        const selectedPlayerId = document.getElementById('personal-stats-player-select')?.value;
        renderPersonalStatsTab(); // ドロップダウンリストを最新のユーザー情報で更新
        if (selectedPlayerId && state.users.some(u => u.id === selectedPlayerId)) {
            document.getElementById('personal-stats-player-select').value = selectedPlayerId;
            displayPlayerStats(selectedPlayerId);
        } else {
            displayPlayerStats(null); // 選択がない場合は初期状態を表示
        }
    }
    if (activeTab === 'data-analysis') updateDataAnalysisCharts();
    if (activeTab === 'head-to-head') {
        updateHeadToHeadDropdowns();
        displayHeadToHeadStats();
    }

    // ゲームタブは常に状態をチェックして更新
    if (document.getElementById('game-tab') && !document.getElementById('game-tab').classList.contains('hidden')) {
        if (document.getElementById('step1-player-selection') && document.getElementById('step1-player-selection').style.display !== 'none') {
            renderPlayerSelection();
        }
        if (document.getElementById('step3-score-input') && !document.getElementById('step3-score-input').classList.contains('hidden')) {
            renderScoreDisplay();
        }
    }

    // 他のタブでも更新が必要なフィルター類
    updateHistoryTabFilters();
}


/**
 * ページ読み込み時に各タブの初期HTML構造を描画する
 */
export function renderInitialUI() {
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

// =================================================================
// Modal Functions
// =================================================================

export function showModal(content) {
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal').classList.remove('hidden');
}

export function showModalMessage(message) {
    showModal(`<p class="text-lg text-center">${message}</p><div class="flex justify-end mt-6"><button id="modal-close-btn" class="cyber-btn px-6 py-2">閉じる</button></div>`);
}

export function showLoadingModal(message) {
    showModal(`<div class="flex justify-center items-center flex-col gap-4"><p class="text-lg text-center">${message}</p><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div></div>`);
}

export function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

// =================================================================
// General UI Components
// =================================================================

export function getPlayerPhotoHtml(playerId, sizeClass = 'w-12 h-12') {
    const user = state.users.find(u => u.id === playerId);
    const fontSize = parseInt(sizeClass.match(/w-(\d+)/)[1]) / 2.5;
    if (user && user.photoURL) {
        return `<img src="${user.photoURL}" class="${sizeClass} rounded-full object-cover bg-gray-800" alt="${user.name}" onerror="this.onerror=null;this.src='https://placehold.co/100x100/010409/8b949e?text=?';">`;
    }
    return `<div class="${sizeClass} rounded-full bg-gray-700 flex items-center justify-center">
                <i class="fas fa-user text-gray-500" style="font-size: ${fontSize}px;"></i>
            </div>`;
}

export function changeTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

    const tabEl = document.getElementById(`${tabName}-tab`);
    if (tabEl) tabEl.classList.remove('hidden');

    const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (btn) btn.classList.add('active');

    updateAllViews();
}

// =================================================================
// Tab Rendering & Update Functions
// =================================================================

// --- Game Tab ---

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
                    <button id="set-mleague-rules-btn" class="cyber-btn cyber-btn-green px-4 py-2 rounded-lg"><i class="fas fa-star mr-2"></i>Mリーグルール</button>
                    <div class="text-right"><p class="text-sm text-gray-400">オカ: <span id="oka-display" class="font-bold text-white">20.0</span></p></div>
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
                     <button id="set-today-date-btn" class="cyber-btn px-4 py-2 rounded-lg">今日</button>
                 </div>
             </div>
             <div id="score-display-area" class="space-y-4"></div>
             <div class="flex flex-col sm:flex-row justify-between items-center mt-4 flex-wrap gap-4">
                 <div class="flex gap-2 w-full sm:w-auto">
                     <button id="add-hanchan-btn" class="cyber-btn px-4 py-2 rounded-lg w-full"><i class="fas fa-plus mr-2"></i>半荘追加</button>
                     <button id="save-partial-btn" class="cyber-btn cyber-btn-green px-4 py-2 rounded-lg w-full"><i class="fas fa-floppy-disk mr-2"></i>途中保存</button>
                 </div>
                 <button id="show-pt-status-btn" class="cyber-btn px-4 py-2 rounded-lg order-first sm:order-none w-full sm:w-auto"><i class="fas fa-calculator mr-2"></i>現在のPT状況</button>
                 <div class="flex gap-2 w-full sm:w-auto">
                     <button id="back-to-step2-btn" class="cyber-btn px-6 py-2 rounded-lg w-full"><i class="fas fa-arrow-left mr-2"></i>戻る</button>
                     <button id="save-game-btn" class="cyber-btn cyber-btn-yellow px-6 py-2 rounded-lg w-full"><i class="fas fa-save mr-2"></i>Pt変換して保存</button>
                 </div>
             </div>
        </div>
    `;
    renderPlayerSelection();
    updateOkaDisplay();
}

export function renderPlayerSelection() {
    const container = document.getElementById('player-list-for-selection');
    if (!container) return;
    container.innerHTML = state.users.map(user => {
        const isSelected = state.selectedPlayers.some(p => p.id === user.id);
        const isDisabled = !isSelected && state.selectedPlayers.length >= 4;
        const photoHtml = getPlayerPhotoHtml(user.id, 'w-16 h-16');
        return `
            <div>
                <input type="checkbox" id="player-${user.id}" data-user-id="${user.id}" class="player-checkbox hidden" ${isSelected ? 'checked' : ''} ${isDisabled ? 'disabled' : ''}>
                <label for="player-${user.id}" class="block text-center border-2 border-gray-600 rounded-lg p-3 cursor-pointer transition-colors duration-200 hover:border-blue-500">
                    <div class="w-16 h-16 mx-auto mb-2 pointer-events-none">${photoHtml}</div>
                    <span class="pointer-events-none">${user.name}</span>
                </label>
            </div>
        `;
    }).join('');
    const toStep2Btn = document.getElementById('to-step2-btn');
    if (toStep2Btn) {
        toStep2Btn.disabled = state.selectedPlayers.length !== 4;
    }
}

export function updateOkaDisplay() {
    const baseInput = document.getElementById('base-point');
    const returnInput = document.getElementById('return-point');
    const display = document.getElementById('oka-display');
    if (!baseInput || !returnInput || !display) return;
    const base = Number(baseInput.value || 0);
    const ret = Number(returnInput.value || 0);
    const oka = ((ret - base) * 4) / 1000;
    display.textContent = oka.toFixed(1);
}

export function renderScoreDisplay() {
    const container = document.getElementById('score-display-area');
    if (!container) return;
    container.innerHTML = state.hanchanScores.map((hanchan, index) => {
        const scores = hanchan.rawScores;
        const total = Object.values(scores).reduce((sum, score) => sum + (Number(score) || 0), 0);
        const basePoint = Number(document.getElementById('base-point').value);
        const isComplete = Object.values(scores).every(s => s !== null && s !== '');
        const totalColor = isComplete && Math.round(total) !== basePoint * 4 ? 'text-red-500' : (isComplete ? 'text-green-400' : '');

        const { points, rawRanks } = calculateHanchanRanksAndPoints(scores);

        const yakumanHtml = (hanchan.yakumanEvents && hanchan.yakumanEvents.length > 0)
            ? `<div class="mt-2 border-t border-gray-700 pt-2">
                ${hanchan.yakumanEvents.map(y => {
                const user = state.users.find(u => u.id === y.playerId);
                return `<span class="text-xs inline-block bg-yellow-900 text-yellow-300 rounded-full px-2 py-1 mr-1 mb-1">${user ? user.name : ''}: ${y.yakumans.join(', ')}</span>`
            }).join('')}
               </div>`
            : '';

        const penaltyHtml = (hanchan.penalties && hanchan.penalties.length > 0)
            ? `<div class="mt-2 border-t border-gray-700 pt-2">
                ${hanchan.penalties.map(p => {
                const user = state.users.find(u => u.id === p.playerId);
                const typeText = p.type === 'chombo' ? 'チョンボ' : 'アガリ放棄';
                return `<span class="text-xs inline-block bg-red-900 text-red-300 rounded-full px-2 py-1 mr-1 mb-1">${user ? user.name : ''}: ${typeText} (${p.reason}) x${p.count}</span>`
            }).join('')}
               </div>`
            : '';

        return `
        <div class="cyber-card p-3" id="hanchan-display-${index}">
            <div class="flex justify-between items-center mb-2">
                <h4 class="font-bold text-lg">半荘 #${index + 1}</h4>
                <div class="flex gap-2">
                    <button data-action="edit-hanchan" data-index="${index}" class="cyber-btn px-3 py-1 text-sm"><i class="fas fa-edit mr-1"></i>編集</button>
                    <button data-action="delete-hanchan" data-index="${index}" class="cyber-btn-red px-3 py-1 text-sm"><i class="fas fa-trash"></i></button>
                </div>
            </div>
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="border-b border-gray-700 text-xs text-gray-400">
                            <th class="p-1 font-normal w-1/3">雀士</th>
                            <th class="p-1 text-right font-normal">素点</th>
                            <th class="p-1 text-right font-normal">Pt</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${state.selectedPlayers.map(p => {
                const rawScoreRank = rawRanks[p.id];
                const rawScoreClass = rawScoreRank === 1 ? 'text-rank-1' : (rawScoreRank === 4 ? 'text-rank-4' : '');
                const pointValue = points[p.id];
                const pointClass = pointValue >= 0 ? 'text-green-400' : 'text-red-400';

                return `
                            <tr>
                                <td class="p-1 font-medium">${p.name}</td>
                                <td class="p-1 text-right font-m-gothic ${rawScoreClass}">${scores[p.id] !== null ? Number(scores[p.id]).toLocaleString() : '-'}</td>
                                <td class="p-1 text-right font-m-gothic ${pointClass}">${pointValue !== undefined ? pointValue.toFixed(1) : '-'}</td>
                            </tr>
                        `}).join('')}
                    </tbody>
                    <tfoot>
                        <tr class="border-t border-gray-700">
                            <th class="p-1">合計</th>
                            <th class="p-1 text-right font-bold ${totalColor}">${total.toLocaleString()}</th>
                            <th class="p-1 text-right font-bold">0.0</th>
                        </tr>
                    </tfoot>
                </table>
                ${yakumanHtml}
                ${penaltyHtml}
            </div>
        </div>
        `;
    }).join('');
}

export function lockUnlockStep(stepNum, lock) {
    const stepDiv = document.getElementById(`step${stepNum}-player-selection`) || document.getElementById(`step${stepNum}-rule-settings`);
    if (!stepDiv) return;
    const elements = stepDiv.querySelectorAll('input, button, select');
    elements.forEach(el => {
        if (!el.id.includes('to-step') && !el.id.includes('back-to-step')) {
            el.disabled = lock;
        }
    });
}

// --- Leaderboard Tab ---

export function renderLeaderboardTab() {
    const container = document.getElementById('leaderboard-tab');
    if (!container) return;
    container.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <h2 class="cyber-header text-2xl font-bold text-blue-400">順位表</h2>
            <div class="flex items-center gap-2">
                <label for="leaderboard-period-select" class="text-sm whitespace-nowrap">期間:</label>
                <select id="leaderboard-period-select" class="rounded-md p-1"></select>
            </div>
        </div>
        <div id="leaderboard-cards-container" class="space-y-4 md:hidden"></div>
        <div class="overflow-x-auto hidden md:block">
            <table class="min-w-full divide-y divide-gray-700 leaderboard-table">
                <thead class="bg-gray-900 text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
                    <tr>
                        <th class="px-2 py-3 text-right sticky-col-1 w-14 whitespace-nowrap">順位</th>
                        <th class="px-2 py-3 text-left sticky-col-2 whitespace-nowrap">雀士</th>
                        <th class="px-2 md:px-4 py-3 text-right whitespace-nowrap">合計Pt</th>
                        <th class="px-2 md:px-4 py-3 text-right whitespace-nowrap">半荘数</th>
                        <th class="px-2 md:px-4 py-3 text-right whitespace-nowrap">平均着順</th>
                        <th class="px-2 md:px-4 py-3 text-right whitespace-nowrap">トップ率</th>
                        <th class="px-2 md:px-4 py-3 text-right whitespace-nowrap">2着率</th>
                        <th class="px-2 md:px-4 py-3 text-right whitespace-nowrap">3着率</th>
                        <th class="px-2 md:px-4 py-3 text-right whitespace-nowrap">ラス率</th>
                        <th class="px-2 md:px-4 py-3 text-right whitespace-nowrap">連対率</th>
                        <th class="px-2 md:px-4 py-3 text-right whitespace-nowrap">トビ率</th>
                        <th class="px-2 md:px-4 py-3 text-right whitespace-nowrap">平均素点</th>
                    </tr>
                </thead>
                <tbody id="leaderboard-body" class="divide-y divide-gray-700"></tbody>
            </table>
        </div>
    `;
}

export function updateLeaderboard() {
    const periodSelect = document.getElementById('leaderboard-period-select');
    if (!periodSelect) return;

    const currentPeriod = periodSelect.value;
    const yearOptions = getGameYears().map(year => `<option value="${year}" ${currentPeriod === year ? 'selected' : ''}>${year}年</option>`).join('');
    periodSelect.innerHTML = `<option value="all" ${!currentPeriod || currentPeriod === 'all' ? 'selected' : ''}>全期間</option>${yearOptions}`;

    const period = periodSelect.value;

    const filteredGames = state.games.filter(game => {
        if (period === 'all') return true;
        const gameDate = game.gameDate || new Date(game.createdAt.seconds * 1000).getFullYear().toString();
        const gameYear = gameDate.substring(0, 4);
        return gameYear === period;
    });

    const statsForPeriod = calculateAllPlayerStats(filteredGames);
    const rankedUsers = Object.values(statsForPeriod).filter(u => u.totalHanchans > 0);

    const leaderboardBody = document.getElementById('leaderboard-body');
    const cardsContainer = document.getElementById('leaderboard-cards-container');

    if (rankedUsers.length === 0) {
        if (leaderboardBody) leaderboardBody.innerHTML = `<tr><td colspan="12" class="text-center py-4 text-gray-500">NO DATA</td></tr>`;
        if (cardsContainer) cardsContainer.innerHTML = `<p class="text-center py-4 text-gray-500">NO DATA</p>`;
        return;
    }

    const minMax = {};
    const statFields = {
        avgRank: 'lower', lastRate: 'lower', bustedRate: 'lower',
        topRate: 'higher', rentaiRate: 'higher', avgRawScore: 'higher'
    };

    Object.keys(statFields).forEach(field => {
        const values = rankedUsers.map(u => u[field]);
        minMax[field] = { min: Math.min(...values), max: Math.max(...values) };
    });

    rankedUsers.sort((a, b) => b.totalPoints - a.totalPoints);

    const getClass = (field, value) => {
        if (rankedUsers.length <= 1 || minMax[field].min === minMax[field].max) return '';
        if (statFields[field] === 'higher') {
            if (value === minMax[field].max) return 'text-rank-1';
            if (value === minMax[field].min) return 'text-rank-4';
        } else { // lower is better
            if (value === minMax[field].min) return 'text-rank-1';
            if (value === minMax[field].max) return 'text-rank-4';
        }
        return '';
    };

    if (leaderboardBody) {
        leaderboardBody.innerHTML = rankedUsers.map((user, index) => {
            const photoHtml = getPlayerPhotoHtml(user.id, 'w-8 h-8');
            return `
                <tr class="hover:bg-gray-800 font-m-gothic text-xs md:text-sm">
                    <td class="px-2 py-4 whitespace-nowrap text-right sticky-col-1">${index + 1}</td>
                    <td class="px-2 py-4 whitespace-nowrap text-left font-medium text-blue-400 cursor-pointer hover:underline sticky-col-2" data-action="show-player-stats" data-user-id="${user.id}">
                        <div class="flex items-center gap-3 pointer-events-none">
                            ${photoHtml}
                            <span>${user.name}</span>
                        </div>
                    </td>
                    <td class="px-2 md:px-4 py-4 whitespace-nowrap text-right font-bold ${user.totalPoints >= 0 ? 'text-green-400' : 'text-red-400'}">${(user.totalPoints).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</td>
                    <td class="px-2 md:px-4 py-4 whitespace-nowrap text-right">${user.totalHanchans.toLocaleString()}</td>
                    <td class="px-2 md:px-4 py-4 whitespace-nowrap text-right ${getClass('avgRank', user.avgRank)}">${user.avgRank.toFixed(2)}</td>
                    <td class="px-2 md:px-4 py-4 whitespace-nowrap text-right ${getClass('topRate', user.topRate)}">${user.topRate.toFixed(2)}%</td>
                    <td class="px-2 md:px-4 py-4 whitespace-nowrap text-right ">${user.ranks[1] > 0 ? ((user.ranks[1] / user.totalHanchans) * 100).toFixed(2) : '0.00'}%</td>
                    <td class="px-2 md:px-4 py-4 whitespace-nowrap text-right ">${user.ranks[2] > 0 ? ((user.ranks[2] / user.totalHanchans) * 100).toFixed(2) : '0.00'}%</td>
                    <td class="px-2 md:px-4 py-4 whitespace-nowrap text-right ${getClass('lastRate', user.lastRate)}">${user.lastRate.toFixed(2)}%</td>
                    <td class="px-2 md:px-4 py-4 whitespace-nowrap text-right ${getClass('rentaiRate', user.rentaiRate)}">${user.rentaiRate.toFixed(2)}%</td>
                    <td class="px-2 md:px-4 py-4 whitespace-nowrap text-right ${getClass('bustedRate', user.bustedRate)}">${user.bustedRate.toFixed(2)}%</td>
                    <td class="px-2 md:px-4 py-4 whitespace-nowrap text-right ${getClass('avgRawScore', user.avgRawScore)}">${user.avgRawScore.toLocaleString()}</td>
                </tr>
            `;
        }).join('');
    }

    if (cardsContainer) {
        cardsContainer.innerHTML = rankedUsers.map((user, index) => {
            const photoHtml = getPlayerPhotoHtml(user.id, 'w-12 h-12');
            return `
            <div class="cyber-card p-3 cursor-pointer" data-action="show-player-stats" data-user-id="${user.id}">
                <div class="flex justify-between items-center mb-3 pointer-events-none">
                    <div class="flex items-center gap-3">
                        <span class="text-xl font-bold text-gray-400 w-8 text-center">${index + 1}</span>
                        ${photoHtml}
                        <span class="font-bold text-lg text-blue-400">${user.name}</span>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-gray-400">合計Pt</p>
                        <p class="text-xl font-bold ${user.totalPoints >= 0 ? 'text-green-400' : 'text-red-400'}">${(user.totalPoints).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-3 text-center text-sm border-t border-gray-700 pt-3 pointer-events-none">
                    <div><p class="text-xs text-gray-400">平均着順</p><p class="font-bold ${getClass('avgRank', user.avgRank)}">${user.avgRank.toFixed(2)}</p></div>
                    <div><p class="text-xs text-gray-400">トップ率</p><p class="font-bold ${getClass('topRate', user.topRate)}">${user.topRate.toFixed(1)}%</p></div>
                    <div><p class="text-xs text-gray-400">ラス率</p><p class="font-bold ${getClass('lastRate', user.lastRate)}">${user.lastRate.toFixed(1)}%</p></div>
                    <div><p class="text-xs text-gray-400">半荘数</p><p class="font-bold">${user.totalHanchans}</p></div>
                    <div><p class="text-xs text-gray-400">連対率</p><p class="font-bold ${getClass('rentaiRate', user.rentaiRate)}">${user.rentaiRate.toFixed(1)}%</p></div>
                    <div><p class="text-xs text-gray-400">トビ率</p><p class="font-bold ${getClass('bustedRate', user.bustedRate)}">${user.bustedRate.toFixed(1)}%</p></div>
                </div>
            </div>
            `;
        }).join('');
    }
}

// --- Trophy Tab ---
export function renderTrophyTab() {
    const container = document.getElementById('trophy-tab');
    if (!container) return;
    container.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
            <h2 class="cyber-header text-2xl font-bold text-blue-400">トロフィー</h2>
            <div class="flex items-center gap-4">
                <select id="trophy-year-filter" class="rounded-md p-1"></select>
                <select id="trophy-player-filter" class="rounded-md p-1"></select>
            </div>
        </div>
        <div id="trophy-list-container" class="space-y-8"></div>
    `;
}

export function updateTrophyPage() {
    const container = document.getElementById('trophy-list-container');
    const yearSelect = document.getElementById('trophy-year-filter');
    const playerSelect = document.getElementById('trophy-player-filter');
    if (!container || !yearSelect || !playerSelect) return;

    const currentYear = yearSelect.value;
    const currentPlayer = playerSelect.value;

    const yearOptions = getGameYears().map(year => `<option value="${year}" ${currentYear === year ? 'selected' : ''}>${year}年</option>`).join('');
    const playerOptions = state.users.map(u => `<option value="${u.id}" ${currentPlayer === u.id ? 'selected' : ''}>${u.name}</option>`).join('');
    yearSelect.innerHTML = `<option value="all" ${!currentYear || currentYear === 'all' ? 'selected' : ''}>全期間</option>${yearOptions}`;
    playerSelect.innerHTML = `<option value="all" ${!currentPlayer || currentPlayer === 'all' ? 'selected' : ''}>全選択</option>${playerOptions}`;

    const yearFilter = yearSelect.value;
    const playerFilter = playerSelect.value;

    const filteredGames = state.games.filter(game => {
        if (yearFilter === 'all') return true;
        const gameYear = (game.gameDate || '').substring(0, 4);
        return gameYear === yearFilter;
    });

    const statsForPeriod = calculateAllPlayerStats(filteredGames);
    checkAllTrophies(filteredGames, statsForPeriod);

    let html = '';
    Object.entries(TROPHY_DEFINITIONS).forEach(([rank, trophies]) => {
        html += `<div class="rank-category">
            <h3 class="cyber-header text-xl font-bold mb-4 border-b-2 pb-2" style="border-color: var(--rank-${rank}); color: var(--rank-${rank});">${rank.charAt(0).toUpperCase() + rank.slice(1)}</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                ${trophies.map(trophy => {
            let isAchieved = false;
            if (playerFilter === 'all') {
                isAchieved = Object.values(state.playerTrophies).some(p => p[trophy.id]);
            } else {
                isAchieved = state.playerTrophies[playerFilter]?.[trophy.id] || false;
            }
            const secretClass = trophy.secret ? 'secret' : '';
            const trophyName = (trophy.secret && !isAchieved) ? '？？？' : trophy.name;
            const trophyDesc = (trophy.secret && !isAchieved) ? '条件を満たすと開示されます' : trophy.desc;
            const trophyIcon = (trophy.secret && !isAchieved) ? 'fa-question-circle' : trophy.icon;

            return `
                    <div class="trophy-card p-4 flex items-center gap-4 rounded-lg rank-${rank} ${isAchieved ? 'achieved' : ''} ${secretClass}">
                        <i class="fas ${trophyIcon} fa-3x w-12 text-center trophy-icon"></i>
                        <div>
                            <h4 class="font-bold text-lg">${trophyName}</h4>
                            <p class="text-sm text-gray-400">${trophyDesc}</p>
                        </div>
                    </div>
                    `;
        }).join('')}
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

// --- History Tabs ---
export function renderHistoryTab() {
    const container = document.getElementById('history-tab');
    if (!container) return;
    container.innerHTML = `
        <h2 class="cyber-header text-2xl font-bold mb-4 border-b border-gray-700 pb-2 text-blue-400">対局履歴</h2>
        <div class="flex flex-col sm:flex-row gap-4 mb-4 p-4 bg-gray-900 rounded-lg">
            <div class="flex-1">
                <label for="history-year-filter" class="block text-sm font-medium text-gray-400">年</label>
                <select id="history-year-filter" class="mt-1 block w-full rounded-md"></select>
            </div>
            <div class="flex-1">
                <label for="history-month-filter" class="block text-sm font-medium text-gray-400">月</label>
                <select id="history-month-filter" class="mt-1 block w-full rounded-md"></select>
            </div>
            <div class="flex-1">
                <label for="history-player-filter" class="block text-sm font-medium text-gray-400">雀士</label>
                <select id="history-player-filter" class="mt-1 block w-full rounded-md"></select>
            </div>
        </div>
        <div id="history-list-container" class="space-y-4"></div>
    `;
}

export function updateHistoryTabFilters() {
    const yearSelect = document.getElementById('history-year-filter');
    const monthSelect = document.getElementById('history-month-filter');
    const playerSelect = document.getElementById('history-player-filter');
    if (!yearSelect || !monthSelect || !playerSelect) return;

    const currentYear = yearSelect.value;
    const currentMonth = monthSelect.value;
    const currentPlayer = playerSelect.value;

    const yearOptions = getGameYears().map(year => `<option value="${year}">${year}年</option>`).join('');
    yearSelect.innerHTML = `<option value="all">すべて</option>${yearOptions}`;
    if (Array.from(yearSelect.options).some(opt => opt.value === currentYear)) yearSelect.value = currentYear;

    if (monthSelect.options.length === 0) {
        const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1).map(m => `<option value="${m}">${m}月</option>`).join('');
        monthSelect.innerHTML = `<option value="all">すべて</option>${monthOptions}`;
    }
    if (Array.from(monthSelect.options).some(opt => opt.value === currentMonth)) monthSelect.value = currentMonth;

    const playerOptions = state.users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    playerSelect.innerHTML = `<option value="all">すべて</option>${playerOptions}`;
    if (Array.from(playerSelect.options).some(opt => opt.value === currentPlayer)) playerSelect.value = currentPlayer;
}

export function updateHistoryList() {
    const container = document.getElementById('history-list-container');
    if (!container) return;

    const yearFilter = document.getElementById('history-year-filter').value;
    const monthFilter = document.getElementById('history-month-filter').value;
    const playerFilter = document.getElementById('history-player-filter').value;

    let filteredGames = [...state.games];
    if (yearFilter !== 'all') {
        filteredGames = filteredGames.filter(game => (game.gameDate || '').substring(0, 4) === yearFilter);
    }
    if (monthFilter !== 'all') {
        filteredGames = filteredGames.filter(game => {
            if (!game.gameDate) return false;
            const parts = game.gameDate.split('/');
            return parts.length > 1 && parts[1] === monthFilter;
        });
    }
    if (playerFilter !== 'all') {
        filteredGames = filteredGames.filter(game => game.playerIds.includes(playerFilter));
    }

    if (filteredGames.length === 0) {
        container.innerHTML = `<p class="text-gray-500 text-center py-8">該当する対局履歴がありません。</p>`;
        return;
    }

    container.innerHTML = filteredGames.map(game => {
        const date = game.gameDate || new Date(game.createdAt.seconds * 1000).toLocaleString('ja-JP');
        const winnerEntry = Object.entries(game.totalPoints).sort((a, b) => b[1] - a[1])[0];
        const winnerId = winnerEntry[0];
        const winnerUser = state.users.find(u => u.id === winnerId);
        const photoHtml = getPlayerPhotoHtml(winnerId, 'w-8 h-8');

        return `
            <div class="bg-gray-900 p-4 rounded-lg border border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div class="cursor-pointer flex-grow" data-action="show-game-details" data-game-id="${game.id}">
                    <p class="font-bold text-lg pointer-events-none">${date}</p>
                    <p class="text-sm text-gray-400 pointer-events-none">${game.playerNames.join(', ')}</p>
                </div>
                <div class="flex justify-between w-full sm:w-auto items-center">
                    <div class="text-left sm:text-right mr-4 cursor-pointer flex items-center gap-2" data-action="show-game-details" data-game-id="${game.id}">
                        ${photoHtml}
                        <div class="pointer-events-none">
                            <p class="text-xs">WINNER</p>
                            <p class="font-bold text-green-400">${winnerUser ? winnerUser.name : 'N/A'} (+${winnerEntry[1].toFixed(1)})</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button data-action="edit-game" data-game-id="${game.id}" class="text-blue-400 hover:text-blue-300 text-lg p-2 self-center"><i class="fas fa-edit"></i></button>
                        <button data-action="delete-game" data-game-id="${game.id}" data-date="${date}" class="text-red-500 hover:text-red-400 text-lg p-2 self-center"><i class="fas fa-trash-alt"></i></button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

export function renderDetailedHistoryTabContainers() {
    const rawContainer = document.getElementById('history-raw-tab');
    const ptContainer = document.getElementById('history-pt-tab');
    const filterHtml = (prefix) => `
        <div class="flex flex-col sm:flex-row gap-4 mb-4 p-4 bg-gray-900 rounded-lg">
            <div class="flex-1">
                <label for="history-${prefix}-year-filter" class="block text-sm font-medium text-gray-400">年</label>
                <select id="history-${prefix}-year-filter" class="mt-1 block w-full rounded-md"></select>
            </div>
            <div class="flex-1">
                <label for="history-${prefix}-month-filter" class="block text-sm font-medium text-gray-400">月</label>
                <select id="history-${prefix}-month-filter" class="mt-1 block w-full rounded-md"></select>
            </div>
            <div class="flex-1">
                <label for="history-${prefix}-player-filter" class="block text-sm font-medium text-gray-400">雀士</label>
                <select id="history-${prefix}-player-filter" class="mt-1 block w-full rounded-md"></select>
            </div>
        </div>
    `;
    rawContainer.innerHTML = `<h2 class="cyber-header text-2xl font-bold mb-4 border-b border-gray-700 pb-2 text-blue-400">詳細履歴 (素点)</h2>${filterHtml('raw')}<div id="history-raw-list" class="overflow-x-auto"></div>`;
    ptContainer.innerHTML = `<h2 class="cyber-header text-2xl font-bold mb-4 border-b border-gray-700 pb-2 text-blue-400">詳細履歴 (PT)</h2>${filterHtml('pt')}<div id="history-pt-list" class="overflow-x-auto"></div>`;
}

export function renderDetailedHistoryTables() {
    const rawListContainer = document.getElementById('history-raw-list');
    const ptListContainer = document.getElementById('history-pt-list');
    if (!rawListContainer || !ptListContainer) return;

    const allHanchans = [];
    state.games.forEach(game => {
        game.scores.forEach((hanchan, index) => {
            allHanchans.push({
                date: game.gameDate || new Date(game.createdAt.seconds * 1000).toLocaleString('ja-JP'),
                gameId: game.id,
                hanchanNum: index + 1,
                playerIds: game.playerIds,
                rawScores: hanchan.rawScores,
                points: hanchan.points
            });
        });
    });

    const createTable = (dataType, container, yearFilter, monthFilter, playerFilter) => {
        let filteredHanchans = [...allHanchans];
        if (yearFilter !== 'all') {
            filteredHanchans = filteredHanchans.filter(h => (h.date || '').substring(0, 4) === yearFilter);
        }
        if (monthFilter !== 'all') {
            filteredHanchans = filteredHanchans.filter(h => {
                if (!h.date) return false;
                const parts = h.date.split('/');
                return parts.length > 1 && parts[1] === monthFilter;
            });
        }
        if (playerFilter !== 'all') {
            filteredHanchans = filteredHanchans.filter(h => h.playerIds.includes(playerFilter));
        }

        let tableHtml = `<table class="min-w-full divide-y divide-gray-700 font-m-gothic text-xs md:text-sm">
            <thead class="bg-gray-900 text-xs md:text-sm font-medium text-gray-400 uppercase tracking-wider">
                <tr>
                    <th class="px-2 py-3 text-left whitespace-nowrap">日時</th>
                    ${state.users.map(u => `<th class="px-2 py-3 text-right whitespace-nowrap">${u.name}</th>`).join('')}
                </tr>
            </thead>
            <tbody class="divide-y divide-gray-700">`;
        
        if (filteredHanchans.length === 0) {
            tableHtml += `<tr><td colspan="${state.users.length + 1}" class="text-center py-4 text-gray-500">NO DATA</td></tr>`;
        } else {
            let lastDate = null;
            filteredHanchans.forEach(hanchan => {
                const currentDate = hanchan.date.split('(')[0];
                let borderClass = '';
                if (lastDate && currentDate !== lastDate) {
                    borderClass = 'border-t-2 border-gray-500';
                }
                lastDate = currentDate;

                const scores = hanchan[dataType];
                const { rawRanks } = calculateHanchanRanksAndPoints(hanchan.rawScores);
                
                tableHtml += `<tr class="${borderClass}"><td class="px-2 py-2 whitespace-nowrap">${hanchan.date} (#${hanchan.hanchanNum})</td>`;
                state.users.forEach(user => {
                    if (scores[user.id] !== undefined) {
                        const rank = rawRanks[user.id];
                        let rankClass = '';
                        if (rank === 1) rankClass = 'text-rank-1';
                        if (rank === 4) rankClass = 'text-rank-4';
                        tableHtml += `<td class="px-2 py-2 text-right ${rankClass}">${dataType === 'points' ? scores[user.id].toFixed(1) : scores[user.id].toLocaleString()}</td>`;
                    } else {
                        tableHtml += `<td class="px-2 py-2 text-right text-gray-600">-</td>`;
                    }
                });
                tableHtml += `</tr>`;
            });
        }
        tableHtml += `</tbody></table>`;
        container.innerHTML = tableHtml;
    };
    
    const rawYear = document.getElementById('history-raw-year-filter').value;
    const rawMonth = document.getElementById('history-raw-month-filter').value;
    const rawPlayer = document.getElementById('history-raw-player-filter').value;
    createTable('rawScores', rawListContainer, rawYear, rawMonth, rawPlayer);

    const ptYear = document.getElementById('history-pt-year-filter').value;
    const ptMonth = document.getElementById('history-pt-month-filter').value;
    const ptPlayer = document.getElementById('history-pt-player-filter').value;
    createTable('points', ptListContainer, ptYear, ptMonth, ptPlayer);
}

// --- Personal Stats Tab ---
export function renderPersonalStatsTab() {
    const container = document.getElementById('personal-stats-tab');
    if (!container) return;
    const options = state.users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    container.innerHTML = `
        <div class="flex flex-col sm:flex-row flex-wrap justify-between items-center mb-4 gap-4">
            <h2 class="cyber-header text-2xl font-bold pb-2 text-blue-400">個人成績</h2>
            <div class="flex items-center gap-2">
                <label for="personal-stats-player-select" class="text-sm text-gray-400">雀士:</label>
                <select id="personal-stats-player-select" class="rounded-md p-1">
                    <option value="">選択してください</option>
                    ${options}
                </select>
            </div>
        </div>
        <div id="personal-stats-content" class="space-y-6">
            <p class="text-gray-500">雀士を選択して成績を表示します。</p>
        </div>
    `;
}

export function displayPlayerStats(playerId) {
    const container = document.getElementById('personal-stats-content');
    if (!playerId) {
        container.innerHTML = `<p class="text-gray-500">雀士を選択して成績を表示します。</p>`;
        return;
    }
    const player = state.users.find(u => u.id === playerId);
    if (!player) return;
    
    const playerStats = state.cachedStats[playerId];
    if (!playerStats) return;

    const rankedUsers = Object.values(state.cachedStats).filter(u => u.totalHanchans > 0);

    const getRank = (metricKey, lowerIsBetter) => {
        if (rankedUsers.length === 0) return { rank: '-', total: 0 };
        const sortedUsers = [...rankedUsers].sort((a, b) => {
            return lowerIsBetter ? a[metricKey] - b[metricKey] : b[metricKey] - a[metricKey];
        });
        const rank = sortedUsers.findIndex(u => u.id === playerId) + 1;
        return { rank: rank > 0 ? rank : '-', total: rankedUsers.length };
    };

    const totalPointsRank = getRank('totalPoints', false);
    const avgRankRank = getRank('avgRank', true);
    const topRateRank = getRank('topRate', false);
    const rentaiRateRank = getRank('rentaiRate', false);
    const lastRateRank = getRank('lastRate', true);
    const avgRawScoreRank = getRank('avgRawScore', false);

    const photoHtml = getPlayerPhotoHtml(playerId, 'w-20 h-20');
    
    const comparisonOptions = state.users
        .filter(u => u.id !== playerId)
        .map(u => `
            <div class="mr-4">
                <input type="checkbox" id="compare-${u.id}" value="${u.id}" class="comparison-checkbox">
                <label for="compare-${u.id}" class="ml-1">${u.name}</label>
            </div>
        `).join('');

    container.innerHTML = `
        <div class="flex items-center gap-4 mb-6">
            ${photoHtml}
            <h3 class="cyber-header text-3xl font-bold text-blue-400">${player.name}</h3>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 text-center mb-6">
            <div class="cyber-card p-3"><p class="text-sm text-gray-400">合計Pt</p><p class="text-2xl font-bold ${playerStats.totalPoints >= 0 ? 'text-green-400' : 'text-red-400'}">${playerStats.totalPoints.toFixed(1)}</p><p class="text-xs text-gray-500 mt-1">全体 ${totalPointsRank.total}人中 ${totalPointsRank.rank}位</p></div>
            <div class="cyber-card p-3"><p class="text-sm text-gray-400">平均着順</p><p class="text-2xl font-bold">${playerStats.avgRank.toFixed(2)}</p><p class="text-xs text-gray-500 mt-1">全体 ${avgRankRank.total}人中 ${avgRankRank.rank}位</p></div>
            <div class="cyber-card p-3"><p class="text-sm text-gray-400">トップ率</p><p class="text-2xl font-bold text-green-400">${playerStats.topRate.toFixed(1)}%</p><p class="text-xs text-gray-500 mt-1">全体 ${topRateRank.total}人中 ${topRateRank.rank}位</p></div>
            <div class="cyber-card p-3"><p class="text-sm text-gray-400">連対率</p><p class="text-2xl font-bold">${playerStats.rentaiRate.toFixed(1)}%</p><p class="text-xs text-gray-500 mt-1">全体 ${rentaiRateRank.total}人中 ${rentaiRateRank.rank}位</p></div>
            <div class="cyber-card p-3"><p class="text-sm text-gray-400">ラス率</p><p class="text-2xl font-bold text-red-400">${playerStats.lastRate.toFixed(1)}%</p><p class="text-xs text-gray-500 mt-1">全体 ${lastRateRank.total}人中 ${lastRateRank.rank}位</p></div>
            <div class="cyber-card p-3"><p class="text-sm text-gray-400">平均素点</p><p class="text-2xl font-bold">${playerStats.avgRawScore.toLocaleString()}</p><p class="text-xs text-gray-500 mt-1">全体 ${avgRawScoreRank.total}人中 ${avgRawScoreRank.rank}位</p></div>
        </div>
        <div class="cyber-card p-4 mb-6">
            <h4 class="font-bold mb-2">比較対象</h4>
            <div id="comparison-checkboxes" class="flex flex-wrap">${comparisonOptions}</div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="cyber-card p-4 sm:p-6">
                <h3 class="cyber-header text-xl font-bold mb-4 text-center">順位分布</h3>
                <div class="w-full h-64 mx-auto"><canvas id="rank-chart-personal"></canvas></div>
            </div>
            <div class="cyber-card p-4 sm:p-6">
                <h3 class="cyber-header text-xl font-bold mb-4 text-center">ポイント推移</h3>
                <div class="w-full h-64 mx-auto"><canvas id="point-history-chart-personal"></canvas></div>
            </div>
        </div>
        <div id="player-history-container" class="cyber-card p-4 sm:p-6"></div>
    `;
    
    renderStatsCharts(playerId);
    renderPlayerHistoryTable(playerId);
}

export function renderStatsCharts(mainPlayerId) {
    const checkedBoxes = document.querySelectorAll('#comparison-checkboxes input:checked');
    const comparisonIds = Array.from(checkedBoxes).map(cb => cb.value);
    const colors = ['#58a6ff', '#52c569', '#f5655f', '#f2cc8f', '#e0aaff', '#9bf6ff'];
    
    // Point History Chart
    const personalChartCanvas = document.getElementById('point-history-chart-personal');
    if (personalChartCanvas) {
        const playerIdsForChart = [mainPlayerId, ...comparisonIds];
        const relevantGames = state.games.filter(g => g.playerIds.some(pId => playerIdsForChart.includes(pId)));
        const dateStrings = relevantGames.map(g => g.gameDate.split('(')[0]);
        const today = new Date();
        const todayString = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
        dateStrings.push(todayString);
        const fullTimeline = [...new Set(dateStrings)].sort((a, b) => new Date(a) - new Date(b));

        const pointHistoryDatasets = playerIdsForChart.map((id, index) => {
            const playerData = getPlayerPointHistory(id, fullTimeline);
            return {
                label: state.cachedStats[id].name,
                data: playerData,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '33',
                fill: true, tension: 0.1
            };
        });

        if (state.charts.personalPointHistoryChart) state.charts.personalPointHistoryChart.destroy();
        state.charts.personalPointHistoryChart = new Chart(personalChartCanvas.getContext('2d'), {
            type: 'line',
            data: { labels: fullTimeline, datasets: pointHistoryDatasets },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#c9d1d9' }}}, scales: { x: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } }, y: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } } } }
        });
    }

    // Rank Distribution Chart
    const rankChartCanvas = document.getElementById('rank-chart-personal');
    if(rankChartCanvas) {
        const rankDatasets = [mainPlayerId, ...comparisonIds].map((id, index) => ({
            label: state.cachedStats[id].name,
            data: state.cachedStats[id].ranks,
            backgroundColor: colors[index % colors.length],
        }));

        if (state.charts.personalRankChart) state.charts.personalRankChart.destroy();
        state.charts.personalRankChart = new Chart(rankChartCanvas.getContext('2d'), {
            type: 'bar',
            data: { labels: ['1位', '2位', '3位', '4位'], datasets: rankDatasets },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: '#c9d1d9' }}}, scales: { x: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } }, y: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } } } }
        });
    }
}

export function renderPlayerHistoryTable(playerId) {
    const container = document.getElementById('player-history-container');
    if (!container) return;
    
    const playerHanchans = [];
    state.games.forEach(game => {
        if (game.playerIds.includes(playerId)) {
            game.scores.forEach((hanchan) => {
                const { rawRanks } = calculateHanchanRanksAndPoints(hanchan.rawScores);
                playerHanchans.push({
                    date: game.gameDate || new Date(game.createdAt.seconds * 1000).toLocaleString('ja-JP'),
                    rawScore: hanchan.rawScores[playerId],
                    point: hanchan.points[playerId],
                    rank: rawRanks[playerId]
                });
            });
        }
    });

    if (playerHanchans.length === 0) {
        container.innerHTML = `<h3 class="cyber-header text-xl font-bold mb-4 text-center">対局履歴</h3><p class="text-gray-500 text-center">まだ対局記録がありません。</p>`;
        return;
    }

    let tableHtml = `<h3 class="cyber-header text-xl font-bold mb-4 text-center">対局履歴</h3>
        <div class="overflow-x-auto max-h-96">
            <table class="min-w-full divide-y divide-gray-700 text-sm">
                <thead class="bg-gray-900 sticky top-0"><tr>
                    <th class="px-4 py-2 text-left">日時</th>
                    <th class="px-4 py-2 text-right">着順</th>
                    <th class="px-4 py-2 text-right">素点</th>
                    <th class="px-4 py-2 text-right">ポイント</th>
                </tr></thead>
                <tbody class="divide-y divide-gray-700">`;
    
    playerHanchans.reverse().forEach(h => {
        tableHtml += `<tr>
            <td class="px-4 py-2 whitespace-nowrap">${h.date}</td>
            <td class="px-4 py-2 text-right">${h.rank}</td>
            <td class="px-4 py-2 text-right">${h.rawScore.toLocaleString()}</td>
            <td class="px-4 py-2 text-right ${h.point >= 0 ? 'text-green-400' : 'text-red-400'}">${h.point.toFixed(1)}</td>
        </tr>`;
    });

    tableHtml += `</tbody></table></div>`;
    container.innerHTML = tableHtml;
}

// --- Data Analysis Tab ---
export function renderDataAnalysisTab() {
    const container = document.getElementById('data-analysis-tab');
    container.innerHTML = `
        <div class="space-y-6">
            <h2 class="cyber-header text-2xl font-bold text-blue-400 border-b border-gray-700 pb-2">データ分析ダッシュボード</h2>
            <div id="stat-cards-container" class="grid grid-cols-2 md:grid-cols-3 gap-4 text-center"></div>
            <div id="top-3-container" class="cyber-card p-4 sm:p-6"></div>
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div class="cyber-card p-4 sm:p-6 min-h-[300px] md:min-h-[400px]">
                    <h3 class="cyber-header text-xl font-bold mb-4 text-center">雀士スタイル分析</h3>
                    <div class="relative h-72 md:h-96"><canvas id="player-radar-chart"></canvas></div>
                </div>
                <div class="cyber-card p-4 sm:p-6 min-h-[300px] md:min-h-[400px]">
                    <h3 class="cyber-header text-xl font-bold mb-4 text-center">ポイント推移</h3>
                    <div class="relative h-72 md:h-96"><canvas id="point-history-chart"></canvas></div>
                </div>
                <div class="cyber-card p-4 sm:p-6 lg:col-span-2">
                     <div class="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
                         <h3 class="cyber-header text-xl font-bold text-center">雀士スタッツ比較</h3>
                         <select id="bar-chart-metric-select" class="p-2 rounded-md text-sm"></select>
                     </div>
                    <div class="relative h-80"><canvas id="player-bar-chart"></canvas></div>
                </div>
            </div>
        </div>
    `;
}

export function updateDataAnalysisCharts() {
    if (state.users.length === 0 || state.games.length === 0) return;
    
    const rankedUsers = Object.values(state.cachedStats).filter(u => u.totalHanchans > 0);
    if (rankedUsers.length === 0) return;

    const colors = ['#58a6ff', '#52c569', '#f5655f', '#E2FF08', '#e0aaff', '#9bf6ff', '#ffb700', '#00ffc8'];
    const allPlayers = [...rankedUsers].sort((a,b) => b.totalPoints - a.totalPoints);

    // Stat Cards
    const statCardsContainer = document.getElementById('stat-cards-container');
    const totalHanchans = rankedUsers.reduce((sum, u) => sum + u.totalHanchans, 0);
    const gameDays = new Set(state.games.map(g => g.gameDate.split('(')[0])).size;
    const leader = allPlayers[0];
    let highestHanchan = { score: -Infinity, name: '', id: '' };
    state.games.forEach(g => g.scores.forEach(s => Object.entries(s.rawScores).forEach(([pId, score]) => {
        if (score > highestHanchan.score) {
            highestHanchan = { score, name: state.users.find(u=>u.id===pId)?.name, id: pId };
        }
    })));
    statCardsContainer.innerHTML = `
        <div class="cyber-card p-3"><p class="text-sm text-gray-400">総半荘数</p><p class="text-2xl font-bold">${totalHanchans}</p></div>
        <div class="cyber-card p-3"><p class="text-sm text-gray-400">開催日数</p><p class="text-2xl font-bold">${gameDays}</p></div>
        <div class="cyber-card p-3"><p class="text-sm text-gray-400">現時点トップ</p><p class="text-xl font-bold">${leader.name}</p></div>
        <div class="cyber-card p-3"><p class="text-sm text-gray-400">1半荘最高素点</p><p class="text-xl font-bold">${highestHanchan.name}</p><p class="text-xs">${highestHanchan.score.toLocaleString()}点</p></div>
    `;

    // Top 3 Players
    const top3Container = document.getElementById('top-3-container');
    if (top3Container) {
        top3Container.innerHTML = `<h3 class="cyber-header text-xl font-bold mb-4 text-center text-yellow-300">現時点トップ３</h3>
            <div class="flex justify-around items-end gap-4">
                ${allPlayers.slice(0, 3).map((p, i) => {
                    const rankClass = i === 0 ? 'text-rank-gold' : (i === 1 ? 'text-rank-silver' : 'text-rank-bronze');
                    const sizeClass = i === 0 ? 'w-24 h-24' : (i === 1 ? 'w-20 h-20' : 'w-16 h-16');
                    return `<div class="text-center flex flex-col items-center">
                        <span class="font-bold text-2xl ${rankClass}">${i+1}</span>
                        ${getPlayerPhotoHtml(p.id, sizeClass)}
                        <span class="font-bold mt-2 text-blue-400">${p.name}</span>
                        <span class="text-sm ${p.totalPoints >= 0 ? 'text-green-400' : 'text-red-400'}">${p.totalPoints.toFixed(1)} pt</span>
                    </div>`
                }).join('')}
            </div>`;
    }

    // Radar Chart
    const radarLabels = ['平均素点', 'トップ率', '連対率', 'ラス回避率', '平均順位'];
    const radarStatKeys = ['avgRawScore', 'topRate', 'rentaiRate', 'lastRate', 'avgRank'];
    
    const fixedAxes = {
        avgRawScore: { min: 0, max: 35000 },
        topRate: { min: 0, max: 50 },
        rentaiRate: { min: 0, max: 100 },
        lastRate: { min: 0, max: 100 },
        avgRank: { min: 1, max: 4 }
    };

    const normalize = (value, key) => {
        const { min, max } = fixedAxes[key];
        if (max === min) return 50;
        const clampedValue = Math.max(min, Math.min(max, value));
        if (key === 'lastRate' || key === 'avgRank') {
            return 100 * ((max - clampedValue) / (max - min));
        }
        return 100 * ((clampedValue - min) / (max - min));
    };

    const radarData = {
        labels: radarLabels,
        datasets: allPlayers.map((player, index) => {
            const stats = state.cachedStats[player.id];
            const originalData = radarStatKeys.map(key => stats[key]);
            return {
                label: player.name,
                data: radarStatKeys.map(key => normalize(stats[key], key)),
                originalData: originalData,
                borderColor: colors[index % colors.length],
                backgroundColor: colors[index % colors.length] + '33',
            };
        })
    };
    if (state.charts.playerRadarChart) state.charts.playerRadarChart.destroy();
    state.charts.playerRadarChart = new Chart(document.getElementById('player-radar-chart'), {
        type: 'radar',
        data: radarData,
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#c9d1d9' }},
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label || '';
                            if (!label) return '';
                            const statKey = radarStatKeys[context.dataIndex];
                            const originalValue = context.dataset.originalData[context.dataIndex];
                            
                            let formattedValue = originalValue;
                            if (statKey === 'avgRank') {
                                formattedValue = originalValue.toFixed(2);
                            } else if (statKey.includes('Rate')) {
                                formattedValue = originalValue.toFixed(2) + '%';
                            } else {
                                formattedValue = originalValue.toLocaleString();
                            }
                            return `${label}: ${formattedValue}`;
                        }
                    }
                }
            },
            scales: { r: { angleLines: { color: '#30363d' }, grid: { color: '#30363d' }, pointLabels: { color: '#c9d1d9', font: { size: 14 }}, suggestedMin: 0, suggestedMax: 100, ticks: { display: false }}}
        }
    });

    // Point History Chart
    const dateStrings = state.games.map(g => g.gameDate.split('(')[0]);
    const fullTimeline = [...new Set(dateStrings)].sort((a, b) => new Date(a) - new Date(b));
    const pointHistoryDatasets = allPlayers.map((player, index) => ({
        label: player.name,
        data: getPlayerPointHistory(player.id, fullTimeline),
        borderColor: colors[index % colors.length],
        fill: false,
    }));
    if (state.charts.pointHistoryChart) state.charts.pointHistoryChart.destroy();
    state.charts.pointHistoryChart = new Chart(document.getElementById('point-history-chart'), { type: 'line', data: { labels: fullTimeline, datasets: pointHistoryDatasets }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#c9d1d9' }}}, scales: { x: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } }, y: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } } } } });

    // Bar Chart
    const barChartMetricSelect = document.getElementById('bar-chart-metric-select');
    const metrics = { 'totalPoints': '合計Pt', 'avgRawScore': '平均素点', 'topRate': 'トップ率', 'lastRate': 'ラス率' };
    if (barChartMetricSelect.options.length === 0) {
        Object.entries(metrics).forEach(([key, value]) => barChartMetricSelect.add(new Option(value, key)));
    }
    const selectedMetric = barChartMetricSelect.value || 'totalPoints';
    const lowerIsBetter = ['lastRate', 'avgRank'].includes(selectedMetric);
    const sortedBarUsers = [...rankedUsers].sort((a, b) => lowerIsBetter ? a[selectedMetric] - b[selectedMetric] : b[selectedMetric] - a[selectedMetric]);
    if (state.charts.playerBarChart) state.charts.playerBarChart.destroy();
    state.charts.playerBarChart = new Chart(document.getElementById('player-bar-chart'), {
        type: 'bar',
        data: {
            labels: sortedBarUsers.map(u => u.name),
            datasets: [{
                label: metrics[selectedMetric],
                data: sortedBarUsers.map(u => u[selectedMetric]),
                backgroundColor: sortedBarUsers.map((u, i) => colors[i % colors.length] + 'AA'),
            }]
        },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } }, y: { ticks: { color: '#c9d1d9' }, grid: { color: '#30363d' } } } }
    });
}

// --- Head to Head Tab ---
export function renderHeadToHeadTab() {
    const container = document.getElementById('head-to-head-tab');
    container.innerHTML = `
        <h2 class="cyber-header text-2xl font-bold text-blue-400 border-b border-gray-700 pb-2 mb-4">直接対決</h2>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <select id="h2h-player1" class="p-2 rounded-md"></select>
            <span class="font-bold text-xl">VS</span>
            <select id="h2h-player2" class="p-2 rounded-md"></select>
        </div>
        <div id="h2h-results" class="text-center">
            <p class="text-gray-500">比較したい雀士を2名選択してください。</p>
        </div>
    `;
}

export function updateHeadToHeadDropdowns() {
    const p1Select = document.getElementById('h2h-player1');
    const p2Select = document.getElementById('h2h-player2');
    if (!p1Select || !p2Select) return;

    const currentP1 = p1Select.value;
    const currentP2 = p2Select.value;

    const options = state.users.map(u => `<option value="${u.id}">${u.name}</option>`).join('');
    p1Select.innerHTML = options;
    p2Select.innerHTML = options;

    if (state.users.some(u => u.id === currentP1)) {
        p1Select.value = currentP1;
    } else if (state.users.length > 0) {
        p1Select.value = state.users[0].id;
    }

    if (state.users.some(u => u.id === currentP2) && currentP2 !== p1Select.value) {
        p2Select.value = currentP2;
    } else if (state.users.length > 1) {
        const defaultP2 = state.users.find(u => u.id !== p1Select.value);
        if (defaultP2) p2Select.value = defaultP2.id;
    }
}

export function displayHeadToHeadStats() {
    const p1Id = document.getElementById('h2h-player1')?.value;
    const p2Id = document.getElementById('h2h-player2')?.value;
    const resultsContainer = document.getElementById('h2h-results');

    if (!p1Id || !p2Id) {
        resultsContainer.innerHTML = `<p class="text-gray-500">比較したい雀士を2名選択してください。</p>`;
        return;
    }
    if (p1Id === p2Id) {
        resultsContainer.innerHTML = `<p class="text-yellow-400">同じ雀士は選択できません。</p>`;
        return;
    }

    const p1 = state.users.find(u => u.id === p1Id);
    const p2 = state.users.find(u => u.id === p2Id);

    let p1Wins = 0, p2Wins = 0, draws = 0, totalHanchans = 0;

    state.games.forEach(game => {
        if (game.playerIds.includes(p1Id) && game.playerIds.includes(p2Id)) {
            game.scores.forEach(hanchan => {
                totalHanchans++;
                const p1Score = hanchan.rawScores[p1Id];
                const p2Score = hanchan.rawScores[p2Id];
                if (p1Score > p2Score) p1Wins++;
                else if (p2Score > p1Score) p2Wins++;
                else draws++;
            });
        }
    });

    if (totalHanchans === 0) {
        resultsContainer.innerHTML = `<p class="text-gray-500">この2人の直接対決の記録はありません。</p>`;
        return;
    }
    
    const p1WinRate = ((p1Wins / totalHanchans) * 100).toFixed(1);
    const p2WinRate = ((p2Wins / totalHanchans) * 100).toFixed(1);

    resultsContainer.innerHTML = `
        <div class="text-2xl mb-4">総対戦半荘数: <span class="font-bold text-yellow-400">${totalHanchans}</span>回</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div class="cyber-card p-4 text-center">
                ${getPlayerPhotoHtml(p1.id, 'w-20 h-20 mx-auto mb-2')}
                <h3 class="text-2xl font-bold text-blue-400">${p1.name}</h3>
                <p class="text-4xl font-bold text-green-400 my-2">${p1Wins}<span class="text-xl">勝</span></p>
                <p class="text-gray-400">勝率: ${p1WinRate}%</p>
            </div>
            <div class="cyber-card p-4 text-center">
                ${getPlayerPhotoHtml(p2.id, 'w-20 h-20 mx-auto mb-2')}
                <h3 class="text-2xl font-bold text-blue-400">${p2.name}</h3>
                <p class="text-4xl font-bold text-green-400 my-2">${p2Wins}<span class="text-xl">勝</span></p>
                <p class="text-gray-400">勝率: ${p2WinRate}%</p>
            </div>
        </div>
        ${draws > 0 ? `<p class="mt-4 text-gray-500">引き分け: ${draws}回</p>` : ''}
    `;
}

// --- User Management Tab ---
export function renderUserManagementTab() {
    const container = document.getElementById('users-tab');
    container.innerHTML = `
        <h2 class="cyber-header text-2xl font-bold mb-4 border-b border-gray-700 pb-2 text-blue-400">雀士管理</h2>
        <div class="flex flex-col sm:flex-row gap-4 mb-4">
            <input type="text" id="new-user-name" class="flex-grow rounded-md shadow-sm sm:text-sm" placeholder="新しい雀士名">
            <button data-action="add-user" class="cyber-btn px-6 py-2 rounded-lg whitespace-nowrap"><i class="fas fa-user-plus mr-2"></i>追加</button>
        </div>
        <div id="user-list-management" class="space-y-2"></div>
    `;
}

export function renderUserManagementList() {
    const container = document.getElementById('user-list-management');
    if (!container) return;
    container.innerHTML = state.users.length === 0
        ? `<p class="text-gray-500">登録されている雀士がいません。</p>`
        : state.users.map(user => {
            const photoHtml = getPlayerPhotoHtml(user.id, 'w-12 h-12');
            return `
            <div class="flex items-center gap-4 bg-gray-900 p-2 rounded-lg">
                <div class="relative flex-shrink-0">
                    <label for="photo-upload-${user.id}" class="cursor-pointer">
                        ${photoHtml}
                    </label>
                    <input type="file" id="photo-upload-${user.id}" class="hidden" accept="image/*">
                </div>
                <div class="flex-grow">
                    <input type="text" id="user-name-input-${user.id}" value="${user.name}" data-original-name="${user.name}" class="w-full bg-transparent rounded-md p-1 -m-1 focus:bg-gray-800 focus:ring-1 focus:ring-blue-500 outline-none" readonly>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                    <button data-action="edit-user" data-user-id="${user.id}" id="edit-user-btn-${user.id}" class="cyber-btn text-sm px-3 py-1 rounded-md"><i class="fas fa-edit"></i></button>
                    <button data-action="delete-user" data-user-id="${user.id}" class="cyber-btn-red text-sm px-3 py-1 rounded-md"><i class="fas fa-trash-alt"></i></button>
                </div>
            </div>
        `}).join('');
}

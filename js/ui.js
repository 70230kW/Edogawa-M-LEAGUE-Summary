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
        } else if (!selectedPlayerId) {
            displayPlayerStats(null); // 選択がない場合は初期状態を表示
        }
    }
    if (activeTab === 'data-analysis') updateDataAnalysisCharts();
    if (activeTab === 'head-to-head') {
        updateHeadToHeadDropdowns();
        displayHeadToHeadStats();
    }

    // ゲームタブは常に状態をチェックして更新
    if (document.getElementById('game-tab')) {
        if (document.getElementById('step1-player-selection').style.display !== 'none') {
            renderPlayerSelection();
        }
        if (!document.getElementById('step3-score-input')?.classList.contains('hidden')) {
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

        const { points, rawRanks, pointRanks } = calculateHanchanRanksAndPoints(scores);

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
                const pointRank = pointRanks[p.id];
                const pointClass = pointRank === 1 ? 'text-rank-1' : (pointRank === 4 ? 'text-rank-4' : '');
                const pointValue = points[p.id];

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
        if(leaderboardBody) leaderboardBody.innerHTML = `<tr><td colspan="12" class="text-center py-4 text-gray-500">NO DATA</td></tr>`;
        if(cardsContainer) cardsContainer.innerHTML = `<p class="text-center py-4 text-gray-500">NO DATA</p>`;
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
                    <td class="px-2 md:px-4 py-4 whitespace-nowrap text-right ">${user.ranks[1] > 0 ? ((user.ranks[1]/user.totalHanchans)*100).toFixed(2) : '0.00'}%</td>
                    <td class="px-2 md:px-4 py-4 whitespace-nowrap text-right ">${user.ranks[2] > 0 ? ((user.ranks[2]/user.totalHanchans)*100).toFixed(2) : '0.00'}%</td>
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
    // ... (This function's logic remains the same, just creates the initial HTML structure)
}
export function updateTrophyPage() {
    // ... (This function's logic remains the same, but uses `state.playerTrophies`)
}

// --- History Tabs ---
export function renderHistoryTab() {
    // ... (Creates initial HTML structure)
}
export function updateHistoryTabFilters() {
    // ... (Updates filter dropdowns based on `state.games` and `state.users`)
}
export function updateHistoryList() {
    // ... (Filters and renders the history list based on selected filters)
}
export function renderDetailedHistoryTabContainers() {
    // ... (Creates initial HTML structure for detailed history tabs)
}
export function renderDetailedHistoryTables() {
    // ... (Renders the detailed raw score and point tables)
}

// --- Personal Stats Tab ---
export function renderPersonalStatsTab() {
    // ... (Renders the tab structure, including the player dropdown)
}
export function displayPlayerStats(playerId) {
    // ... (Renders the detailed stats for a selected player)
}
export function renderStatsCharts(mainPlayerId) {
    // ... (Renders the personal stats charts)
}
export function renderPlayerHistoryTable(playerId) {
    // ... (Renders the table of a player's past games)
}

// --- Data Analysis Tab ---
export function renderDataAnalysisTab() {
    // ... (Creates the initial HTML structure for the data analysis dashboard)
}
export function updateDataAnalysisCharts() {
    // ... (Renders all charts on the data analysis tab)
}

// --- Head to Head Tab ---
export function renderHeadToHeadTab() {
    // ... (Creates the initial HTML structure for the head-to-head tab)
}
export function updateHeadToHeadDropdowns() {
    // ... (Updates the player selection dropdowns)
}
export function displayHeadToHeadStats() {
    // ... (Calculates and displays the H2H stats)
}

// --- User Management Tab ---
export function renderUserManagementTab() {
    // ... (Creates the initial HTML structure for the user management tab)
}
export function renderUserManagementList() {
    // ... (Renders the list of users with edit/delete buttons)
}

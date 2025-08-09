import * as state from './state.js';
import * as charts from './charts.js';
import * as utils from './utils.js';
import { TROPHY_DEFINITIONS, YAKUMAN_LIST, PENALTY_REASONS, YAKUMAN_INCOMPATIBILITY } from './constants.js';

//#################################################################
// #region Main Update & Render Flow
//#################################################################

/**
 * アプリケーションのすべてのビューを最新の状態に更新します。
 */
export function updateAllViews() {
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab || 'game';

    updateLeaderboard();
    updateTrophyPage();
    updateHistoryTabFilters();
    updateHistoryList();
    renderDetailedHistoryTables();
    renderUserManagementList();
    
    if (activeTab === 'data-analysis') {
        charts.updateDataAnalysisCharts();
    } else if (activeTab === 'personal-stats') {
        const playerId = document.getElementById('personal-stats-player-select')?.value;
        if (playerId) {
            displayPlayerStats(playerId);
        } else {
            renderPersonalStatsTab();
        }
    } else if (activeTab === 'game') {
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
// #endregion

//#################################################################
// #region Reusable Components
//#################################################################

/**
 * プレイヤーの写真を表示するHTML文字列を生成します。
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
// #endregion

//#################################################################
// #region Initial Tab Rendering
//#################################################################

export function renderGameTab() {
    const container = document.getElementById('game-tab');
    container.innerHTML = `
        <div id="step1-player-selection" class="cyber-card p-4 sm:p-6">
            <h2 class="cyber-header text-xl font-bold mb-4 border-b border-gray-700 pb-2 text-blue-400">STEP 1: 雀士選択</h2>
            <div id="player-list-for-selection" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4"></div>
            <div class="flex justify-end">
                <button id="to-step2-btn" onclick="moveToStep2()" class="cyber-btn px-6 py-2 rounded-lg" disabled>進む <i class="fas fa-arrow-right ml-2"></i></button>
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
                    <button onclick="setMLeagueRules()" class="cyber-btn cyber-btn-green px-4 py-2 rounded-lg"><i class="fas fa-star mr-2"></i>Mリーグルール</button>
                    <div class="text-right"><p class="text-sm text-gray-400">オカ: <span id="oka-display" class="font-bold text-white">20.0</span></p></div>
                </div>
            </div>
            <div class="flex justify-between mt-6">
                <button onclick="backToStep1()" class="cyber-btn px-6 py-2 rounded-lg"><i class="fas fa-arrow-left mr-2"></i>戻る</button>
                <button onclick="moveToStep3()" class="cyber-btn px-6 py-2 rounded-lg">進む <i class="fas fa-arrow-right ml-2"></i></button>
            </div>
        </div>
        <div id="step3-score-input" class="cyber-card p-4 sm:p-6 hidden">
             <h2 class="cyber-header text-xl font-bold mb-4 border-b border-gray-700 pb-2 text-blue-400">STEP 3: 素点入力</h2>
             <div class="mb-4">
                 <label for="game-date" class="block text-sm font-medium text-gray-400 mb-1">対局日</label>
                 <div class="flex gap-2">
                     <input type="text" id="game-date" class="flex-grow rounded-md shadow-sm sm:text-sm" placeholder="yyyy/m/d(aaa)">
                     <button onclick="setTodayDate()" class="cyber-btn px-4 py-2 rounded-lg">今日</button>
                 </div>
             </div>
             <div id="score-display-area" class="space-y-4"></div>
             <div class="flex flex-col sm:flex-row justify-between items-center mt-4 flex-wrap gap-4">
                 <div class="flex gap-2 w-full sm:w-auto">
                     <button onclick="addHanchan()" class="cyber-btn px-4 py-2 rounded-lg w-full"><i class="fas fa-plus mr-2"></i>半荘追加</button>
                     <button onclick="savePartialData()" class="cyber-btn cyber-btn-green px-4 py-2 rounded-lg w-full"><i class="fas fa-floppy-disk mr-2"></i>途中保存</button>
                 </div>
                 <button onclick="showCurrentPtStatus()" class="cyber-btn px-4 py-2 rounded-lg order-first sm:order-none w-full sm:w-auto"><i class="fas fa-calculator mr-2"></i>現在のPT状況</button>
                 <div class="flex gap-2 w-full sm:w-auto">
                     <button onclick="backToStep2()" class="cyber-btn px-6 py-2 rounded-lg w-full"><i class="fas fa-arrow-left mr-2"></i>戻る</button>
                     <button id="save-game-btn" onclick="calculateAndSave()" class="cyber-btn cyber-btn-yellow px-6 py-2 rounded-lg w-full"><i class="fas fa-save mr-2"></i>Pt変換して保存</button>
                 </div>
             </div>
        </div>
    `;
    renderPlayerSelection();
    setupRuleEventListeners();
}

export function renderLeaderboardTab() {
    const container = document.getElementById('leaderboard-tab');
    if (!container) return;
    const yearOptions = utils.getGameYears(state.getGames()).map(year => `<option value="${year}">${year}年</option>`).join('');

    container.innerHTML = `
        <div class="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <h2 class="cyber-header text-2xl font-bold text-blue-400">順位表</h2>
            <div class="flex items-center gap-2">
                <label for="leaderboard-period-select" class="text-sm whitespace-nowrap">期間:</label>
                <select id="leaderboard-period-select" onchange="updateLeaderboard()" class="rounded-md p-1">
                    <option value="all">全期間</option>
                    ${yearOptions}
                </select>
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

// ... (他の `render...Tab` 関数も同様に移植) ...
// #endregion

//#################################################################
// #region Dynamic Rendering & Updates
//#################################################################

export function updateLeaderboard() {
    // ... (元の `updateLeaderboard` 関数のロジックをここに移植)
}

export function renderPlayerSelection() {
    // ... (元の `renderPlayerSelection` 関数のロジックをここに移植)
}

// ... (他の動的更新関数 (`renderScoreDisplay`, `updateHistoryList` など) も同様に移植) ...
// #endregion


//#################################################################
// #region Modal Logic
//#################################################################

export function showModal(content) {
    const modalContent = document.getElementById('modal-content');
    const modal = document.getElementById('modal');
    modalContent.innerHTML = content;
    modal.classList.remove('hidden');
}

export function closeModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('hidden');
    modal.querySelector('#modal-content').innerHTML = '';
}

export function showModalMessage(message) {
    showModal(`
        <p class="text-lg text-center">${message}</p>
        <div class="flex justify-end mt-6">
            <button onclick="closeModal()" class="cyber-btn px-6 py-2">閉じる</button>
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

export function openScoreInputModal(index) {
    const hanchan = state.getHanchanScores()[index];
    const scores = hanchan.rawScores;
    const selectedPlayers = state.getSelectedPlayers();

    const modalHtml = `
        <h3 class="cyber-header text-xl font-bold text-yellow-300 mb-4">半荘 #${index + 1} スコア入力</h3>
        <div class="grid md:grid-cols-2 gap-4">
            <div class="space-y-3">
                ${selectedPlayers.map(p => `
                    <div>
                        <label class="flex items-center gap-2 mb-1">
                            ${getPlayerPhotoHtml(p.id, 'w-8 h-8')}
                            <span class="text-sm font-medium text-gray-400">${p.name}</span>
                        </label>
                        <input type="text" id="modal-score-${p.id}" class="modal-score-input block w-full shadow-sm sm:text-lg p-2 text-right border-2 border-transparent bg-zinc-800" value="${scores[p.id] !== null ? scores[p.id] : ''}" onfocus="setActiveInput('modal-score-${p.id}')" readonly>
                    </div>
                `).join('')}
                <div>
                    <label class="block text-sm font-medium text-gray-400 mt-2">合計</label>
                    <div id="modal-total-score" class="mt-1 block w-full bg-zinc-900 p-2 text-right sm:text-lg font-bold">0</div>
                </div>
                <div class="flex gap-2 pt-4">
                    <button onclick="openYakumanEventModal(${index})" class="cyber-btn text-sm px-3 py-2 rounded-md w-full"><i class="fas fa-dragon mr-2"></i>役満を追加</button>
                    <button onclick="openPenaltyModal(${index})" class="cyber-btn-red text-sm px-3 py-2 rounded-md w-full"><i class="fas fa-exclamation-triangle mr-2"></i>ペナルティを追加</button>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
                ${[7, 8, 9, 4, 5, 6, 1, 2, 3, 0, '00', '000'].map(key => `
                    <button onclick="keypadInput('${key}')" class="cyber-btn aspect-square text-xl md:text-2xl font-bold">${key}</button>
                `).join('')}
                <button onclick="keypadInput('マイナス')" class="cyber-btn aspect-square text-xl md:text-2xl font-bold">-</button>
                <button onclick="keypadInput('C')" class="cyber-btn-red aspect-square text-xl md:text-2xl font-bold">C</button>
                <button onclick="keypadInput('auto')" class="cyber-btn-green aspect-square text-lg md:text-xl font-bold">AUTO</button>
            </div>
        </div>
        <div class="flex justify-end gap-4 mt-6">
            <button onclick="closeModal()" class="cyber-btn px-4 py-2">キャンセル</button>
            <button onclick="saveScoresFromModal(${index})" class="cyber-btn-yellow px-4 py-2">保存</button>
        </div>
    `;
    showModal(modalHtml);
    
    setActiveInput(`modal-score-${selectedPlayers[0].id}`);
    updateModalTotal();
}

export function setActiveInput(inputId) {
    document.querySelectorAll('.modal-score-input').forEach(el => el.classList.remove('ring-2', 'ring-yellow-400'));
    const activeEl = document.getElementById(inputId);
    if (activeEl) {
        activeEl.classList.add('ring-2', 'ring-yellow-400');
        state.setActiveInputId(inputId);
    }
}

export function keypadInput(key) {
    const input = document.getElementById(state.getActiveInputId());
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
    updateModalTotal();
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
        updateModalTotal();
    }
}

function updateModalTotal() {
    let total = 0;
    let filledCount = 0;
    document.querySelectorAll('.modal-score-input').forEach(input => {
        if (input.value.trim() !== '' && input.value.trim() !== '-') {
            total += Number(input.value);
            filledCount++;
        }
    });
    const totalDiv = document.getElementById('modal-total-score');
    const basePoint = Number(document.getElementById('base-point').value);
    totalDiv.textContent = total.toLocaleString();
    totalDiv.classList.remove('text-red-500', 'text-green-400');
    if (filledCount === 4) {
        if(total === basePoint * 4) {
            totalDiv.classList.add('text-green-400');
        } else {
            totalDiv.classList.add('text-red-500');
        }
    }
}

export function openYakumanEventModal(hanchanIndex) {
    const playerOptions = state.getSelectedPlayers().map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    const yakumanCheckboxes = YAKUMAN_LIST.map(y => `
        <label class="flex items-center space-x-2">
            <input type="checkbox" name="yakuman-checkbox" value="${y}" class="form-checkbox h-5 w-5 text-blue-600 bg-gray-800 border-gray-600 rounded" onchange="updateYakumanCheckboxes()">
            <span>${y}</span>
        </label>
    `).join('');

    let modalContent = `
        <h3 class="cyber-header text-xl font-bold text-yellow-300 mb-4">役満記録</h3>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-400">雀士</label>
                <select id="yakuman-player-select" class="mt-1 block w-full rounded-md">${playerOptions}</select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-400">役満 (複数選択可)</label>
                <div id="yakuman-checkbox-container" class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">${yakumanCheckboxes}</div>
            </div>
        </div>
        <div class="flex justify-end mt-6 gap-2">
            <button onclick="openScoreInputModal(${hanchanIndex})" class="cyber-btn px-4 py-2">戻る</button>
            <button onclick="addYakumanEvent(${hanchanIndex})" class="cyber-btn-green px-4 py-2">記録する</button>
        </div>
    `;
    showModal(modalContent);
}

export function updateYakumanCheckboxes() {
    const checkboxes = document.querySelectorAll('input[name="yakuman-checkbox"]');
    const selectedYakumans = Array.from(checkboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);

    let incompatibleYakumans = new Set();
    selectedYakumans.forEach(yakuman => {
        if (YAKUMAN_INCOMPATIBILITY[yakuman]) {
            YAKUMAN_INCOMPATIBILITY[yakuman].forEach(incompatible => {
                incompatibleYakumans.add(incompatible);
            });
        }
    });

    checkboxes.forEach(checkbox => {
        const label = checkbox.parentElement;
        if (!selectedYakumans.includes(checkbox.value) && incompatibleYakumans.has(checkbox.value)) {
            checkbox.disabled = true;
            label.classList.add('yakuman-label-disabled');
        } else {
            checkbox.disabled = false;
            label.classList.remove('yakuman-label-disabled');
        }
    });
}

export function addYakumanEvent(hanchanIndex) {
    const playerId = document.getElementById('yakuman-player-select').value;
    const selectedYakuman = Array.from(document.querySelectorAll('input[name="yakuman-checkbox"]:checked')).map(cb => cb.value);

    if (!playerId || selectedYakuman.length === 0) {
        showModalMessage("雀士と役満を選択してください。");
        return;
    }

    const hanchanScores = state.getHanchanScores();
    const hanchan = hanchanScores[hanchanIndex];
    if (!hanchan.yakumanEvents) {
        hanchan.yakumanEvents = [];
    }
    hanchan.yakumanEvents.push({ playerId, yakumans: selectedYakuman });
    state.setHanchanScores(hanchanScores);
    
    showModalMessage("役満を記録しました！");
    renderScoreDisplay();
    setTimeout(() => openScoreInputModal(hanchanIndex), 1500);
}

export function openPenaltyModal(hanchanIndex) {
    const playerOptions = state.getSelectedPlayers().map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    const chomboReasons = PENALTY_REASONS.chombo.map(r => `<option value="${r}">${r}</option>`).join('');
    
    let modalContent = `
        <h3 class="cyber-header text-xl font-bold text-red-400 mb-4">ペナルティ記録</h3>
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-400">雀士</label>
                <select id="penalty-player-select" class="mt-1 block w-full rounded-md">${playerOptions}</select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-400">種類</label>
                <select id="penalty-type-select" class="mt-1 block w-full rounded-md" onchange="updatePenaltyReasons()">
                    <option value="chombo">チョンボ</option>
                    <option value="agariHouki">アガリ放棄</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-400">原因</label>
                <select id="penalty-reason-select" class="mt-1 block w-full rounded-md">${chomboReasons}</select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-400">回数</label>
                <input type="number" id="penalty-count-input" value="1" class="mt-1 block w-full rounded-md">
            </div>
        </div>
        <div class="flex justify-end mt-6 gap-2">
            <button onclick="openScoreInputModal(${hanchanIndex})" class="cyber-btn px-4 py-2">戻る</button>
            <button onclick="addPenalty(${hanchanIndex})" class="cyber-btn-red px-4 py-2">記録する</button>
        </div>
    `;
    showModal(modalContent);
}

export function updatePenaltyReasons() {
    const type = document.getElementById('penalty-type-select').value;
    const reasonSelect = document.getElementById('penalty-reason-select');
    const reasons = PENALTY_REASONS[type];
    reasonSelect.innerHTML = reasons.map(r => `<option value="${r}">${r}</option>`).join('');
}

export function addPenalty(hanchanIndex) {
    const playerId = document.getElementById('penalty-player-select').value;
    const type = document.getElementById('penalty-type-select').value;
    const reason = document.getElementById('penalty-reason-select').value;
    const count = parseInt(document.getElementById('penalty-count-input').value, 10);

    if (!playerId || !type || !reason || isNaN(count) || count < 1) {
        showModalMessage("全ての項目を正しく入力してください。");
        return;
    }
    
    const hanchanScores = state.getHanchanScores();
    const hanchan = hanchanScores[hanchanIndex];
    if (!hanchan.penalties) {
        hanchan.penalties = [];
    }
    hanchan.penalties.push({ playerId, type, reason, count });
    state.setHanchanScores(hanchanScores);
    
    showModalMessage("ペナルティを記録しました。");
    renderScoreDisplay();
    setTimeout(() => openScoreInputModal(hanchanIndex), 1500);
}

// #endregion

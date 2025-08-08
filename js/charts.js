import * as state from './state.js';
import { getPlayerPointHistory } from './utils.js';
import { getPlayerPhotoHtml } from './dom.js'; // プレイヤー写真表示のためdom.jsからインポート

/**
 * データ分析タブのすべてのチャートと統計カードを更新します。
 */
export function updateDataAnalysisCharts() {
    const dataAnalysisTab = document.getElementById('data-analysis-tab');
    if (!dataAnalysisTab || dataAnalysisTab.classList.contains('hidden')) {
        return; // タブが非表示の場合は何もしない
    }

    const cachedStats = state.getCachedStats();
    const rankedUsers = Object.values(cachedStats).filter(u => u.totalHanchans > 0);
    const colors = ['#58a6ff', '#52c569', '#f5655f', '#E2FF08', '#e0aaff', '#9bf6ff', '#ffb700', '#00ffc8'];
    const allPlayers = [...rankedUsers].sort((a, b) => b.totalPoints - a.totalPoints);
    const users = state.getUsers();
    const games = state.getGames();
    
    // --- 1. 統計サマリーカード & トップ3プレイヤーのレンダリング ---
    const statCardsContainer = document.getElementById('stat-cards-container');
    const top3Container = document.getElementById('top-3-container');

    if (rankedUsers.length > 0) {
        const totalHanchans = rankedUsers.reduce((sum, u) => sum + u.totalHanchans, 0);
        const gameDays = new Set(games.map(g => g.gameDate.split('(')[0])).size;
        const leader = allPlayers[0];

        const topHanchans = [...rankedUsers].sort((a,b) => b.totalHanchans - a.totalHanchans)[0];
        const hanchanParticipationRate = totalHanchans > 0 ? (topHanchans.totalHanchans / totalHanchans * 100).toFixed(1) : 0;

        const participationDays = {};
        users.forEach(u => participationDays[u.id] = new Set());
        games.forEach(g => {
            const date = g.gameDate.split('(')[0];
            g.playerIds.forEach(pId => participationDays[pId].add(date));
        });
        const topDays = [...rankedUsers].sort((a,b) => participationDays[b.id].size - participationDays[a.id].size)[0];
        const daysParticipationRate = gameDays > 0 ? (participationDays[topDays.id].size / gameDays * 100).toFixed(1) : 0;
        
        let highestHanchan = { score: -Infinity, name: '', id: '' };
        games.forEach(g => g.scores.forEach(s => Object.entries(s.rawScores).forEach(([pId, score]) => {
            if (score > highestHanchan.score) {
                highestHanchan = { score, name: users.find(u=>u.id===pId)?.name, id: pId };
            }
        })));
        
        const dailyPoints = {};
        games.forEach(g => {
            const date = g.gameDate.split('(')[0];
            if(!dailyPoints[date]) dailyPoints[date] = {};
            Object.entries(g.totalPoints).forEach(([pId, pts]) => {
                if(!dailyPoints[date][pId]) dailyPoints[date][pId] = 0;
                dailyPoints[date][pId] += pts;
            });
        });
        let highestDaily = { pt: -Infinity, name: '', id: '' };
        Object.values(dailyPoints).forEach(day => Object.entries(day).forEach(([pId, pt]) => {
            if (pt > highestDaily.pt) {
                highestDaily = { pt, name: users.find(u=>u.id===pId)?.name, id: pId };
            }
        }));

        const getColorForPlayer = (playerId) => {
            const rankIndex = allPlayers.findIndex(p => p.id === playerId);
            if (rankIndex === -1) return 'var(--accent-green)';
            return colors[rankIndex % colors.length];
        };

        statCardsContainer.innerHTML = `
            <div class="cyber-card p-3"><p class="text-sm text-gray-400">総半荘数</p><p class="text-2xl font-bold" style="color: var(--accent-green);">${totalHanchans}</p><p class="text-xs text-gray-500">開催日数: ${gameDays}日</p></div>
            <div class="cyber-card p-3"><p class="text-sm text-gray-400">現時点トップ</p><p class="text-xl font-bold" style="color: ${getColorForPlayer(leader.id)};">${leader.name}</p><p class="text-xs">${leader.totalPoints.toFixed(1)} pt</p></div>
            <div class="cyber-card p-3"><p class="text-sm text-gray-400">参加半荘数トップ</p><p class="text-xl font-bold" style="color: ${getColorForPlayer(topHanchans.id)};">${topHanchans.name}</p><p class="text-xs">参加 ${topHanchans.totalHanchans}半荘：参加率 ${hanchanParticipationRate}％</p></div>
            <div class="cyber-card p-3"><p class="text-sm text-gray-400">参加日数トップ</p><p class="text-xl font-bold" style="color: ${getColorForPlayer(topDays.id)};">${topDays.name}</p><p class="text-xs">参加 ${participationDays[topDays.id].size}日：参加率 ${daysParticipationRate}％</p></div>
            <div class="cyber-card p-3"><p class="text-sm text-gray-400">1半荘最高素点</p><p class="text-xl font-bold" style="color: ${getColorForPlayer(highestHanchan.id)};">${highestHanchan.name}</p><p class="text-xs">${highestHanchan.score.toLocaleString()}点</p></div>
            <div class="cyber-card p-3"><p class="text-sm text-gray-400">1日最高獲得Pt</p><p class="text-xl font-bold" style="color: ${getColorForPlayer(highestDaily.id)};">${highestDaily.name}</p><p class="text-xs">+${highestDaily.pt.toFixed(1)} pt</p></div>
        `;

        if (top3Container && allPlayers.length > 0) {
            const top3 = allPlayers.slice(0, 3);
            top3Container.innerHTML = `
                <h3 class="cyber-header text-xl font-bold mb-4 text-center text-yellow-300">現時点トップ３</h3>
                <div class="flex justify-around items-end gap-4">
                    ${top3.map((p, i) => {
                        const rankClass = i === 0 ? 'text-rank-gold' : (i === 1 ? 'text-rank-silver' : 'text-rank-bronze');
                        const sizeClass = i === 0 ? 'w-24 h-24' : (i === 1 ? 'w-20 h-20' : 'w-16 h-16');
                        const nameSize = i === 0 ? 'text-lg' : (i === 1 ? 'text-base' : 'text-sm');
                        return `
                        <div class="text-center flex flex-col items-center">
                            <span class="font-bold text-2xl ${rankClass}">${i+1}</span>
                            ${getPlayerPhotoHtml(p.id, sizeClass)}
                            <span class="font-bold ${nameSize} mt-2 text-blue-400">${p.name}</span>
                            <span class="text-sm ${p.totalPoints >= 0 ? 'text-green-400' : 'text-red-400'}">${p.totalPoints.toFixed(1)} pt</span>
                        </div>
                        `
                    }).join('')}
                </div>
            `;
        }
    } else {
        statCardsContainer.innerHTML = `<div class="col-span-full text-center text-gray-500 py-4">データがありません</div>`;
        if (top3Container) top3Container.innerHTML = '';
        return; // データがなければチャートも描画しない
    }

    // --- 2. レーダーチャート ---
    const radarPlayerSelect = document.getElementById('radar-player-select');
    // ... (レーダーチャートのロジックをここに移植)

    // --- 3. ポイント推移チャート ---
    const pointHistoryCanvas = document.getElementById('point-history-chart');
    // ... (ポイント推移チャートのロジックをここに移植)

    // --- 4. 棒グラフ ---
    const barChartMetricSelect = document.getElementById('bar-chart-metric-select');
    // ... (棒グラフのロジックをここに移植)
}


/**
 * 個人成績タブのチャート（順位分布、ポイント推移）を描画・更新します。
 * @param {string} mainPlayerId - 表示対象のメインプレイヤーID
 * @param {Array} comparisonIds - 比較対象のプレイヤーIDの配列
 */
export function renderStatsCharts(mainPlayerId, comparisonIds) {
    const chartsState = state.getCharts();
    const cachedStats = state.getCachedStats();
    const games = state.getGames();
    const colors = ['#58a6ff', '#52c569', '#f5655f', '#f2cc8f', '#e0aaff', '#9bf6ff'];

    // --- ポイント推移チャート (個人) ---
    const personalChartCanvas = document.getElementById('point-history-chart-personal');
    if (personalChartCanvas) {
        const playerIdsForChart = [mainPlayerId, ...comparisonIds];
        const relevantGames = games.filter(g => g.playerIds.some(pId => playerIdsForChart.includes(pId)));
        const dateStrings = relevantGames.map(g => g.gameDate.split('(')[0]);
        const today = new Date();
        const todayString = `${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`;
        dateStrings.push(todayString);
        const fullTimeline = [...new Set(dateStrings)].sort((a, b) => new Date(a) - new Date(b));

        const pointHistoryDatasets = [];
        const mainPlayerData = getPlayerPointHistory(mainPlayerId, games, fullTimeline);
        pointHistoryDatasets.push({
            label: cachedStats[mainPlayerId].name,
            data: mainPlayerData,
            borderColor: colors[0],
            backgroundColor: colors[0] + '33',
            fill: true,
            tension: 0.1
        });
        comparisonIds.forEach((id, index) => {
            const playerData = getPlayerPointHistory(id, games, fullTimeline);
            pointHistoryDatasets.push({
                label: cachedStats[id].name,
                data: playerData,
                borderColor: colors[(index + 1) % colors.length],
                backgroundColor: colors[(index + 1) % colors.length] + '33',
                fill: true,
                tension: 0.1
            });
        });

        if (chartsState.personalPointHistoryChart) chartsState.personalPointHistoryChart.destroy();
        chartsState.personalPointHistoryChart = new Chart(personalChartCanvas.getContext('2d'), {
            type: 'line',
            data: { labels: fullTimeline, datasets: pointHistoryDatasets },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { labels: { color: '#c9d1d9' }}}, scales: { x: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } }, y: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } } } }
        });
        state.setCharts({ personalPointHistoryChart: chartsState.personalPointHistoryChart });
    }

    // --- 順位分布チャート (個人) ---
    const rankChartCanvas = document.getElementById('rank-chart-personal');
    if (rankChartCanvas) {
        const rankDatasets = [];
        rankDatasets.push({
            label: cachedStats[mainPlayerId].name,
            data: cachedStats[mainPlayerId].ranks,
            backgroundColor: colors[0],
        });
        comparisonIds.forEach((id, index) => {
            rankDatasets.push({
                label: cachedStats[id].name,
                data: cachedStats[id].ranks,
                backgroundColor: colors[(index + 1) % colors.length],
            });
        });

        if (chartsState.personalRankChart) chartsState.personalRankChart.destroy();
        chartsState.personalRankChart = new Chart(rankChartCanvas.getContext('2d'), {
            type: 'bar',
            data: { labels: ['1位', '2位', '3位', '4位'], datasets: rankDatasets },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { color: '#c9d1d9' }}}, scales: { x: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } }, y: { ticks: { color: '#8b949e' }, grid: { color: '#30363d' } } } }
        });
        state.setCharts({ personalRankChart: chartsState.personalRankChart });
    }
}

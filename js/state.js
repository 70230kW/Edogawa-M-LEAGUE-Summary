export const state = {
    currentUser: null,
    users: [],
    games: [],
    selectedPlayers: [],
    hanchanScores: [],
    editingGameId: null,
    cachedStats: {},
    playerTrophies: {},
    activeInputId: null,
    charts: {
        playerRadarChart: null,
        pointHistoryChart: null,
        playerBarChart: null,
        personalRankChart: null,
        personalPointHistoryChart: null,
    }
};

export function setUsers(newUsers) {
    state.users = newUsers;
    // ユーザー名を日本語順でソート
    state.users.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

export function setGames(newGames) {
    state.games = newGames;
}

export function resetGame() {
    state.selectedPlayers = [];
    state.hanchanScores = [];
    state.editingGameId = null;
    localStorage.removeItem('edogawa-m-league-partial');
}

export function addHanchan() {
    const newHanchan = { rawScores: {}, yakumanEvents: [], penalties: [] };
    state.selectedPlayers.forEach(p => {
        newHanchan.rawScores[p.id] = null;
    });
    state.hanchanScores.push(newHanchan);
}

export function deleteHanchan(index) {
    if (state.hanchanScores.length > 1) {
        state.hanchanScores.splice(index, 1);
        return true; // 削除成功
    }
    return false; // 削除失敗
}

export function saveScoresFromModal(index) {
    const newScores = {};
    let total = 0;
    let hasEmpty = false;
    state.selectedPlayers.forEach(p => {
        const input = document.getElementById(`modal-score-${p.id}`);
        const value = input.value;
        if (value === '' || value === null || value === '-') {
            hasEmpty = true;
            newScores[p.id] = null;
        } else {
            const score = Number(value);
            newScores[p.id] = score;
            total += score;
        }
    });

    if (!hasEmpty) {
        const basePoint = Number(document.getElementById('base-point').value);
        const targetTotal = basePoint * 4;
        if (Math.round(total) !== targetTotal) {
            return `合計点が ${targetTotal.toLocaleString()} になっていません。(現在: ${total.toLocaleString()})`;
        }
    }
    
    state.hanchanScores[index].rawScores = newScores;
    return null; // エラーなし
}

export function savePartialData() {
    const gameData = {
        selectedPlayers: state.selectedPlayers,
        gameDate: document.getElementById('game-date').value,
        basePoint: document.getElementById('base-point').value,
        returnPoint: document.getElementById('return-point').value,
        uma1: document.getElementById('uma-1').value,
        uma2: document.getElementById('uma-2').value,
        uma3: document.getElementById('uma-3').value,
        uma4: document.getElementById('uma-4').value,
        scores: state.hanchanScores
    };
    localStorage.setItem('edogawa-m-league-partial', JSON.stringify(gameData));
}

export function loadSavedGameData() {
    const savedDataJSON = localStorage.getItem('edogawa-m-league-partial');
    if (!savedDataJSON) return false;

    const savedData = JSON.parse(savedDataJSON);
    if (savedData.selectedPlayers && savedData.selectedPlayers.length > 0) {
        state.selectedPlayers = savedData.selectedPlayers;
        state.hanchanScores = savedData.scores || [];
        
        // UIに値を反映
        const gameTab = document.getElementById('game-tab');
        gameTab.querySelector('#base-point').value = savedData.basePoint;
        gameTab.querySelector('#return-point').value = savedData.returnPoint;
        gameTab.querySelector('#uma-1').value = savedData.uma1;
        gameTab.querySelector('#uma-2').value = savedData.uma2;
        gameTab.querySelector('#uma-3').value = savedData.uma3;
        gameTab.querySelector('#uma-4').value = savedData.uma4;
        gameTab.querySelector('#game-date').value = savedData.gameDate;
        
        if (state.hanchanScores.length === 0) {
            addHanchan();
        }
        return true;
    }
    return false;
}

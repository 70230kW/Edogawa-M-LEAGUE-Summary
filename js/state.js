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
    state.users.sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

export function setGames(newGames) {
    state.games = newGames;
}

export function resetGame() {
    state.selectedPlayers = [];
    state.hanchanScores = [];
    state.editingGameId = null;
}

// ... 他の状態管理関数 ...

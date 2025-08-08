// Firebase instances
let db, auth, storage;

// App State
let currentUser = null;
let users = [];
let games = [];
let selectedPlayers = []; 
let hanchanScores = []; 
let activeInputId = null; 
let editingGameId = null;

// Cached Stats
let cachedStats = {};
let playerTrophies = {};

// Chart instances
let playerRadarChart = null;
let pointHistoryChart = null;
let playerBarChart = null;
let personalRankChart = null;
let personalPointHistoryChart = null;

// Getters
export const getDb = () => db;
export const getAuth = () => auth;
export const getStorage = () => storage;
export const getCurrentUser = () => currentUser;
export const getUsers = () => users;
export const getGames = () => games;
export const getSelectedPlayers = () => selectedPlayers;
export const getHanchanScores = () => hanchanScores;
export const getActiveInputId = () => activeInputId;
export const getEditingGameId = () => editingGameId;
export const getCachedStats = () => cachedStats;
export const getPlayerTrophies = () => playerTrophies;
export const getCharts = () => ({ playerRadarChart, pointHistoryChart, playerBarChart, personalRankChart, personalPointHistoryChart });

// Setters
export const setDb = (val) => { db = val; };
export const setAuth = (val) => { auth = val; };
export const setStorage = (val) => { storage = val; };
export const setCurrentUser = (val) => { currentUser = val; };
export const setUsers = (val) => { users = val; };
export const setGames = (val) => { games = val; };
export const setSelectedPlayers = (val) => { selectedPlayers = val; };
export const setHanchanScores = (val) => { hanchanScores = val; };
export const setActiveInputId = (val) => { activeInputId = val; };
export const setEditingGameId = (val) => { editingGameId = val; };
export const setCachedStats = (val) => { cachedStats = val; };
export const setPlayerTrophies = (val) => { playerTrophies = val; };
export const setCharts = (val) => {
    playerRadarChart = val.playerRadarChart ?? playerRadarChart;
    pointHistoryChart = val.pointHistoryChart ?? pointHistoryChart;
    playerBarChart = val.playerBarChart ?? playerBarChart;
    personalRankChart = val.personalRankChart ?? personalRankChart;
    personalPointHistoryChart = val.personalPointHistoryChart ?? personalPointHistoryChart;
};

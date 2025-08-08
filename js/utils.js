/**
 * 与えられたゲームデータに基づいて全プレイヤーの統計情報を計算します。
 * この関数はアプリケーション内で最も計算量が多い処理の一つです。
 * @param {Array} gamesToCalculate - 計算対象のゲームオブジェクトの配列
 * @param {Array} allUsers - 全ユーザーの配列
 * @returns {Object} プレイヤーIDをキーとし、統計情報オブジェクトを値とするオブジェクト
 */
export function calculateAllPlayerStats(gamesToCalculate, allUsers) {
    const stats = {};
    allUsers.forEach(u => {
        stats[u.id] = {
            id: u.id,
            name: u.name,
            photoURL: u.photoURL,
            totalPoints: 0,
            gameCount: 0,
            ranks: [0, 0, 0, 0],
            bustedCount: 0,
            totalRawScore: 0,
            totalHanchans: 0,
            yakumanCount: 0,
            maxStreak: { rentai: 0, noTobi: 0, noLast: 0, top: 0, sameRank: 0 },
            currentStreak: { rentai: 0, noTobi: 0, noLast: 0, top: 0, sameRank: 0 },
            lastRank: null
        };
    });

    const sortedGames = [...gamesToCalculate].sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));

    sortedGames.forEach(game => {
        game.playerIds.forEach(pId => { if (stats[pId]) stats[pId].gameCount++; });
        Object.entries(game.totalPoints).forEach(([playerId, point]) => { if (stats[playerId]) stats[playerId].totalPoints += point; });

        game.scores.forEach(hanchan => {
            Object.entries(hanchan.rawScores).forEach(([playerId, rawScore]) => {
                if (stats[playerId]) {
                    stats[playerId].totalRawScore += rawScore;
                    if (rawScore < 0) {
                        stats[playerId].bustedCount++;
                        stats[playerId].currentStreak.noTobi = 0;
                    } else {
                        stats[playerId].currentStreak.noTobi++;
                    }
                    stats[playerId].maxStreak.noTobi = Math.max(stats[playerId].maxStreak.noTobi, stats[playerId].currentStreak.noTobi);
                }
            });

            const scoreGroups = {};
            Object.entries(hanchan.rawScores).forEach(([pId, score]) => {
                if (!scoreGroups[score]) scoreGroups[score] = [];
                scoreGroups[score].push(pId);
            });
            const sortedScores = Object.keys(scoreGroups).map(Number).sort((a, b) => b - a);

            let rankCursor = 0;
            sortedScores.forEach(score => {
                const playersInGroup = scoreGroups[score];
                playersInGroup.forEach(pId => {
                    if (stats[pId]) {
                        const currentRank = rankCursor;
                        stats[pId].ranks[currentRank]++;

                        // Streak logic
                        if (currentRank <= 1) { // 1st or 2nd
                            stats[pId].currentStreak.rentai++;
                        } else {
                            stats[pId].currentStreak.rentai = 0;
                        }
                        if (currentRank === 0) { // 1st
                            stats[pId].currentStreak.top++;
                        } else {
                            stats[pId].currentStreak.top = 0;
                        }
                        if (currentRank === 3) { // 4th
                            stats[pId].currentStreak.noLast = 0;
                        } else {
                            stats[pId].currentStreak.noLast++;
                        }
                        if (stats[pId].lastRank === currentRank) {
                            stats[pId].currentStreak.sameRank++;
                        } else {
                            stats[pId].currentStreak.sameRank = 1;
                        }

                        stats[pId].maxStreak.rentai = Math.max(stats[pId].maxStreak.rentai, stats[pId].currentStreak.rentai);
                        stats[pId].maxStreak.top = Math.max(stats[pId].maxStreak.top, stats[pId].currentStreak.top);
                        stats[pId].maxStreak.noLast = Math.max(stats[pId].maxStreak.noLast, stats[pId].currentStreak.noLast);
                        stats[pId].maxStreak.sameRank = Math.max(stats[pId].maxStreak.sameRank, stats[pId].currentStreak.sameRank);
                        stats[pId].lastRank = currentRank;
                    }
                });
                rankCursor += playersInGroup.length;
            });

            Object.keys(hanchan.rawScores).forEach(pId => {
                if (stats[pId]) stats[pId].totalHanchans++;
            });

            if (hanchan.yakumanEvents) {
                hanchan.yakumanEvents.forEach(event => {
                    if (stats[event.playerId]) {
                        stats[event.playerId].yakumanCount += event.yakumans.length;
                    }
                });
            }
        });
    });

    // 派生データを計算 (平均値など)
    Object.values(stats).forEach(u => {
        if (u.totalHanchans > 0) {
            u.avgRank = u.ranks.reduce((sum, count, i) => sum + count * (i + 1), 0) / u.totalHanchans;
            u.topRate = (u.ranks[0] / u.totalHanchans) * 100;
            u.rentaiRate = ((u.ranks[0] + u.ranks[1]) / u.totalHanchans) * 100;
            u.lastRate = (u.ranks[3] / u.totalHanchans) * 100;
            u.bustedRate = (u.bustedCount / u.totalHanchans) * 100;
            u.avgRawScore = Math.round((u.totalRawScore / u.totalHanchans) / 100) * 100;
        } else {
            u.avgRank = 0;
            u.topRate = 0;
            u.rentaiRate = 0;
            u.lastRate = 0;
            u.bustedRate = 0;
            u.avgRawScore = 0;
        }
    });

    return stats;
}

/**
 * 特定プレイヤーのポイント推移履歴を計算します。
 * @param {string} playerId - プレイヤーID
 * @param {Array} allGames - 全ゲームデータ
 * @param {Array} fullTimeline - 日付のタイムライン配列
 * @returns {Array} 累積ポイントの配列
 */
export function getPlayerPointHistory(playerId, allGames, fullTimeline) {
    let cumulativePoints = 0;
    const playerGamesByDate = {};
    allGames
        .filter(g => g.playerIds.includes(playerId) && g.gameDate)
        .forEach(game => {
            const date = game.gameDate.split('(')[0];
            if (!playerGamesByDate[date]) {
                playerGamesByDate[date] = 0;
            }
            playerGamesByDate[date] += game.totalPoints[playerId];
        });

    const history = [];
    fullTimeline.forEach(date => {
        if (playerGamesByDate[date]) {
            cumulativePoints += playerGamesByDate[date];
        }
        history.push(cumulativePoints);
    });
    return history;
}

/**
 * 参加されたゲームから重複のない年のリストを取得します。
 * @param {Array} allGames - 全ゲームデータ
 * @returns {Array} 年の配列 (降順)
 */
export function getGameYears(allGames) {
    const years = new Set();
    allGames.forEach(game => {
        const dateStr = game.gameDate;
        if (dateStr) {
            const year = dateStr.substring(0, 4);
            if (!isNaN(year)) {
                years.add(year);
            }
        } else if (game.createdAt && game.createdAt.seconds) {
            const year = new Date(game.createdAt.seconds * 1000).getFullYear().toString();
            years.add(year);
        }
    });
    return Array.from(years).sort((a, b) => b - a);
}

/**
 * 1半荘の素点から順位とポイントを計算します。
 * @param {Object} scores - プレイヤーIDをキー、素点を値とするオブジェクト
 * @returns {Object} points, rawRanks, pointRanks を含むオブジェクト
 */
export function calculateHanchanRanksAndPoints(scores) {
    const result = { points: {}, rawRanks: {}, pointRanks: {} };
    if (Object.values(scores).some(s => s === null || s === '')) {
        return result;
    }

    const basePoint = Number(document.getElementById('base-point').value);
    const returnPoint = Number(document.getElementById('return-point').value);
    const uma = [
        Number(document.getElementById('uma-1').value), Number(document.getElementById('uma-2').value),
        Number(document.getElementById('uma-3').value), Number(document.getElementById('uma-4').value)
    ];
    const oka = ((returnPoint - basePoint) * 4) / 1000;

    const scoreGroups = {};
    Object.entries(scores).forEach(([playerId, score]) => {
        const s = Number(score);
        if (!scoreGroups[s]) scoreGroups[s] = [];
        scoreGroups[s].push(playerId);
    });
    const sortedScores = Object.keys(scoreGroups).map(Number).sort((a, b) => b - a);

    let rankCursor = 1;
    sortedScores.forEach(score => {
        const playersInGroup = scoreGroups[score];
        playersInGroup.forEach(pId => { result.rawRanks[pId] = rankCursor; });
        rankCursor += playersInGroup.length;
    });

    rankCursor = 0;
    sortedScores.forEach(score => {
        const playersInGroup = scoreGroups[score];
        const groupSize = playersInGroup.length;
        const umaSlice = uma.slice(rankCursor, rankCursor + groupSize);
        const totalUma = umaSlice.reduce((a, b) => a + b, 0);
        const sharedUma = totalUma / groupSize;
        let sharedOka = 0;
        if (rankCursor === 0) sharedOka = oka / groupSize;

        playersInGroup.forEach(playerId => {
            const pointWithoutUma = (Number(score) - returnPoint) / 1000;
            result.points[playerId] = pointWithoutUma + sharedUma + sharedOka;
        });
        rankCursor += groupSize;
    });

    const pointGroups = {};
    Object.entries(result.points).forEach(([playerId, p]) => {
        if (!pointGroups[p]) pointGroups[p] = [];
        pointGroups[p].push(playerId);
    });
    const sortedPoints = Object.keys(pointGroups).map(Number).sort((a, b) => b - a);
    rankCursor = 1;
    sortedPoints.forEach(p => {
        const playersInGroup = pointGroups[p];
        playersInGroup.forEach(pId => { result.pointRanks[pId] = rankCursor; });
        rankCursor += playersInGroup.length;
    });

    return result;
}

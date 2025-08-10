import { state } from './state.js';
import { TROPHY_DEFINITIONS } from './constants.js';

export function getGameYears() {
    const years = new Set();
    state.games.forEach(game => {
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

export function calculateAllPlayerStats(gamesToCalculate) {
    const stats = {};
    state.users.forEach(u => {
        stats[u.id] = { id: u.id, name: u.name, photoURL: u.photoURL, totalPoints: 0, gameCount: 0, ranks: [0, 0, 0, 0], bustedCount: 0, totalRawScore: 0, totalHanchans: 0, yakumanCount: 0, maxStreak: { rentai: 0, noTobi: 0, noLast: 0, top: 0, sameRank: 0 }, currentStreak: { rentai: 0, noTobi: 0, noLast: 0, top: 0, sameRank: 0 }, lastRank: null };
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

                        if (currentRank <= 1) { stats[pId].currentStreak.rentai++; } else { stats[pId].currentStreak.rentai = 0; }
                        if (currentRank === 0) { stats[pId].currentStreak.top++; } else { stats[pId].currentStreak.top = 0; }
                        if (currentRank === 3) { stats[pId].currentStreak.noLast = 0; } else { stats[pId].currentStreak.noLast++; }
                        if (stats[pId].lastRank === currentRank) { stats[pId].currentStreak.sameRank++; } else { stats[pId].currentStreak.sameRank = 1; }

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

    Object.values(stats).forEach(u => {
        if (u.totalHanchans > 0) {
            u.avgRank = u.ranks.reduce((sum, count, i) => sum + count * (i + 1), 0) / u.totalHanchans;
            u.topRate = (u.ranks[0] / u.totalHanchans) * 100;
            u.rentaiRate = ((u.ranks[0] + u.ranks[1]) / u.totalHanchans) * 100;
            u.lastRate = (u.ranks[3] / u.totalHanchans) * 100;
            u.bustedRate = (u.bustedCount / u.totalHanchans) * 100;
            u.avgRawScore = Math.round((u.totalRawScore / u.totalHanchans) / 100) * 100;
        } else {
            u.avgRank = 0; u.topRate = 0; u.rentaiRate = 0; u.lastRate = 0; u.bustedRate = 0; u.avgRawScore = 0;
        }
    });

    return stats;
}

export function getPlayerPointHistory(playerId, fullTimeline) {
    let cumulativePoints = 0;
    const playerGamesByDate = {};
    [...state.games]
        .filter(g => g.playerIds.includes(playerId))
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

export function getGameDataFromForm(onlyCompleted) {
    const basePoint = Number(document.getElementById('base-point').value);
    const returnPoint = Number(document.getElementById('return-point').value);
    const uma = [
        Number(document.getElementById('uma-1').value), Number(document.getElementById('uma-2').value),
        Number(document.getElementById('uma-3').value), Number(document.getElementById('uma-4').value)
    ];

    const processedHanchans = [];

    for (let i = 0; i < state.hanchanScores.length; i++) {
        const hanchan = state.hanchanScores[i];
        const scores = hanchan.rawScores;
        const isComplete = Object.values(scores).every(s => s !== null && s !== '');

        if (!isComplete) {
            if (onlyCompleted) continue;
            return { error: `半荘 #${i + 1} の全ての素点を入力してください。` };
        }

        const total = Object.values(scores).reduce((sum, score) => sum + Number(score), 0);
        if (Math.round(total) !== basePoint * 4) {
            return { error: `半荘 #${i + 1} の合計点が ${basePoint * 4} になっていません。(現在: ${total})` };
        }
        processedHanchans.push(hanchan);
    }

    if (processedHanchans.length === 0 && onlyCompleted) {
        return { error: "ポイント計算できる完成した半荘がありません。" };
    }

    const totalPoints = {};
    state.selectedPlayers.forEach(p => totalPoints[p.id] = 0);

    processedHanchans.forEach(hanchan => {
        const { points } = calculateHanchanRanksAndPoints(hanchan.rawScores);
        hanchan.points = points;
        Object.keys(points).forEach(playerId => {
            totalPoints[playerId] += points[playerId];
        });
    });

    return { hanchanData: processedHanchans, totalPoints, settings: { basePoint, returnPoint, uma } };
}

export function checkAllTrophies(targetGames, currentStats) {
    state.playerTrophies = {};
    
    state.users.forEach(user => {
        state.playerTrophies[user.id] = {};
        const stats = currentStats[user.id];
        if (!stats || stats.totalHanchans === 0) return;

        const playerGames = targetGames.filter(g => g.playerIds.includes(user.id)).sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
        const dailyPoints = {};
        const dailyScores = {};
        const monthlyHanchans = {};

        playerGames.forEach(g => {
            if (g.gameDate) {
                const date = g.gameDate.split('(')[0];
                if (!dailyPoints[date]) dailyPoints[date] = 0;
                dailyPoints[date] += g.totalPoints[user.id];

                if (!dailyScores[date]) dailyScores[date] = [];
                g.scores.forEach(s => dailyScores[date].push(s.rawScores[user.id]));

                const month = g.gameDate.substring(0, 7); // yyyy/mm
                if (!monthlyHanchans[month]) monthlyHanchans[month] = 0;
                monthlyHanchans[month] += g.scores.length;
            }
        });

        // Bronze
        state.playerTrophies[user.id].first_game = stats.totalHanchans > 0;
        state.playerTrophies[user.id].first_top = stats.ranks[0] > 0;
        state.playerTrophies[user.id].first_plus_day = Object.values(dailyPoints).some(p => p > 0);
        state.playerTrophies[user.id].ten_games = stats.totalHanchans >= 10;
        state.playerTrophies[user.id].first_busted = stats.bustedCount > 0;
        state.playerTrophies[user.id].first_last = stats.ranks[3] > 0;
        state.playerTrophies[user.id].score_under_1000 = playerGames.some(g => g.scores.some(s => s.rawScores[user.id] < 1000 && s.rawScores[user.id] >= 0));
        state.playerTrophies[user.id].daily_high_score = Object.keys(dailyPoints).some(date => {
            let maxScoreToday = -Infinity;
            targetGames.filter(g => g.gameDate && g.gameDate.startsWith(date)).forEach(g => {
                g.scores.forEach(s => {
                    Object.values(s.rawScores).forEach(score => {
                        if (score > maxScoreToday) maxScoreToday = score;
                    })
                })
            });
            return dailyScores[date] && dailyScores[date].some(s => s === maxScoreToday);
        });

        // Silver
        state.playerTrophies[user.id].twenty_five_games = stats.totalHanchans >= 25;
        state.playerTrophies[user.id].yakuman = stats.yakumanCount > 0;
        state.playerTrophies[user.id].plus_100_day = Object.values(dailyPoints).some(p => p >= 100);
        state.playerTrophies[user.id].five_rentai = stats.maxStreak.rentai >= 5;
        state.playerTrophies[user.id].score_over_50k = playerGames.some(g => g.scores.some(s => s.rawScores[user.id] >= 50000));
        state.playerTrophies[user.id].ten_tops = stats.ranks[0] >= 10;
        state.playerTrophies[user.id].monthly_player = Object.values(monthlyHanchans).some(count => count >= 15);
        state.playerTrophies[user.id].zero_point_finish = playerGames.some(g => g.totalPoints[user.id] === 0.0);

        const allDailyPoints = {};
        targetGames.forEach(g => {
            if (g.gameDate) {
                const date = g.gameDate.split('(')[0];
                if (!allDailyPoints[date]) allDailyPoints[date] = {};
                Object.entries(g.totalPoints).forEach(([pId, points]) => {
                    if (!allDailyPoints[date][pId]) allDailyPoints[date][pId] = 0;
                    allDailyPoints[date][pId] += points;
                });
            }
        });
        state.playerTrophies[user.id].dramatic_finish = Object.keys(dailyPoints).some(date => {
            const gamesOnDate = playerGames.filter(g => g.gameDate && g.gameDate.startsWith(date));
            if (gamesOnDate.length < 2) return false;
            const dailyTotalsForDate = allDailyPoints[date];
            if (!dailyTotalsForDate || Object.keys(dailyTotalsForDate).length === 0) return false;
            const winnerEntry = Object.entries(dailyTotalsForDate).reduce((a, b) => (a[1] > b[1] ? a : b), [null, -Infinity]);
            if (winnerEntry[0] !== user.id) return false;
            const lastGame = gamesOnDate[gamesOnDate.length - 1];
            const pointsBeforeLastGame = {};
            Object.entries(dailyTotalsForDate).forEach(([pId, total]) => {
                pointsBeforeLastGame[pId] = total - (lastGame.totalPoints[pId] || 0);
            });
            if (Object.keys(pointsBeforeLastGame).length === 0) return false;
            const winnerBeforeLastGameEntry = Object.entries(pointsBeforeLastGame).reduce((a, b) => (a[1] > b[1] ? a : b), [null, -Infinity]);
            return winnerBeforeLastGameEntry[0] !== user.id;
        });

        // Gold
        state.playerTrophies[user.id].fifty_tops = stats.ranks[0] >= 50;
        state.playerTrophies[user.id].close_win = playerGames.some(g => g.scores.some(s => {
            const scores = Object.entries(s.rawScores).sort((a, b) => b[1] - a[1]);
            return scores.length > 1 && scores[0][0] === user.id && (scores[0][1] - scores[1][1]) < 1000;
        }));
        state.playerTrophies[user.id].all_negative_win = playerGames.some(g => g.scores.some(s => {
            const myPoint = s.points[user.id];
            const othersPoints = Object.entries(s.points).filter(([pId]) => pId !== user.id).map(([, point]) => point);
            return myPoint > 0 && othersPoints.every(p => p < 0);
        }));
        state.playerTrophies[user.id].ten_no_last = stats.maxStreak.noLast >= 10;
        state.playerTrophies[user.id].three_same_rank = stats.maxStreak.sameRank >= 3;
        state.playerTrophies[user.id].finish_over_50k = playerGames.some(g => g.scores.some(s => s.rawScores[user.id] >= 50000));
        state.playerTrophies[user.id].score_under_minus_30k = playerGames.some(g => g.scores.some(s => s.rawScores[user.id] < -30000));

        // Platinum
        state.playerTrophies[user.id].two_hundred_games = stats.totalHanchans >= 200;
        state.playerTrophies[user.id].four_top_streak = stats.maxStreak.top >= 4;
        state.playerTrophies[user.id].twenty_five_no_last = stats.maxStreak.noLast >= 25;
        state.playerTrophies[user.id].finish_over_70k = playerGames.some(g => g.scores.some(s => s.rawScores[user.id] >= 70000));
        state.playerTrophies[user.id].avg_rank_2_3 = stats.totalHanchans >= 50 && stats.avgRank <= 2.3;
        let closeGamesCount = 0;
        playerGames.forEach(g => g.scores.forEach(s => {
            const scores = Object.values(s.rawScores).sort((a, b) => b - a);
            if (scores.length > 1 && (scores[0] - scores[1]) < 1000) closeGamesCount++;
        }));
        state.playerTrophies[user.id].ten_close_games = closeGamesCount >= 10;
        state.playerTrophies[user.id].undefeated_month = Object.keys(monthlyHanchans).some(month => {
            if (monthlyHanchans[month] >= 10) {
                const gamesInMonth = playerGames.filter(g => g.gameDate && g.gameDate.startsWith(month));
                return !gamesInMonth.some(g => g.scores.some(s => {
                    const { rawRanks } = calculateHanchanRanksAndPoints(s.rawScores);
                    return rawRanks[user.id] === 4;
                }));
            }
            return false;
        });

        const achievedYakuman = new Set();
        playerGames.forEach(g => g.scores.forEach(s => {
            if (s.yakumanEvents) s.yakumanEvents.forEach(y => {
                if (y.playerId === user.id) y.yakumans.forEach(yakuman => achievedYakuman.add(yakuman));
            })
        }));
        state.playerTrophies[user.id].kokushi = achievedYakuman.has('国士無双');
        state.playerTrophies[user.id].suuankou = achievedYakuman.has('四暗刻');
        state.playerTrophies[user.id].daisangen = achievedYakuman.has('大三元');
        state.playerTrophies[user.id].tsuuiisou = achievedYakuman.has('字一色');
        state.playerTrophies[user.id].ryuuiisou = achievedYakuman.has('緑一色');
        state.playerTrophies[user.id].chinroutou = achievedYakuman.has('清老頭');
        state.playerTrophies[user.id].chuuren = achievedYakuman.has('九蓮宝燈');
        state.playerTrophies[user.id].shousuushii = achievedYakuman.has('小四喜');

        // Crystal
        state.playerTrophies[user.id].five_top_streak = stats.maxStreak.top >= 5;
        state.playerTrophies[user.id].yearly_avg_rank_2_0 = stats.totalHanchans >= 50 && stats.avgRank <= 2.0;
        state.playerTrophies[user.id].thirty_no_last = stats.maxStreak.noLast >= 30;
        state.playerTrophies[user.id].finish_over_100k = playerGames.some(g => g.scores.some(s => s.rawScores[user.id] >= 100000));
        state.playerTrophies[user.id].two_yakuman_day = Object.keys(dailyPoints).some(date => {
            let yakumanCountToday = 0;
            playerGames.filter(g => g.gameDate && g.gameDate.startsWith(date)).forEach(g => {
                g.scores.forEach(s => {
                    if (s.yakumanEvents) s.yakumanEvents.forEach(y => {
                        if (y.playerId === user.id) yakumanCountToday += y.yakumans.length;
                    });
                });
            });
            return yakumanCountToday >= 2;
        });
        state.playerTrophies[user.id].three_yakuman_types = achievedYakuman.size >= 3;
        state.playerTrophies[user.id].tenhou = achievedYakuman.has('天和');
        state.playerTrophies[user.id].chiihou = achievedYakuman.has('地和');
        state.playerTrophies[user.id].kokushi13 = achievedYakuman.has('国士無双十三面待ち');
        state.playerTrophies[user.id].suuankou_tanki = achievedYakuman.has('四暗刻単騎');
        state.playerTrophies[user.id].junsei_chuuren = achievedYakuman.has('純正九蓮宝燈');
        state.playerTrophies[user.id].daisuushii = achievedYakuman.has('大四喜');
        
        let allPlayerHanchans = [];
        playerGames.forEach(g => g.scores.forEach(s => allPlayerHanchans.push(s)));
        if (allPlayerHanchans.length >= 100) {
            const recent100Hanchans = allPlayerHanchans.slice(-100);
            let totalRank = 0;
            recent100Hanchans.forEach(s => {
                const { rawRanks } = calculateHanchanRanksAndPoints(s.rawScores);
                totalRank += rawRanks[user.id];
            });
            state.playerTrophies[user.id].recent_100_avg_rank_1_5 = (totalRank / 100) <= 1.5;
        }


        // Chaos
        state.playerTrophies[user.id].yakuman_then_busted_last = playerGames.some((game, i) => {
            if (i === 0) return false;
            const prevGame = playerGames[i - 1];
            const hadYakumanPrev = prevGame.scores.some(s => s.yakumanEvents && s.yakumanEvents.some(y => y.playerId === user.id));
            if (!hadYakumanPrev) return false;
            return game.scores.some(s => {
                const { rawRanks } = calculateHanchanRanksAndPoints(s.rawScores);
                return s.rawScores[user.id] < 0 && rawRanks[user.id] === 4;
            });
        });
        state.playerTrophies[user.id].perfect_world = targetGames.some(g => g.scores.some(s => {
            const scores = Object.values(s.rawScores).sort((a, b) => b - a);
            return scores.length === 4 && scores[0] === 40000 && scores[1] === 30000 && scores[2] === 20000 && scores[3] === 10000;
        }));
        state.playerTrophies[user.id].reincarnation = targetGames.some((g, i) => {
            if (i === 0) return false;
            const prevGame = targetGames[i - 1];
            if (g.playerIds.length !== 4 || prevGame.playerIds.length !== 4) return false;
            const sortedPids = [...g.playerIds].sort();
            const sortedPrevPids = [...prevGame.playerIds].sort();
            if (JSON.stringify(sortedPids) !== JSON.stringify(sortedPrevPids)) return false;

            return g.scores.every((s, hanchanIdx) => {
                if (!prevGame.scores[hanchanIdx]) return false;
                const { rawRanks } = calculateHanchanRanksAndPoints(s.rawScores);
                const { rawRanks: prevRanks } = calculateHanchanRanksAndPoints(prevGame.scores[hanchanIdx].rawScores);
                return g.playerIds.every(pId => rawRanks[pId] + prevRanks[pId] === 5);
            });
        });
        state.playerTrophies[user.id].reroll = playerGames.some(g => g.scores.some(s => s.rawScores[user.id] === g.settings.basePoint));
        state.playerTrophies[user.id].chaos_theory = (() => {
            let consecutiveDifferentRanks = 0;
            for (const game of playerGames) {
                for (const hanchan of game.scores) {
                    const { rawRanks } = calculateHanchanRanksAndPoints(hanchan.rawScores);
                    const ranks = Object.values(rawRanks);
                    if (new Set(ranks).size === 4) {
                        consecutiveDifferentRanks++;
                    } else {
                        consecutiveDifferentRanks = 0;
                    }
                    if (consecutiveDifferentRanks >= 4) return true;
                }
            }
            return false;
        })();
        state.playerTrophies[user.id].peaceful_village = targetGames.some(g => g.scores.some(s => Object.values(s.rawScores).every(score => score === 25000)));
    });
}

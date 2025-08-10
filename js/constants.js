export const YAKUMAN_LIST = [
    '国士無双', '四暗刻', '大三元', '緑一色', '字一色', '清老頭', '九蓮宝燈', '四槓子', '天和', '地和',
    '国士無双十三面待ち', '四暗刻単騎', '純正九蓮宝燈', '大四喜', '小四喜'
];

export const PENALTY_REASONS = {
    chombo: ['誤ロン・誤ツモ', 'ノーテンリーチ', 'その他'],
    agariHouki: ['多牌・少牌', '喰い替え', 'その他']
};

export const YAKUMAN_INCOMPATIBILITY = {
    '天和': ['国士無双', '四暗刻', '大三元', '緑一色', '字一色', '清老頭', '九蓮宝燈', '四槓子', '地和', '国士無双十三面待ち', '四暗刻単騎', '純正九蓮宝燈', '大四喜', '小四喜'],
    '地和': ['国士無双', '四暗刻', '大三元', '緑一色', '字一色', '清老頭', '九蓮宝燈', '四槓子', '天和', '国士無双十三面待ち', '四暗刻単騎', '純正九蓮宝燈', '大四喜', '小四喜'],
    '国士無双': ['四暗刻', '大三元', '緑一色', '字一色', '清老頭', '九蓮宝燈', '四槓子', '天和', '地和', '四暗刻単騎', '純正九蓮宝燈', '大四喜', '小四喜'],
    '国士無双十三面待ち': ['四暗刻', '大三元', '緑一色', '字一色', '清老頭', '九蓮宝燈', '四槓子', '天和', '地和', '四暗刻単騎', '純正九蓮宝燈', '大四喜', '小四喜'],
    '九蓮宝燈': ['国士無双', '四暗刻', '大三元', '緑一色', '字一色', '清老頭', '四槓子', '天和', '地和', '国士無双十三面待ち', '四暗刻単騎', '大四喜', '小四喜'],
    '純正九蓮宝燈': ['国士無双', '四暗刻', '大三元', '緑一色', '字一色', '清老頭', '四槓子', '天和', '地和', '国士無双十三面待ち', '四暗刻単騎', '大四喜', '小四喜'],
    '四槓子': ['国士無双', '四暗刻', '大三元', '緑一色', '字一色', '清老頭', '九蓮宝燈', '天和', '地和', '国士無双十三面待ち', '四暗刻単騎', '純正九蓮宝燈', '大四喜', '小四喜'],
    '四暗刻': ['国士無双', '九蓮宝燈', '四槓子', '国士無双十三面待ち', '純正九蓮宝燈'],
    '四暗刻単騎': ['国士無双', '九蓮宝燈', '四槓子', '国士無双十三面待ち', '純正九蓮宝燈'],
    '大三元': ['国士無双', '九蓮宝燈', '四槓子', '緑一色', '清老頭', '国士無双十三面待ち', '純正九蓮宝燈'],
    '字一色': ['国士無双', '九蓮宝燈', '緑一色', '清老頭', '国士無双十三面待ち', '純正九蓮宝燈'],
    '緑一色': ['国士無双', '九蓮宝燈', '大三元', '字一色', '清老頭', '国士無双十三面待ち', '純正九蓮宝燈', '大四喜', '小四喜'],
    '清老頭': ['国士無双', '九蓮宝燈', '大三元', '字一色', '緑一色', '国士無双十三面待ち', '純正九蓮宝燈', '大四喜', '小四喜'],
    '大四喜': ['国士無双', '九蓮宝燈', '小四喜', '国士無双十三面待ち', '純正九蓮宝燈'],
    '小四喜': ['国士無双', '九蓮宝燈', '大四喜', '国士無双十三面待ち', '純正九蓮宝燈'],
};

export const TROPHY_DEFINITIONS = {
    bronze: [
        { id: 'first_game', name: '初陣', desc: '初めて対局に参加する', icon: 'fa-chess-pawn' },
        { id: 'first_top', name: '初トップ', desc: '初めてトップを取る', icon: 'fa-crown' },
        { id: 'first_plus_day', name: '初勝利の味', desc: '初めて1日の収支をプラスで終える', icon: 'fa-arrow-trend-up' },
        { id: 'ten_games', name: '雀士認定', desc: '累計10半荘を戦い抜く', icon: 'fa-user-check' },
        { id: 'first_busted', name: 'これも経験', desc: '初めてトんだ', icon: 'fa-piggy-bank' },
        { id: 'first_last', name: '捲土重来の誓い', desc: '初めて4位で半荘を終えた', icon: 'fa-flag' },
        { id: 'score_under_1000', name: '虫の息', desc: '持ち点が1,000点未満の状態で対局を終える', icon: 'fa-heart-pulse' },
        { id: 'daily_high_score', name: '今日のヒーロー', desc: '1日の対局で最も高いスコアを記録する', icon: 'fa-star' },
    ],
    silver: [
        { id: 'twenty_five_games', name: 'リーグの主軸', desc: '累計25半荘を戦い抜く', icon: 'fa-users' },
        { id: 'yakuman', name: '神域の淵', desc: '初めて役満を和了する', icon: 'fa-dragon' },
        { id: 'plus_100_day', name: '爆勝ち', desc: '1日で合計+100pt以上を獲得する', icon: 'fa-sack-dollar' },
        { id: 'five_rentai', name: '連対の鬼', desc: '5連続で連対(1位か2位)を達成する', icon: 'fa-link' },
        { id: 'score_over_50k', name: '高打点メーカー', desc: '1半荘で50,000点以上を獲得する', icon: 'fa-bomb' },
        { id: 'dramatic_finish', name: 'ドラマティック・フィニッシュ', desc: '1日の最終半荘で逆転して1位になる', icon: 'fa-film' },
        { id: 'ten_tops', name: 'トップハンター', desc: '通算1位獲得回数が10回に到達する', icon: 'fa-crosshairs' },
        { id: 'monthly_player', name: 'マンスリープレイヤー', desc: '1か月のうちに15半荘以上対局する', icon: 'fa-calendar-days' },
        { id: 'zero_point_finish', name: '実質何もしてない', desc: '収支が±0.0で対局を終える', icon: 'fa-equals' },
    ],
    gold: [
        { id: 'fifty_tops', name: '伝説の始まり', desc: '通算1位獲得回数が50回に到達する', icon: 'fa-book-journal-whills' },
        { id: 'self_redemption', name: '自らの尻拭い', desc: '前回の対局のマイナス収支を、今回のプラス収支で完全に取り返す', icon: 'fa-hand-sparkles' },
        { id: 'close_win', name: 'ハナ差', desc: '2位と1,000点未満の点差で1位になる', icon: 'fa-ruler-horizontal' },
        { id: 'all_negative_win', name: 'やりたい事やりすぎ', desc: 'その半荘の参加者全員をマイナス収支にして1位を取る', icon: 'fa-volcano' },
        { id: 'ten_no_last', name: 'カッチカチ麻雀', desc: '10半荘連続でラス回避をする', icon: 'fa-shield-virus' },
        { id: 'three_same_rank', name: 'マイブーム？', desc: '3半荘連続で同じ順位を取り続ける', icon: 'fa-clone' },
        { id: 'finish_over_50k', name: '勝者の余裕', desc: '1回の対局で50,000点以上を獲得して終了する', icon: 'fa-champagne-glasses' },
        { id: 'score_under_minus_30k', name: '地底の奥底', desc: '-30,000点未満で対局を終える', icon: 'fa-person-falling-burst' },
    ],
    platinum: [
        { id: 'two_hundred_games', name: '君がいなきゃ始まらない', desc: '累計200半荘を戦い抜く', icon: 'fa-book-skull' },
        { id: 'four_top_streak', name: '雀神の導き', desc: '4半荘連続で1位を獲得する', icon: 'fa-brain' },
        { id: 'twenty_five_no_last', name: '絶対防衛線', desc: '25回連続でラスを回避する', icon: 'fa-torii-gate' },
        { id: 'finish_over_70k', name: '背中も見せない', desc: '70,000点以上を獲得して対局を終える', icon: 'fa-person-running' },
        { id: 'avg_rank_2_3', name: '圧倒的実力', desc: '年間平均順位が2.3以下（年間50半荘以上）', icon: 'fa-chart-line' },
        { id: 'ten_close_games', name: '歴戦の猛者', desc: '1,000点差以内の僅差での決着を10回経験する（勝ち負け問わず）', icon: 'fa-swords' },
        { id: 'undefeated_month', name: '無敗神話', desc: '1ヶ月間（月間10半荘以上）、一度も4位を取らない', icon: 'fa-calendar-check' },
        { id: 'kokushi', name: '十三の旗印', desc: '国士無双を和了する', icon: 'fa-flag', secret: true },
        { id: 'suuankou', name: '闇に潜む刺客', desc: '四暗刻を和了する', icon: 'fa-user-secret', secret: true },
        { id: 'daisangen', name: '三元龍の咆哮', desc: '大三元を和了する', icon: 'fa-dragon', secret: true },
        { id: 'tsuuiisou', name: '刻まれし言霊', desc: '字一色を和了する', icon: 'fa-font', secret: true },
        { id: 'ryuuiisou', name: '翠玉の輝き', desc: '緑一色を和了する', icon: 'fa-leaf', secret: true },
        { id: 'chinroutou', name: '万物の始祖', desc: '清老頭を和了する', icon: 'fa-dice-one', secret: true },
        { id: 'chuuren', name: '九連の灯火', desc: '九蓮宝燈を和了する', icon: 'fa-lightbulb', secret: true },
        { id: 'shousuushii', name: '風の支配者', desc: '小四喜を和了する', icon: 'fa-wind', secret: true },
    ],
    crystal: [
        { id: 'five_top_streak', name: '天衣無縫', desc: '5半荘連続で1位を獲得する', icon: 'fa-feather-pointed' },
        { id: 'yearly_avg_rank_2_0', name: '頂への道', desc: '年間平均順位が2.0以下（年間50戦以上）', icon: 'fa-mountain-sun' },
        { id: 'recent_100_avg_rank_1_5', name: '全知全能', desc: '直近100半荘の平均着順が1.5以下', icon: 'fa-eye' },
        { id: 'thirty_no_last', name: 'アルティメット・ガーディアン', desc: '30半荘連続でラスを回避する', icon: 'fa-shield-heart' },
        { id: 'finish_over_100k', name: '膏血の強奪', desc: '100,000点以上を獲得して対局を終える', icon: 'fa-gem' },
        { id: 'two_yakuman_day', name: '神はサイコロを振らない', desc: '1日のうちに2回役満を和了する', icon: 'fa-dice' },
        { id: 'three_yakuman_types', name: '役満コレクター', desc: '3種類以上の役満を和了する', icon: 'fa-box-archive' },
        { id: 'tenhou', name: '天命', desc: '天和を和了する', icon: 'fa-hand-sparkles', secret: true },
        { id: 'chiihou', name: '地の啓示', desc: '地和を和了する', icon: 'fa-hand-holding-hand', secret: true },
        { id: 'kokushi13', name: '終焉の十三面', desc: '国士無双十三面待ちを和了する', icon: 'fa-skull', secret: true },
        { id: 'suuankou_tanki', name: '静寂切り裂く一閃', desc: '四暗刻単騎を和了する', icon: 'fa-user-ninja', secret: true },
        { id: 'junsei_chuuren', name: '死の篝火', desc: '純正九蓮宝燈を和了する', icon: 'fa-fire', secret: true },
        { id: 'daisuushii', name: '風を統べる者', desc: '大四喜を和了する', icon: 'fa-tornado', secret: true },
    ],
    chaos: [
        { id: 'yakuman_then_busted_last', name: '天国と地獄', desc: '役満を和了した次の対局で、ハコテンラスになる', icon: 'fa-yin-yang' },
        { id: 'perfect_world', name: '完全世界', desc: '4人の最終スコアが、1位から順に40,000、30,000、20,000、10,000点になる', icon: 'fa-globe' },
        { id: 'reincarnation', name: '輪廻転生', desc: '4人の順位が、前回の対局の順位から完全に逆転する', icon: 'fa-recycle' },
        { id: 'reroll', name: 'リセマラ', desc: '最初の持ち点と全く同じ点数で対局を終える', icon: 'fa-arrow-rotate-left' },
        { id: 'chaos_theory', name: 'カオス理論', desc: '4半荘連続で、4人全員が違う順位になる', icon: 'fa-hurricane' },
        { id: 'peaceful_village', name: '平和村', desc: '4人の最終スコアが、全員25,000点ずつになる', icon: 'fa-dove' },
    ]
};

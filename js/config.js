/**
 * Game Configurations
 * Each game's rules, colors, and settings
 */

const GAMES = {
    shanghai: {
        name: "Shang-Hi", 
        color: "#27ae60",
        type: "low_score", 
        phases: ["score"], 
        rounds: [
            "2 Sets of 3", 
            "1 Set of 3, 1 Run of 4", 
            "2 Runs of 4", 
            "3 Sets of 3",
            "1 Set of 3, 1 Run of 7", 
            "2 Sets of 3, 1 Run of 5", 
            "3 Runs of 4",
            "1 Set of 3, 1 Run of 10", 
            "3 Sets of 3, 1 Run of 5", 
            "3 Runs of 5"
        ],
        hasTeams: true, 
        hasRandomize: true, 
        hasDealer: true, 
        hasStars: true
    },
    
    mexicantrain: {
        name: "Mexican Train", 
        color: "#d35400",
        type: "low_score",
        phases: ["score"],
        rounds: 13, 
        hasStarter: true, 
        hasTeams: false
    },
    
    oldhell: {
        name: "Old Hell", 
        color: "#8e44ad",
        type: "high_score",
        phases: ["bid", "score"], 
        handSize: 52, 
        hasDealer: true, 
        hasTeams: false
    },
    
    spades: {
        name: "Spades", 
        color: "#2c3e50",
        type: "target_score", 
        target: 500,
        phases: ["bid", "score"],
        hasDealer: true, 
        hasTeams: true,
        hasBlindNil: true
    },
    
    hearts: {
        name: "Hearts", 
        color: "#c0392b",
        type: "low_score",
        target: 100, 
        maxPlayers: 6, 
        phases: ["score"],
        validation: "sum_26", 
        hasDealer: true, 
        hasTeams: false,
        helpers: [
            { id: 'moon', label: 'Moon', val: 0, text: '🌙' }
        ]
    },
    
    rummikub: {
        name: "Rummikub", 
        color: "#2980b9",
        type: "high_score", 
        phases: ["score"],
        rounds: 99, 
        hasDealer: false, 
        hasTeams: false
    },
    
    triominos: {
        name: "Triominos", 
        color: "#f39c12",
        type: "low_score", 
        phases: ["score"],
        rounds: 99, 
        hasDealer: false, 
        hasTeams: false
    },
    
    qwirkle: {
        name: "Qwirkle", 
        color: "#e74c3c",
        type: "high_score", 
        phases: ["score"],
        rounds: 99, 
        hasDealer: false, 
        hasTeams: false,
        helpers: [
            { id: 'q', label: 'Q', val: 6, text: '+6' },
            { id: 'qq', label: 'QQ', val: 12, text: '+12' },
            { id: 'end', label: 'Finish', val: 6, isEnd: true, text: '+6' }
        ]
    }
};

const COMMON_NAMES = ["Angie", "Daren", "Derek", "Dylan", "Lina", "Nick", "Quinn"];

const DOMINO_COLORS = [
    'none',
    '#1E90FF',
    '#2ECC71',
    '#E74C3C',
    '#A0522D',
    '#F1C40F',
    '#16A085',
    '#9B59B6',
    '#00BFFF',
    '#FF00FF',
    '#FF8C00',
    '#333333',
    '#95A5A6'
];
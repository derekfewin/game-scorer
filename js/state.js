/**
 * Global State Management
 * Manages the current game state and configuration
 */

let state = {
    gameKey: 'shanghai',
    currentGame: null,
    // Multiplayer state
    isHost: false,
    isViewer: false,
    gameCode: null,
    firebaseRef: null
};

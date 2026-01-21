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
    viewerCount: 0,
    viewerId: null,          // Unique ID for this browser session
    viewingAsPlayerIdx: null, // The index of the player we are "being" (0, 1, 2...)
    firebaseRef: null
};
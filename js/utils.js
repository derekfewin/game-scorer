/**
 * Utility Functions
 * Helper functions used across the app
 */

/**
 * Get suit icon for card games
 */
function getSuitIcon(suit) {
    if(suit === 'S') return '♠';
    if(suit === 'C') return '♣';
    if(suit === 'H') return '♥';
    if(suit === 'D') return '♦';
    return '';
}

/**
 * Generate SVG for domino tiles (Mexican Train)
 */
function getDominoSvg(val, size) {
    const grid = {
        TL: [25, 25], TM: [50, 25], TR: [75, 25],
        ML: [25, 50], MM: [50, 50], MR: [75, 50],
        BL: [25, 75], BM: [50, 75], BR: [75, 75]
    };
    
    const layouts = {
        0: [],
        1: [grid.MM],
        2: [grid.TR, grid.BL],
        3: [grid.TR, grid.MM, grid.BL],
        4: [grid.TL, grid.TR, grid.BL, grid.BR],
        5: [grid.TL, grid.TR, grid.MM, grid.BL, grid.BR],
        6: [grid.TL, grid.TR, grid.ML, grid.MR, grid.BL, grid.BR],
        7: [grid.TL, grid.TR, grid.ML, grid.MM, grid.MR, grid.BL, grid.BR],
        8: [grid.TL, grid.TM, grid.TR, grid.ML, grid.MR, grid.BL, grid.BM, grid.BR],
        9: [grid.TL, grid.TM, grid.TR, grid.ML, grid.MM, grid.MR, grid.BL, grid.BM, grid.BR],
        10: [[25,20],[75,20],[50,20],[25,80],[75,80],[50,80],[25,40],[75,40],[25,60],[75,60]],
        11: [[25,20],[75,20],[50,20],[25,80],[75,80],[50,80],[25,40],[75,40],[25,60],[75,60],[50,50]],
        12: [[25,20],[50,20],[75,20],[25,40],[50,40],[75,40],[25,60],[50,60],[75,60],[25,80],[50,80],[75,80]]
    };
    
    let dots = (layouts[val] || [])
        .map(p => `<circle cx="${p[0]}" cy="${p[1]}" r="9" fill="${DOMINO_COLORS[val]}"/>`)
        .join('');
    
    return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" 
            style="background:white; border:1px solid #333; margin:1px; border-radius:3px">
            ${dots}
            </svg>`;
}

/**
 * Reset theme colors to default
 */
function resetTheme() {
    document.documentElement.style.removeProperty('--primary');
    document.documentElement.style.removeProperty('--accent');
}

/**
 * Clear error message display
 */
function clearError() {
    document.getElementById('error-msg').style.display = 'none';
}
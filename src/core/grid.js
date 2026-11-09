export const GRID_WIDTH = 10;
export const GRID_HEIGHT = 20;

/**
 * Crée une grille vide de 10 colonnes et 20 lignes.
 * @returns {number[][]} Grille indépendante composée de cases initialisées à 0.
 */
export function createGrid() {
    return Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(0));
}

function validateGrid(grid) {
    if (
        !Array.isArray(grid)
        || grid.length !== GRID_HEIGHT
        || grid.some(row =>
            !Array.isArray(row)
            || row.length !== GRID_WIDTH
            || row.some(cell => cell !== 0 && cell !== 1)
        )
    ) {
        throw new Error("La grille doit contenir 20 lignes de 10 cases binaires.");
    }
}

function validatePiece(piece) {
    if (
        !Array.isArray(piece)
        || piece.length === 0
        || piece.some(row =>
            !Array.isArray(row)
            || row.length !== piece.length
            || row.some(cell => cell !== 0 && cell !== 1)
        )
    ) {
        throw new Error("La pièce doit être une matrice carrée composée de 0 et de 1.");
    }
}

function validatePosition(x, y) {
    if (!Number.isInteger(x) || !Number.isInteger(y)) {
        throw new Error("La position de la pièce doit utiliser des coordonnées entières.");
    }
}

/**
 * Vérifie qu'une pièce ne dépasse pas la grille et ne chevauche aucune case occupée.
 * @param {number[][]} grid Grille binaire de 10 colonnes et 20 lignes.
 * @param {number[][]} piece Matrice carrée binaire de la pièce.
 * @param {number} x Coordonnée horizontale de la matrice dans la grille.
 * @param {number} y Coordonnée verticale de la matrice dans la grille.
 * @returns {boolean} Vrai si toutes les cases occupées de la pièce peuvent être placées.
 */
export function canPlacePiece(grid, piece, x, y) {
    validateGrid(grid);
    validatePiece(piece);
    validatePosition(x, y);

    for (let row = 0; row < piece.length; row++) {
        for (let column = 0; column < piece[row].length; column++) {
            if (piece[row][column] === 0) {
                continue;
            }

            const gridX = x + column;
            const gridY = y + row;
            if (
                gridX < 0
                || gridX >= GRID_WIDTH
                || gridY < 0
                || gridY >= GRID_HEIGHT
                || grid[gridY][gridX] === 1
            ) {
                return false;
            }
        }
    }

    return true;
}

/**
 * Retourne une copie de la grille où les cases occupées de la pièce sont verrouillées.
 * @param {number[][]} grid Grille binaire de départ.
 * @param {number[][]} piece Matrice carrée binaire de la pièce.
 * @param {number} x Coordonnée horizontale de la pièce.
 * @param {number} y Coordonnée verticale de la pièce.
 * @returns {number[][]} Nouvelle grille; la grille d'origine n'est pas modifiée.
 */
export function placePiece(grid, piece, x, y) {
    if (!canPlacePiece(grid, piece, x, y)) {
        throw new Error("La pièce ne peut pas être placée à cette position.");
    }

    const nextGrid = grid.map(row => [...row]);
    for (let row = 0; row < piece.length; row++) {
        for (let column = 0; column < piece[row].length; column++) {
            if (piece[row][column] === 1) {
                nextGrid[y + row][x + column] = 1;
            }
        }
    }
    return nextGrid;
}

/**
 * Supprime toutes les lignes complètes et ajoute autant de lignes vides en haut.
 * @param {number[][]} grid Grille binaire à traiter.
 * @returns {{grid: number[][], clearedRows: number}} Nouvelle grille et nombre de lignes supprimées.
 */
export function clearFullRows(grid) {
    validateGrid(grid);

    const remainingRows = grid.filter(row => row.some(cell => cell === 0));
    const clearedRows = GRID_HEIGHT - remainingRows.length;
    const emptyRows = Array.from(
        { length: clearedRows },
        () => Array(GRID_WIDTH).fill(0),
    );

    return {
        grid: [...emptyRows, ...remainingRows.map(row => [...row])],
        clearedRows,
    };
}

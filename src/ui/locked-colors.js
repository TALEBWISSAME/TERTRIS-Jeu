import { GRID_HEIGHT, GRID_WIDTH } from "../core/grid.js";
import { PIECES } from "../core/piece.js";

function isValidGrid(grid) {
    return Array.isArray(grid)
        && grid.length === GRID_HEIGHT
        && grid.every(row =>
            Array.isArray(row)
            && row.length === GRID_WIDTH
            && row.every(cell => cell === 0 || cell === 1)
        );
}

function gridsEqual(first, second) {
    return first.every((row, y) => row.every((cell, x) => cell === second[y][x]));
}

/**
 * Synchronise les couleurs d'une pièce verrouillée avec la grille issue du moteur.
 * Les lignes retirées sont retournées sous forme d'instantanés pour l'animation.
 * @param {number[][]} previousGrid Grille binaire avant le verrouillage.
 * @param {(string|null)[][]} lockedColors Couleurs associées aux cases déjà occupées.
 * @param {{type: string, matrix: number[][], x: number, y: number}} piece Pièce qui vient d'être verrouillée.
 * @param {number[][]} nextGrid Grille binaire obtenue après le verrouillage et la suppression des lignes.
 * @returns {{lockedColors: (string|null)[][], removedRows: (string|null)[][]}} Couleurs synchronisées et lignes effacées.
 * @throws {Error} Si les dimensions, le verrouillage ou la correspondance des grilles sont invalides.
 */
export function applyLockedPiece(previousGrid, lockedColors, piece, nextGrid) {
    if (!isValidGrid(previousGrid) || !isValidGrid(nextGrid)) {
        throw new Error("La grille avant et après verrouillage doit mesurer 10 × 20.");
    }
    if (
        !Array.isArray(lockedColors)
        || lockedColors.length !== GRID_HEIGHT
        || lockedColors.some(row => !Array.isArray(row) || row.length !== GRID_WIDTH)
    ) {
        throw new Error("La grille des couleurs doit mesurer 10 × 20.");
    }
    if (
        !piece
        || !PIECES[piece.type]
        || !Array.isArray(piece.matrix)
        || !Number.isInteger(piece.x)
        || !Number.isInteger(piece.y)
    ) {
        throw new Error("La pièce verrouillée est invalide.");
    }

    const colors = lockedColors.map((row, y) => row.map((color, x) => {
        if (previousGrid[y][x] === 1 && !PIECES[color]) {
            throw new Error("Une case occupée ne possède pas de couleur valide.");
        }
        if (previousGrid[y][x] === 0 && color !== null) {
            throw new Error("Une case vide possède une couleur inattendue.");
        }
        return color;
    }));

    for (let y = 0; y < piece.matrix.length; y++) {
        for (let x = 0; x < piece.matrix[y].length; x++) {
            if (piece.matrix[y][x] !== 1) {
                continue;
            }

            const gridX = piece.x + x;
            const gridY = piece.y + y;
            if (
                gridX < 0
                || gridX >= GRID_WIDTH
                || gridY < 0
                || gridY >= GRID_HEIGHT
                || previousGrid[gridY][gridX] !== 0
            ) {
                throw new Error("La pièce ne peut pas être synchronisée hors de la grille ou en collision.");
            }
            colors[gridY][gridX] = piece.type;
        }
    }

    const clearedRows = colors
        .map((row, index) => row.every(Boolean) ? index : -1)
        .filter(index => index !== -1);
    const removedRows = clearedRows.map(index => [...colors[index]]);
    const remainingRows = colors.filter((_, index) => !clearedRows.includes(index));
    const synchronizedColors = [
        ...Array.from({ length: clearedRows.length }, () => Array(GRID_WIDTH).fill(null)),
        ...remainingRows,
    ];
    const expectedGrid = synchronizedColors.map(row => row.map(color => color ? 1 : 0));

    if (!gridsEqual(expectedGrid, nextGrid)) {
        throw new Error("La grille des couleurs ne correspond pas à la grille du moteur.");
    }

    return { lockedColors: synchronizedColors, removedRows };
}

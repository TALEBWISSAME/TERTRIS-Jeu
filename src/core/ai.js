import {
    canPlacePiece,
    clearFullRows,
    GRID_HEIGHT,
    GRID_WIDTH,
    placePiece,
} from "./grid.js";
import { rotate } from "./piece.js";

const COMPLETED_LINE_SCORE = 100;
const HOLE_PENALTY = 50;
const HEIGHT_PENALTY = 1;
const MAX_HEIGHT_PENALTY = 2;

/** Délai entre deux déplacements d'une case, en millisecondes. */
export const AI_MOVE_INTERVALS_MS = {
    beginner: 300,
    intermediate: 200,
    expert: 100,
};

function simulatePlacement(grid, placement) {
    const placedGrid = placePiece(grid, placement.matrix, placement.x, placement.y);
    return clearFullRows(placedGrid);
}

function evaluatePlacement(grid, placement) {
    const { grid: settledGrid, clearedRows } = simulatePlacement(grid, placement);
    let aggregateHeight = 0;
    let maximumHeight = 0;
    let holes = 0;

    for (let x = 0; x < GRID_WIDTH; x++) {
        let firstOccupiedRow = GRID_HEIGHT;
        for (let y = 0; y < GRID_HEIGHT; y++) {
            if (settledGrid[y][x] === 1) {
                firstOccupiedRow = y;
                break;
            }
        }

        const columnHeight = GRID_HEIGHT - firstOccupiedRow;
        aggregateHeight += columnHeight;
        maximumHeight = Math.max(maximumHeight, columnHeight);
        for (let y = firstOccupiedRow + 1; y < GRID_HEIGHT; y++) {
            if (settledGrid[y][x] === 0) {
                holes++;
            }
        }
    }

    return clearedRows * COMPLETED_LINE_SCORE
        - holes * HOLE_PENALTY
        - aggregateHeight * HEIGHT_PENALTY
        - maximumHeight * MAX_HEIGHT_PENALTY;
}

/**
 * Calcule les caractéristiques du plateau et le score pondéré de l'IA Experte.
 * @param {number[][]} grid Grille binaire à analyser.
 * @param {number} [linesCleared=0] Lignes supprimées par le placement évalué.
 * @returns {{aggregateHeight: number, linesCleared: number, holes: number, irregularity: number, score: number}}
 * Hauteur cumulée, lignes supprimées, trous, irrégularité et score calculé.
 */
export function evaluateExpertFeatures(grid, linesCleared = 0) {
    let aggregateHeight = 0;
    let holes = 0;
    const columnHeights = [];

    for (let x = 0; x < GRID_WIDTH; x++) {
        let firstOccupiedRow = GRID_HEIGHT;
        for (let y = 0; y < GRID_HEIGHT; y++) {
            if (grid[y][x] === 1) {
                firstOccupiedRow = y;
                break;
            }
        }

        const height = GRID_HEIGHT - firstOccupiedRow;
        columnHeights.push(height);
        aggregateHeight += height;
        for (let y = firstOccupiedRow + 1; y < GRID_HEIGHT; y++) {
            if (grid[y][x] === 0) {
                holes++;
            }
        }
    }

    let irregularity = 0;
    for (let x = 1; x < columnHeights.length; x++) {
        irregularity += Math.abs(columnHeights[x] - columnHeights[x - 1]);
    }

    const score = -0.51 * aggregateHeight
        + 0.76 * linesCleared
        - 0.36 * holes
        - 0.18 * irregularity;
    return { aggregateHeight, linesCleared, holes, irregularity, score };
}

/**
 * Énumère les positions finales légales d'une pièce, en ignorant les rotations identiques.
 * La descente est simulée sans modifier la grille ni la matrice reçues.
 * @param {number[][]} grid Grille binaire de 10 colonnes et 20 lignes.
 * @param {number[][]} piece Matrice carrée binaire de la pièce.
 * @returns {{rotation: number, matrix: number[][], x: number, y: number}[]} Placements finaux légaux.
 */
export function findLegalPlacements(grid, piece) {
    canPlacePiece(grid, piece, 0, 0);

    const placements = [];
    const seenOrientations = new Set();
    let matrix = piece.map(row => [...row]);

    for (let rotation = 0; rotation < 4; rotation++) {
        const orientation = JSON.stringify(matrix);
        if (!seenOrientations.has(orientation)) {
            seenOrientations.add(orientation);

            for (let x = 1 - matrix.length; x < GRID_WIDTH; x++) {
                if (!canPlacePiece(grid, matrix, x, 0)) {
                    continue;
                }

                let y = 0;
                while (canPlacePiece(grid, matrix, x, y + 1)) {
                    y++;
                }
                placements.push({
                    rotation,
                    matrix: matrix.map(row => [...row]),
                    x,
                    y,
                });
            }
        }
        matrix = rotate(matrix);
    }

    return placements;
}

/**
 * Choisit au hasard un placement parmi les placements légaux.
 * @param {number[][]} grid Grille binaire de la partie.
 * @param {number[][]} piece Matrice de la pièce à placer.
 * @param {() => number} [random=Math.random] Générateur qui retourne une valeur entre 0 inclus et 1 exclu.
 * @returns {{rotation: number, matrix: number[][], x: number, y: number}|null} Placement choisi, ou null si aucun n'existe.
 */
export function chooseBeginnerPlacement(grid, piece, random = Math.random) {
    if (typeof random !== "function") {
        throw new TypeError("Le générateur aléatoire doit être une fonction.");
    }

    const placements = findLegalPlacements(grid, piece);
    if (placements.length === 0) {
        return null;
    }

    const value = random();
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value >= 1) {
        throw new RangeError("Le générateur aléatoire doit retourner un nombre entre 0 inclus et 1 exclu.");
    }
    return placements[Math.floor(value * placements.length)];
}

/**
 * Choisit le placement qui complète des lignes en limitant les trous et la hauteur.
 * @param {number[][]} grid Grille binaire de la partie.
 * @param {number[][]} piece Matrice de la pièce à placer.
 * @returns {{rotation: number, matrix: number[][], x: number, y: number}|null} Meilleur placement, ou null si aucun n'existe.
 */
export function chooseIntermediatePlacement(grid, piece) {
    const placements = findLegalPlacements(grid, piece);
    let bestPlacement = null;
    let bestScore = -Infinity;

    for (const placement of placements) {
        const score = evaluatePlacement(grid, placement);
        if (score > bestScore) {
            bestPlacement = placement;
            bestScore = score;
        }
    }

    return bestPlacement;
}

/**
 * Choisit le placement qui obtient le meilleur score expert, avec une anticipation facultative.
 * @param {number[][]} grid Grille binaire de la partie.
 * @param {number[][]} piece Matrice de la pièce actuelle.
 * @param {number[][]} [nextPiece] Matrice de la prochaine pièce si elle est connue.
 * @returns {{rotation: number, matrix: number[][], x: number, y: number}|null} Meilleur placement, ou null si aucun n'existe.
 */
export function chooseExpertPlacement(grid, piece, nextPiece) {
    const placements = findLegalPlacements(grid, piece);
    let bestPlacement = null;
    let bestScore = -Infinity;

    for (const placement of placements) {
        const { grid: nextGrid, clearedRows } = simulatePlacement(grid, placement);
        const currentScore = evaluateExpertFeatures(nextGrid, clearedRows).score;
        let score = currentScore;

        if (nextPiece !== undefined && nextPiece !== null) {
            const nextPlacements = findLegalPlacements(nextGrid, nextPiece);
            let bestNextScore = -Infinity;
            for (const nextPlacement of nextPlacements) {
                const { grid: finalGrid, clearedRows: nextClearedRows } =
                    simulatePlacement(nextGrid, nextPlacement);
                bestNextScore = Math.max(
                    bestNextScore,
                    evaluateExpertFeatures(finalGrid, nextClearedRows).score,
                );
            }
            if (bestNextScore > -Infinity) {
                score += bestNextScore;
            }
        }

        if (score > bestScore) {
            bestPlacement = placement;
            bestScore = score;
        }
    }

    return bestPlacement;
}

/**
 * Prend une décision de placement avec l'une des trois stratégies disponibles.
 */
export class AIPlayer {
    /**
     * Initialise une IA avec son niveau et son générateur aléatoire.
     * @param {object} options Niveau de l'IA et générateur facultatif.
     * @param {"beginner"|"intermediate"|"expert"} options.difficulty Niveau de stratégie.
     * @param {() => number} [options.random=Math.random] Générateur utilisé par le niveau débutant.
     * @throws {RangeError} Si le niveau n'est pas reconnu.
     * @throws {TypeError} Si le générateur n'est pas une fonction.
     */
    constructor({ difficulty, random = Math.random } = {}) {
        if (!Object.hasOwn(AI_MOVE_INTERVALS_MS, difficulty)) {
            throw new RangeError("Le niveau doit être beginner, intermediate ou expert.");
        }
        if (typeof random !== "function") {
            throw new TypeError("Le générateur aléatoire doit être une fonction.");
        }

        this.difficulty = difficulty;
        this.random = random;
        this.moveIntervalMs = AI_MOVE_INTERVALS_MS[difficulty];
    }

    /**
     * Choisit une rotation et une colonne d'origine légales pour la pièce.
     * L'analyse utilise des copies de la grille; la partie n'est pas modifiée.
     * @param {number[][]} grid Grille actuelle.
     * @param {number[][]} piece Matrice de la pièce active.
     * @param {number[][]} [next] Matrice de la prochaine pièce, utilisée par l'expert.
     * @returns {{rotation: number, colonne: number}|null} Décision, ou null si aucun placement n'est légal.
     */
    decide(grid, piece, next) {
        const placement = this.difficulty === "beginner"
            ? chooseBeginnerPlacement(grid, piece, this.random)
            : this.difficulty === "intermediate"
                ? chooseIntermediatePlacement(grid, piece)
                : chooseExpertPlacement(grid, piece, next);

        return placement
            ? { rotation: placement.rotation, colonne: placement.x }
            : null;
    }
}

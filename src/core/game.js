import { canPlacePiece, clearFullRows, createGrid, placePiece } from "./grid.js";
import { PIECES, rotate } from "./piece.js";
import { getLevel, getLineScore } from "./scoring.js";

/** Intervalle de descente initial, en millisecondes. */
export const INITIAL_DROP_INTERVAL_MS = 1000;
/** Intervalle minimal de descente, en millisecondes. */
export const MIN_DROP_INTERVAL_MS = 100;
/** Réduction de l'intervalle de descente à chaque niveau, en millisecondes. */
export const DROP_INTERVAL_STEP_MS = 100;

const PIECE_TYPES = Object.keys(PIECES);

/**
 * Crée un générateur pseudo-aléatoire déterministe à partir d'une graine entière.
 * @param {number} seed Graine entière utilisée pour initialiser le générateur.
 * @returns {() => number} Fonction qui produit un nombre compris entre 0 inclus et 1 exclu.
 */
export function createSeededRandom(seed) {
    if (!Number.isInteger(seed)) {
        throw new TypeError("La graine doit être un entier.");
    }

    let state = seed >>> 0;
    return () => {
        state = (state + 0x6D2B79F5) >>> 0;
        let value = state;
        value = Math.imul(value ^ (value >>> 15), value | 1);
        value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
        return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
}

/**
 * Retourne l'intervalle de descente automatique correspondant au niveau.
 * @param {number} level Niveau entier, à partir de 1.
 * @returns {number} Délai en millisecondes, limité à la vitesse minimale.
 */
export function getDropInterval(level) {
    if (!Number.isInteger(level) || level < 1) {
        throw new RangeError("Le niveau doit être un entier supérieur ou égal à 1.");
    }
    return Math.max(
        MIN_DROP_INTERVAL_MS,
        INITIAL_DROP_INTERVAL_MS - (level - 1) * DROP_INTERVAL_STEP_MS,
    );
}

function choosePieceType(random) {
    const value = random();
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value >= 1) {
        throw new RangeError("Le générateur aléatoire doit retourner un nombre entre 0 inclus et 1 exclu.");
    }
    return PIECE_TYPES[Math.floor(value * PIECE_TYPES.length)];
}

function makePiece(type) {
    const matrix = PIECES[type].map(row => [...row]);
    return {
        type,
        matrix,
        x: Math.floor((10 - matrix.length) / 2),
        y: 0,
    };
}

function spawnPiece(game, type) {
    const piece = makePiece(type);
    if (!canPlacePiece(game.grid, piece.matrix, piece.x, piece.y)) {
        game.currentPiece = null;
        game.status = "gameover";
        return;
    }
    game.currentPiece = piece;
}

function lockCurrentPiece(game) {
    const { currentPiece } = game;
    game.grid = placePiece(game.grid, currentPiece.matrix, currentPiece.x, currentPiece.y);

    const result = clearFullRows(game.grid);
    game.grid = result.grid;
    if (result.clearedRows > 0) {
        game.linesCleared += result.clearedRows;
        game.score += getLineScore(result.clearedRows);
        game.level = getLevel(game.linesCleared);
        game.dropIntervalMs = getDropInterval(game.level);
    }

    const nextType = game.nextPieceType;
    game.nextPieceType = choosePieceType(game.random);
    spawnPiece(game, nextType);
}

function descend(game) {
    if (game.status !== "playing") {
        return game;
    }

    const { currentPiece } = game;
    if (canPlacePiece(game.grid, currentPiece.matrix, currentPiece.x, currentPiece.y + 1)) {
        currentPiece.y += 1;
    } else {
        lockCurrentPiece(game);
    }
    return game;
}

/**
 * Crée une partie avec une grille vide et ses deux premières pièces.
 * @param {object} [options] Options de création.
 * @param {number} [options.seed=0] Graine entière du générateur par défaut.
 * @param {() => number} [options.random] Générateur aléatoire injecté à la place du générateur seedable.
 * @returns {object} État mutable de la partie, incluant la grille, les pièces, le score et le statut.
 */
export function createGame({ seed = 0, random = createSeededRandom(seed) } = {}) {
    if (typeof random !== "function") {
        throw new TypeError("Le générateur aléatoire doit être une fonction.");
    }

    const game = {
        grid: createGrid(),
        currentPiece: null,
        nextPieceType: null,
        score: 0,
        linesCleared: 0,
        level: 1,
        dropIntervalMs: getDropInterval(1),
        status: "playing",
        random,
    };

    spawnPiece(game, choosePieceType(random));
    if (game.status === "playing") {
        game.nextPieceType = choosePieceType(random);
    }
    return game;
}

/**
 * Tente de déplacer la pièce active d'une case horizontalement.
 * @param {object} game État de la partie à modifier.
 * @param {-1|1} direction Direction du déplacement : -1 à gauche ou 1 à droite.
 * @returns {object} Le même état de partie, modifié seulement si le déplacement est légal.
 */
export function movePiece(game, direction) {
    if (game.status !== "playing") {
        return game;
    }
    if (direction !== -1 && direction !== 1) {
        throw new RangeError("La direction doit être -1 (gauche) ou 1 (droite).");
    }

    const { currentPiece } = game;
    if (canPlacePiece(
        game.grid,
        currentPiece.matrix,
        currentPiece.x + direction,
        currentPiece.y,
    )) {
        currentPiece.x += direction;
    }
    return game;
}

/**
 * Tente de tourner la pièce active d'un quart de tour horaire.
 * @param {object} game État de la partie à modifier.
 * @returns {object} Le même état de partie, modifié seulement si la rotation est légale.
 */
export function rotatePiece(game) {
    if (game.status !== "playing") {
        return game;
    }

    const { currentPiece } = game;
    const rotatedMatrix = rotate(currentPiece.matrix);
    if (canPlacePiece(game.grid, rotatedMatrix, currentPiece.x, currentPiece.y)) {
        currentPiece.matrix = rotatedMatrix;
    }
    return game;
}

/**
 * Effectue une étape de descente automatique et verrouille la pièce si elle ne peut plus descendre.
 * @param {object} game État de la partie à modifier.
 * @returns {object} Le même état de partie après l'étape de descente.
 */
export function tick(game) {
    return descend(game);
}

/**
 * Accélère la descente d'une case et verrouille la pièce si elle ne peut plus descendre.
 * @param {object} game État de la partie à modifier.
 * @returns {object} Le même état de partie après la descente accélérée.
 */
export function softDrop(game) {
    return descend(game);
}

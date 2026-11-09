import {
    createGame,
    movePiece,
    rotatePiece,
    softDrop,
    tick,
} from "./game.js";
import { canPlacePiece } from "./grid.js";
import { rotate } from "./piece.js";

function isSameMatrix(first, second) {
    return Array.isArray(first)
        && Array.isArray(second)
        && first.length === second.length
        && first.every((row, y) =>
            Array.isArray(row)
            && Array.isArray(second[y])
            && row.length === second[y].length
            && row.every((cell, x) => cell === second[y][x])
        );
}

function isPieceRotation(matrix, pieceMatrix) {
    let rotation = pieceMatrix;
    for (let quarterTurns = 0; quarterTurns < 4; quarterTurns++) {
        if (isSameMatrix(matrix, rotation)) {
            return true;
        }
        rotation = rotate(rotation);
    }
    return false;
}

/**
 * Partie indépendante qui délègue ses règles au moteur de jeu.
 */
export class GameInstance {
    /**
     * Crée un nouvel état de partie avec sa propre grille et son générateur aléatoire.
     * @param {object} [options] Graine et générateur aléatoire facultatif.
     * @param {number} [options.seed=0] Graine du générateur aléatoire par défaut.
     * @param {() => number} [options.random] Générateur aléatoire injecté, s'il est fourni.
     */
    constructor({ seed = 0, random } = {}) {
        this.state = random === undefined
            ? createGame({ seed })
            : createGame({ seed, random });
    }

    /** @returns {number[][]} Grille actuelle de la partie. */
    get grid() {
        return this.state.grid;
    }

    /** @returns {object|null} Pièce active, ou null si la partie est terminée. */
    get currentPiece() {
        return this.state.currentPiece;
    }

    /** @returns {string|null} Type de la prochaine pièce connue. */
    get nextPieceType() {
        return this.state.nextPieceType;
    }

    /** @returns {number} Score actuel. */
    get score() {
        return this.state.score;
    }

    /** @returns {number} Nombre total de lignes supprimées. */
    get linesCleared() {
        return this.state.linesCleared;
    }

    /** @returns {number} Niveau actuel. */
    get level() {
        return this.state.level;
    }

    /** @returns {number} Délai de descente automatique en millisecondes. */
    get dropIntervalMs() {
        return this.state.dropIntervalMs;
    }

    /** @returns {"playing"|"gameover"} Statut actuel de la partie. */
    get status() {
        return this.state.status;
    }

    /**
     * Déplace la pièce active d'une case à gauche ou à droite si le déplacement est légal.
     * @param {-1|1} direction -1 pour la gauche ou 1 pour la droite.
     * @returns {GameInstance} Cette instance pour permettre l'enchaînement des appels.
     */
    move(direction) {
        movePiece(this.state, direction);
        return this;
    }

    /**
     * Tourne la pièce active d'un quart de tour horaire si le placement est possible.
     * @returns {GameInstance} Cette instance.
     */
    rotate() {
        rotatePiece(this.state);
        return this;
    }

    /**
     * Fait descendre la pièce d'une case avec la descente accélérée.
     * @returns {GameInstance} Cette instance.
     */
    softDrop() {
        softDrop(this.state);
        return this;
    }

    /**
     * Effectue une étape de descente automatique.
     * @returns {GameInstance} Cette instance.
     */
    tick() {
        tick(this.state);
        return this;
    }

    /**
     * Remplace l'orientation et la position de la pièce active par un placement légal,
     * puis demande au moteur de la verrouiller. Le moteur gère ensuite les lignes,
     * le score, le niveau et la pièce suivante. Si la partie est terminée, ne fait rien.
     * @param {{matrix: number[][], x: number, y: number}} placement Position finale à appliquer.
     * @returns {GameInstance} Cette instance, modifiée si la partie est en cours.
     * @throws {Error} Si la partie est en cours et que le placement n'est pas une position finale légale.
     */
    playPlacement(placement) {
        if (this.state.status !== "playing") {
            return this;
        }
        if (
            !placement
            || !Array.isArray(placement.matrix)
            || !Number.isInteger(placement.x)
            || !Number.isInteger(placement.y)
            || !isPieceRotation(placement.matrix, this.state.currentPiece.matrix)
            || !canPlacePiece(this.state.grid, placement.matrix, placement.x, placement.y)
            || canPlacePiece(this.state.grid, placement.matrix, placement.x, placement.y + 1)
        ) {
            throw new Error("Le placement doit être une position finale légale.");
        }

        Object.assign(this.state.currentPiece, {
            matrix: placement.matrix.map(row => [...row]),
            x: placement.x,
            y: placement.y,
        });
        tick(this.state);
        return this;
    }
}

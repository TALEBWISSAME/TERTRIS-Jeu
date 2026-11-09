import { GameInstance } from "./game-instance.js";
import { createSeededRandom } from "./game.js";
import { AIPlayer } from "./ai.js";

/** Nombre maximal d'adversaires dans une partie. */
export const MAX_OPPONENTS = 3;
/** Valeurs acceptées pour le niveau de difficulté des adversaires. */
export const AI_DIFFICULTIES = ["beginner", "intermediate", "expert"];

/**
 * Crée le joueur humain et jusqu'à trois adversaires avec des parties indépendantes.
 */
export class GameManager {
    /**
     * Initialise les joueurs et leurs instances de jeu.
     * @param {object} [options] Nombre d'adversaires, graine et difficulté.
     * @param {number} [options.opponents=0] Nombre d'adversaires, de 0 à 3.
     * @param {number} [options.seed=0] Graine de base servant à créer les parties et les tirages IA.
     * @param {"beginner"|"intermediate"|"expert"} [options.difficulty="beginner"] Difficulté attribuée aux adversaires.
     */
    constructor({ opponents = 0, seed = 0, difficulty = "beginner" } = {}) {
        if (!Number.isInteger(opponents) || opponents < 0 || opponents > MAX_OPPONENTS) {
            throw new RangeError("Le nombre d'adversaires doit être compris entre 0 et 3.");
        }
        if (!Number.isInteger(seed)) {
            throw new TypeError("La graine doit être un entier.");
        }
        if (!AI_DIFFICULTIES.includes(difficulty)) {
            throw new RangeError("La difficulté doit être beginner, intermediate ou expert.");
        }

        this.humanPlayerIndex = 0;
        this.players = Array.from({ length: opponents + 1 }, (_, index) => {
            const role = index === this.humanPlayerIndex ? "human" : "opponent";
            const aiRandom = role === "opponent"
                ? createSeededRandom((seed + Math.imul(index, 0x9E3779B9)) >>> 0)
                : null;
            return {
                index,
                role,
                game: new GameInstance({ seed: (seed + index) >>> 0 }),
                difficulty: role === "opponent" ? difficulty : null,
                aiRandom,
                aiPlayer: role === "opponent"
                    ? new AIPlayer({ difficulty, random: aiRandom })
                    : null,
            };
        });
        this.eliminatedPlayers = [];
        this.winner = null;
        this.ranking = [];
        this.podium = [];
        this.isFinished = false;
    }

    /** @returns {object} Joueur humain, toujours placé en première position. */
    get humanPlayer() {
        return this.players[this.humanPlayerIndex];
    }

    /** @returns {object[]} Joueurs adverses, sans le joueur humain. */
    get opponents() {
        return this.players.filter(player => player.role === "opponent");
    }

    /** @returns {GameInstance[]} Instances de jeu dans l'ordre des joueurs. */
    get games() {
        return this.players.map(player => player.game);
    }

    /**
     * Met à jour le classement après un changement d'état des parties.
     * Le dernier joueur encore en jeu gagne; les joueurs éliminés sont classés
     * dans l'ordre inverse de leur élimination.
     * @returns {object[]} Classement complet, vide tant que le tournoi continue.
     */
    updateResults() {
        if (this.isFinished || this.players.length === 1) {
            return this.ranking;
        }

        for (const player of this.players) {
            if (
                player.game.status === "gameover"
                && !this.eliminatedPlayers.includes(player)
            ) {
                this.eliminatedPlayers.push(player);
            }
        }

        const remainingPlayers = this.players.filter(
            player => player.game.status === "playing",
        );
        if (remainingPlayers.length === 1 && this.eliminatedPlayers.length > 0) {
            this.winner = remainingPlayers[0];
            this.ranking = [this.winner, ...[...this.eliminatedPlayers].reverse()];
            this.podium = this.ranking.slice(0, 3);
            this.isFinished = true;
        } else if (remainingPlayers.length === 0) {
            this.ranking = [...this.eliminatedPlayers].reverse();
            this.podium = this.ranking.slice(0, 3);
            this.isFinished = true;
        }

        return this.ranking;
    }
}

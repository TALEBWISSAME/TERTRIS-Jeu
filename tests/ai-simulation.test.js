import { describe, expect, it } from "vitest";
import {
    chooseBeginnerPlacement,
    chooseExpertPlacement,
    chooseIntermediatePlacement,
} from "../src/core/ai.js";
import { createSeededRandom } from "../src/core/game.js";
import { GameInstance } from "../src/core/game-instance.js";
import { PIECES } from "../src/core/piece.js";

const SEEDS = [202, 404, 505];
const MAX_PLACED_PIECES = 1000;
const OTHER_PIECE_INDICES = [0, 1, 2, 5, 6];
const AI_LEVELS = ["beginner", "intermediate", "expert"];

function createPieceTape(seed) {
    const random = createSeededRandom(seed);
    return Array.from({ length: MAX_PLACED_PIECES + 2 }, () => {
        const value = random();
        const pieceIndex = value < 0.35
            ? 3
            : value < 0.7
                ? 4
                : OTHER_PIECE_INDICES[Math.floor(((value - 0.7) / 0.3) * OTHER_PIECE_INDICES.length)];
        return (pieceIndex + 0.01) / Object.keys(PIECES).length;
    });
}

function simulateGame(seed, difficulty, pieceTape) {
    let pieceIndex = 0;
    const game = new GameInstance({
        random: () => {
            if (pieceIndex >= pieceTape.length) {
                throw new Error("La suite de pièces déterministe est épuisée.");
            }
            return pieceTape[pieceIndex++];
        },
    });
    const aiRandom = createSeededRandom(seed ^ 0xA5A5A5A5);
    const playedTypes = [];
    let placedPieces = 0;

    while (game.status === "playing" && placedPieces < MAX_PLACED_PIECES) {
        playedTypes.push(game.currentPiece.type);
        const placement = difficulty === "beginner"
            ? chooseBeginnerPlacement(game.grid, game.currentPiece.matrix, aiRandom)
            : difficulty === "intermediate"
                ? chooseIntermediatePlacement(game.grid, game.currentPiece.matrix)
                : chooseExpertPlacement(
                    game.grid,
                    game.currentPiece.matrix,
                    PIECES[game.nextPieceType],
                );

        if (!placement) {
            throw new Error(`L'IA ${difficulty} n'a trouvé aucun placement sur une partie active.`);
        }

        game.playPlacement(placement);
        placedPieces++;
    }

    if (game.status !== "gameover") {
        throw new Error(`La partie ${difficulty} n'est pas terminée après ${MAX_PLACED_PIECES} pièces.`);
    }

    return {
        difficulty,
        seed,
        lines: game.linesCleared,
        score: game.score,
        placedPieces,
        playedTypes,
    };
}

function average(results, metric) {
    return results.reduce((total, result) => total + result[metric], 0) / results.length;
}

describe("simulation comparative des IA", () => {
    it("compare les trois niveaux sur des parties complètes, équitables et reproductibles", () => {
        const results = Object.fromEntries(AI_LEVELS.map(difficulty => [
            difficulty,
            SEEDS.map(seed => simulateGame(seed, difficulty, createPieceTape(seed))),
        ]));

        for (const seed of SEEDS) {
            const sameSeedResults = AI_LEVELS.map(difficulty =>
                results[difficulty].find(result => result.seed === seed)
            );
            expect(sameSeedResults.every(result => result.placedPieces > 0)).toBe(true);

            const shortestGame = Math.min(...sameSeedResults.map(result => result.playedTypes.length));
            const sharedOpening = sameSeedResults[0].playedTypes.slice(0, shortestGame);
            for (const result of sameSeedResults.slice(1)) {
                expect(result.playedTypes.slice(0, shortestGame)).toEqual(sharedOpening);
            }
        }

        const beginner = results.beginner;
        const expert = results.expert;
        expect(average(expert, "lines")).toBeGreaterThan(average(beginner, "lines"));
        expect(average(expert, "score")).toBeGreaterThan(average(beginner, "score"));
        expect(average(expert, "placedPieces")).toBeGreaterThan(average(beginner, "placedPieces"));

        for (const difficulty of AI_LEVELS) {
            expect(results[difficulty]).toHaveLength(SEEDS.length);
            expect(results[difficulty].every(result => result.placedPieces < MAX_PLACED_PIECES))
                .toBe(true);
        }
    }, 60_000);
});

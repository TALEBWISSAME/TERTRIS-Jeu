import {
    chooseBeginnerPlacement,
    chooseExpertPlacement,
    chooseIntermediatePlacement,
} from "../src/core/ai.js";
import { createSeededRandom } from "../src/core/game.js";
import { GameInstance } from "../src/core/game-instance.js";
import { PIECES } from "../src/core/piece.js";

const SEEDS = Array.from({ length: 20 }, (_, index) => 202 + index);
const MAX_PLACED_PIECES = 1000;
const DIFFICULTIES = [
    ["Débutant", "beginner"],
    ["Intermédiaire", "intermediate"],
    ["Expert", "expert"],
];
const AI_RANDOM_SEED_MASK = 0xA5A5A5A5;

function choosePlacement(difficulty, game, random) {
    if (difficulty === "beginner") {
        return chooseBeginnerPlacement(game.grid, game.currentPiece.matrix, random);
    }
    if (difficulty === "intermediate") {
        return chooseIntermediatePlacement(game.grid, game.currentPiece.matrix);
    }

    return chooseExpertPlacement(
        game.grid,
        game.currentPiece.matrix,
        PIECES[game.nextPieceType],
    );
}

function simulateGame(seed, difficulty) {
    const game = new GameInstance({ seed });
    const aiRandom = createSeededRandom(seed ^ AI_RANDOM_SEED_MASK);
    let placedPieces = 0;

    while (game.status === "playing" && placedPieces < MAX_PLACED_PIECES) {
        const placement = choosePlacement(difficulty, game, aiRandom);
        if (!placement) {
            throw new Error(
                `L'IA ${difficulty} n'a trouvé aucun placement pour la graine ${seed}.`,
            );
        }

        game.playPlacement(placement);
        placedPieces++;
    }

    return {
        seed,
        lines: game.linesCleared,
        placedPieces,
        interruptedByLimit: game.status === "playing",
    };
}

for (const [label, difficulty] of DIFFICULTIES) {
    const results = SEEDS.map(seed => simulateGame(seed, difficulty));
    const averageLines = results.reduce((sum, result) => sum + result.lines, 0)
        / SEEDS.length;
    const interrupted = results.filter(result => result.interruptedByLimit);

    console.log(
        `${label} : ${averageLines.toFixed(2)} lignes supprimées en moyenne `
        + `sur ${SEEDS.length} parties.`,
    );
    if (interrupted.length > 0) {
        const details = interrupted
            .map(result => `${result.seed} (${result.lines} lignes)`)
            .join(", ");
        console.log(
            `  ${interrupted.length} partie(s) interrompue(s) après `
            + `${MAX_PLACED_PIECES} pièces : graines ${details}.`,
        );
    } else {
        console.log("  Les 20 parties se sont terminées normalement.");
    }
}

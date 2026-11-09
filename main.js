import { movePiece, rotatePiece, softDrop, tick } from "./src/core/game.js";
import { GRID_HEIGHT, GRID_WIDTH } from "./src/core/grid.js";
import { GameManager } from "./src/core/game-manager.js";
import { advanceOpponentTurn } from "./src/core/opponent-turn.js";
import { bindInput } from "./src/ui/input.js";
import { applyLockedPiece } from "./src/ui/locked-colors.js";
import { createMultiplayerRenderer, createRenderer } from "./src/ui/renderer.js";

function getElement(id) {
    const element = document.getElementById(id);
    if (!element) {
        throw new Error(`L'élément « ${id} » est introuvable dans la page.`);
    }
    return element;
}

function createColorGrid() {
    return Array.from({ length: GRID_HEIGHT }, () => Array(GRID_WIDTH).fill(null));
}

const pauseButton = getElement("pause-button");
const modeSelect = getElement("game-mode");
const difficultyPicker = getElement("difficulty-picker");
const difficultySelect = getElement("ai-difficulty");
const soloRenderer = createRenderer({
    boardCanvas: getElement("game-board"),
    nextCanvas: getElement("next-piece"),
    scoreElement: getElement("score"),
    levelElement: getElement("level"),
    linesElement: getElement("lines"),
    gameOverElement: getElement("game-over"),
});
const multiplayerRenderer = createMultiplayerRenderer({
    container: getElement("multiplayer-games"),
});

let seed = Date.now() >>> 0;
let opponentCount = Number(modeSelect.value);
let difficulty = difficultySelect.value;
let manager = null;
let runtimes = [];
let modeIsMultiplayer = false;

function makeRuntime(player, game, isHuman) {
    return {
        player,
        game,
        isHuman,
        lockedColors: createColorGrid(),
        isRunning: false,
        isPaused: false,
        timerId: null,
        lineClearAnimation: null,
        opponentTurn: { piece: null, placement: null },
    };
}

function createGameRuntimes() {
    modeIsMultiplayer = opponentCount > 0;
    difficultyPicker.hidden = !modeIsMultiplayer;
    manager = new GameManager({ opponents: opponentCount, seed, difficulty });
    return manager.players.map(player =>
        makeRuntime(player, player.game.state, player.role === "human")
    );
}

function drawRuntime(runtime) {
    const lineClear = runtime.lineClearAnimation
        ? {
            rows: runtime.lineClearAnimation.rows,
            progress: Math.min(
                (performance.now() - runtime.lineClearAnimation.startedAt)
                    / runtime.lineClearAnimation.duration,
                1,
            ),
        }
        : undefined;
    soloRenderer(runtime.game, { lockedColors: runtime.lockedColors, lineClear });
}

function draw() {
    if (modeIsMultiplayer) {
        multiplayerRenderer.renderPlayers(runtimes.map(runtime => ({
            ...runtime.player,
            game: runtime.game,
            isPaused: runtime.isPaused,
            lockedColors: runtime.lockedColors,
            lineClear: runtime.lineClearAnimation
                ? {
                    rows: runtime.lineClearAnimation.rows,
                    progress: Math.min(
                        (performance.now() - runtime.lineClearAnimation.startedAt)
                            / runtime.lineClearAnimation.duration,
                        1,
                    ),
                }
                : undefined,
        })), {
            winner: manager.winner,
            podium: manager.podium,
            isFinished: manager.isFinished,
        });
    } else {
        multiplayerRenderer.showSolo();
        drawRuntime(runtimes[0]);
    }
}

function animateLineClear(runtime, animation) {
    if (runtime.lineClearAnimation !== animation) {
        return;
    }
    if (performance.now() - animation.startedAt >= animation.duration) {
        runtime.lineClearAnimation = null;
        draw();
        return;
    }
    draw();
    requestAnimationFrame(() => animateLineClear(runtime, animation));
}

function syncLockedColors(runtime, previousGrid, piece, nextGrid) {
    const result = applyLockedPiece(previousGrid, runtime.lockedColors, piece, nextGrid);
    runtime.lockedColors = result.lockedColors;
    if (result.removedRows.length > 0) {
        const animation = {
            rows: result.removedRows,
            startedAt: performance.now(),
            duration: 360,
        };
        runtime.lineClearAnimation = animation;
        requestAnimationFrame(() => animateLineClear(runtime, animation));
    }
}

function perform(runtime, action) {
    if (!runtime.isRunning || runtime.isPaused || runtime.game.status !== "playing") {
        return;
    }

    const previousPiece = runtime.game.currentPiece;
    const previousGrid = runtime.game.grid;
    action(runtime);
    if (previousPiece && runtime.game.grid !== previousGrid) {
        syncLockedColors(runtime, previousGrid, previousPiece, runtime.game.grid);
    }
    if (modeIsMultiplayer) {
        manager.updateResults();
        if (manager.isFinished) {
            for (const item of runtimes) {
                item.isRunning = false;
                item.isPaused = false;
                clearTimer(item);
            }
            updatePauseLabel();
        }
    }
    draw();
}

function clearTimer(runtime) {
    if (runtime.timerId !== null) {
        clearTimeout(runtime.timerId);
        runtime.timerId = null;
    }
}

function scheduleTick(runtime) {
    clearTimer(runtime);
    if (
        !runtime.isRunning
        || runtime.isPaused
        || runtime.game.status !== "playing"
        || (modeIsMultiplayer && manager.isFinished)
    ) {
        return;
    }

    const intervalMs = runtime.player.aiPlayer?.moveIntervalMs
        ?? runtime.game.dropIntervalMs;
    runtime.timerId = setTimeout(() => {
        runtime.timerId = null;
        perform(runtime, item => {
            if (runtime.player.role === "human") {
                tick(item.game);
            } else {
                advanceOpponentTurn(runtime.player, runtime.opponentTurn);
            }
        });
        scheduleTick(runtime);
    }, intervalMs);
}

function scheduleAllTicks() {
    runtimes.forEach(scheduleTick);
}

function updatePauseLabel() {
    if (modeIsMultiplayer && manager.isFinished) {
        pauseButton.textContent = "Terminé";
        pauseButton.disabled = true;
        return;
    }
    pauseButton.disabled = false;
    const activeGames = runtimes.filter(runtime =>
        runtime.isRunning && runtime.game.status === "playing"
    );
    pauseButton.textContent = activeGames.length > 0
        && activeGames.every(runtime => runtime.isPaused)
        ? "Reprendre"
        : "Pause";
}

function startGame() {
    if (modeIsMultiplayer && manager.isFinished) {
        return;
    }
    for (const runtime of runtimes) {
        if (runtime.game.status === "playing") {
            runtime.isRunning = true;
            runtime.isPaused = false;
        }
    }
    updatePauseLabel();
    draw();
    scheduleAllTicks();
}

function togglePause() {
    const activeGames = runtimes.filter(runtime =>
        runtime.isRunning && runtime.game.status === "playing"
    );
    if (activeGames.length === 0) {
        return;
    }

    const shouldPause = activeGames.some(runtime => !runtime.isPaused);
    for (const runtime of activeGames) {
        runtime.isPaused = shouldPause;
        if (shouldPause) {
            clearTimer(runtime);
        } else {
            scheduleTick(runtime);
        }
    }
    updatePauseLabel();
    draw();
}

function resetGames({ start = false } = {}) {
    runtimes.forEach(clearTimer);
    seed = (seed + 1) >>> 0;
    runtimes = createGameRuntimes();
    if (start) {
        for (const runtime of runtimes) {
            runtime.isRunning = true;
        }
    }
    updatePauseLabel();
    draw();
    if (start) {
        scheduleAllTicks();
    }
}

function changeMode() {
    const selected = Number(modeSelect.value);
    if (!Number.isInteger(selected) || selected < 0 || selected > 3) {
        throw new RangeError("Le mode doit comporter de zéro à trois adversaires.");
    }
    opponentCount = selected;
    resetGames();
}

function changeDifficulty() {
    difficulty = difficultySelect.value;
    resetGames();
}

const humanRuntime = () => runtimes.find(runtime => runtime.isHuman);

bindInput({
    startButton: getElement("start-button"),
    pauseButton,
    restartButton: getElement("restart-button"),
    onStart: startGame,
    onPause: togglePause,
    onRestart: () => resetGames({ start: true }),
    onMove: direction => {
        const runtime = humanRuntime();
        if (runtime) {
            perform(runtime, item => {
                if (modeIsMultiplayer) {
                    item.player.game.move(direction);
                } else {
                    movePiece(item.game, direction);
                }
            });
        }
    },
    onRotate: () => {
        const runtime = humanRuntime();
        if (runtime) {
            perform(runtime, item => {
                if (modeIsMultiplayer) {
                    item.player.game.rotate();
                } else {
                    rotatePiece(item.game);
                }
            });
        }
    },
    onSoftDrop: () => {
        const runtime = humanRuntime();
        if (runtime) {
            perform(runtime, item => {
                if (modeIsMultiplayer) {
                    item.player.game.softDrop();
                } else {
                    softDrop(item.game);
                }
            });
        }
    },
});

modeSelect.addEventListener("change", changeMode);
difficultySelect.addEventListener("change", changeDifficulty);
runtimes = createGameRuntimes();
updatePauseLabel();
draw();

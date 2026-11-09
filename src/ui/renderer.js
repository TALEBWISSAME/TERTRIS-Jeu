import { GRID_HEIGHT, GRID_WIDTH } from "../core/grid.js";
import { PIECES } from "../core/piece.js";

const CELL_COLORS = {
    I: "#35f4f4",
    O: "#ffe45e",
    T: "#c878ff",
    S: "#67ff9b",
    Z: "#ff5d83",
    J: "#5795ff",
    L: "#ffad55",
};

const LOCKED_CELL_COLOR = "#8b72ff";
const GRID_LINE_COLOR = "rgba(147, 167, 255, 0.13)";

function requireElement(element, name) {
    if (!element) {
        throw new TypeError(`L'élément « ${name} » est obligatoire.`);
    }
    return element;
}

function drawCell(context, x, y, size, color, glow = true) {
    const inset = Math.max(1, size * 0.07);
    context.save();
    if (glow) {
        context.shadowColor = color;
        context.shadowBlur = Math.max(5, size * 0.35);
    }
    context.fillStyle = color;
    context.fillRect(x + inset, y + inset, size - inset * 2, size - inset * 2);
    context.shadowBlur = 0;
    context.strokeStyle = "rgba(255, 255, 255, 0.5)";
    context.lineWidth = Math.max(1, size * 0.035);
    context.strokeRect(
        x + inset + context.lineWidth / 2,
        y + inset + context.lineWidth / 2,
        size - inset * 2 - context.lineWidth,
        size - inset * 2 - context.lineWidth,
    );
    context.restore();
}

function drawLineClear(context, rows, progress, width, height) {
    if (!rows?.length || progress >= 1) {
        return;
    }

    const cellHeight = height / GRID_HEIGHT;
    const cellWidth = width / GRID_WIDTH;
    const clearedBandHeight = rows.length * cellHeight;
    const glow = Math.sin(progress * Math.PI);
    context.save();
    // Le compactage laisse autant de nouvelles lignes vides en haut de la grille.
    context.beginPath();
    context.rect(0, 0, width, clearedBandHeight);
    context.clip();
    context.globalAlpha = glow;
    for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        const y = rowIndex * cellHeight - progress * clearedBandHeight;
        for (let x = 0; x < GRID_WIDTH; x++) {
            const color = CELL_COLORS[rows[rowIndex][x]];
            if (color) {
                drawCell(context, x * cellWidth, y, Math.min(cellWidth, cellHeight), color);
            }
        }
    }
    context.restore();
}

function drawBoard(context, game, width, height, lockedColors, lineClear) {
    const cellWidth = width / GRID_WIDTH;
    const cellHeight = height / GRID_HEIGHT;

    context.clearRect(0, 0, width, height);
    context.fillStyle = "#080d1b";
    context.fillRect(0, 0, width, height);

    drawLineClear(
        context,
        lineClear?.rows,
        lineClear?.progress ?? 1,
        width,
        height,
    );

    for (let y = 0; y < GRID_HEIGHT; y++) {
        for (let x = 0; x < GRID_WIDTH; x++) {
            if (game.grid[y][x] === 1) {
                drawCell(
                    context,
                    x * cellWidth,
                    y * cellHeight,
                    Math.min(cellWidth, cellHeight),
                    CELL_COLORS[lockedColors?.[y]?.[x]] ?? LOCKED_CELL_COLOR,
                );
            }
        }
    }

    if (game.currentPiece) {
        const { matrix, type, x: pieceX, y: pieceY } = game.currentPiece;
        for (let y = 0; y < matrix.length; y++) {
            for (let x = 0; x < matrix[y].length; x++) {
                if (matrix[y][x] === 1) {
                    drawCell(
                        context,
                        (pieceX + x) * cellWidth,
                        (pieceY + y) * cellHeight,
                        Math.min(cellWidth, cellHeight),
                        CELL_COLORS[type],
                    );
                }
            }
        }
    }

    context.save();
    context.strokeStyle = GRID_LINE_COLOR;
    context.lineWidth = 1;
    for (let x = 0; x <= GRID_WIDTH; x++) {
        context.beginPath();
        context.moveTo(x * cellWidth, 0);
        context.lineTo(x * cellWidth, height);
        context.stroke();
    }
    for (let y = 0; y <= GRID_HEIGHT; y++) {
        context.beginPath();
        context.moveTo(0, y * cellHeight);
        context.lineTo(width, y * cellHeight);
        context.stroke();
    }
    context.restore();
}

function drawPreview(context, type, width, height) {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#0a1021";
    context.fillRect(0, 0, width, height);
    if (!type || !PIECES[type]) {
        return;
    }

    const matrix = PIECES[type];
    const cellSize = Math.min(
        (width * 0.68) / matrix.length,
        (height * 0.68) / matrix.length,
    );
    const offsetX = (width - cellSize * matrix.length) / 2;
    const offsetY = (height - cellSize * matrix.length) / 2;
    for (let y = 0; y < matrix.length; y++) {
        for (let x = 0; x < matrix[y].length; x++) {
            if (matrix[y][x] === 1) {
                drawCell(
                    context,
                    offsetX + x * cellSize,
                    offsetY + y * cellSize,
                    cellSize,
                    CELL_COLORS[type],
                );
            }
        }
    }
}

function createMultiplayerCard(index) {
    const card = document.createElement("article");
    card.className = "multiplayer-card";

    const header = document.createElement("header");
    header.className = "multiplayer-card__header";
    const title = document.createElement("h3");
    title.className = "multiplayer-card__title";
    const difficulty = document.createElement("span");
    difficulty.className = "multiplayer-card__difficulty";
    const status = document.createElement("span");
    status.className = "multiplayer-card__status";
    header.append(title, difficulty, status);

    const boardFrame = document.createElement("div");
    boardFrame.className = "multiplayer-card__board-frame";
    const canvas = document.createElement("canvas");
    canvas.className = "multiplayer-card__canvas";
    canvas.width = 200;
    canvas.height = 400;
    canvas.setAttribute("aria-label", `Plateau du joueur ${index + 1}`);
    const gameOver = document.createElement("div");
    gameOver.className = "multiplayer-card__game-over";
    gameOver.textContent = "Partie terminée";
    gameOver.hidden = true;
    boardFrame.append(canvas, gameOver);

    const statistics = document.createElement("dl");
    statistics.className = "multiplayer-card__statistics";
    const score = createStatistic(statistics, "Score");
    const level = createStatistic(statistics, "Niveau");
    const lines = createStatistic(statistics, "Lignes");
    card.append(header, boardFrame, statistics);

    const context = canvas.getContext("2d");
    if (!context) {
        throw new Error("Le navigateur ne permet pas le rendu HTML5 Canvas.");
    }

    return { card, title, difficulty, status, canvas, context, gameOver, score, level, lines };
}

function createStatistic(container, label) {
    const wrapper = document.createElement("div");
    wrapper.className = "multiplayer-card__stat";
    const term = document.createElement("dt");
    term.textContent = label;
    const value = document.createElement("dd");
    value.textContent = "0";
    wrapper.append(term, value);
    container.append(wrapper);
    return value;
}

/**
 * Crée une fonction qui dessine l'état du jeu sur les Canvas du mode solo.
 * Le rendu lit l'état reçu sans le modifier.
 * @param {object} options Éléments HTML affichant le plateau, l'aperçu et les statistiques.
 * @param {HTMLCanvasElement} options.boardCanvas Canvas du plateau.
 * @param {HTMLCanvasElement} options.nextCanvas Canvas de la pièce suivante.
 * @param {HTMLElement} options.scoreElement Élément qui affiche le score.
 * @param {HTMLElement} options.levelElement Élément qui affiche le niveau.
 * @param {HTMLElement} options.linesElement Élément qui affiche les lignes supprimées.
 * @param {HTMLElement} options.gameOverElement Élément du message de fin de partie.
 * @returns {(game: object, options?: {lockedColors?: (string|null)[][], lineClear?: object}) => void}
 * Fonction qui dessine l'état et les couleurs verrouillées facultatives.
 */
export function createRenderer({
    boardCanvas,
    nextCanvas,
    scoreElement,
    levelElement,
    linesElement,
    gameOverElement,
}) {
    requireElement(boardCanvas, "boardCanvas");
    requireElement(nextCanvas, "nextCanvas");
    requireElement(scoreElement, "scoreElement");
    requireElement(levelElement, "levelElement");
    requireElement(linesElement, "linesElement");
    requireElement(gameOverElement, "gameOverElement");

    const boardContext = boardCanvas.getContext("2d");
    const nextContext = nextCanvas.getContext("2d");
    if (!boardContext || !nextContext) {
        throw new Error("Le navigateur ne permet pas le rendu HTML5 Canvas.");
    }

    return function render(game, { lockedColors, lineClear } = {}) {
        drawBoard(
            boardContext,
            game,
            boardCanvas.width,
            boardCanvas.height,
            lockedColors,
            lineClear,
        );
        drawPreview(nextContext, game.nextPieceType, nextCanvas.width, nextCanvas.height);
        scoreElement.textContent = game.score.toLocaleString("fr-FR");
        levelElement.textContent = String(game.level);
        linesElement.textContent = String(game.linesCleared);
        gameOverElement.hidden = game.status !== "gameover";
        if (game.status === "gameover") {
            gameOverElement.textContent = "Partie terminée";
        }
    };
}

/**
 * Prépare le rendu d'une à quatre parties dans une grille de joueurs.
 * @param {object} options Options du rendu.
 * @param {HTMLElement} options.container Conteneur qui contient l'élément .multiplayer-grid.
 * @returns {{renderPlayers: (players: object[], result?: object) => void, showSolo: () => void}}
 * Méthodes pour afficher les parties ou masquer l'arène en mode solo.
 */
export function createMultiplayerRenderer({ container }) {
    requireElement(container, "container");
    const grid = container.querySelector(".multiplayer-grid");
    if (!grid) {
        throw new Error("Le conteneur doit inclure un élément .multiplayer-grid.");
    }
    const results = container.querySelector(".multiplayer-results");
    if (!results) {
        throw new Error("Le conteneur doit inclure un élément .multiplayer-results.");
    }

    const arcade = container.closest(".arcade");
    const soloLayout = arcade?.querySelector(".game-layout");
    const cards = new Map();
    function renderPlayers(players, result = null) {
        if (!Array.isArray(players) || players.length < 1 || players.length > 4) {
            throw new RangeError("L'affichage doit contenir entre 1 et 4 joueurs.");
        }
        if (players.filter(player => player?.role === "human").length !== 1) {
            throw new TypeError("L'affichage doit contenir exactement un joueur humain.");
        }

        container.hidden = false;
        if (arcade) {
            arcade.classList.add("arcade--multiplayer");
        }
        grid.dataset.playerCount = String(players.length);
        const activeCards = [];
        players.forEach((player, index) => {
            if (!player?.game || !["human", "opponent"].includes(player.role)) {
                throw new TypeError("Chaque joueur doit avoir un rôle et une partie valides.");
            }

            let view = cards.get(index);
            if (!view) {
                view = createMultiplayerCard(index);
                cards.set(index, view);
            }

            const label = player.role === "human"
                ? "Joueur humain"
                : `Adversaire ${players.slice(0, index + 1).filter(item => item.role === "opponent").length}`;
            view.title.textContent = label;
            const difficultyLabels = {
                beginner: "Débutant",
                intermediate: "Intermédiaire",
                expert: "Expert",
            };
            view.difficulty.hidden = player.role === "human";
            view.difficulty.textContent = player.role === "opponent"
                ? `IA ${difficultyLabels[player.difficulty] ?? "inconnue"}`
                : "";
            view.card.classList.toggle("multiplayer-card--human", player.role === "human");
            view.card.classList.toggle("multiplayer-card--opponent", player.role === "opponent");
            view.canvas.setAttribute("aria-label", `Plateau : ${label}`);

            const game = player.game;
            drawBoard(
                view.context,
                game,
                view.canvas.width,
                view.canvas.height,
                player.lockedColors,
                player.lineClear,
            );
            view.score.textContent = game.score.toLocaleString("fr-FR");
            view.level.textContent = String(game.level);
            view.lines.textContent = String(game.linesCleared);
            view.status.textContent = game.status === "gameover"
                ? "Terminée"
                : player.isPaused
                    ? "En pause"
                    : "En cours";
            view.status.classList.toggle("multiplayer-card__status--ended", game.status === "gameover");
            view.status.classList.toggle(
                "multiplayer-card__status--paused",
                game.status !== "gameover" && player.isPaused,
            );
            view.gameOver.hidden = game.status !== "gameover";
            activeCards.push(view.card);
        });

        for (const [index, view] of cards) {
            if (index >= players.length) {
                cards.delete(index);
            }
        }
        activeCards.forEach((card, index) => {
            if (grid.children[index] !== card) {
                grid.insertBefore(card, grid.children[index] ?? null);
            }
        });
        while (grid.children.length > activeCards.length) {
            grid.lastElementChild.remove();
        }
        renderTournamentResult(result);
    }

    function renderTournamentResult(result) {
        results.replaceChildren();
        results.hidden = !result?.isFinished;
        if (!result?.isFinished) {
            return;
        }

        const title = document.createElement("h3");
        title.className = "multiplayer-results__title";
        title.textContent = result.winner
            ? `Gagnant : ${getPlayerLabel(result.winner)}`
            : "Partie terminée sans survivant";
        results.append(title);

        const podium = document.createElement("ol");
        podium.className = "multiplayer-results__podium";
        for (const player of result.podium) {
            const entry = document.createElement("li");
            entry.textContent = getPlayerLabel(player);
            podium.append(entry);
        }
        results.append(podium);
    }

    function getPlayerLabel(player) {
        return player.role === "human"
            ? "Joueur humain"
            : `Adversaire ${player.index}`;
    }

    function showSolo() {
        container.hidden = true;
        results.replaceChildren();
        results.hidden = true;
        if (arcade) {
            arcade.classList.remove("arcade--multiplayer");
        }
    }

    return { renderPlayers, showSolo };
}

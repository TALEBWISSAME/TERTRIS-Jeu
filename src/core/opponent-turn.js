import { findLegalPlacements } from "./ai.js";
import { PIECES } from "./piece.js";

/**
 * Fait avancer un adversaire d'une case vers le placement choisi par son IA.
 * La pièce est verrouillée par le moteur lorsqu'elle atteint sa position finale.
 * @param {object} player Joueur adverse avec son instance et sa difficulté.
 * @param {{piece: object|null, placement: object|null}} turn État du placement en cours.
 * @returns {object} État de la partie après cette étape de descente.
 */
export function advanceOpponentTurn(player, turn) {
    const game = player.game;
    if (game.status !== "playing") {
        return game.state;
    }

    const currentPiece = game.currentPiece;
    if (turn.piece !== currentPiece) {
        const nextPiece = Object.hasOwn(PIECES, game.nextPieceType)
            ? PIECES[game.nextPieceType]
            : undefined;
        const decision = player.aiPlayer.decide(
            game.grid,
            currentPiece.matrix,
            nextPiece,
        );
        if (!decision) {
            throw new Error("L'IA n'a trouvé aucun placement légal pour une partie en cours.");
        }
        const placement = findLegalPlacements(game.grid, currentPiece.matrix).find(
            candidate => candidate.rotation === decision.rotation
                && candidate.x === decision.colonne,
        );
        if (!placement) {
            throw new Error("La décision de l'IA ne correspond à aucun placement légal.");
        }

        turn.piece = currentPiece;
        turn.placement = placement;
        currentPiece.matrix = placement.matrix.map(row => [...row]);
        currentPiece.x = placement.x;
    }

    game.tick();
    if (game.currentPiece !== currentPiece) {
        turn.piece = null;
        turn.placement = null;
    }
    return game.state;
}

function requireButton(button, name) {
    if (!button) {
        throw new TypeError(`Le bouton « ${name} » est obligatoire.`);
    }
    return button;
}

/**
 * Relie les boutons et les touches aux fonctions fournies sans gérer l'état du jeu.
 * Les flèches appellent les actions de déplacement, rotation et descente; P appelle la pause.
 * @param {object} options Boutons, fonctions d'action et cible des événements clavier.
 * @param {HTMLElement} options.startButton Bouton de démarrage.
 * @param {HTMLElement} options.pauseButton Bouton de pause et de reprise.
 * @param {HTMLElement} options.restartButton Bouton de redémarrage.
 * @param {() => void} options.onStart Action appelée au démarrage.
 * @param {() => void} options.onPause Action appelée à la pause ou à la reprise.
 * @param {() => void} options.onRestart Action appelée au redémarrage.
 * @param {(direction: -1|1) => void} options.onMove Action appelée avec la direction horizontale.
 * @param {() => void} options.onRotate Action appelée pour tourner la pièce.
 * @param {() => void} options.onSoftDrop Action appelée pour accélérer la descente.
 * @param {EventTarget} [options.target=window] Cible qui reçoit les événements clavier.
 * @returns {() => void} Fonction qui retire les écouteurs installés.
 */
export function bindInput({
    startButton,
    pauseButton,
    restartButton,
    onStart,
    onPause,
    onRestart,
    onMove,
    onRotate,
    onSoftDrop,
    target = window,
}) {
    const start = requireButton(startButton, "Démarrer");
    const pause = requireButton(pauseButton, "Pause");
    const restart = requireButton(restartButton, "Recommencer");

    start.addEventListener("click", onStart);
    pause.addEventListener("click", onPause);
    restart.addEventListener("click", onRestart);

    function handleKeydown(event) {
        switch (event.key) {
            case "ArrowLeft":
                event.preventDefault();
                onMove(-1);
                break;
            case "ArrowRight":
                event.preventDefault();
                onMove(1);
                break;
            case "ArrowUp":
                event.preventDefault();
                onRotate();
                break;
            case "ArrowDown":
                event.preventDefault();
                onSoftDrop();
                break;
            case "p":
            case "P":
                if (!event.repeat) {
                    onPause();
                }
                break;
        }
    }

    target.addEventListener("keydown", handleKeydown);

    return function removeInputListeners() {
        start.removeEventListener("click", onStart);
        pause.removeEventListener("click", onPause);
        restart.removeEventListener("click", onRestart);
        target.removeEventListener("keydown", handleKeydown);
    };
}

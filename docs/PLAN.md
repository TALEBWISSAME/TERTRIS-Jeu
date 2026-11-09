Voici le plan corrigé en **exactement cinq étapes**, en respectant les fichiers imposés et en réutilisant [piece.js](C:/Users/taleb/Desktop/Tetris/src/core/piece.js) ainsi que ses tests existants. Aucun fichier ne sera modifié.

1. **Établir la grille et valider les pièces**  
   **Fichiers :** `src/core/grid.js`, `src/core/piece.js` (réutilisé), `tests/grid.test.js`, `tests/piece.test.js` (tests existants).  
   **Fonctionnalités :** représenter la grille de 10 colonnes × 20 lignes et ses opérations de base; conserver les sept tétrominos, leurs matrices et la rotation.  
   **Vérifications manuelles :** contrôler que les matrices représentent les sept formes et que la grille est initialisée vide aux bonnes dimensions.  
   **Tests :** tester l’initialisation et les opérations de grille; conserver et exécuter les tests existants de rotation et de matrice non carrée.

2. **Implémenter le score et les niveaux**  
   **Fichiers :** `src/core/scoring.js`, `tests/scoring.test.js`.  
   **Fonctionnalités :** calculer le score selon le nombre de lignes supprimées (100, 300, 500 ou 800 points) et déterminer le niveau, qui augmente toutes les 10 lignes.  
   **Vérifications manuelles :** vérifier les valeurs de score et les changements de niveau aux seuils.  
   **Tests :** couvrir les suppressions de 1 à 4 lignes, les seuils de niveau et les entrées limites pertinentes.

3. **Construire le moteur de partie**  
   **Fichiers :** `src/core/game.js`, `src/core/grid.js`, `src/core/piece.js`, `src/core/scoring.js`, `tests/game.test.js`.  
   **Fonctionnalités :** orchestrer l’état de la partie, l’apparition et le déplacement des pièces, les rotations et collisions, leur verrouillage, la suppression des lignes, la fin de partie et la vitesse liée au niveau. Injecter le générateur aléatoire seedable pour rendre les séquences reproductibles.  
   **Vérifications manuelles :** jouer avec une graine fixe et confirmer qu’une seconde exécution produit la même séquence; vérifier les bords, les empilements et la fin de partie.  
   **Tests :** couvrir déplacements, rotations, collisions, verrouillage, lignes, score, progression, fin de partie et répétabilité d’une graine.

4. **Créer le rendu de l’interface**  
   **Fichiers :** `src/ui/renderer.js`, `index.html`, `styles.css`.  
   **Fonctionnalités :** afficher la grille et les pièces colorées, le score, le niveau, les lignes, l’aperçu de la prochaine pièce et le message de fin; appliquer le style arcade et la mise en page responsive.  
   **Vérifications manuelles :** contrôler le rendu du plateau et des indicateurs, l’aperçu, le message de fin et l’adaptation à différentes tailles d’écran.  
   **Tests :** exécuter les tests automatisés du cœur pour vérifier que le rendu ne modifie pas les règles; compléter par une vérification manuelle dans le navigateur, sans ajouter de dépendance de test UI.

5. **Relier les commandes et finaliser le cycle de jeu**  
   **Fichiers :** `src/ui/input.js`, `main.js`, `src/ui/renderer.js`, `tests/input.test.js`.  
   **Fonctionnalités :** initialiser et relier le moteur au rendu; associer les flèches aux mouvements et à la rotation, P à la pause/reprise, et connecter les boutons Démarrer, Pause et Recommencer. Déclencher la descente automatique et l’animation de suppression des lignes.  
   **Vérifications manuelles :** parcourir une partie complète, tester chaque touche et bouton, observer pause/reprise, redémarrage, accélération de la descente et fin de partie.  
   **Tests :** vérifier la correspondance des commandes avec les actions attendues, puis lancer `npm test` pour toute la suite.
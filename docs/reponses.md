# TP4 — Réponses aux questions

## Exercice 1 — Prise en main de GitHub Copilot

### Question A — Les sept matrices de l'étape 1 étaient-elles toutes justes ? Laquelle ne l'était pas ? Qu'est-ce que cela dit de la complétion sur un sujet « connu » ?

Dans mon cas, les sept matrices générées par GitHub Copilot étaient correctes. J'ai vérifié les formes I, O, T, S, Z, J et L dans le fichier `piece.js`. J'ai également demandé à Copilot de les analyser avec le mode Ask, et il n'a pas trouvé d'erreur.

Cela montre que la complétion automatique peut être efficace sur un sujet connu comme les pièces du Tetris. Mais même si le résultat semble correct, il faut toujours vérifier le code généré, car Copilot peut aussi faire des erreurs.

### Question B — Combien de crédits ont coûté les étapes 6 et 7 ? Et les étapes 1 à 3 ?

Les étapes 1 et 2 ont été réalisées avec la complétion automatique de Copilot. L'étape 3 a utilisé le chat en ligne avec `Ctrl + I`.

Pour les étapes 6 et 7, j'ai utilisé le mode Agent. Il a créé et exécuté les tests, puis renommé la fonction `rotate` en `tourner` dans plusieurs fichiers.

Le mode Agent effectue davantage d'opérations et peut consommer plus de requêtes premium que la simple complétion automatique.

Je ne peux pas donner les nombres de crédits consommés à partir du dépôt : ni le journal ni l'historique Git ne contiennent les statistiques de consommation de Copilot. Il faut relever manuellement, sur la page des paramètres Copilot de GitHub, le coût des étapes 6 et 7, puis celui des étapes 1 à 3. Je ne peux pas déduire ces chiffres du nombre de commits ou de requêtes.

### Question C — Quel outil choisir pour chaque besoin ?

**1. Compléter une ligne :** j'utiliserais la complétion automatique de Copilot avec `Tab`, car elle permet d'obtenir rapidement une proposition directement dans le code.

**2. Modifier une fonction :** j'utiliserais le chat en ligne avec `Ctrl + I`, car il permet de sélectionner une fonction et de demander une modification précise.

**3. Comprendre un fichier :** j'utiliserais le mode Ask en ajoutant le fichier au contexte, pour obtenir des explications sans modifier le code.

**4. Ajouter une fonctionnalité sur trois fichiers :** j'utiliserais le mode Agent, après avoir préparé un plan, car il peut travailler sur plusieurs fichiers et mettre à jour leurs références.

**5. Faire passer un test qui échoue :** j'utiliserais le mode Agent pour analyser l'erreur, rechercher sa cause, corriger le code et relancer les tests. Je vérifierais ensuite les modifications pour m'assurer que l'Agent n'a pas simplement changé le test pour le faire réussir.

## Exercice 2 — Développement du Tetris avec Copilot Agent

### Question A — Combien de requêtes agent et d'interventions manuelles ? Quelle étape a été reprise, et avec quelle information ?

Le journal consigne cinq étapes de réalisation, chacune avec une demande à l'Agent. Il consigne aussi des demandes de correction pendant l'étape du moteur et pendant la dernière étape. Il ne donne toutefois pas le nombre exact de requêtes Agent ni le décompte complet des interventions manuelles. Les commits ne permettent pas de les compter : un commit ne correspond pas nécessairement à une seule requête.

Les interventions manuelles explicitement décrites sont notamment la correction du plan après sa première proposition, le choix du style arcade, la demande d'ajout d'identifiants aux boutons et la demande de correction des couleurs et de l'animation.

L'étape du moteur a été reprise après que le premier lancement des tests a signalé trois problèmes dans des scénarios. Le journal ne conserve ni les noms de ces tests ni le texte exact de la sortie du terminal. Il faut renseigner manuellement le nombre total de requêtes et d'interventions, ainsi que ces détails de diagnostic, s'ils sont encore disponibles.

### Question B — Quelle violation de `copilot-instructions.md` se trouvait dans le code produit ? Comment la faire corriger sans répéter la consigne ?

Les éléments conservés ne permettent pas d'identifier une violation précise dans le code produit. La première proposition de plan utilisait des noms de fichiers différents et omettait `grid.js`, mais c'était une erreur du plan, pas une violation démontrée dans le code. Dans les fichiers de l'exercice 2, les commentaires examinés sont en français et `src/core/` reste séparé du DOM et du Canvas.

Je ne peux donc pas présenter cette erreur de plan comme la violation de code demandée. Pour corriger une violation constatée sans recopier la consigne, je peux donner à l'Agent le fichier et l'écart précis, puis lui demander de relire `#file:.github/copilot-instructions.md` et de corriger uniquement cet écart.

### Question C — L'étape 2 aurait-elle été possible en un seul prompt ? Qu'aurait-on perdu ?

Je trouve que travailler en plusieurs étapes est plus pratique, car je peux vérifier le résultat après chaque modification.

Par exemple, j'ai d'abord vérifié la grille, puis le score, le moteur, l'interface et enfin les commandes.

Si j'avais demandé tout le jeu en une seule fois, il aurait été plus difficile de comprendre les erreurs et de savoir quelle partie corriger.

Cette méthode m'a aussi permis de faire des tests et des commits régulièrement.

## Exercice 3 — Tests et couverture

### Question A — Quel test généré ne vérifiait rien d'utile ? Comment l'ai-je réécrit ?

Je ne peux pas identifier dans les éléments conservés un test qui a réellement été jugé inutile puis réécrit. Le journal rapporte un test incorrect pour la collision contre le bord, mais il a été corrigé pour tester que `canPlacePiece` renvoie `false`; ce n'est pas le test inutile décrit dans la question.

Le test de reproductibilité de `game.test.js` compare deux séquences générées avec la même graine. Il vérifie une propriété utile, même s'il ne fixe pas une séquence de référence. Je ne peux pas le présenter comme une tautologie ni prétendre l'avoir réécrit. Il faut retrouver le test concerné et son diff dans mes notes ou le compléter manuellement; faute de cette preuve, cette question reste incomplète.

### Question B — L'agent a-t-il corrigé le code ou aligné le test sur le bug ? Comment éviter qu'il modifie le test ?

J'ai volontairement changé `scoring.js` pour que trois lignes rapportent 300 points au lieu des 500 attendus. Le test a échoué. D'après le journal, Copilot a remis la bonne valeur dans le code de `scoring.js`, sans modifier les tests; les 52 tests ont ensuite réussi.

Pour éviter que l'Agent corrige le test à la place du code, je peux préciser : « Corrige le bug dans `src/core/scoring.js` selon la spécification. Ne modifie aucun fichier de test. Utilise la sortie de `npm test` pour vérifier la correction, puis indique les fichiers modifiés. »

### Question C — Qu'est-ce qui n'est pas couvert dans `src/core`, et pourquoi ?

J'ai relancé la couverture sur l'archive Git `ex3`, qui contient les 52 tests de l'exercice. Elle donne **93,79 % de couverture des lignes de `src/core`**. Le rapport identifie dans `game.js` des branches non exécutées : les validations d'une graine invalide (ligne 14), d'un niveau invalide (30), d'une valeur aléatoire invalide (41), d'un générateur invalide (101) et d'une direction invalide (129). Il laisse aussi non testés certains retours sans effet lorsque la partie est déjà terminée (lignes 86, 126 et 147).

Ces lignes correspondent surtout à des cas d'erreur ou à des appels après la fin de partie, et non à du code mort. Les tests injectent un générateur déterministe pour vérifier la reproductibilité, mais ne couvrent pas toutes les valeurs invalides possibles. Le journal ne détaille pas ces lignes; elles ont été identifiées en relançant la couverture sur le tag `ex3`.
## Exercice 4 — Mode versus

### Question A — Quelles fonctions le refactoring a-t-il déplacées ou renommées ? Un test a-t-il échoué pendant l'opération ? Lequel, et qu'a fait l'agent ?

La comparaison des tags `ex3` et `ex4` montre que les fonctions du moteur dans `src/core/game.js` n'ont pas été déplacées ni renommées. `GameInstance` a été ajouté comme interface de partie : ses méthodes `move`, `rotate`, `softDrop` et `tick` délèguent aux fonctions existantes du moteur. Le démarrage de partie, auparavant fait directement dans `main.js` avec `createGame`, est maintenant organisé par `GameManager` et ses `GameInstance`.

Le journal ne rapporte pas d'échec de test pendant le refactoring. Il décrit plutôt un problème d'interface : les boutons étaient masqués en mode multijoueur, puis l'Agent a corrigé leur affichage. Les tests consignés sont passés de 52 à 71. Je ne peux donc pas nommer de test échoué ni affirmer qu'un échec de test a guidé cette correction.

### Question B — Comparer `git diff ex3 ex4 --stat` avec ce que vous auriez modifié à la main : l'agent a-t-il touché des fichiers inutiles ?

Pour passer du mode solo au multijoueur, Copilot Agent a modifié 10 fichiers, avec 929 lignes ajoutées et 81 lignes supprimées.

Il a principalement modifié `main.js`, `renderer.js`, `styles.css` et créé les classes `GameInstance` et `GameManager`, ainsi que leurs tests.

À la main, j'aurais aussi dû modifier ces fichiers pour gérer plusieurs parties et afficher plusieurs grilles.

Les modifications me semblent utiles pour ajouter le multijoueur. Je n'ai pas identifié de fichier clairement inutile parmi ceux modifiés.

## Exercice 5 — Joueurs IA

### Question A — Pourquoi exiger que l'IA joue avec les mêmes fonctions que l'humain plutôt que de poser directement la pièce dans la grille ?

L'IA doit respecter les mêmes règles que le joueur humain pour que le jeu soit équitable.

Si elle plaçait directement les pièces dans la grille, elle pourrait éviter certaines règles, comme les collisions ou le verrouillage.

En utilisant les fonctions du moteur, on s'assure que les trois niveaux d'IA respectent les règles du Tetris.

Cela permet aussi de réutiliser le code existant et de faciliter les tests.

### Question B — Faire varier une pondération de l'expert avec la simulation : laquelle a le plus d'effet ? L'agent a-t-il proposé cette expérience de lui-même ?

J'ai demandé à Copilot Agent de comparer les pondérations de l'IA experte en augmentant chaque coefficient de 25 %, un par un.

Nous avons utilisé les mêmes trois graines pour comparer les résultats.

La pondération des trous a eu le plus d'effet. En augmentant son importance, la moyenne est passée de 44,33 à 96,33 lignes complétées, soit 52 lignes supplémentaires.

La hauteur a fait diminuer la moyenne à 33,33 lignes, tandis que l'irrégularité l'a augmentée à 64,67 lignes. Le coefficient des lignes complétées n'a pas changé le résultat.

L'agent n'avait pas proposé cette expérience de lui-même. Je lui ai demandé de la réaliser.

Ces résultats restent limités à trois simulations par variante, donc ils ne permettent pas de conclure que ce coefficient est toujours le meilleur.
---

## Exercice 6 — Documentation et revue


### Question A — Trouver une JSDoc inexacte et la corriger

J'ai demandé à Copilot de vérifier les commentaires JSDoc des fonctions de `src/core`.

Il a trouvé une JSDoc incomplète dans la méthode `GameInstance.playPlacement()`.

Le commentaire ne précisait pas que la méthode ne fait rien lorsque la partie est déjà terminée. Il n'expliquait pas non plus clairement que la position et l'orientation de la pièce sont modifiées avant son verrouillage.

Copilot a corrigé le commentaire pour expliquer ces comportements.

Seule la documentation a été modifiée, sans changer le code du jeu ni les tests.

### Question B — Vérification des dépendances du diagramme

J'ai demandé à Copilot de comparer les diagrammes de `docs/ARCHITECTURE.md` avec les imports des fichiers JavaScript.

Il a trouvé des dépendances manquantes, notamment entre `main.js` et `grid.js`, ainsi qu'entre `game-instance.js` et `grid.js` et `piece.js`.

Il a aussi trouvé un lien entre `main.js` et `ai.js` qui ne correspond pas à un import direct. En réalité, `main.js` utilise `opponent-turn.js`, qui importe les fonctions de l'IA.

Cette vérification m'a permis de voir que le diagramme ne représentait pas exactement toutes les dépendances du code.

J'ai également constaté que le document contenait deux flowcharts au lieu du diagramme de classes et du diagramme de séquence demandés.

### Question C — Vérification des remarques de la revue de code

J'ai demandé à Copilot de vérifier les remarques de sa revue de code.

Aucune des trois remarques ne s'est révélée fausse.

Le premier problème concernait les adversaires IA qui plaçaient leurs pièces directement. Le deuxième concernait la méthode `playPlacement()`, qui acceptait une matrice incorrecte.

Ces deux problèmes ont été vérifiés avec des tests, puis corrigés.

Le troisième concernait l'animation des lignes supprimées. Le problème semble réel en lisant le code, mais nous ne l'avons pas vérifié visuellement.

Cette vérification m'a montré qu'il ne faut pas accepter automatiquement les remarques de Copilot : il faut les comparer au code et aux tests.
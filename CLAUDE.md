# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Rédigé en français : le site, ses contenus et son mainteneur le sont aussi.

## Le projet

Portfolio personnel de Vincent Waldmann. Site statique, sans framework, sans étape de build
et sans gestionnaire de dépendances : `index.html`, `css/style.css` et `js/main.js` sont
servis tels qu'ils sont écrits. Tous les textes destinés aux visiteurs sont en français.

## Lancer le site

Le serveur de dev est déclaré dans `.claude/launch.json` — démarre-le avec le panneau
navigateur (`preview_start` avec `{name: "portfolio"}`), jamais avec Bash. C'est un simple
`python3 -m http.server 4173`. Il n'y a ni build, ni lint, ni tests.

**Le panneau met `style.css` et `main.js` en cache de façon agressive.** Un rechargement
ordinaire — même `navigate` avec `force: true` — continue de servir l'ancien fichier en
silence, et injecter une copie du `<script>` avec un paramètre anti-cache laisse *plusieurs*
instances des IIFE enregistrées, ce qui produit un état incompréhensible. Le rafraîchissement
fiable :

```js
await fetch('css/style.css', {cache: 'reload'}); await fetch('js/main.js', {cache: 'reload'}); location.reload();
```

Si une modification semble sans effet, compare les règles de `document.styleSheets` avec un
`fetch()` frais du même fichier avant de conclure que le code est en cause. Et quand le
panneau est masqué, les captures d'écran retardent : fie-toi aux mesures du DOM.

## Versionnement

Dépôt git sur `main`, poussé vers `git@github-perso:lefourbefromage/portfolio.git`.

`github-perso` est un alias d'hôte SSH défini dans `~/.ssh/config`, ce n'est pas une faute de
frappe : il épingle la clé personnelle avec `IdentitiesOnly yes`. Utiliser `github.com` en
clair dans une URL de remote propose la clé *professionnelle* et échoue sur
`Permission denied (publickey)`. Garde l'alias dans tout remote ajouté ici.

Les skills vendorisées (`.agents/`, et les liens symboliques de `.claude/skills/`) sont
ignorées par git — 5,4 Mo que `skills-lock.json`, lui versionné, permet de restaurer.

## Système de design

### Palette : quatre couleurs

Tout est défini dans `:root`. **N'introduis pas de cinquième couleur** sans le demander.

| Token | Valeur | Usage |
|---|---|---|
| `--cream` | `#fef1da` | Blanc cassé : fond des sections claires, **ou** couleur de texte sur fond foncé |
| `--navy` | `#172247` | Bleu foncé : couleur de texte, ou fond foncé |
| `--green` | `#4f914f` | Touche de couleur sur certains éléments |
| `--pink` | `#f8d0ee` | Touche de couleur, **sur fond foncé uniquement** |

Corollaire à ne pas oublier : sur fond sombre le texte est **crème, jamais blanc pur**.
`body` porte déjà `color: var(--cream)`.

### L'axe des bleus

Tous les bleus du site partagent la **teinte 226**. Seules la luminosité et la saturation
varient, et la saturation *baisse* quand la couleur s'éclaircit — c'est ce qui donne des
bleus d'encre plutôt que des bleus électriques. Un bleu à saturation 80 % dans les tons
moyens jure avec le reste du site ; c'est un écart mesuré et écarté délibérément.

- `--ink` `#060d22` — `hsl(226 70% 8%)`. Fond du site, et encre de la carte topographique.
- `--ink-rgb` `6 13 34` — pour les opacités : `rgb(var(--ink-rgb) / .32)`.
- `--cream-rgb`, `--navy-rgb` — même usage pour les deux autres.

**Ne réintroduis jamais une opacité en `rgba()` codée en dur.** La section parcours en a
compté jusqu'à dix, à neuf opacités différentes, ce qui rendait tout changement manuel.

Exceptions restant hors palette, à trancher un jour : `#44d444` (pastille « Disponible »),
`#4258a2` (bordure du badge de localisation), `#fffaf0` (fond des cartes du parcours).

### Typographie

Deux familles, toutes deux auto-hébergées dans `fonts/` en woff2 variable.

- **Clash Display** (`--font-display`, graisses 200–700) — titres en bold, ainsi que les
  sous-titres et les labels.
- **Inter** (`--font-body`, graisses 100–900) — texte courant, en regular.

`body` porte `--font-body` ; `--font-display` est appliqué explicitement aux onze sélecteurs
de titres et de labels. Un nouvel élément de texte hérite donc d'Inter par défaut, ce qui est
le comportement voulu.

## Le hero : un repère fixe adressé en pourcentages

`.hero__panel` est un contexte de container query (`container-name: panel`) verrouillé sur
`aspect-ratio: 1472 / 599`, la taille du cadre Figma. Chaque élément décoratif de
`.hero__decor` est positionné en **pourcentage de ce cadre**, et les tailles de texte sont en
`cqw`. Donc quand une demande est formulée en pixels (« descend la ligne de 10px »), convertis
contre cette taille de référence : **10px ≈ 0,679 % en horizontal, ≈ 1,669 % en vertical**.
La rotation de chaque sticker vit dans sa règle `.sticker-N` sous forme de `--rot`, pas dans
un `transform`.

Pour placer un élément par rapport à un tracé SVG décoratif (par exemple « mets UX au départ
de la flèche »), lis le point fractionnaire dans le `d` du SVG, multiplie-le par le `width:%`
de l'élément et par 1472/599 pour la composante verticale, puis ajoute ses `left`/`top`.

## Le décollage des stickers (`js/main.js`, première IIFE)

Draguer un sticker ne doit **pas le déplacer** : ça soulève un coin en 3D et ça revient en
place. Le JS n'écrit que `--tiltx`, `--tilty` et `--peel-scale` ; la transformation composée
vit entièrement dans la règle `.decor--sticker`. Garde ce partage : ajouter une translation
dans le JS casse l'intention. `setPointerCapture` est enveloppé dans un try/catch parce que
les drags synthétiques lèvent `NotFoundError`.

## La section parcours (`#experiences`)

La partie la plus délicate du site. `js/main.js`, deuxième IIFE.

**Forme.** Une piste `.trail` très haute (`height: 1150vh`) avec une scène en
`position: sticky`. La progression du scroll vaut
`-trail.getBoundingClientRect().top / runway`, limitée par rAF.

**La caméra est une seule transformation composée** sur `.trail__map` (7200×7200,
`transform-origin: 0 0`), qui se lit de droite à gauche : amener le point du marcheur à
l'origine, mettre à l'échelle, tourner, puis le poser à l'écran.

```
translate(cx,cy) rotate(rot) scale(zoom) translate(-here.x,-here.y)
```

Tout le reste en découle. **N'anime rien d'autre image par image** — c'est cette
transformation unique et composite qui rend la section fluide au doigt. `cx`/`cy` valent le
centre de l'écran plus une légère dérive sinusoïdale, pour que le marcheur respire autour du
milieu sans jamais approcher un bord.

**La rotation cap en haut** est échantillonnée de part et d'autre du marcheur, puis
*déroulée* à la couture de l'atan2 (`while (heading - prev > 180) heading -= 360`), faute de
quoi un scroll rapide provoque un tour complet, puis amortie par `ROT_DAMP`. Au-delà de ~0,4
l'amortissement rend le scroll rapide brinquebalant : la valeur actuelle a été baissée exprès.

**Les étiquettes se contre-transforment.** Les étapes vivent *à l'intérieur* de la carte qui
tourne, pour rester collées au terrain, et annulent la caméra avec
`rotate(calc(-1 * var(--rot))) scale(calc(1 / var(--zoom)))`. `--rot` et `--zoom` sont posés
sur `.trail__map` à chaque image uniquement pour servir d'interface JS → CSS.

**Le rythme est non linéaire par construction.** `costAt(p)` renvoie un coût de scroll par
unité de parcours : une base, plus une pénalité de pente issue du profil `GRADE` (« comme si
on montait »), plus un puits triangulaire à chaque étape pour que le marcheur s'arrête
presque le temps qu'on lise la carte. Le tout est intégré une fois en table cumulée, puis
inversé par recherche dichotomique dans `progressFor()`. Augmente `DWELL_COST`/`DWELL_W` pour
des pauses plus longues ; les deux ont été baissés quand une cinquième étape est arrivée,
puisque le nombre d'étapes multiplie la longueur totale de la piste.

**La plage de scroll est bornée aux étapes.** `START` et `END` viennent du premier et du
dernier `data-at`, si bien que la section s'ouvre déjà à la première étape avec du vert
derrière soi, et se termine à la dernière avec les pointillés gris qui continuent au-delà.
Conséquence : la fraction brute du parcours ne vaut jamais 0 ni 1 — l'affichage du HUD montre
donc délibérément `scrolled`, et non `p`.

**Deux tracés superposés, au `d` identique.** `.trail__track` est la route grise en
pointillés devant ; `.trail__track-done` est verte, pleine, et se révèle par
`stroke-dasharray: ${walked} ${total}`. Cette astuce ne fonctionne que parce que la ligne
parcourue n'est *pas* en pointillés — si elle le redevenait, il faudrait un `<mask>` et un
tracé de révélation distinct.

Ajouter ou déplacer une étape se fait en éditant `data-at` dans `index.html` ; les positions à
l'écran sont calculées par `getPointAtLength`, il n'y a rien d'autre à toucher.

`prefers-reduced-motion: reduce` désépingle l'ensemble en une simple frise verticale. Quand tu
y masques des morceaux de la carte, masque les éléments feuilles — masquer un conteneur a déjà
emporté `.trail__stops` deux fois en silence.

## Les assets générés

`assets/hero-topo.svg`, `assets/trail-map.svg` et l'attribut `d` du parcours sont tous
**produits par les scripts Python de `tools/`** (numpy / scipy / matplotlib, déjà installés).
Chacun utilise une graine fixe : relancer `gen_map.py` et `gen_route.py` reproduit les assets
versionnés **à l'octet près**, tu peux donc changer un paramètre et régénérer en confiance.
Voir `tools/README.md`, qui consigne aussi la seule lacune : `gen_topo.py` sort un SVG brut de
204 Ko alors que le `hero-topo.svg` livré en fait 132 Ko, une passe de nettoyage qui n'a pas
été conservée.

`gen_route.py` réécrit le `d` des **deux** `<path>` d'`index.html` ; ils doivent toujours
porter la même valeur.

## À préciser

Ces points ne sont pas encore arbitrés — demande plutôt que de supposer :

- **La hiérarchie du site.** La nav pointe vers `#a-propos`, `#projets` et `#contact`, qui
  **n'existent pas**. Et `#experiences`, qui existe, n'est lié depuis nulle part.
- **L'hébergement**, donc si les chemins doivent rester relatifs et si une étape de
  minification est un jour nécessaire.
- **La source de vérité du design** : savoir si le fichier Figma fait toujours foi.

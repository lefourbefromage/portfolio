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
| `--cream` | `#fef1da` | Blanc cassé : couleur de texte sur fond foncé — c'est le cas partout — **ou** fond des rares surfaces claires (pastilles et cartes du parcours) |
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

- `--ink` `#060d22` — `hsl(226 70% 8%)`. Fond du site, et pied du ciel du parcours. Ce fut
  aussi l'encre de la carte topographique, dont les courbes sont désormais tracées en crème.
- `--ink-rgb` `6 13 34` — pour les opacités : `rgb(var(--ink-rgb) / .32)`.
- `--cream-rgb`, `--navy-rgb` — même usage pour les deux autres.

**Ne réintroduis jamais une opacité en `rgba()` codée en dur.** La section parcours en a
compté jusqu'à dix, à neuf opacités différentes, ce qui rendait tout changement manuel.

Exceptions restant hors palette, à trancher un jour : `#44d444` (pastille « Disponible »),
`#4258a2` (bordure du badge de localisation), `#fffaf0` (fond des cartes du parcours).

### Typographie

Trois familles, toutes auto-hébergées dans `fonts/` en woff2 variable.

- **Clash Display** (`--font-display`, graisses 200–700) — titres en bold, ainsi que les
  sous-titres et les labels.
- **Inter** (`--font-body`, graisses 100–900) — texte courant, en regular.
- **EB Garamond** (`--font-serif`, graisses 400–800) — **en italique seulement**. Réservé à
  quatre usages, tous décidés par la maquette : les œils des **quatre** sections, les mots mis
  en avant dans le texte d'À propos, l'année des cartes d'étape, et le « Avancement » du HUD. C'est la respiration du reste : ne l'étends pas sans le demander.

`body` porte `--font-body` ; `--font-display` est appliqué explicitement aux onze sélecteurs
de titres et de labels. Un nouvel élément de texte hérite donc d'Inter par défaut, ce qui est
le comportement voulu.

**Le woff2 de Garamond ne contient QUE l'italique**, sous-ensemble latin + accents français,
29 Ko. Il est produit depuis la variable Google Fonts (`EBGaramond-Italic-VariableFont_wght.ttf`)
avec fontTools ; le `@font-face` est déclaré en `font-style: italic`. Écrire du Garamond droit
donnerait un faux romain synthétisé par le navigateur — ne le fais pas, ou réexporte le romain.
Son œil est plus petit que celui d'Inter : `.about__hl` compense par un `font-size: 1.08em`,
sinon les mots en avant paraissent en retrait au lieu d'en relief.

## La structure de la page

`Hero > À propos > Parcours (« Carnet de routes ») > Projets > Contact > Footer`, dans cet ordre, et la nav du
header comme celle du footer pointent toutes vers des sections qui existent bel et bien —
dans l'ordre de la page, elles aussi. À propos passe **avant** projets : c'est ce que veut la
maquette, et c'est ce qui met la section à cheval avec le tas de photos du hero.

`html` **et `main`** portent `overflow-x: clip` : en s'en allant, les photos du tas grossissent
et dérivent hors du cadre, et sans ça un ascenseur horizontal apparaît. Il en faut sur les
deux — la règle du root ne retient pas ce débordement-là, seul le clip du conteneur pleine
largeur l'arrête. `clip` et non `hidden` : ni l'un ni l'autre ne crée de conteneur de
défilement ici, donc le `position: sticky` du parcours n'est pas affecté (vérifié).

**Le fond du site est sombre de bout en bout**, parcours compris. Il l'a été *sauf* pour le
parcours, qui était crème ; cette inversion a été retirée. La carte porte à la place son
propre ciel (`--trail-sky`, voir plus bas), un dégradé de `--navy` vers `--ink` : le seul
écart de valeur de la page, et il reste sur l'axe des bleus. Les seules surfaces claires
restantes sont les cartes d'étape du parcours. N'introduis pas de section claire.

Les sections plates partagent trois primitives — `.section` (largeur max et rythme vertical),
`.section__eyebrow` / `.section__title` / `.section__lede` — et la pastille `.todo` qui
signale un contenu encore à écrire. Le parcours garde ses propres `.trail__eyebrow` et
`.trail__heading` — non plus pour inverser ses couleurs, mais parce que sa tête est posée
sur la carte et non dans le rythme vertical de `.section`.

**Les quatre sections portent LA MÊME tête**, et c'est une consigne : œil en Garamond italique
`clamp(20px, 2.9vw, 41px)`, numéro d'ordre en vert, titre en Clash bold et en casse normale
`clamp(32px, 4.6vw, 66px)`, le tout centré. Il y a eu trois têtes différentes sur cette page —
capitales espacées roses pour projets et contact, Garamond 18/25px pour À propos et le
parcours, puis la grande version de la maquette arrivée par les projets. **Ne les fais pas
revenir.**

Les sélecteurs sont **groupés exprès** dans une seule déclaration
(`.section__eyebrow, .about__eyebrow, .trail__eyebrow` et de même pour les titres) : plus rien
ne peut diverger sans qu'on le voie. Ne redonne pas une taille propre à l'une des trois
familles de classes — c'est exactement ce qui avait produit les trois têtes.

**Le rapport titre / œil vaut ~2,1**, celui de la maquette : mesuré au rapport des deux
longueurs de texte, 3,05 contre 3,06. Les trois termes du `clamp` de l'œil valent 0,62 fois
ceux du titre, **borne basse comprise** — sinon la proportion se perd sous ~700px de large, là
où les deux clamps se figent sur leur minimum. Si tu retouches les tailles, garde le rapport
plutôt que les valeurs.

Deux exceptions, et elles sont motivées :

- **le parcours est aligné à gauche** (`.trail__intro`), son titre étant un calque dans le coin
  de la carte et non un bloc dans le flux ; son œil est aussi légèrement retenu (crème à 82 %)
  parce qu'il est posé sur le terrain ;
- **le titre de couverture du parcours est une vignette** : le carton fait au plus 330px de
  large, où 66px ne tiendrait pas. Il se règle donc sur `--card-w` et non sur la largeur de
  l'écran (`calc(var(--card-w) * .089)`, et `.055` pour l'œil — le même rapport 0,62). Ce n'est
  pas une quatrième taille, c'est le même titre en réduction.

Les quatre œils portent un numéro d'ordre : `01.` À propos, `02.` parcours, `03.` projets,
`04.` contact.

`html` porte `scroll-behavior: smooth`, sous `prefers-reduced-motion: no-preference`. Cliquer
une ancre qui traverse le parcours le fait donc défiler d'un trait : c'est voulu, la caméra
suit image par image sans casser.

## Le hero : un repère fixe adressé en pourcentages

**Deux boîtes, à ne pas confondre.** `.hero__panel` fait `aspect-ratio: 1472 / 730` — presque
2/1 — mais le **cadre Figma reste 1472 × 599**, porté par `--frame` et appliqué à
`.hero__content` et `.hero__decor`, calés EN HAUT du panneau. La hauteur en plus s'ouvre donc
en dessous, sans déplacer d'un pixel le titre, les badges ni les onze éléments du décor ; c'est
elle qui laisse la place au « Scroll to explore » et au tas de photos. Si tu remets le décor
sur la hauteur du panneau, tout descend proportionnellement.

`.hero__panel` est aussi le contexte de container query (`container-name: panel`) : les `cqw`
ne dépendent que de la largeur, donc ils sont les mêmes dans les deux boîtes. Chaque élément
décoratif de `.hero__decor` est positionné en **pourcentage du cadre de 599**, et les tailles
de texte sont en `cqw`. Donc quand une demande est formulée en pixels (« descend la ligne de 10px »), convertis
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

## Le tas de photos (`js/main.js`, deuxième IIFE)

Sous le hero, à cheval sur le haut d'À propos. Tout — le « Scroll to explore », le tracé
pointillé et les sept photos — est posé en **pourcentage d'un même cadre de référence**, 1472
× 490, comme les stickers du hero. La composition se met donc à l'échelle d'un seul bloc, et
les coordonnées du `d` du tracé sont celles de ce cadre (même viewBox, même rapport).

**L'échelle du collage est une règle, pas un réglage : il fait la largeur du titre du hero.**
949 sur 1472, mesuré des deux côtés. C'est le repère à reprendre si tu retouches les tailles —
une première lecture de la maquette l'avait fait une fois et demie trop grand, jusqu'à occuper
toute la largeur, ce qui ne ressemblait plus à rien.

**Les PNG sont à plat** : plus de rotation ni d'ombre cuites dedans, seulement le cadre crème.
La rotation de repos vit dans `--rot` de chaque règle `.pile__photo--N` (jamais dans un
`transform`) et l'ombre est un `box-shadow`. Elle ne se voit presque pas sur le fond d'encre —
c'est sur les photos de dessous qu'elle travaille, et c'est ce qui fait tenir l'empilement.
`photo1` à `photo7` sont de gauche à droite dans la maquette.

**L'empilement est décidé par des `z-index` explicites, pas par l'ordre du DOM.** Ce sont les
quatre couches de la maquette, et elles sont données :

| couche | photos |
|---|---|
| 1 (au fond) | 1 et 7 |
| 2 | 4 |
| 3 | 3 et 6 |
| 4 (devant) | 2 et 5 |

Le tracé est en `z-index: 0` (donc sous tout : il disparaît derrière la photo du randonneur et
ressort en dessous) — et son `inset` porte un **bas négatif** (-20,41 %, soit 100 unités de
cadre) pour qu'il descende dans le padding haut d'À propos et meure juste au-dessus de l'œil de
section, comme sur la maquette. Le `d` s'arrête à **510** et pas à 590 : c'est ce qui laisse
36px de dégagement au-dessus de l'œil, sans quoi le dernier tiret vient buter dessus. Pour le
raccourcir, corrige le `d` et **pas** l'inset — réduire la boîte remet tout le tracé à
l'échelle au lieu de l'écourter. Rien ne le rogne : `container-type` applique une containment de
layout, pas de peinture. Son viewBox vaut donc 1472 × 590, pas 1472 × 490 et le « Scroll to explore » en `z-index: 5`, au-dessus de tout. L'ordre du
DOM suit quand même ces couches — `1, 7, 4, 3, 6, 2, 5` — mais pour une autre raison : c'est
lui que lit `:nth-of-type` pour décaler l'animation de chargement, qui doit poser les photos de
l'arrière vers l'avant. Changer l'un sans l'autre désynchronise l'empilement et le décalage.

**Le raccord tient à une seule marge négative.** `--bite` (8 % de la largeur du cadre, soit
118px) dit de combien le CADRE remonte sur le hero ; `.pile__scene` porte
`margin-top: calc(-1 * var(--bite) - clamp(20px, 3vw, 40px))`, le second terme annulant le
padding bas du hero. **Ne répartis pas ça sur deux marges** (une sur `.pile`, une sur
`.pile__scene`) : elles s'effondrent en une seule, la plus grande, et la morsure tombait à 24px
au lieu de 118.

Cette valeur est calée sur une contrainte précise : le hero laisse **259px de libre sous ses
badges** (mesuré au cadre de 1472) depuis qu'il est passé en presque 2/1. Trois choses s'y
logent, et elles se tiennent : le « Scroll to explore » à 90px sous les badges, 72px d'écart
jusqu'au collage (la maquette en a 70), et le haut des photos qui mord de 75px sur le bord bas
du panneau. Bouger `--bite` déplace les trois d'un coup — et **changer le rapport du hero aussi**,
puisque tout est mesuré depuis son bord bas.

**L'arrivée est une animation CSS jouée une fois au chargement**, pas un montage au scroll :
les photos sont en place dès le départ et se posent de l'arrière vers l'avant
(`@keyframes pile-land`, 70ms d'écart, dans l'ordre du DOM). Elle passe par la propriété **`translate`**, pas par
`transform`, pour ne pas écraser la transformation composée — les deux se composent d'elles-
mêmes. Ne la remets pas au scroll.

**Le JS ne pose plus qu'un nombre** : `--out` sur la scène (0 posée, 1 partie), pour la sortie
en parallaxe. La progression est mesurée sur la **traversée du tas** — du moment où son
bord haut entre par le bas de l'écran à celui où son bord bas sort par le haut. C'est ce qui
tient à toute hauteur d'écran : le tas est haut dans la page, donc sur une grande fenêtre il
est déjà entier à l'écran au chargement, et un repère « centre du tas dans la fenêtre »
démarrait avant le premier scroll. La sortie court de 0,50 à 0,90 de traversée : **le bord haut
du tas quitte l'écran aux deux tiers**, donc des bornes plus tardives la jouaient hors champ.

- **La sortie est une remontée, et rien d'autre.** Les photos s'échappent vers le haut, sans
  zoom et sans dérive latérale : la transformation ne compose plus qu'un `translateY` et la
  rotation. Ne réintroduis pas de `scale()` — ça a été essayé et retiré.
- **Elles ne montent pas à la même vitesse**, et c'est tout le sujet : `--away-y` va de -6vh
  pour celle du fond à -21vh pour celle de devant. C'est ce seul écart qui fait le parallaxe.
- Les valeurs sont volontairement basses — les photos doivent s'échapper **doucement**, pas
  décoller. Celle de devant va ~43 % plus vite que le scroll, celle du fond ~12 %.
- La sortie **reste linéaire**. N'y remets pas d'assouplissement : c'est un parallaxe, donc
  proportionnel au scroll, et l'effet vient de l'écart entre les photos, pas d'une courbe.

En mobile le collage **déborde des deux côtés** plutôt que de rétrécir : `width: 170%` et
`margin-left: -35%` sur la scène, donc son cadre en `aspect-ratio` grandit d'autant et les
hauteurs suivent toutes seules. `--bite` est remis à l'échelle en conséquence (20,9 %). Le
débord est clos par le `overflow-x: clip` de `html`.

Sous `prefers-reduced-motion: reduce`, ni l'animation de chargement ni le JS ne tournent : le
défaut `--out: 0` posé sur `.pile__scene` laisse le collage en place, immobile.

Deux choses à savoir sur les assets : `photo4.png` a été **rognée de sa bande transparente
haute** (54px) pour que la boîte de l'élément vaille exactement la photo visible — c'est
l'invariant sur lequel reposent les `top` en % et le `box-shadow`. Si tu réexportes une photo
depuis Figma, vérifie que son alpha remplit toute l'image. Et le libellé est en anglais
(« Scroll to explore ») parce que la maquette l'est : c'est la seule entorse au français.


## La section À propos (`#a-propos`)

**C'est la seule section bâtie comme ça, et c'est voulu** : l'œil (`.about__eyebrow`) et le
titre sont **centrés**, le texte repasse **à gauche** dans une colonne de 1040px. Ne la
réaligne pas sur les autres sections, qui sont entièrement à gauche.

**Sa hiérarchie a longtemps été inversée** — tête volontairement plus petite que le texte
qu'elle annonce, œil à 18px et titre à 25px au-dessus d'un corps à 30px. **Ce n'est plus le
cas** : Vincent a demandé l'unification des quatre titres, et À propos porte désormais la tête
commune (voir « Les quatre sections portent LA MÊME tête »). Le titre y est donc plus gros que
son texte, comme partout ailleurs. `.about__eyebrow` et `.about__title` n'ont plus de règles à
eux — ne leur en redonne pas.

Ce qui reste vrai : le corps monte à 30px (`clamp(17px, 1.98vw, 30px)`, contre 18px pour le
reste du site) et le chapô à 32px, dans une colonne calée sur ~70 signes par ligne. Si tu
changes le corps, change la largeur de colonne avec : les deux tiennent la mesure.

`.about__head` ne porte **aucune largeur maximale**, ce qui évite de mal recentrer les titres
longs.

**Le fond porte deux carrés topo** (`assets/topo-square-left.svg` et `-right.svg`, 266×266),
posés dans un `.about__topo` en `z-index: -1` et `overflow: hidden` qui les laisse déborder
des deux bords sans créer d'ascenseur. Ils sont calés en % de la **largeur**, jamais de la
hauteur : le texte est du contenu réel, donc la section grandit quand on l'édite et un calage
vertical en % dériverait. Leur remplissage a été ramené de `#18264A` à `--navy` à l'import —
garde-le dans la palette si tu réexportes.

**Le fil pointillé qui relie les deux sections part d'ici mais vit dans le parcours** —
voir « Le fil qui vient d'À propos » plus bas. Il n'est plus dans `.about__body` parce qu'il
doit se figer avec la scène du parcours, ce qu'un enfant d'À propos ne peut pas faire.

**Le bouton CV est un `<span>`, pas un `<a>`, tant que le PDF n'existe pas** — même règle que
les liens réseaux du contact : pas d'ancre morte sur le site. Le jour où le fichier est là, il
repasse en `<a href="assets/cv-vincent-waldmann.pdf" download>`, un commentaire HTML le
rappelle sur place.

Le texte est **du vrai contenu**, écrit avec Vincent : treize ans d'expérience depuis 2013,
les années sur des sites à très forte audience, et le « couteau suisse ». Le nombre d'années
est écrit en toutes lettres dans le chapô — un commentaire HTML rappelle de l'incrémenter. L'ancienne liste de compétences
(`.about__skills`) a disparu avec la refonte — les stickers du hero disent déjà les outils.

## La section parcours (`#parcours`, « Carnet de routes »)

La partie la plus délicate du site. `js/main.js`, troisième IIFE.

**Forme.** Une piste `.trail` très haute (`height: 717vh`) avec une scène en
`position: sticky`.

**Le parcours a son propre ciel.** `--trail-sky`, déclaré sur `.trail`, est un dégradé à 163°
qui va de `--navy` à `--ink` (88 %) : deux tokens existants, aucune cinquième couleur, et toute
la teinte reste sur l'axe 226. Il est peint sur `.trail__window` — c'est donc lui qu'on découvre
en ouvrant le carton — et il finit exactement sur l'encre de la page, si bien que la marge
`--frame` qui borde la carte ouverte ne laisse pas de couture en bas.

Quatre corollaires, tous déjà appliqués ; si tu retouches le ciel, ils se tiennent :

- le texte de la scène est **crème** (`color` sur `.trail__stage`), l'œil et le titre compris ;
- le tracé encore à parcourir est crème à 38 % d'opacité, plus de l'encre à 32 % ;
- le HUD est une pastille d'**encre sur un fond devenu sombre** : il ne se détachait plus, d'où
  son filet crème à 16 % ;
- les cartes d'étape, elles, restent claires (`#fffaf0`, texte encre) — ce sont les seules
  surfaces claires de la page, et c'est ce qui les fait ressortir sur le terrain.

**La section REMONTE sur le bas d'À propos** (`margin-top: calc(-1 * var(--pull))`, avec
`--pull: max(0px, calc(50vh - 260px))`), et ce n'est pas un ajustement esthétique : c'est ce
qui rend le fil pointillé de longueur constante. Le carton se tient à 50vh sous le haut de la
section, donc sans ça le trajet du bouton « CV » jusqu'à lui grandissait avec la hauteur de la
fenêtre — 380px sur un portable, plus de 1000 sur un grand écran, dont 640 de seule descente
droite. En remontant de `50vh − 260px`, ce terme sort du calcul : le trajet tient dans
376–465px de 900 × 600 à 2560 × 1440. Le `max(0px, ...)` évite de POUSSER la section vers le bas
sur une fenêtre de moins de 520px de haut.

Le recouvrement va jusqu'à 271px et ne cache rien : la scène est transparente tant que la
fenêtre n'est pas ouverte, donc le texte d'À propos continue de défiler dessous, normalement.
**Toute position mesurée depuis le haut de la section doit ajouter `--pull`** — c'est le cas de
`--lead-top` et la hauteur du fil.

### La révélation : une fenêtre qui s'ouvre, une carte qui ne bouge pas

Avant la marche, la section se donne un premier temps. Un **petit carton centré** montre déjà
la carte en fond, avec l'œil et le titre dedans ; en scrollant il grandit jusqu'au plein écran,
à une marge d'encre près.

**C'est un masque, pas un zoom, et c'est tout le sujet.** `.trail__window` porte un
`clip-path: inset(...)` dont les quatre côtés s'interpolent entre le carton et le plein cadre.
La carte, dessous, n'est **pas** transformée pendant ce temps : le même relief reste exactement
au même endroit à l'écran, on ne fait qu'en découvrir davantage. Si tu remplaces ça par une mise
à l'échelle du carton, l'effet s'inverse et tout est perdu.

**Le marcheur avance pendant l'ouverture, mais la caméra ne le suit pas** — c'est le partage à
tenir, et il repose sur une seule variable dans `render()` : `pCam`. Le chemin parcouru, le
pourcentage et les cartes d'étape suivent `p`, la vraie progression ; la caméra, elle, suit
`pCam`, qui est **tenu à la position que le marcheur aura à la FIN de la révélation** tant que
`rev < 1`. D'où un terrain rigoureusement immobile sous le cadre qui s'ouvre (matrice de
transformation identique au pixel près, vérifié), et **aucun saut au raccord** puisque les deux
valeurs se rejoignent exactement à cet instant. Viser la position de DÉPART à la place
produirait ce saut : c'est le piège.

Toute la géométrie de l'ouverture vit dans le CSS — taille du carton (`--card-w`, `--card-h`),
marge finale (`--frame`), arrondi — et **le JS n'écrit qu'un nombre**, `--open`, comme pour les
stickers du hero et le tas de photos. `--open` et la classe `is-open` sont posés sur **`.trail`
et pas sur la scène** : le fil pointillé en a besoin lui aussi, et comme il est le FRÈRE de la
scène il ne pourrait pas les lire depuis elle. Ne redéclare pas `--open: 0` sur `.trail__stage`
— une déclaration sur l'élément l'emporte sur l'héritage, et la valeur du JS serait masquée. Les `%` du `inset()` se résolvent sur la boîte de la
fenêtre, donc le carton reste centré à toute taille d'écran sans une ligne de JS.

Trois choses attendent la **fin** de la révélation, et c'est une consigne : le chemin, le
marcheur et les étapes n'apparaissent qu'une fois la carte entièrement ouverte, avec le HUD et
le titre en haut à gauche. Le JS pose alors la classe `is-open` sur la scène et le CSS fait le
fondu. C'est un rendez-vous, pas une progression : n'accroche pas ces opacités au scroll.

**Et à cet instant on est presque sur la première étape**, à 11 % contre 14 % pour la carte —
c'est là que la caméra prend le relais et se met à suivre.
C'est `REVEAL_VH` qui le règle, contre le coût de l'amorce, qui vaut 100vh : à **0,8** il reste
20vh de marche visible après l'ouverture, le temps de voir le marcheur couvrir les derniers
mètres et la carte d'étape apparaître. À 1 il serait collé dessus au moment même où le cadre
finit de s'ouvrir, et le chemin paraîtrait déjà arrivé. `REVEAL_VH` n'a **pas** de budget de
scroll à lui : il se superpose à la marche, donc le changer ne touche ni la hauteur CSS ni la
vitesse au sol.

**Deux titres, pas un seul qui se déplace.** `.trail__cover` est centré dans le carton et
s'efface au scroll (`opacity: calc(1 - var(--open) * 2.8)`, l'opacité étant bornée par le
navigateur, pas besoin de clamp) ; `.trail__intro` reparaît en haut à gauche à l'ouverture.
Le premier est `aria-hidden` et n'est pas un `<h2>` — sans quoi le titre serait doublé.

**La révélation ne coûte rien** : mesurée à 8,3 ms médians, exactement comme la marche. Un
`clip-path: inset()` est un découpage de rectangle arrondi, pas une recomposition.

### Le fil qui vient d'À propos

Le trait pointillé qui descend du bouton « CV » et va se poser sur le carton vit **dans le
parcours**, pas dans À propos, et son bloc `.trail__lead` est en **`position: sticky`** avec une
hauteur nulle.

**C'est ce sticky qui fait tout** : il se colle en haut de l'écran à l'instant précis où la
scène s'épingle, donc **au début de la révélation**. Avant, le fil défile avec la page et reste
accroché sous le bouton ; à partir de là **il ne bouge plus**, et le carton, en grandissant, le
recouvre jusqu'à l'avoir mangé.

**Et il s'escamote pour de bon dès que la carte est ouverte** (`.trail.is-open .trail__lead`).
Ce n'est pas cosmétique : son bloc reste collant sur **toute** la hauteur de la section, donc
sans ça il réapparaissait par-dessus la section projets une fois la carte sortie par le haut.
À cet instant il est déjà caché derrière la carte, l'escamotage ne se voit donc pas. C'est aussi pourquoi il ne peut pas rester dans `.about__body` :
un `sticky` ne sort pas de son bloc conteneur, et il doit tenir bien au-delà d'À propos.
Hauteur nulle pour ne pas décaler la scène d'un pixel, et placé **avant** elle dans le DOM —
tous deux en `z-index: auto` — pour que la fenêtre peigne par-dessus.

`.trail__lead` **recopie les boîtes d'À propos** (`max-width: 1512px`, le même `padding-inline`,
puis une colonne de 1040px) : le fil part ainsi exactement sous le bouton sans un seul calcul de
centrage à refaire.

**Un seul tracé, et il est DÉFORMÉ — c'est le point à comprendre.** Le fil doit couvrir deux
distances qui ne varient pas ensemble : la *verticale* dépend de la hauteur de la fenêtre (le
carton se tient à 50vh sous le haut de la section) alors que l'*horizontale* est quasi
constante — la colonne de texte et le carton sont l'un comme l'autre centrés.
`preserveAspectRatio="none"` laisse donc chaque axe se régler sur sa contrainte.

Ça ne marche que grâce à `vector-effect: non-scaling-stroke`, qui refait le trait en **pixels
d'écran** : bouts ronds et tirets restent nets quel que soit l'étirement. Mesuré à 0,91–1,17
d'écart en desktop (invisible) et 0,26 en mobile — même à ce 3,8x d'écrasement le trait reste
propre, vérifié côte à côte. Sans lui il faudrait deux éléments (une descente droite qui absorbe
le vertical, une boucle à taille fixe), ce qui a été la version précédente : elle ajoutait une
jointure à recaler en x ET en phase de tirets, pour rien.

**La boîte du SVG EST le trajet.** Le tracé vient d'`assets/separator.svg` (fourni par
Vincent, gardé comme référence — rien ne le charge, il est recopié dans le HTML),
renormalisé pour que son départ tombe en (0,0) et son arrivée en (486,415) : il n'y a donc plus
rien à calculer pour placer ses deux bouts, on dimensionne la boîte et c'est tout.

- en largeur, `calc(50% - 64px + var(--card-w) * 0.08)` : du bouton (62 + 2 = 64px, l'axe du
  trait) jusqu'au carton. La colonne de 1040px étant centrée comme lui, **sa moitié EST le
  centre du carton** — d'où le « 50 % », sans un seul calcul de centrage ;
- en hauteur, jusqu'à 70px SOUS le bord haut du carton, pour finir derrière lui.

Les points de contrôle sortent de la boîte (−222 et 749 en x), c'est voulu — c'est le ventre de
la courbe vers la gauche, qui va lécher le bord gauche de la colonne de texte. D'où
`overflow: visible` sur le SVG.

**Ne réduis pas le padding bas d'À propos pour « rapprocher » les deux sections** : c'est lui
qui donne sa hauteur au fil. À zéro, le trajet tombe de 370–439px à 199–240px et la courbe est
écrasée de moitié en plus de son étirement horizontal. C'est la remontée de la section
(`--pull`, voir « Forme ») qui règle cette distance, pas le padding.

**Le mode auto est débrayé tant que la carte n'est pas ouverte.** La scène est déjà épinglée
pendant la révélation, donc sans le garde `revealFraction() < 1` dans `targetFor()`, le premier
cran de molette filerait droit sur la première carte et on ne verrait jamais la fenêtre
s'ouvrir.

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

**`.trail__you` vit dans la carte lui aussi**, posé en coordonnées carte (`here.x`, `here.y`)
et contre-transformé de la même façon — la caméra amène ce point pile en `cx, cy`, donc il
retombe au même endroit à l'écran que s'il était posé sur la scène. Ce n'est pas un détour
gratuit : `.trail__map` est un contexte d'empilement à lui seul (il porte un `transform`), donc
tant que le point restait un frère de la carte avec un `z-index`, **rien** de la carte ne
pouvait passer devant lui. Le mettre dedans, juste avant `.trail__stops`, est le seul moyen de
le garder au-dessus du terrain tout en laissant les étiquettes passer par-dessus. L'ordre de
peinture tient au seul ordre du DOM (les deux sont en `z-index: auto`) : ne réordonne pas ces
deux blocs sans le vouloir.

**Le relief est cuit dans la tuile, et il doit le rester.** `assets/trail-relief.svg` est une
tuile de 1400 px où chaque niveau de courbe est déjà remonté de `i × STEP` dans le dessin
lui-même — c'est ce qui donne l'empilement des cartes topographiques dessinées, sans aucune
3D. Un seul `background`, un seul calque.

**Et elle est dessinée en crème**, pas en encre, depuis que le parcours est passé sur fond
sombre : `LINE_RGB` dans `gen_relief.py`. `ALPHA` (0,46) ramène au passage toutes les opacités
au même poids visuel — elles avaient été calées pour de l'encre sur crème, et une ligne claire
sur fond sombre paraît nettement plus forte. Garde les deux ensemble si tu régénères la tuile.

**Ne redécoupe pas ce fond en calques.** Une version l'a fait — un `<div>` par niveau, décalé
en `translateZ` dans un contexte `preserve-3d`, la carte inclinée en `rotateX`. Ça marchait
visuellement, et c'était inutilisable : la surface composée (24 calques sur toute la carte,
1 244 Mpx) saturait le compositeur, qui évinçait des tuiles. La carte et le tracé
**clignotaient et disparaissaient** au scroll, et il y avait des gels de 1,5 à 2 s. En prime,
un SVG dans un contexte `preserve-3d` n'est pas toujours composité : le tracé s'évanouissait
par intermittence. Avec la tuile cuite, plus rien de tout ça ne peut revenir — mesuré à 8-17 ms
médians, 25 ms au pire, sur toute la traversée.

Le prix de la cuisson, assumé : la direction de l'empilement est fixée dans l'image, donc elle
suit la rotation cap-en-haut au lieu de rester verticale à l'écran. `ROT_DAMP` bornant la
rotation à ±25°, le relief penche un peu au fil de la marche.

Trois contraintes à respecter si tu retouches `tools/gen_relief.py` :

- **`STEP` doit rester sous le quart de l'espacement horizontal des courbes** (~`TILE/LEVELS`).
  Au-delà, deux niveaux voisins se croisent au lieu de s'emboîter et le volume cesse de se
  lire — dans les pentes raides ça donne déjà un paquet de lignes parallèles plutôt que du
  relief. Baisser `STEP` corrige, au prix d'un relief plus discret.
- **Chaque niveau est dessiné deux fois**, à `dy` et `dy + TILE`. C'est ce qui garde la couture
  invisible malgré le décalage vertical : sans la copie, chaque niveau laisserait une bande
  vide en bas de la tuile.
- **`LINE_RGB` doit rester dans la palette** et `ALPHA` bouger avec lui : ce sont les deux
  réglages qui accordent la tuile au fond du parcours.

**Le rythme est non linéaire par construction.** `costAt(p)` renvoie un coût de scroll par
unité de parcours : une base, plus une pénalité de pente issue du profil `GRADE` (« comme si
on montait »), plus un puits triangulaire à chaque étape pour que le marcheur s'arrête
presque le temps qu'on lise la carte. Le tout est intégré une fois en table cumulée, puis
inversé par recherche dichotomique dans `progressFor()`. Augmente `BASE_COST`/`GRADE_COST`
pour de plus longues marches.

**Les étapes sont des aimants, pas des ralentisseurs.** Le puits de coût est un trapèze très
étroit (`DETENT_W` = 0,0025 de parcours) et très haut (`DETENT_COST` = 8,7, soit ~18x le coût
en terrain libre) : on arrive presque à pleine vitesse, on se colle net, et il faut ~45 vh de
scroll pour décrocher — pendant lesquels le marcheur n'avance que de 47 px de carte. La
version précédente étalait au contraire la décélération sur un quart de marche, ce qui se
lisait comme un ralentissement mou plutôt que comme un arrêt. Si tu élargis `DETENT_W`, tu
retombes dans le ralenti ; c'est l'étroitesse qui fait l'aimant.

**Les marches sont volontairement courtes.** C'est réglé aux deux bouts, et il faut tenir les
deux ensemble sous peine de casser l'équilibre :

- *géométriquement*, les `data-at` sont resserrés — un écart de 0,07, contre 0,115 puis 0,18
  dans les versions précédentes, soit 663 px de carte entre deux étapes au lieu de ~1 800 ;
- *en scroll*, `BASE_COST` et `GRADE_COST` ont été divisés par deux environ, si bien qu'un
  intervalle d'étape à étape coûte ~94 vh au lieu de ~243 (49 de marche, 45 d'aimant).

La vitesse à l'écran pendant la marche, elle, n'a quasiment pas bougé (~13 px de carte par
vh) : c'est le trajet qui est plus court, pas le pas qui est plus rapide. Si tu retouches un
des deux réglages, vérifie l'autre — allonger la géométrie sans rallonger le coût donnerait
une marche expédiée.

**Le zoom est piloté par l'approche d'une étape, et rien d'autre.** `approachAt(p)` vaut 0 en
pleine marche et 1 sur une étape ; le zoom va de `ZOOM_TRAVEL` (0,70 — on prend du recul, on
couvre du terrain) à `ZOOM_STOP` (1,14 — on se penche sur la carte). Garde le rapport entre
les deux (1,63) si tu les retouches : c'est lui qui donne son amplitude au mouvement
d'approche, pas leurs valeurs absolues. **`ZOOM_W` doit rester
sous la demi-distance entre deux étapes** (0,035 aujourd'hui) : au-delà, les fenêtres
d'approche se recouvrent, le zoom ne redescend jamais à `ZOOM_TRAVEL` et la carte reste plaquée
de bout en bout. Il a fallu le baisser de 0,048 à 0,030 en rapprochant les cartes. `ZOOM_W` est plus large
que `DWELL_W` **exprès** : l'objectif bouge déjà avant que le scroll ne se mette à résister,
et continue de bouger pendant la pause, ce qui évite que les ~55 % de scroll passés à l'arrêt
paraissent morts. Le profil `GRADE` ne pilote plus le zoom, seulement le rythme.

**Reculer la caméra fait voir le bord du motif**, et c'est le piège de ce réglage. À 0,70 la
marge entre le coin d'écran le plus exposé et le bord de la carte était tombée à 195 px en
2560×1440, et passait négative au-delà. `.trail__relief` déborde donc les 7200 px de la carte
de **2800 px de chaque côté — exactement deux tuiles**, pour que la phase du motif soit
inchangée et que le terrain ne bouge pas d'un pixel. Il reste ainsi 2 995 px de marge en
2560×1440 et 2 378 px en 3440×1440. Si tu baisses encore `ZOOM_TRAVEL`, remesure, et agrandis
le débord **par multiples de 1400**.

**La section se lit en trois temps, et c'est le point le plus délicat du fichier.** `START`
est le premier `data-at` **moins `LEAD_RUN`** (0,113 de parcours), `END` le dernier **plus
`TAIL_RUN`** (0,0607). Ces bornes ne coïncident ni avec le début ni avec la fin de la piste :

- pendant les **100 vh où la section entre par le bas**, le marcheur avance déjà sur l'amorce.
  Il atteint l'aimant de la première carte à l'instant précis où la section achève de se
  poser — c'est là que la marche « commence vraiment » ;
- tant que la scène est **épinglée**, on marche d'étape en étape jusqu'à la dernière carte ;
- pendant les **100 vh où elle ressort par le haut**, le marcheur continue sur la traîne, si
  bien qu'on le voit progresser *pendant* qu'on défile vers le contact.

Sans ces deux bouts, le marcheur restait figé tant que la section n'était pas collée, puis se
figeait de nouveau dès qu'elle se décollait : deux ruptures nettes, aux deux extrémités.

**Tout tient à une division.** `fraction()` mesure la marche sur toute la piste, de
l'épinglage au moment où le bord bas de la section sort par le haut. Une seule division sur une
longueur de scroll réelle, en pixels : la densité est uniforme par construction, le marcheur ne
change jamais d'allure, ni quand la scène se décolle ni pendant la traîne. Une version
antérieure calculait les points de couture à l'avance ; elle dérivait de 5 % sur mobile, où
`vh` et `window.innerHeight` ne sont pas d'accord à cause de la barre d'URL. Ne réintroduis pas
ce découpage explicite.

**La traversée se lit 100 + 717 = 817 vh**, et `height` en vaut 717 : 100 vh d'entrée pendant
lesquels le carton monte jusqu'au centre, puis 717 vh de marche — dont les 100 derniers se
jouent pendant que la scène ressort par le haut. La révélation ne prend aucun de ces vh, elle
se superpose aux 80 premiers.

Les **deux rendez-vous** tiennent : l'entrée dans l'aimant de la première carte tombe 100 vh
après l'épinglage, et la sortie de l'aimant de la dernière pile quand la scène commence à se
retirer (vérifié : 14 % à 1 vh après l'épinglage, 86 % à `H − V`). C'est aussi pourquoi **il n'y
a pas de hauteur réduite en mobile** : les 100 vh d'entrée et de sortie ne rétrécissent pas.

`LEAD_RUN` est près du double de `TAIL_RUN`, et ce n'est pas une faute de frappe : le terrain
d'avant la première carte est plus plat, donc moins cher, donc il en faut davantage pour
dépenser les mêmes 100 vh. C'est aussi ce qui a forcé à **décaler toutes les étapes plus loin
sur le tracé** (première carte à 0,133 au lieu de 0,10) : avec l'ancienne position il n'y
avait pas assez de chemin en amont pour payer l'entrée.

Conséquence de l'amorce : la partie basse du tracé est visible dès l'entrée, ce qui est le
moment où la marge au bord du motif est la plus faible. C'est ce cas-là qu'il faut mesurer
quand on touche au zoom ou au débord de `.trail__relief`.

Conséquence : la fraction brute du parcours ne vaut jamais 0 ni 1 — l'affichage du HUD montre
donc délibérément `scrolled`, et non `p`.

**Le `d` du tracé porte l'altitude.** Il n'est plus celui que produit `gen_route.py` :
`gen_relief.py` le relit et remonte chaque point de la hauteur du terrain sous lui, du même
barème que les courbes de la tuile — d'où un chemin qui épouse le relief. Bonne surprise :
comme `getPointAtLength` renvoie donc des positions déjà relevées, **la caméra, les pastilles
d'étape et le marcheur suivent le terrain sans une ligne de JS en plus**.

Le tracé plat de référence vit dans `assets/route-flat.path`, et c'est lui que le script
relit — relancer `gen_relief.py` ne cumule donc pas les décalages. **Si tu régénères le tracé
avec `gen_route.py`, supprime ce fichier puis relance `gen_relief.py`**, sinon l'altitude
resterait calée sur l'ancien tracé.

**Deux tracés superposés, au `d` identique.** `.trail__track` est la route grise en
pointillés devant ; `.trail__track-done` est verte, pleine, et se révèle par
`stroke-dasharray: ${walked} ${total}`. Cette astuce ne fonctionne que parce que la ligne
parcourue n'est *pas* en pointillés — si elle le redevenait, il faudrait un `<mask>` et un
tracé de révélation distinct.

Ajouter ou déplacer une étape se fait en éditant `data-at` dans `index.html` ; les positions à
l'écran sont calculées par `getPointAtLength`. Une étape ajoutée doit porter les quatre
éléments d'une carte — année, poste, boîte/lieu et `.trail__stop-note` — sans quoi le journal
affichera une entrée tronquée. Mais **quatre valeurs se recalculent ensemble**
dès qu'on touche à l'espacement, et les oublier se voit tout de suite :

| valeur | contrainte |
|---|---|
| `ZOOM_W` | < demi-distance entre deux étapes, sinon le zoom ne respire plus |
| `TAIL_RUN` | fixe la vitesse à l'écran : ~13,5 px de carte par vh |
| `DETENT_COST` | fixe l'aimant à ~45 vh |
| `LEAD_RUN` | rendez-vous d'entrée : `scrollFor(première − DETENT_W)` = 100 vh de traversée |
| `height` (CSS) | rendez-vous de sortie, et donc la traversée totale |

Les trois dernières se résolvent ensemble : le barème est intégré une fois, donc changer l'une
déplace les autres. En pratique on les cherche numériquement plutôt qu'à la main.

### Le journal, en bas à gauche

Le poste courant s'écrit **à même la carte**, en bas à gauche : année, intitulé, boîte, lieu,
puis une description. Comme le reste du parcours, ces cinq textes sont **du vrai contenu**,
écrits par Vincent — ne les réécris pas sans le lui demander.

**Pas de carton, mais un scrim.** Le fond reste transparent — aucune boîte dessinée — et la
lisibilité est assurée par un dégradé d'encre né dans le coin bas gauche, qui meurt avant le
HUD. Il est porté par **le journal et non par ses entrées** : sur une entrée il s'effacerait et
reparaîtrait à chaque changement de poste, et ce clignotement se verrait bien plus que le
dégradé lui-même. D'où une taille fixe et généreuse (`min(430px, 52vh)`), calculée pour couvrir
la description la plus longue sans que le fond ne bouge d'une étape à l'autre. La couleur est
`--ink` : le pied du ciel du parcours, assombri, pas une nouvelle couleur. Pas de carton ni de scrim — le ciel du parcours est assez sombre pour
porter du crème, vérifié par-dessus les courbes les plus denses.

**Il garde le dernier poste atteint.** Tant que l'étape suivante n'est pas débloquée, c'est le
précédent qui reste affiché ; le journal ne se vide jamais entre deux cartes. Le seul état vide
est celui d'avant la première étape, et il tombe pendant la révélation, donc il ne se voit
pratiquement pas : la carte finit de s'ouvrir presque au moment où le marcheur atteint la
première pastille (voir `REVEAL_VH`).

**Les cartes du tracé sont réduites à l'ANNÉE**, exprès : sans ça on lisait deux fois la même
chose à 30 cm d'écart. Le balisage complet reste pourtant dans chaque `<li>` — c'est la
**seule source de vérité**, et le CSS n'en masque que les feuilles (`.trail__stop-role`,
`-org`, `-note`). Deux raisons, toutes deux à respecter :

- le JS **clone** ces éléments au démarrage pour fabriquer les entrées du journal, donc il n'y
  a jamais deux textes à tenir à jour ;
- le **mode réduit les réaffiche en entier** (`display: revert`), puisqu'il n'a pas de journal :
  la frise verticale doit porter tout le texte, description comprise.

Le journal est donc `aria-hidden` : le lecteur d'écran lit la liste des étapes, pas son reflet.

**Les cinq entrées sont toutes dans le DOM, superposées**, et le rendu ne fait que déplacer la
classe `is-current`. Toute la transition est en CSS — aucun minuteur JS qui pourrait se croiser
sur un scroll rapide. L'entrée qui part **ne fait que s'effacer** : sa translation est remise à
sa valeur de départ *après* le fondu (`transition: … translate 0s linear .3s`), donc elle ne
redescend pas ; celle qui arrive monte de 10px, avec 120 ms de retard pour que les deux ne se
croisent pas à mi-opacité.

**Son retrait à gauche est plus serré que le padding du titre** posé au-dessus, et c'est
demandé : `--log-inset` vaut `clamp(16px, 3vw, 42px)` contre `clamp(24px, 4.5vw, 64px)` pour
`.trail__intro`, soit 22px d'écart en 1440. Les deux calques ne sont donc PAS alignés sur la
même verticale — si tu veux les raccorder, c'est le padding de `.trail__intro` qu'il faut
descendre, pas le journal qu'il faut repousser. Le scrim relit `--log-inset`, il n'y a qu'une
valeur à changer.

**Le journal et le HUD partagent la ligne du bas**, à toute largeur d'écran : même `bottom`,
et le journal s'arrête avant le coin droit grâce à `--hud-reserve`, la place réservée au HUD.
C'est ce qui évite qu'un texte long ne décale l'un par rapport à l'autre — une version
précédente faisait passer le journal *au-dessus* du HUD en mobile, et l'alignement se perdait.

La boîte est pour cela **de hauteur nulle et ancrée par le bas** : les entrées grandissent vers
le haut, donc la ligne du bas ne bouge pas d'un poste à l'autre, quelle que soit la longueur de
la description. Le prix de cet alignement se paie en mobile, où la colonne est étroite : la
description la plus longue y monte sur sept lignes (214px de haut en 375 × 812, 17px de
dégagement avec le HUD — mesuré). Si ça devient trop haut, c'est la longueur des textes qu'il
faut revoir, pas l'alignement.

**Le HUD est une pastille d'encre posée sur la carte**, en bas à droite : « Avancement » en
Garamond italique, le pourcentage en gros Clash, et sous un filet le couple **Manuel / Auto**.
Les deux libellés sont **décoratifs** (`aria-hidden`) — l'état réel passe par `aria-pressed` sur
le bouton unique, et son `aria-label` dit ce que fera le prochain clic. Le HUD est en
`pointer-events: none` tant que `is-open` n'est pas posée : invisible, il ne doit pas non plus
être cliquable ni atteignable au clavier.

### Le mode « étape par étape »

Activé par défaut, débrayable par le bouton `.trail__auto` du HUD. Dedans, **un geste n'est
plus une poignée mais un déclencheur** : un cran ou deux de molette et la caméra parcourt
d'elle-même tout le chemin jusqu'à l'étape suivante.

Le rythme de cette marche se règle par `GLIDE_PACE` (3,4 ms par px de scroll à couvrir),
borné par `GLIDE_MIN`/`GLIDE_MAX`. **La lenteur est le sujet** : on doit voir le cheminement
se faire, pas être téléporté d'une carte à l'autre. Ça donne 3,8 à 6,3 s par étape, ~295 px/s
de scroll. La valeur a été cherchée en trois passes (0,9 → 1,8 → 4,5 → 3,4) : c'est un réglage
tenu, pas une valeur par défaut, et le trop rapide s'est révélé bien plus gênant que le trop
lent. Si tu dois trancher, penche du côté lent.
Garde `GLIDE_MAX` assez haut pour qu'aucune marche ne soit écrêtée sur un écran courant,
sinon la plus longue irait plus vite que les autres, ce qui s'entend tout de suite.

**L'interpolation est linéaire. N'y remets pas d'assouplissement.** Un ease-in-out (cubique
puis smoothstep) a été essayé et retiré : quand le sujet est de suivre le chemin, toute courbe
d'entrée/sortie se lit comme une accélération bizarre au milieu du trajet. Le scroll avance
maintenant à ~295 px/s du début à la fin de la marche, mesuré plat à 4 % près.

Attention, il reste **une seconde source d'accélération, plus forte, et celle-là est
volontaire** : le marcheur avance à `vitesse de scroll / costAt(p)`, et `costAt` varie d'un
facteur ~8 entre le creux d'une étape et le milieu d'une marche. Donc même à scroll
parfaitement linéaire, le marcheur rampe en quittant une carte puis file au milieu. C'est le
principe même de la section en défilement libre. Si ça devait gêner en mode auto, le correctif
n'est pas de retoucher la courbe mais d'interpoler `p` au lieu du scroll — en passant par
`scrollFor(p)` à chaque image, ce qui donnerait une vitesse au sol constante.

**Le verrou anti-inertie ne couvre pas toute la marche**, seulement `INERTIA_LOCK` (1,1 s), le
temps qu'un flick de trackpad retombe. C'est indispensable depuis que les marches durent
plusieurs secondes : avec un verrou couvrant toute la durée, un visiteur pressé restait
prisonnier 8 s. Passé ce délai, un nouveau geste **enchaîne** sur l'étape d'après en cours de
route — `glide.to` sert de référence, donc il vise bien la marque suivant la destination et
non celle suivant la position courante.

`MARKS` est la liste des seules fractions de scroll où le mode s'arrête : **une par étape, et
rien d'autre**. Elles sont obtenues en **inversant `progressFor` par dichotomie**
(`scrollFor`), donc elles suivent automatiquement tout changement de `data-at`, de `GRADE` ou
des coûts : il n'y a aucune position à tenir à jour à la main.

**La traîne est hors du mode auto, dans les deux sens.** Une fois sur la dernière carte, un
geste vers le bas n'est plus absorbé : on repasse en scroll manuel, et c'est ce scroll-là qui
emmène à la fois la scène hors de l'écran et le marcheur plus loin sur le chemin. Et à l'intérieur de la traîne, plus rien n'est intercepté — sans
ça, remonter d'un cran vous ramenait aussitôt sur la dernière carte. C'est le rôle du garde
`fraction() > LAST_MARK` dans `targetFor()`, qui est le point de passage unique des trois
gestionnaires (molette, doigt, clavier). Un geste vers le haut *depuis* la dernière carte,
lui, reste automatique : on remonte bien d'étape en étape.

Trois pièges, tous déjà payés :

- **`scrollTo` doit passer `behavior: 'instant'`.** `html` porte `scroll-behavior: smooth`, qui
  sinon anime chaque pas de l'animation et la fait ramer sur place.
- **`preventDefault` même quand rien n'avance.** Un flick de trackpad envoie ~25 événements ;
  sans le verrou `lockUntil` + le seuil `WHEEL_TRIGGER`, un seul geste traversait toute la
  section. Les événements pendant le verrou sont absorbés mais ne font rien.
- **Le test d'épinglage tolère 1px.** Au ras de la couture `getBoundingClientRect().top` vaut
  couramment 0,23px, et un `<= 0` strict laissait filer le tout premier geste.

Quand `nextMark` ne renvoie plus rien — au tout début en remontant, au bout de la traîne en
descendant — le geste **n'est pas** absorbé et la page reprend son défilement normal. C'est ce
qui évite d'enfermer le visiteur ; le bouton du HUD est la seconde sortie.

`prefers-reduced-motion: reduce` désépingle l'ensemble en une simple frise verticale — le mode
auto n'y est pas branché du tout, et le HUD (donc son bouton) y est masqué. Quand tu y masques
des morceaux de la carte, masque les éléments feuilles — masquer un conteneur a déjà emporté
`.trail__stops` deux fois en silence.

## La motion des pages projet (`js/main.js`, quatrième IIFE)

Deux mouvements sur `projet-beepz.html`, et deux seulement : la **couverture se pose au
chargement**, les **blocs se révèlent au scroll**. Le corps de texte n'est jamais révélé
paragraphe par paragraphe — on ne fait pas apparaître sous les yeux de quelqu'un le texte
qu'il est en train de lire. Un bloc, une révélation.

**Une seule courbe pour tout ce qui entre** : `--ease-out`, `cubic-bezier(.23, 1, .32, 1)`,
déclarée dans `:root`. C'est le premier token de motion du site — les 27 transitions
antérieures utilisaient `ease` ou une courbe écrite en clair. Les mouvements de survol
gardent `ease` : à 180 ms la courbe ne se voit pas.

**La source de vérité est le HTML.** Ce qui se révèle est décidé par un attribut
`data-reveal` posé à la main dans la page, comme les `data-at` des étapes du parcours. Le JS
ne fait que le déclencher, le CSS que le dessiner. Trois valeurs :

| valeur | effet |
|---|---|
| `data-reveal` | le bloc monte de 10 px et se fond |
| `data-reveal="group"` | le conteneur ne bouge pas, ses enfants se posent l'un après l'autre (70 ms d'écart) |
| `data-reveal="pin"` | seule la pastille du volet (`::before`) éclot, de 0,72 à 1 |

**`.js-motion` porte tous les états masqués, et elle est posée par un script en TÊTE de
page**, avant le premier rendu — pas depuis `main.js` en bas. C'est ce qui évite de voir la
page s'afficher en entier puis se cacher. Corollaire à ne jamais enfreindre : **la
visibilité d'un contenu ne dépend pas du JS**. Sans JS la classe n'existe pas, en mouvement
réduit le script ne la pose pas, et dans les deux cas rien n'est masqué. Un garde-fou de
2,5 s la retire si `main.js` ne s'est pas annoncé (`data-motion="ready"`) — réseau coupé,
404 : le texte réapparaît au lieu de rester invisible.

**Le déclencheur est un balayage géométrique, pas un `IntersectionObserver`**, et c'est
délibéré : l'observateur ne signale que les FRANCHISSEMENTS. Un saut d'un seul rendu — gros
crans de molette, `scrollTo`, position restaurée, ancre du sommaire — peut faire passer un
bloc de « sous la fenêtre » à « au-dessus » sans une image intermédiaire où il croise le
bord : aucune notification, et le bloc reste masqué pour toujours. On relit donc la position
de ce qui reste à révéler, une fois par image (`requestAnimationFrame`), sur un écouteur de
scroll passif qui **se débranche quand la liste est vide**.

**La couverture s'anime par cinq règles nommées**, pas par des `nth-child` : la structure du
hero bouge encore, et un sélecteur de position décalerait les retards en silence au premier
bloc ajouté. `.case-back` (0), `.case-hero__text` (70 ms), les trois `.plate` de l'arrière
vers l'avant (140/210/280 ms), `.topo` (350 ms). Si un de ces noms disparaît, sa règle
devient sans effet et l'élément s'affiche **sans animation, jamais masqué**.

On anime `translate` et `opacity`, jamais `transform` : les plaques portent déjà
`transform: rotate(var(--rot))`, et les deux propriétés se composent d'elles-mêmes — même
raison que `pile-land` sur l'accueil. Ni l'un ni l'autre ne déclenche de calcul de mise en
page.

**Ce qui n'a pas pu être vérifié dans le panneau** : la révélation au scroll elle-même. Le
panneau navigateur ne rend rien quand il est masqué (`document.hidden`), donc ni
`requestAnimationFrame` ni `IntersectionObserver` n'y tournent — un piège qui fait conclure
à tort que le code est en cause. Les états, les courbes, les retards et le chemin « sans JS »
ont été vérifiés en lisant le CSSOM et en posant les attributs à la main.

## Les assets générés

`assets/hero-topo.svg`, `assets/trail-relief.svg` et l'attribut `d` du parcours sont tous
**produits par les scripts Python de `tools/`** (numpy / scipy / matplotlib, déjà installés).
Chacun utilise une graine fixe : relancer `gen_map.py` et `gen_route.py` reproduit les assets
versionnés **à l'octet près**, tu peux donc changer un paramètre et régénérer en confiance.
Voir `tools/README.md`, qui consigne aussi la seule lacune : `gen_topo.py` sort un SVG brut de
204 Ko alors que le `hero-topo.svg` livré en fait 132 Ko, une passe de nettoyage qui n'a pas
été conservée.

`gen_route.py` réécrit le `d` des **deux** `<path>` d'`index.html` ; ils doivent toujours
porter la même valeur.

**`gen_map.py` et `assets/trail-map.svg` ne servent plus au site** : c'est la carte plate,
remplacée par la tuile en relief. Le script reste comme référence du terrain d'origine, mais
plus rien ne pointe dessus.

**Ordre des scripts.** `gen_relief.py` écrit lui aussi dans le `d` du parcours, après
`gen_route.py`. La chaîne est donc : `gen_route.py`, puis supprimer
`assets/route-flat.path`, puis `gen_relief.py`.

## À préciser

Ces points ne sont pas encore arbitrés — demande plutôt que de supposer :

- **Le contenu de `#projets` et `#contact`.** Les sections existent et sont maquettées, mais
  leurs textes sont des **placeholders assumés**, marqués par la pastille `.todo`
  (« À compléter »). N'invente pas de projets ni de client à sa place : demande-lui le
  contenu. À propos et le parcours, eux, sont écrits pour de bon.
  L'adresse de `#contact` est `adresse@a-completer.fr`, et les liens
  réseaux sont des `<span>`, pas des `<a>`, pour ne pas laisser d'ancre morte.
- **Le design des titres**, `.trail__intro` compris, qui doit être repris. En attendant, les
  cartes d'étape passent derrière « L'ASCENSION » et les deux textes se croisent : c'est
  **connu et assumé**, pas un bug. Ne le rattrape pas par un fond ou un dégradé sous le titre,
  le sujet sera traité par la refonte.
- **L'hébergement**, donc si les chemins doivent rester relatifs et si une étape de
  minification est un jour nécessaire.
- **La source de vérité du design** : savoir si le fichier Figma fait toujours foi.

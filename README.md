# UAE Helper

App web (React + Vite + Tailwind) pour retrouver rapidement les démarches administratives
courantes aux Émirats (Dubai / Abu Dhabi) : étapes, documents, coût, délai, lien officiel, un
bouton "Me rappeler", et une analyse de photo par IA (Claude Vision) pour identifier
automatiquement la procédure correspondant à une facture, un avis d'amende ou une capture d'écran.

## Configuration de la clé API (obligatoire pour la fonction photo)

La fonction "Analyser une photo" appelle l'API Claude depuis une fonction serverless Vercel
(`/api/analyze-photo.js`), jamais depuis le navigateur — ta clé API n'est donc jamais exposée
publiquement.

1. Crée une clé API sur [console.anthropic.com](https://console.anthropic.com)
2. Sur Vercel : Project Settings → Environment Variables → ajoute
   `ANTHROPIC_API_KEY` = `sk-ant-...`
3. Redéploie le projet pour que la variable soit prise en compte.

En local, crée un fichier `.env` à la racine (non versionné, déjà dans `.gitignore`) :
```
ANTHROPIC_API_KEY=sk-ant-...
```
Puis lance avec `vercel dev` (et non `npm run dev`) pour que la route `/api` fonctionne aussi en
local :
```bash
npm install -g vercel
vercel dev
```
(`npm run dev` seul ne fait tourner que Vite, sans les fonctions serverless.)

## Lancer en local (sans la fonction photo)

```bash
npm install
npm run dev
```

Puis ouvre http://localhost:5173

## Déployer sur Vercel

**Option A — via GitHub (recommandé)**
1. Crée un nouveau repo GitHub et pousse ce dossier dedans :
   ```bash
   git init
   git add .
   git commit -m "UAE Helper v1"
   git remote add origin <url-de-ton-repo>
   git push -u origin main
   ```
2. Sur [vercel.com](https://vercel.com) → "Add New Project" → importe le repo.
3. Vercel détecte automatiquement Vite. Laisse les réglages par défaut
   (Build Command: `npm run build`, Output Directory: `dist`).
4. **Avant de cliquer Deploy**, ajoute la variable d'environnement `ANTHROPIC_API_KEY`
   (voir section ci-dessus), puis déploie.

**Option B — via la CLI Vercel (sans GitHub)**
```bash
npm install -g vercel
vercel
```
Suis les instructions à l'écran (choisis "Vite" si demandé), puis ajoute la variable
`ANTHROPIC_API_KEY` via `vercel env add ANTHROPIC_API_KEY`.

## Structure du projet

```
api/
  analyze-photo.js        ← fonction serverless: appelle Claude Vision, garde la clé API au secret
src/
  data/procedures.json     ← base de données des 20 procédures
  utils/search.js          ← logique de recherche par mots-clés
  utils/reminders.js        ← gestion des rappels (localStorage + Notification API)
  utils/image.js            ← compression d'image côté client avant envoi
  components/               ← SearchBar, ProcedureCard, ProcedureDetail, ReminderModal,
                               RemindersPanel, PhotoUpload
  App.jsx                    ← page principale
```

## Comment fonctionne l'analyse de photo

1. L'utilisateur choisit une photo (ou prend une photo sur mobile).
2. Le navigateur la redimensionne/compresse (canvas, ~1280px max) pour rester léger.
3. L'image est envoyée en base64 à `/api/analyze-photo`.
4. La fonction serverless appelle l'API Claude (modèle `claude-sonnet-5`) avec l'image et la
   liste exacte des 20 procédures, et demande une réponse JSON structurée :
   `{ best_match, confidence, detected_text_summary }`.
5. Si `best_match` correspond à une procédure connue avec une confiance suffisante, la fiche
   détail s'affiche directement. Sinon, l'app relance une recherche texte avec le résumé détecté
   pour laisser l'utilisateur choisir manuellement.

## Comment fonctionne le chatbot multilingue

Un bouton flottant (bulle de chat, en bas à droite) ouvre un panneau de conversation.

1. L'utilisateur pose sa question dans n'importe laquelle des 4 langues supportées (anglais,
   arabe, hindi, français) — pas de sélecteur de langue, Claude détecte et répond dans la même
   langue.
2. La question + l'historique récent sont envoyés à `/api/chat`, avec la base de procédures.
3. La fonction serverless demande à Claude de répondre **uniquement** à partir des données du
   JSON (jamais d'invention de coût/délai/lien), et d'inclure systématiquement le lien officiel
   de la procédure concernée en fin de réponse.
4. Si aucune procédure ne correspond, l'assistant le dit honnêtement et propose les démarches les
   plus proches disponibles.

La conversation n'est pas sauvegardée (ni en base, ni en localStorage) : elle est perdue au
rechargement de la page, ce qui évite de stocker des échanges potentiellement sensibles.

## Ajouter / modifier des procédures

Édite simplement `src/data/procedures.json`. Chaque entrée doit garder les champs :
`nom_fr`, `nom_en`, `nom_ar`, `qui_concerne` (`expat` / `emirati` / `les_deux`), `etapes`,
`documents_necessaires`, `cout_moyen_AED`, `delai`, `lien_officiel`, `penalite_retard`.

## Limites connues (V1)

- Les rappels sont stockés uniquement dans le navigateur (localStorage) : pas de compte, pas de
  synchronisation entre appareils, et la notification ne se déclenche que si l'onglet reste ouvert
  à l'heure prévue.
- La reconnaissance photo dépend de la qualité/lisibilité de l'image ; en cas de doute, l'app
  demande confirmation plutôt que d'afficher un résultat incertain.
- Chaque appel à la fonction photo consomme des crédits API Anthropic (facturés sur ta clé).
- Le chatbot envoie l'intégralité du JSON des procédures à chaque appel API (léger, ~20 fiches),
  ce qui consomme aussi des crédits Anthropic à chaque message échangé — pas de limite de débit
  (rate limiting) par utilisateur en V1, à ajouter si l'usage grandit.
- Les coûts/délais du JSON sont indicatifs et doivent être vérifiés sur les sites officiels.


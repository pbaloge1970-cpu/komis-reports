# KOMIS · Rapports d'intervention terrain

Application de reporting pour les opérateurs signalétique en stade de rugby.

## ✨ Fonctionnalités

- 📋 5 sections de saisie (en-tête, synthèse, photos, logistique, incidents)
- 🖼️ Photos sélectionnées depuis la **bibliothèque/galerie** du téléphone, organisées par zones, avec commentaires
- 📦 Inventaire éditable (provenance, quantité, état)
- ⚠️ Gestion des incidents avec photo de preuve et niveau de sévérité
- 📄 Export du rapport en **PDF** ou en **HTML**
- 💾 Sauvegarde automatique dans le navigateur (`localStorage`)

## 🚀 Déploiement sur Vercel (méthode la plus simple)

### Option A — Déploiement via GitHub (recommandé, ~10 min)

1. **Créer un compte GitHub** (gratuit) sur [github.com](https://github.com) si tu n'en as pas.
2. **Créer un nouveau repository** vide nommé `komis-reports`.
3. **Uploader le contenu de ce dossier** dans le repository :
   - Sur la page de ton repo : bouton "uploading an existing file"
   - Glisse tous les fichiers et dossiers de ce projet
   - Commit
4. **Créer un compte Vercel** (gratuit) sur [vercel.com](https://vercel.com) → "Sign up with GitHub".
5. Sur Vercel, clique **"Add New… → Project"**, sélectionne ton repo `komis-reports`, et clique **"Deploy"**.
6. ⏱ Au bout d'1 minute, Vercel te donne une URL du type `komis-reports.vercel.app`.

C'est tout. Cette URL fonctionne sur n'importe quel téléphone, tablette ou ordinateur. Tes intervenants n'ont qu'à l'ouvrir dans Safari/Chrome.

### Option B — Déploiement par drag-and-drop (encore plus simple, mais sans mises à jour faciles)

1. Sur ton ordinateur, ouvre un terminal dans ce dossier et lance :
   ```bash
   npm install
   npm run build
   ```
2. Va sur [vercel.com/new](https://vercel.com/new), choisis "Other → Deploy from CLI" ou utilise l'interface drag-and-drop.
3. Glisse le dossier `dist` qui vient d'être créé.

## 📱 Comment l'installer sur le téléphone des intervenants

Une fois l'URL en ligne :

**Sur iPhone** : ouvrir l'URL dans Safari → bouton "Partager" → "Sur l'écran d'accueil". L'app s'ajoute comme une vraie application.

**Sur Android** : ouvrir l'URL dans Chrome → menu (⋮) → "Ajouter à l'écran d'accueil".

## 💾 Stockage des données

Les rapports sont stockés **dans le navigateur de chaque intervenant** (`localStorage`).

⚠️ **Important à savoir :**
- Les rapports d'un intervenant ne sont **pas visibles** par les autres intervenants ni au bureau.
- Si l'intervenant efface ses données de navigation, les rapports sont perdus.
- L'export HTML doit être envoyé par email/WhatsApp pour être centralisé.

➡️ Pour une **vraie centralisation** (rapports visibles depuis le bureau, tous les intervenants synchronisés), il faut passer à l'étape suivante avec un backend (Supabase/Firebase). Demande-moi pour cette évolution.

## 🛠 Développement local

```bash
npm install
npm run dev
```

L'app tourne sur `http://localhost:5173`.

## 📂 Structure

```
komis-reports/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx       # Point d'entrée React
│   ├── App.jsx        # Toute l'application
│   └── index.css      # Tailwind global
└── README.md
```

## 🔧 Personnalisation rapide

- **Logo / nom** : modifier le composant `Header` dans `src/App.jsx`
- **Compétitions** : modifier le `<select>` dans `HeaderSection`
- **Inventaire par défaut** : modifier `EMPTY_REPORT()` en haut de `src/App.jsx`
- **Couleurs** : remplacer `lime-400` par une autre couleur Tailwind partout dans le fichier

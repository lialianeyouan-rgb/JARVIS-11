# J.A.R.V.I.S. (Just A Rather Very Intelligent System)

J.A.R.V.I.S. est un assistant personnel intelligent conçu pour centraliser et automatiser la gestion de votre écosystème numérique personnel (Google Workspace) via une interface moderne et sécurisée.

## 🚀 Fonctionnalités & Logique Métier

| Fonctionnalité | Pourquoi cette approche ? |
| :--- | :--- |
| **Gestion Gmail/Agenda/Drive** | Centraliser les données éparpillées pour une vue d'ensemble rapide. |
| **Diagnostic Système** | Permettre une auto-surveillance des connexions pour minimiser le temps d'arrêt. |
| **Architecture Firebase** | Assurer la persistance des données multi-appareils et la sécurité native des accès. |

## 🛠 Explication des Technologies & Langages

- **React & Vite** : Utilisés pour construire une interface utilisateur rapide, modulaire et réactive (Single Page Application).
- **TypeScript** : Choisi pour la sécurité du typage, essentielle dans un projet manipulant des données sensibles (emails, calendriers).
- **Tailwind CSS** : Permet un design rapide, propre et responsive sans alourdir le projet avec des fichiers CSS complexes.
- **Firebase Admin SDK (Node.js)** : La colonne vertébrale pour gérer les accès sécurisés aux données côté serveur.
- **Google Cloud APIs** : Le moteur qui permet d'interagir avec les services Google (Gmail, Drive, etc.).

## ⚠️ Analyse des Défis & Erreurs Rencontrées

Au cours du développement, nous avons dû surmonter plusieurs défis techniques :

1.  **Erreurs de Permissions (PERMISSION_DENIED)** : 
    *   *Cause* : Souvent dues à une mauvaise configuration des rôles dans la console Google Cloud ou à des APIs non activées (ex: Google Drive API).
    *   *Correction* : Vérification des scopes OAuth et activation explicite des APIs dans la console GCP.
2.  **Gestion des Objets complexes dans l'UI** :
    *   *Cause* : Tentative d'affichage direct d'objets JSON complexes dans le DOM React.
    *   *Correction* : Sécurisation de l'affichage avec `typeof` et `JSON.stringify` pour convertir les logs techniques en chaînes de texte.
3.  **Connexions Firebase Instables** :
    *   *Cause* : Problèmes de persistance des connexions lors du cycle de vie du serveur de développement.
    *   *Correction* : Implémentation d'un redémarrage propre du serveur et réinitialisation des accès Firebase.

## 🗺 Roadmap

- **v0.x** : Stabilisation, sécurisation et gestion des logs.
- **v1.0** : Interface fluide pour Gmail/Agenda/Drive et Dashboard de santé.
- **v2.0** : Réponses intelligentes (Gemini API) et recherche sémantique.
- **v3.0** : Système de plugins et support multi-utilisateurs.

---
*Projet développé pour une automatisation personnelle intelligente.*

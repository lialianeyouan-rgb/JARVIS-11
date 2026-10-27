# J.A.R.V.I.S. (Just A Rather Very Intelligent System)

J.A.R.V.I.S. is an intelligent personal assistant designed to centralize and automate the management of your personal digital ecosystem (Google Workspace) through a modern, secure interface.

## Functionalities & Business Logic

| Functionality | Why this approach? |
| :--- | :--- |
| **Gmail/Calendar/Drive Management** | Centralize scattered data for a quick, comprehensive overview. |
| **System Diagnostics** | Enable self-monitoring of service connections to minimize downtime. |
| **Firebase Architecture** | Ensure cross-device data persistence and native access security. |

## Technology & Language Explanations

- **React & Vite** : Used to build a fast, modular, and reactive user interface (Single Page Application).
- **TypeScript** : Chosen for type safety, which is essential in a project handling sensitive data (emails, calendars).
- **Tailwind CSS** : Allows for fast, clean, and responsive design without cluttering the project with complex CSS files.
- **Firebase Admin SDK (Node.js)** : The backbone for managing secure server-side data access.
- **Google Cloud APIs** : The engine enabling interaction with Google services (Gmail, Drive, etc.).

## Analysis of Challenges & Errors Encountered

During development, we overcame several technical challenges:

1. **Permission Errors (PERMISSION_DENIED)** :
    - *Cause* : Often due to incorrect role configuration in the Google Cloud Console or disabled APIs (e.g., Google Drive API).
    - *Correction* : Verification of OAuth scopes and explicit activation of APIs in the GCP Console.
2. **Complex Object Rendering in UI** :
    - *Cause* : Attempting to directly render complex JSON objects in the React DOM.
    - *Correction* : Securing rendering using `typeof` and `JSON.stringify` to convert technical logs into readable text strings.
3. **Unstable Firebase Connections** :
    - *Cause* : Connection persistence issues during the development server lifecycle.
    - *Correction* : Implementation of a clean server restart and resetting Firebase access credentials.

## Roadmap

- **v0.x (Current Phase)** : Stabilization, access security, and log management.
- **v1.0** : Fluid interface for Gmail/Calendar/Drive and System Health Dashboard.
- **v2.0** : Intelligent email responses (Gemini API) and semantic search for Drive.
- **v3.0** : Plugin system, multi-user support, and advanced preferences.

---
*Project developed for intelligent personal automation.*

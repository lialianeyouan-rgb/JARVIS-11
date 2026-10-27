export const jarvisToolDeclarations: any[] = [
  {
    name: "navigateTo",
    description: "Navigate to or open a specific internal dashboard view / interface within J.A.R.V.I.S. Whitelist of authorized views: 'capabilities', 'settings', 'integrations', 'history', 'tasks', 'voice_settings', 'communications', 'home'.",
    parameters: {
      type: "OBJECT",
      properties: {
        view: {
          type: "STRING",
          description: "Target view to open ('capabilities', 'settings', 'integrations', 'history', 'tasks', 'voice_settings', 'communications', 'home')",
        },
      },
      required: ["view"],
    },
  },
  {
    name: "configureVoice",
    description: "Dynamically adjust J.A.R.V.I.S. voice modulation parameters (profile preset, gender, pitch, speed, timbre) or trigger the voice configuration view. Available profiles: 'jarvis' (masculin grave), 'friday' (féminin élégant), 'homer' (militaire grave), 'karen' (amicale), 'edith' (cyber), 'vision' (philosophique), 'neo' (dynamique), 'robot' (synthétique).",
    parameters: {
      type: "OBJECT",
      properties: {
        profile: { type: "STRING", description: "Voice preset name ('jarvis', 'friday', 'homer', 'karen', 'edith', 'vision', 'neo', 'robot')" },
        gender: { type: "STRING", description: "Voice gender ('masculine', 'feminine', 'auto')" },
        characteristic: { type: "STRING", description: "Vocal characteristic ('grave', 'calme', 'dynamique', 'tactique', 'philosophique', 'robotique', 'standard')" },
        rate: { type: "NUMBER", description: "Speaking speed rate (0.6 to 1.5)" },
        pitch: { type: "NUMBER", description: "Vocal pitch (0.4 to 1.5)" },
        openSettings: { type: "BOOLEAN", description: "Whether to also open the Voice Settings view" },
      },
      required: [],
    },
  },
  {
    name: "setContinuousConversation",
    description: "Enable or disable Hands-Free Continuous Conversation (Auto-Listen) loop where J.A.R.V.I.S. automatically reopens the microphone after speaking each response.",
    parameters: {
      type: "OBJECT",
      properties: {
        enabled: { type: "BOOLEAN", description: "True to enable hands-free auto-listening loop, False to require manual mic press" },
      },
      required: ["enabled"],
    },
  },
  {
    name: "setTranscriptDisplay",
    description: "Show or hide the live on-screen speech-to-text transcription and subtitles display on the user interface.",
    parameters: {
      type: "OBJECT",
      properties: {
        enabled: { type: "BOOLEAN", description: "True to display live on-screen transcription subtitles, False to hide it for a minimalist screen" },
      },
      required: ["enabled"],
    },
  },
  {
    name: "draftMessage",
    description: "Draft, prepare and structure a message or email for user preview and confirmation before any actual dispatch.",
    parameters: {
      type: "OBJECT",
      properties: {
        recipient: { type: "STRING", description: "Recipient email address or name" },
        subject: { type: "STRING", description: "Subject line of the email or topic" },
        body: { type: "STRING", description: "Structured body text of the message" },
        channel: { type: "STRING", description: "Target channel ('email', 'system_notification', 'slack')" },
      },
      required: ["recipient", "subject", "body"],
    },
  },
  {
    name: "sendEmail",
    description: "Send an email via Google Workspace / Gmail API / SMTP bridge. Strictly verifies real API configuration and will not simulate dispatch if credentials are not configured.",
    parameters: {
      type: "OBJECT",
      properties: {
        recipient: { type: "STRING", description: "Email recipient address" },
        subject: { type: "STRING", description: "Subject of the email" },
        body: { type: "STRING", description: "Body text of the email" },
        confirmed: { type: "BOOLEAN", description: "Whether the user explicitly confirmed dispatch" },
      },
      required: ["recipient", "subject", "body"],
    },
  },
  {
    name: "listDrafts",
    description: "List all active email drafts and pending communication dispatches.",
    parameters: {
      type: "OBJECT",
      properties: {},
      required: [],
    },
  },
  {
    name: "getSystemIntegrations",
    description: "Inspect the real live status of all external services and integrations (Google Workspace, Gmail, Mac Bridge, Postgres, Weather, Financial).",
    parameters: {
      type: "OBJECT",
      properties: {},
      required: [],
    },
  },
  {
    name: "scrapeWebPage",
    description: "Scrape and extract text content from a given URL using Cheerio.",
    parameters: {
      type: "OBJECT",
      properties: {
        url: { type: "STRING", description: "The full URL to scrape (e.g., https://example.com)" },
      },
      required: ["url"],
    },
  },
  {
    name: "getLiveWeather",
    description: "Get real-time weather and atmospheric conditions for a given city or coordinates.",
    parameters: {
      type: "OBJECT",
      properties: {
        city: { type: "STRING", description: "City name for weather lookup (default New York)" },
      },
      required: [],
    },
  },
  {
    name: "getStockMarketData",
    description: "Fetch live stock market quotes or financial indices (e.g., AAPL, TSLA, BTC, STARK).",
    parameters: {
      type: "OBJECT",
      properties: {
        symbol: { type: "STRING", description: "Stock symbol or crypto ticker" },
      },
      required: ["symbol"],
    },
  },
  {
    name: "executePostgresQuery",
    description: "Execute a secure database operation or PG query via the core task engine.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "SQL statement or database action command" },
      },
      required: ["query"],
    },
  },
  {
    name: "checkServerIoT",
    description: "Run comprehensive IoT and server infrastructure diagnostics across cluster nodes.",
    parameters: {
      type: "OBJECT",
      properties: {
        nodeId: { type: "STRING", description: "Node identifier or 'all'" },
      },
      required: [],
    },
  },
  {
    name: "scheduleAppointment",
    description: "Schedule or check calendar appointments, meetings, and reminders for the user.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Title of the meeting or appointment" },
        time: { type: "STRING", description: "Scheduled time or date" },
      },
      required: ["title"],
    },
  },
  {
    name: "manageFiles",
    description: "Search, organize, or index files on the local computer workspace in the background.",
    parameters: {
      type: "OBJECT",
      properties: {
        action: { type: "STRING", description: "Action such as 'scan', 'index', or 'backup'" },
        path: { type: "STRING", description: "Target directory path" },
      },
      required: ["action"],
    },
  },
  {
    name: "runSecurityScan",
    description: "Perform an advanced cybersecurity scan for malware, network anomalies, or unauthorized connections.",
    parameters: {
      type: "OBJECT",
      properties: {
        level: { type: "STRING", description: "Scan depth level ('quick', 'deep', 'armor')" },
      },
      required: [],
    },
  },
  {
    name: "runAutonomousBotTask",
    description: "Execute an automated background bot task (e.g. data scraping, API synchronization, automated email drafting).",
    parameters: {
      type: "OBJECT",
      properties: {
        taskName: { type: "STRING", description: "Name of the automated bot routine" },
      },
      required: ["taskName"],
    },
  },
  {
    name: "writeArticle",
    description: "Draft, format, and generate a professional editorial article or strategic report.",
    parameters: {
      type: "OBJECT",
      properties: {
        topic: { type: "STRING", description: "Topic or title of the article to draft" },
      },
      required: ["topic"],
    },
  },
  {
    name: "openMacApplication",
    description: "Open a local macOS application (e.g., VS Code, Chrome, Spotify, Terminal, Finder) via the Secure Local Mac Bridge.",
    parameters: {
      type: "OBJECT",
      properties: {
        appName: { type: "STRING", description: "Name of the application to open (e.g., 'Visual Studio Code', 'Google Chrome', 'Spotify', 'Terminal')" },
        targetPath: { type: "STRING", description: "Optional project folder or file path to open with the app (e.g., '/Users/username/FinProtect')" },
      },
      required: ["appName"],
    },
  },
  {
    name: "executeMacCommand",
    description: "Execute an authorized whitelisted terminal command or server start routine on the local Mac host via the Secure Local Mac Bridge.",
    parameters: {
      type: "OBJECT",
      properties: {
        command: { type: "STRING", description: "Terminal command to execute (e.g., 'npm run dev', 'git status', 'open .')" },
      },
      required: ["command"],
    },
  },
  {
    name: "manageLocalComputerFile",
    description: "Move, copy, or organize recently downloaded files into a target project folder on the local Mac host.",
    parameters: {
      type: "OBJECT",
      properties: {
        action: { type: "STRING", description: "Action type ('move', 'copy', 'organize')" },
        sourceFileName: { type: "STRING", description: "Name of the file to manage (e.g., latest download)" },
        destinationFolder: { type: "STRING", description: "Destination folder path (e.g., '/Users/username/FinProtect')" },
      },
      required: ["action", "sourceFileName", "destinationFolder"],
    },
  },
  {
    name: "computerUseExecutePlan",
    description: "Autonomously plan and execute a multi-step Computer Use interaction workflow on the host machine (e.g., 'Ouvre Chrome et va sur LinkedIn', 'Ouvre VS Code et lance le projet') following the Plan -> Action -> Observation -> Validation loop.",
    parameters: {
      type: "OBJECT",
      properties: {
        userIntent: { type: "STRING", description: "The full user intent or multi-step instruction to plan and execute on the device" },
      },
      required: ["userIntent"],
    },
  },
  {
    name: "computerUseNavigateBrowser",
    description: "Open a web browser (Google Chrome or Safari), navigate to a specific URL, or perform a search query.",
    parameters: {
      type: "OBJECT",
      properties: {
        urlOrQuery: { type: "STRING", description: "The target website URL or Google search query" },
        browser: { type: "STRING", description: "Browser to use ('Google Chrome' or 'Safari', default 'Google Chrome')" },
      },
      required: ["urlOrQuery"],
    },
  },
  {
    name: "computerUseClick",
    description: "Click or double click a specific UI coordinate or detected visual element on the device screen.",
    parameters: {
      type: "OBJECT",
      properties: {
        target: { type: "STRING", description: "Label or description of the UI element to click" },
        x: { type: "NUMBER", description: "Optional X coordinate on screen (0-1920)" },
        y: { type: "NUMBER", description: "Optional Y coordinate on screen (0-1080)" },
        doubleClick: { type: "BOOLEAN", description: "Whether to perform a double click (default false)" },
      },
      required: ["target"],
    },
  },
  {
    name: "computerUseTypeText",
    description: "Type alphanumeric text or inject keystrokes into the currently focused input field.",
    parameters: {
      type: "OBJECT",
      properties: {
        text: { type: "STRING", description: "Text content to type" },
      },
      required: ["text"],
    },
  },
  {
    name: "computerUseReadScreen",
    description: "Capture the current device screen, analyze active windows, and detect visible UI elements and text via OCR.",
    parameters: {
      type: "OBJECT",
      properties: {},
      required: [],
    },
  },
  {
    name: "computerUseEmergencyStop",
    description: "Trigger an immediate Emergency Stop to instantly abort all running Computer Use automations and lock device actions.",
    parameters: {
      type: "OBJECT",
      properties: {},
      required: [],
    },
  },
  {
    name: "listGoogleCalendarEvents",
    description: "Fetch upcoming meetings, reminders, and scheduled agenda events directly from the user's connected Google Calendar.",
    parameters: {
      type: "OBJECT",
      properties: {
        maxResults: { type: "NUMBER", description: "Maximum number of events to retrieve (default 10)" },
      },
      required: [],
    },
  },
  {
    name: "createGoogleCalendarEvent",
    description: "Create and schedule a new event or appointment on the user's official Google Calendar. Always requires confirmation.",
    parameters: {
      type: "OBJECT",
      properties: {
        summary: { type: "STRING", description: "Title or summary of the event (e.g., 'Point d'étape Q3')" },
        startTime: { type: "STRING", description: "Start time (ISO or YYYY-MM-DDTHH:MM:SS format)" },
        endTime: { type: "STRING", description: "End time (ISO or YYYY-MM-DDTHH:MM:SS format)" },
        description: { type: "STRING", description: "Optional description or meeting agenda" },
        location: { type: "STRING", description: "Optional location or Google Meet link" },
      },
      required: ["summary", "startTime", "endTime"],
    },
  },
  {
    name: "getGoogleFitSummary",
    description: "Retrieve real-time daily fitness, activity, and step metrics from Google Fit (steps, calories burned, active minutes, distance).",
    parameters: {
      type: "OBJECT",
      properties: {},
      required: [],
    },
  },
  {
    name: "getGoogleFitBiometrics",
    description: "Retrieve biometric vital signs from Google Fit (heart rate BPM, weight, body metrics).",
    parameters: {
      type: "OBJECT",
      properties: {},
      required: [],
    },
  },
  {
    name: "listGoogleDriveFiles",
    description: "Browse, list, and search files and folders in the user's real Google Drive.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Search query to filter files by name" },
        folderId: { type: "STRING", description: "Optional folder ID to list contents of a specific folder" },
        pageSize: { type: "NUMBER", description: "Max files to return (default 15)" },
      },
      required: [],
    },
  },
  {
    name: "createGoogleDriveFolder",
    description: "Create a new folder in Google Drive.",
    parameters: {
      type: "OBJECT",
      properties: {
        folderName: { type: "STRING", description: "Name of the folder to create" },
        parentId: { type: "STRING", description: "Optional parent folder ID" },
      },
      required: ["folderName"],
    },
  },
  {
    name: "deleteGoogleDriveFile",
    description: "Delete or trash a file in Google Drive. Requires confirmation.",
    parameters: {
      type: "OBJECT",
      properties: {
        fileId: { type: "STRING", description: "The ID of the file to delete" },
      },
      required: ["fileId"],
    },
  },
  {
    name: "createGmailDraft",
    description: "Create a new draft in Gmail for the user to review. Returns a draft ID.",
    parameters: {
      type: "OBJECT",
      properties: {
        to: { type: "STRING", description: "Recipient email address" },
        subject: { type: "STRING", description: "Draft subject" },
        body: { type: "STRING", description: "Draft body text" },
      },
      required: ["to", "subject", "body"],
    },
  },
  {
    name: "sendGmailDraft",
    description: "Send an existing Gmail draft by ID. Explicitly requires confirmation.",
    parameters: {
      type: "OBJECT",
      properties: {
        draftId: { type: "STRING", description: "The ID of the draft to send" },
        confirmed: { type: "BOOLEAN", description: "Whether the user explicitly confirmed dispatch" },
      },
      required: ["draftId", "confirmed"],
    },
  },

  {
    name: "listGoogleContacts",
    description: "List the user's Google Contacts with name and email addresses.",
    parameters: {
      type: "OBJECT",
      properties: {
        maxResults: { type: "NUMBER", description: "Max contacts to list (default 20)" },
      },
      required: [],
    },
  },
  {
    name: "listGmailMessages",
    description: "List recent emails received or sent in Gmail with subject, sender, and snippet.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "Optional search query (e.g., 'is:unread', 'from:alice@example.com')" },
        maxResults: { type: "NUMBER", description: "Max emails to list (default 10)" },
      },
      required: [],
    },
  },
  {
    name: "getGmailThread",
    description: "Retrieve the full content of a Gmail thread.",
    parameters: {
      type: "OBJECT",
      properties: {
        threadId: { type: "STRING", description: "The ID of the thread to retrieve" },
      },
      required: ["threadId"],
    },
  },
  {
    name: "createGoogleDoc",
    description: "Create a new real Google Doc in Google Drive with title and optional formatted text content.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Document title" },
        content: { type: "STRING", description: "Initial document content / text" },
      },
      required: ["title"],
    },
  },
  {
    name: "createGoogleSheet",
    description: "Create a new real Google Sheet in Google Drive with title, column headers, and data rows.",
    parameters: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING", description: "Spreadsheet title" },
        headers: {
          type: "ARRAY",
          description: "List of column header names",
          items: { type: "STRING" },
        },
        rows: {
          type: "ARRAY",
          description: "Array of row data arrays",
          items: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
        },
      },
      required: ["title"],
    },
  },
];

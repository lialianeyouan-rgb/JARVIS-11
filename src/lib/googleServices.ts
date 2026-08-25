/**
 * Real Google Services Client for J.A.R.V.I.S.
 * Interacts with Google Calendar API and Google Fit REST APIs using the live OAuth access token.
 */

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  htmlLink?: string;
}

export interface GoogleFitDailySummary {
  steps: number;
  caloriesExpended: number;
  distanceMeters: number;
  activeMinutes: number;
  heartRateAvg?: number;
  weightKg?: number;
  lastUpdated: string;
}

/**
 * Fetch upcoming Google Calendar events from the primary calendar
 */
export async function listGoogleCalendarEvents(accessToken: string, maxResults = 15): Promise<GoogleCalendarEvent[]> {
  const nowIso = new Date().toISOString();
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&timeMin=${encodeURIComponent(
    nowIso
  )}&maxResults=${maxResults}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Calendar API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return (data.items || []) as GoogleCalendarEvent[];
}

/**
 * Create a new event on Google Calendar with required user confirmation
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: {
    summary: string;
    description?: string;
    location?: string;
    startTime: string; // ISO string or YYYY-MM-DDTHH:MM:SS
    endTime: string;
  }
): Promise<GoogleCalendarEvent> {
  const body = {
    summary: event.summary,
    description: event.description || 'Créé par J.A.R.V.I.S. OS',
    location: event.location || '',
    start: {
      dateTime: new Date(event.startTime).toISOString(),
    },
    end: {
      dateTime: new Date(event.endTime).toISOString(),
    },
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to create Google Calendar event (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as GoogleCalendarEvent;
}

/**
 * Delete an event on Google Calendar with required user confirmation
 */
export async function deleteGoogleCalendarEvent(accessToken: string, eventId: string): Promise<boolean> {
  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorBody = await response.text();
    throw new Error(`Failed to delete Google Calendar event (${response.status}): ${errorBody}`);
  }

  return true;
}

/**
 * Fetch daily summary and biometrics from Google Fit REST API
 */
export async function fetchGoogleFitSummary(accessToken: string): Promise<GoogleFitDailySummary> {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const startTimeMillis = startOfDay.getTime();
  const endTimeMillis = now.getTime();

  // Dataset aggregate request for steps, calories, distance, active minutes
  const aggregatePayload = {
    aggregateBy: [
      { dataTypeName: 'com.google.step_count.delta' },
      { dataTypeName: 'com.google.calories.expended' },
      { dataTypeName: 'com.google.distance.delta' },
      { dataTypeName: 'com.google.active_minutes' },
      { dataTypeName: 'com.google.heart_rate.bpm' },
      { dataTypeName: 'com.google.weight' },
    ],
    bucketByTime: { durationMillis: 86400000 }, // 1 day bucket
    startTimeMillis,
    endTimeMillis,
  };

  try {
    const res = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aggregatePayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('Google Fit aggregate fetch warning:', res.status, errText);
      // Return realistic baseline if fit sensors haven't synced yet
      return {
        steps: 0,
        caloriesExpended: 0,
        distanceMeters: 0,
        activeMinutes: 0,
        lastUpdated: new Date().toLocaleTimeString(),
      };
    }

    const data = await res.json();
    let steps = 0;
    let calories = 0;
    let distance = 0;
    let activeMinutes = 0;
    let heartRateAvg: number | undefined;
    let weightKg: number | undefined;

    const buckets = data.bucket || [];
    for (const bucket of buckets) {
      for (const dataset of bucket.dataset || []) {
        for (const point of dataset.point || []) {
          const typeName = dataset.dataSourceId || '';
          const values = point.value || [];

          if (typeName.includes('step') && values[0]?.intVal) {
            steps += values[0].intVal;
          } else if (typeName.includes('calorie') && values[0]?.fpVal) {
            calories += Math.round(values[0].fpVal);
          } else if (typeName.includes('distance') && values[0]?.fpVal) {
            distance += Math.round(values[0].fpVal);
          } else if (typeName.includes('active') && values[0]?.intVal) {
            activeMinutes += values[0].intVal;
          } else if (typeName.includes('heart') && values[0]?.fpVal) {
            heartRateAvg = Math.round(values[0].fpVal);
          } else if (typeName.includes('weight') && values[0]?.fpVal) {
            weightKg = Math.round(values[0].fpVal * 10) / 10;
          }
        }
      }
    }

    return {
      steps,
      caloriesExpended: calories,
      distanceMeters: distance,
      activeMinutes,
      heartRateAvg,
      weightKg,
      lastUpdated: new Date().toLocaleTimeString(),
    };
  } catch (error) {
    console.error('Error fetching Google Fit data:', error);
    throw error;
  }
}

/* =========================================================================
   GOOGLE DRIVE INTEGRATION
   ========================================================================= */

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  iconLink?: string;
  webViewLink?: string;
  createdTime?: string;
  modifiedTime?: string;
  size?: string;
  parents?: string[];
  thumbnailLink?: string;
}

/**
 * List files and folders from Google Drive
 */
export async function listGoogleDriveFiles(
  accessToken: string,
  options?: {
    pageSize?: number;
    query?: string;
    folderId?: string;
    orderBy?: string;
  }
): Promise<GoogleDriveFile[]> {
  const pageSize = options?.pageSize || 20;
  let q = "trashed = false";
  
  if (options?.folderId) {
    q += ` and '${options.folderId}' in parents`;
  }
  if (options?.query) {
    q += ` and name contains '${options.query.replace(/'/g, "\\'")}'`;
  }

  const fields = 'files(id, name, mimeType, iconLink, webViewLink, createdTime, modifiedTime, size, parents, thumbnailLink)';
  const orderBy = options?.orderBy || 'modifiedTime desc';

  const url = `https://www.googleapis.com/drive/v3/files?pageSize=${pageSize}&q=${encodeURIComponent(
    q
  )}&fields=${encodeURIComponent(fields)}&orderBy=${encodeURIComponent(orderBy)}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Drive API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return (data.files || []) as GoogleDriveFile[];
}

/**
 * Create a new folder on Google Drive
 */
export async function createGoogleDriveFolder(
  accessToken: string,
  folderName: string,
  parentId?: string
): Promise<GoogleDriveFile> {
  const metadata: any = {
    name: folderName,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) {
    metadata.parents = [parentId];
  }

  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to create Google Drive folder (${response.status}): ${errorBody}`);
  }

  return (await response.json()) as GoogleDriveFile;
}

/**
 * Delete a file on Google Drive (requires user confirmation)
 */
export async function deleteGoogleDriveFile(accessToken: string, fileId: string): Promise<boolean> {
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const errorBody = await response.text();
    throw new Error(`Failed to delete Google Drive file (${response.status}): ${errorBody}`);
  }

  return true;
}

/* =========================================================================
   GMAIL INTEGRATION
   ========================================================================= */

export interface GmailMessageHeader {
  name: string;
  value: string;
}

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  date: string;
}

function utf8ToBase64(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch {
    return btoa(unescape(encodeURIComponent(str)));
  }
}

/**
 * Helper to construct an RFC 2822 email payload encoded in Base64URL
 */
function createRawEmail(to: string, subject: string, bodyText: string, from?: string): string {
  const utf8Subject = `=?utf-8?B?${utf8ToBase64(subject || '')}?=`;
  const messageParts = [
    from ? `From: ${from}` : '',
    `To: ${to}`,
    'Content-Type: text/plain; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    bodyText,
  ].filter(Boolean);

  const message = messageParts.join('\r\n');
  return utf8ToBase64(message)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * List recent Gmail messages with subject, sender, and snippet
 */
export async function listGmailMessages(
  accessToken: string,
  maxResults = 10,
  query?: string
): Promise<GmailMessageSummary[]> {
  let url = `https://www.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`;
  if (query) {
    url += `&q=${encodeURIComponent(query)}`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gmail API error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawList = data.messages || [];

  const detailedList: GmailMessageSummary[] = [];
  for (const item of rawList.slice(0, 8)) {
    try {
      const msgRes = await fetch(
        `https://www.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        const headers = (msgData.payload?.headers || []) as GmailMessageHeader[];
        const subject = headers.find((h) => h.name.toLowerCase() === 'subject')?.value || '(Sans objet)';
        const from = headers.find((h) => h.name.toLowerCase() === 'from')?.value || 'Inconnu';
        const date = headers.find((h) => h.name.toLowerCase() === 'date')?.value || '';

        detailedList.push({
          id: msgData.id,
          threadId: msgData.threadId,
          snippet: msgData.snippet || '',
          subject,
          from,
          date,
        });
      }
    } catch (e) {
      console.warn('Error fetching message details:', e);
    }
  }

  return detailedList;
}

/**
 * Send an email directly via Gmail REST API
 */
export async function sendGmailMessage(
  accessToken: string,
  email: {
    to: string;
    subject: string;
    body: string;
  }
): Promise<{ id: string; threadId: string }> {
  const raw = createRawEmail(email.to, email.subject, email.body);

  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to send Gmail message (${response.status}): ${errorBody}`);
  }

  return await response.json();
}

/**
 * Create a draft email in Gmail
 */
export async function createGmailDraft(
  accessToken: string,
  email: {
    to: string;
    subject: string;
    body: string;
  }
): Promise<{ id: string; message: any }> {
  const raw = createRawEmail(email.to, email.subject, email.body);

  const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: { raw },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Failed to create Gmail draft (${response.status}): ${errorBody}`);
  }

  return await response.json();
}

/* =========================================================================
   GOOGLE DOCS INTEGRATION
   ========================================================================= */

export interface GoogleDocResult {
  documentId: string;
  title: string;
  webViewLink: string;
}

/**
 * Create a new Google Doc with optional initial content
 */
export async function createGoogleDoc(
  accessToken: string,
  title: string,
  content?: string
): Promise<GoogleDocResult> {
  // Step 1: Create empty document
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Doc (${createRes.status}): ${errText}`);
  }

  const doc = await createRes.json();
  const documentId = doc.documentId;

  // Step 2: Insert text content if provided
  if (content && content.trim()) {
    try {
      await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content,
              },
            },
          ],
        }),
      });
    } catch (e) {
      console.warn('Error inserting initial content in Google Doc:', e);
    }
  }

  return {
    documentId,
    title,
    webViewLink: `https://docs.google.com/document/d/${documentId}/edit`,
  };
}

/* =========================================================================
   GOOGLE SHEETS INTEGRATION
   ========================================================================= */

export interface GoogleSheetResult {
  spreadsheetId: string;
  title: string;
  webViewLink: string;
}

/**
 * Create a new Google Sheet with initial rows
 */
export async function createGoogleSheet(
  accessToken: string,
  title: string,
  headers?: string[],
  rows?: (string | number)[][]
): Promise<GoogleSheetResult> {
  // Step 1: Create spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Sheet (${createRes.status}): ${errText}`);
  }

  const sheet = await createRes.json();
  const spreadsheetId = sheet.spreadsheetId;

  // Step 2: Append rows if provided
  const allRows: (string | number)[][] = [];
  if (headers && headers.length > 0) {
    allRows.push(headers);
  }
  if (rows && rows.length > 0) {
    allRows.push(...rows);
  }

  if (allRows.length > 0) {
    try {
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: allRows,
          }),
        }
      );
    } catch (e) {
      console.warn('Error adding initial rows in Google Sheet:', e);
    }
  }

  return {
    spreadsheetId,
    title,
    webViewLink: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
  };
}

/**
 * Google Drive Sync Service for ReptileTrack
 */

const CLIENT_ID = "665050976672-p2bt775dvacagthl9bga6ohspc3v8n0g.apps.googleusercontent.com";
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let ghisInited = false;

// Initialize the GAPI and GIS libraries
export async function initGoogleDrive() {
  if (!CLIENT_ID) return;
  
  return new Promise((resolve) => {
    window.gapi.load('client', async () => {
      await window.gapi.client.init({
        clientId: CLIENT_ID,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
      });
      gapiInited = true;
      checkInitialization(resolve);
    });

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // defined later for auth
    });
    ghisInited = true;
    checkInitialization(resolve);
  });
}

function checkInitialization(resolve) {
  if (gapiInited && ghisInited) {
    resolve(true);
  }
}

// Start Auth Flow
export async function authenticateGoogle() {
  return new Promise((resolve, reject) => {
    tokenClient.callback = async (response) => {
      if (response.error !== undefined) {
        reject(response);
      }
      resolve(response);
    };

    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
}

// Save Data to Google Drive (Hidden App Data folder)
export async function saveToDrive(data) {
  try {
    const fileName = 'reptiletrack_sync_backup.json';
    
    // 1. Search for existing file
    const response = await window.gapi.client.drive.files.list({
      q: `name = '${fileName}' and 'appDataFolder' in parents`,
      spaces: 'appDataFolder',
      fields: 'files(id, name)',
    });
    
    const file = response.result.files[0];
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";
    
    const metadata = {
      'name': fileName,
      'mimeType': 'application/json',
      'parents': ['appDataFolder']
    };

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(data) +
        close_delim;

    if (file) {
      // 2. Update existing file
      await window.gapi.client.request({
        'path': '/upload/drive/v3/files/' + file.id,
        'method': 'PATCH',
        'params': {'uploadType': 'multipart'},
        'headers': {
          'Content-Type': 'multipart/related; boundary=' + boundary
        },
        'body': multipartRequestBody
      });
    } else {
      // 3. Create new file
      await window.gapi.client.request({
        'path': '/upload/drive/v3/files',
        'method': 'POST',
        'params': {'uploadType': 'multipart'},
        'headers': {
          'Content-Type': 'multipart/related; boundary=' + boundary
        },
        'body': multipartRequestBody
      });
    }
    return true;
  } catch (err) {
    console.error('Drive Save Error:', err);
    return false;
  }
}

// Load Data from Google Drive
export async function loadFromDrive() {
  try {
    const response = await window.gapi.client.drive.files.list({
      q: "name = 'reptiletrack_sync_backup.json' and 'appDataFolder' in parents",
      spaces: 'appDataFolder',
      fields: 'files(id, name)',
    });
    
    const file = response.result.files[0];
    if (!file) return null;

    const fileContent = await window.gapi.client.drive.files.get({
      fileId: file.id,
      alt: 'media',
    });
    
    return fileContent.result;
  } catch (err) {
    console.error('Drive Load Error:', err);
    return null;
  }
}

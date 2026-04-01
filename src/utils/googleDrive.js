/**
 * Google Drive Sync Service for ReptileTrack
 */

const CLIENT_ID = "665050976672-p2bt775dvacagthl9bga6ohspc3v8n0g.apps.googleusercontent.com";
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let ghisInited = false;

// Helper to wait for global scripts to load
function waitForScripts() {
  return new Promise((resolve) => {
    const check = () => {
      if (window.gapi && window.google) {
        resolve();
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}

// Initialize the GAPI and GIS libraries
export async function initGoogleDrive() {
  if (!CLIENT_ID) return;
  
  await waitForScripts();
  console.log("🛠️ Script Google détectés, initialisation...");

  return new Promise((resolve) => {
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          clientId: CLIENT_ID,
          discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"],
        });
        gapiInited = true;
        console.log("✅ GAPI Initialisé");
        checkInitialization(resolve);
      } catch (err) {
        console.error("❌ GAPI Init Error:", err);
      }
    });

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', // defined later for auth
    });
    ghisInited = true;
    console.log("✅ GIS Initialisé");
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

// Helper to find or create a folder by name and parent
async function getOrCreateFolder(name, parentId = 'root') {
  const query = `name = '${name}' and mimeType = 'application/vnd.google-apps.folder' and '${parentId}' in parents and trashed = false`;
  const response = await window.gapi.client.drive.files.list({
    q: query,
    fields: 'files(id, name)',
  });
  
  if (response.result.files.length > 0) {
    return response.result.files[0].id;
  } else {
    const createResponse = await window.gapi.client.drive.files.create({
      resource: {
        name: name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      },
      fields: 'id'
    });
    return createResponse.result.id;
  }
}

// Save Data to a specific path: DigitalSaurien/Cheptel/ReptileTrack
export async function saveToDrive(data) {
  console.log("💾 [Drive] Début de la sauvegarde...");
  try {
    // 1. Get or create the path
    const digitalSaurienId = await getOrCreateFolder('DigitalSaurien');
    const cheptelId = await getOrCreateFolder('Cheptel', digitalSaurienId);
    const reptileTrackId = await getOrCreateFolder('ReptileTrack', cheptelId);
    console.log("📂 [Drive] Dossier cible trouvé/créé, ID:", reptileTrackId);

    const fileName = 'reptiletrack_sync_backup.json';
    
    // 2. Search for existing file in the final folder
    const response = await window.gapi.client.drive.files.list({
      q: `name = '${fileName}' and '${reptileTrackId}' in parents and trashed = false`,
      fields: 'files(id, name)',
    });
    
    const file = response.result.files[0];
    const boundary = '-------314159265358979323846';
    const delimiter = "\r\n--" + boundary + "\r\n";
    const close_delim = "\r\n--" + boundary + "--";
    
    const metadata = {
      'name': fileName,
      'mimeType': 'application/json',
      'parents': [reptileTrackId]
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
      console.log("📝 [Drive] Mise à jour du fichier existant (ID:", file.id, ")...");
      await window.gapi.client.request({
        'path': '/upload/drive/v3/files/' + file.id,
        'method': 'PATCH',
        'params': {'uploadType': 'multipart'},
        'headers': {
          'Content-Type': 'multipart/related; boundary=' + boundary
        },
        'body': multipartRequestBody
      });
      console.log("✅ [Drive] Mise à jour réussie !");
    } else {
      console.log("🆕 [Drive] Création d'un nouveau fichier de sauvegarde...");
      await window.gapi.client.request({
        'path': '/upload/drive/v3/files',
        'method': 'POST',
        'params': {'uploadType': 'multipart'},
        'headers': {
          'Content-Type': 'multipart/related; boundary=' + boundary
        },
        'body': multipartRequestBody
      });
      console.log("✅ [Drive] Création réussie !");
    }
    return true;
  } catch (err) {
    console.error('❌ [Drive] Erreur lors de la sauvegarde:', err);
    return false;
  }
}

// Load Data from the specific path
export async function loadFromDrive() {
  try {
    const digitalSaurienId = await getOrCreateFolder('DigitalSaurien');
    const cheptelId = await getOrCreateFolder('Cheptel', digitalSaurienId);
    const reptileTrackId = await getOrCreateFolder('ReptileTrack', cheptelId);

    const response = await window.gapi.client.drive.files.list({
      q: `name = 'reptiletrack_sync_backup.json' and '${reptileTrackId}' in parents and trashed = false`,
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

import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stripTypeScriptTypes } from 'node:module';
import { app, BrowserWindow, net, protocol, shell } from 'electron';

let mainWindow: BrowserWindow;

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
process.removeAllListeners('warning');
app.commandLine.appendSwitch('log-level', '3');
app.whenReady().then(onReady);
app.on('window-all-closed', () => app.quit());

// file://... -> app-file://app...
protocol.registerSchemesAsPrivileged([{
  scheme: 'app-file',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, codeCache: true }
}]);

function onReady() {

  protocol.handle('app-file', async request => {
    const url = request.url.replace('app-file://app', 'file://');
    const fsPath = fileURLToPath(url).replace(/^\\\\([c-z])\\/, (_, drive) => `${drive.toUpperCase()}:\\`);
    const response = await net.fetch(pathToFileURL(fsPath).toString(), {
      method: request.method,
      headers: request.headers
    });
    if (fsPath.endsWith('.ts') && response.headers.get('content-type') === 'video/vnd.dlna.mpeg-tts') {
      const body = await response.text();
      const transformedBody = stripTypeScriptTypes(body);
      return new Response(transformedBody, {
        status: response.status,
        statusText: response.statusText,
        headers: { 'content-type': 'text/javascript; charset=utf-8' }
      });
    } else {
      return response;
    }
  });

  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    x: 100, y: 300, width: 544, height: 416,
    webPreferences: {
      preload: join(import.meta.dirname, 'preload.js')
    }
  });
  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });
  mainWindow.webContents.openDevTools({ mode: 'detach' });
  const file = new URL('index.html', import.meta.url);
  mainWindow.loadURL('app-file://app' + file.toString().slice('file://'.length)); // file:// -> app-file://

}

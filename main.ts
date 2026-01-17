import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { register, stripTypeScriptTypes } from 'node:module';
import { readFile, writeFile } from 'node:fs/promises';
import { app, BrowserWindow, nativeTheme, net, protocol, shell } from 'electron';

let mainWindow: BrowserWindow;

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = '1';
process.removeAllListeners('warning');

// Resolve 'fs' to 'original-fs', since we do not use ASAR packaging.
register('data:text/javascript,export async function resolve(r,t,n){if(r==="fs"){return{format:"builtin",shortCircuit:true,url:"node:original-fs"}}return n(r,t)}', import.meta.url);

app.commandLine.appendSwitch('log-level', '3');
app.whenReady().then(onReady);
app.on('window-all-closed', () => app.quit());

// Setup a custom protocol to serve local files without using file:// for security reasons.
// The 'app' part is a valid domain name, so Windows driver letters like `C:` won't be "normalized" to `/c/` by Electron.
// file://... -> app-file://app...
protocol.registerSchemesAsPrivileged([{
  scheme: 'app-file',
  privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true, codeCache: true }
}]);

async function onReady() {

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

  // Transpile preload.ts once at startup
  let preloadSource = await readFile(join(import.meta.dirname, 'preload.ts'), 'utf8');
  preloadSource = stripTypeScriptTypes(preloadSource);
  await writeFile(join(import.meta.dirname, 'preload.js'), preloadSource);

  // For macOS dock icon
  app.dock?.setIcon(join(import.meta.dirname, 'icon.png'));

  mainWindow = new BrowserWindow({
    autoHideMenuBar: true,
    x: 100, y: 300, width: 544, height: 416,
    icon: join(import.meta.dirname, 'icon.png'),
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#1F1F1F' : '#FFFFFF',
    webPreferences: {
      preload: join(import.meta.dirname, 'preload.js'),
      defaultFontFamily: {
        standard: 'Noto Sans SC',
        serif: 'Noto Serif SC',
        sansSerif: 'Noto Sans SC',
        monospace: 'Cascadia Mono'
      }
    }
  });

  mainWindow.webContents.setWindowOpenHandler(details => {
    shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // Fix font issue on Windows https://github.com/electron/electron/issues/42055
  if (process.platform === 'win32') mainWindow.webContents.on('devtools-opened', () => {
    const monospaceFont = 'Cascadia Mono, consolas, monospace';
    const style = `
      :root {
        --sys-color-base: var(--ref-palette-neutral100);
        --source-code-font-family: ${monospaceFont} !important;
        --source-code-font-size: 12px;
        --monospace-font-family: ${monospaceFont} !important;
        --monospace-font-size: 12px;
        --default-font-family: system-ui, sans-serif;
        --default-font-size: 12px;
        --ref-palette-neutral99: #ffffffff;
      }
      .theme-with-dark-background {
        --sys-color-base: var(--ref-palette-secondary25);
      }
      body {
        --default-font-family: system-ui,sans-serif;
      }
    `.replaceAll(/\s+/g, ' ').trim();
    mainWindow.webContents.devToolsWebContents?.executeJavaScript(`
      document.body.appendChild(document.createElement('style')).textContent = '${style}';
      document.querySelectorAll('.platform-windows').forEach(el => el.classList.remove('platform-windows'));
      addStyleToAutoComplete();
      new MutationObserver((mutationList, observer) => {
        for (const mutation of mutationList) {
          if (mutation.type === 'childList') {
            for (let i = 0; i < mutation.addedNodes.length; i++) {
              const item = mutation.addedNodes[i];
              if (item.classList.contains('editor-tooltip-host')) {
                addStyleToAutoComplete();
              }
            }
          }
        }
      }).observe(document.body, { childList: true });
      function addStyleToAutoComplete() {
        document.querySelectorAll('.editor-tooltip-host').forEach(element => {
          if (element.shadowRoot.querySelectorAll('[data-key="overridden-dev-tools-font"]').length === 0) {
            const overriddenStyle = element.shadowRoot.appendChild(document.createElement('style'));
            overriddenStyle.setAttribute('data-key', 'overridden-dev-tools-font');
            overriddenStyle.textContent = '.cm-tooltip-autocomplete ul[role=listbox] {font-family: ${monospaceFont} !important;}';
          }
        });
      }
    `)
  });
  mainWindow.webContents.openDevTools({ mode: 'detach' });

  const file = new URL('index.html', import.meta.url);
  mainWindow.loadURL(file.toString().replace('file://', 'app-file://app'));

}

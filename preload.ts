// This file is *not* in commonjs, it just happens to have a require function.
// This file runs in the renderer process (i.e. in the browser) and is wrapped in an IIFE by Electron.
// Things you can require: https://www.electronjs.org/docs/latest/tutorial/sandbox#preload-scripts
// Do not import anything from outside this file! We do not have a bundler so this file should be self-contained.
const { webUtils, ipcRenderer, contextBridge }: typeof import('electron') = require('electron');

contextBridge.exposeInMainWorld('electron', {

  webUtils: {
    getPathForFile(file: File): string {
      return webUtils.getPathForFile(file);
    }
  },

  ipcRenderer: {
    send(channel: string, ...args: unknown[]): void {
      ipcRenderer.send(channel, ...args);
    },
    invoke(channel: string, ...args: unknown[]): Promise<unknown> {
      return ipcRenderer.invoke(channel, ...args);
    },
    on(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) {
      ipcRenderer.on(channel, listener);
      return this;
    },
    once(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) {
      ipcRenderer.once(channel, listener);
      return this;
    },
    removeListener(channel: string, listener: (event: Electron.IpcRendererEvent, ...args: unknown[]) => void) {
      ipcRenderer.removeListener(channel, listener);
      return this;
    }
  },

  process: {
    get platform() { return process.platform },
    get arch() { return process.arch },
    get env() { return process.env },
    get versions() { return process.versions },
    get type() { return process.type },
    get execPath() { return process.execPath },

    cwd(): string {
      return process.execPath.slice(0, process.execPath.lastIndexOf(process.platform == 'win32' ? '\\' : '/'));
    },

    getProcessMemoryInfo(): Promise<Electron.ProcessMemoryInfo> {
      return process.getProcessMemoryInfo();
    }
  }
});

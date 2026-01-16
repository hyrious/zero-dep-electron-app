// @ts-check
const { webUtils, contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  webUtils: {
    /** @param {File} file */
    getPathForFile(file) {
      return webUtils.getPathForFile(file);
    }
  }
});

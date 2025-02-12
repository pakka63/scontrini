'use strict'

import { app, protocol, BrowserWindow, ipcMain, dialog } from 'electron'
import {
  createProtocol,
//  installVueDevtools
} from 'vue-cli-plugin-electron-builder/lib'

const fs = require('fs');
const path = require('path');
//const stampaSc = require('@/utils/stampaScontrini');
const scriviSc = require('@/utils/scriviScontrini');

const confFile = process.cwd() + path.sep +'config.json';
try {
    if (!fs.existsSync(confFile)) {
      const content = 
`{
  "fpMate" : {
    "id_printer" : "Epson FP81II RT 99IEB095401",
    "cartella_scontrini" : "C:\\\\tmp\\\\EPSON",
    "cartella_esiti_scontrini" : "C:\\\\tmp\\\\EPSON\\\\out",
    "nome_scontrino" : "sco_",
    "estensione_scontrino" : ".txt",
    "estensione_monitor" : ".Out"
  }, 
  "in_test" : true
}`;
      const data = fs.writeFileSync(confFile, content)
      //file written successfully
    }
    var config = JSON.parse(fs.readFileSync(confFile, 'utf8'));
} catch(err) {
    dialog.showErrorBox('Errore', 'ERRORE in lettura di "' + confFile + '":' + "\n     " + err);
    process.exit(1);
} 


const isDevelopment = process.env.NODE_ENV !== 'production'

//console.log(process.env);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{scheme: 'app', privileges: { secure: true, standard: true } }])

function createWindow () {
  // Create the browser window.
  win = new BrowserWindow({ 
    width: 1300, height: 755, maxHeight: 755+20 ,
    webPreferences: {
      nodeIntegration: true
    }
  })
  win.removeMenu()

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode (http://localhost:8080/)
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL + (config.in_test ? '?test=1': ''))
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html' + (config.in_test ? '?test=1': ''))
  }

  win.on('closed', () => {
    win = null
  })
}

/*===================================================================================
//Esegue la stampa degli scontrini e poi manda al server (Laravel) la lista di scontrini stampati
ipcMain.on('OLD_stampaScontrini', (event, lista) => {
  let scontrini = lista.map( ticket => {
    return {
      id: ticket['id'],
      testo: ticket['testo'],
      id_documento: ticket['id_documento'],
      prezzo: ticket['prezzo']
    }
  })
  stampaSc.emettiScontrini(config.server, scontrini, event)
})
*/

//===================================================================================
//Esegue la scrittura degli scontrini nella cartella gestita da FpMate e poi manda al server (Laravel) la lista di scontrini stampati
ipcMain.on('stampaScontrini', (event, lista) => {
  let scontrini = lista.map( ticket => {
    return {
      id: ticket['id'],
      testo: ticket['testo'],
      id_documento: ticket['id_documento'],
      prezzo: ticket['prezzo']
    }
  })
  scriviSc.emettiScontrini(config, scontrini, event)
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    // Devtools extensions are broken in Electron 6.0.0 and greater
    // See https://github.com/nklayman/vue-cli-plugin-electron-builder/issues/378 for more info
    // Electron will not launch with Devtools extensions installed on Windows 10 with dark mode
    // If you are not using Windows 10 dark mode, you may uncomment these lines
    // In addition, if the linked issue is closed, you can upgrade electron and uncomment these lines
    // try {
    //   await installVueDevtools()
    // } catch (e) {
    //   console.error('Vue Devtools failed to install:', e.toString())
    // }

  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

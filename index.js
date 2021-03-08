var path = require('path');
var { app, BrowserWindow, session } = require('electron');
var { autoUpdater } = require('electron-updater');
var log = require('electron-log');
var { ElectronBlocker } = require('@cliqz/adblocker-electron');
var fetch = require('cross-fetch');

const cors = require('cors');
const express = require('express');
const stockfish = require("./scripts/stockfish");

const engine = stockfish();

class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow = null;

ElectronBlocker.fromPrebuiltAdsAndTracking(fetch)
  // eslint-disable-next-line promise/always-return
  .then((blocker) => {
    blocker.enableBlockingInSession(session.defaultSession);
  })
  .catch((err) => {
    console.log(err);
  });

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

if (
  process.env.NODE_ENV === 'development' ||
  process.env.DEBUG_PROD === 'true'
) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS', 'REDUX_DEVTOOLS'];

  return Promise.all(
    extensions.map((name) => installer.default(installer[name], forceDownload))
  ).catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  mainWindow = new BrowserWindow({
    width: 1024,
    height: 728,
    // fullscreen: true,
    // frame: true,
    transparent: false,
    webPreferences: {
      webSecurity: true,
      nodeIntegration: false,
      // allowRunningInsecureContent: true,
      devTools: true,
      preload: path.join(__dirname, 'preload/preload.js'),
    },
  });

  mainWindow.webContents.openDevTools();

  mainWindow.loadURL(`https://chess.com/live`, {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'
  });

  mainWindow.webContents.on('did-finish-load', function() {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  new AppUpdater();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', createWindow);

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

const expressApp = express();

expressApp.listen(3000);
expressApp.use(express.urlencoded());
expressApp.use(cors({credentials: true, origin: 'https://www.chess.com'}));

let previousResponse;
let firstMove = true;

expressApp.get('/stockfish', (req, res) => {
  const uciMessage = decodeURIComponent(req.query.uci);  

  function send(str)
  {
      console.log(`Sending: ${str}`)
      engine.postMessage(str);
  }

  if (process.argv[2] === "--help") {
      console.log("Usage: node simple_node.js [FEN OR move1 move2 ...moveN]");
      console.log("");
      console.log("Examples:");
      console.log("   node simple_node.js");
      console.log("   node simple_node.js \"rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2\"");
      console.log("   node simple_node.js g1f3 e7e5");
      process.exit();
  }

  engine.onmessage = function(line){
    console.log(`Line: ${line}`)
    
    if (typeof line !== "string") {
        console.log("Got line:");
        console.log(typeof line);
        console.log(line);
    }
  
    if(line.includes('bestmove') && previousResponse !== line || line.includes('bestmove') && firstMove){
      previousResponse = line;
      res.end(line);
    }
  }

  if(uciMessage === 'position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'){
    console.log('first message true')
    firstMove = true;
  } else {
    console.log('first message false')
    firstMove = false;
  }

  send(uciMessage);
  if(uciMessage.includes('position')){
    send('go depth 15');
    // send("d");
  }
})
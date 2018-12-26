// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron')
const server = require('http').createServer();
const io = require('socket.io')(server);
const randomPort = require('random-port');

//Local storage
const Store = require('electron-store')
const store = new Store({name: 'electron-store'});

// App global context
global.context = {
  host: null,
  name: null,
  id: null,
  port: null
};

if(store.get("name")) {
  global.context.name = store.get("name")
}

global.context.port = randomPort({from: 3000, range: 10}, function(port) {
  global.context.port = port
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 1090, height: 800, icon: './icon.png'})

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')
  // Enable live-reload and DevTools.
  try {
    require('electron-reloader')(module)
  } catch (err) {}
  //mainWindow.webContents.openDevTools()

  // disable menu
  mainWindow.setMenu(null);

  // Allow kerberos auth
  mainWindow.webContents.session.allowNTLMCredentialsForDomains('*')

  // Handle socket.io connections
  io.on('connection', function(socket){
    socket.on('poker message', function(msg){
        try {
            var data = JSON.parse(msg);
            if(data && data.room) {
                if(data.command === 'join'){
                    socket.join(msg.to);
                }
                io.to(msg.room).emit('poker message', msg);
                return;
            }
        }
        catch (ex) {
            //empty
        }        
      });

    socket.on('disconnect', function(){
      });
  });
  // Start Socket.io server
  server.listen(global.context.port);

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

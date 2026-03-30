const { app, BrowserWindow, ipcMain, Menu, shell, desktopCapturer } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

/**
 * RULE: Local PC Image Cleanup
 * Deletes any temporary images in the 'local_captures' folder on start and exit.
 */
const localFolder = path.join(__dirname, 'local_captures');

function cleanLocalImages() {
    try {
        if (fs.existsSync(localFolder)) {
            const files = fs.readdirSync(localFolder);
            for (const file of files) {
                fs.unlinkSync(path.join(localFolder, file));
            }
            console.log("Cleanup: Local temporary images removed.");
        } else {
            fs.mkdirSync(localFolder);
        }
    } catch (err) {
        console.error("Cleanup Error:", err);
    }
}

function createWindow() {
    // Run cleanup on startup
    cleanLocalImages();

    mainWindow = new BrowserWindow({
        width: 300,
        height: 450,
        title: "AI Answer App",
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    mainWindow.loadFile('index.html');

    // --- COMPLETE MENU BAR CONFIGURATION ---
    const menuTemplate = [
  {
    label: 'Settings',
    click: () => { 
        // This must match the name in preload.js
        mainWindow.webContents.send('menu-toggle-settings'); 
    }
},
        {
            label: 'Get API',
            click: () => { shell.openExternal('https://blogcutter.com/user/profile/api'); }
        },
        {
            label: 'Balance',
            click: () => { 
                // Send signal to renderer to fetch balance using the stored API key
                mainWindow.webContents.send('check-balance'); 
            }
        },
        {
            label: 'Restart',
            click: () => { 
                app.relaunch(); 
                app.exit(); 
            }
        },
        {
            label: 'Help',
            click: () => { shell.openExternal('https://blogcutter.com/contact'); }
        },
        {
            label: 'Dev',
            submenu: [
                { role: 'reload' },
                { role: 'toggleDevTools' }
            ]
        }
    ];

    const menu = Menu.buildFromTemplate(menuTemplate);
    Menu.setApplicationMenu(menu);

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Initialize App
app.whenReady().then(createWindow);

// Run cleanup when app stops
app.on('will-quit', () => {
    cleanLocalImages();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

/**
 * IPC HANDLER: Take Screenshot
 * Hides the app, captures the screen, then shows the app again.
 */
ipcMain.handle('take-screenshot', async () => {
    try {
        mainWindow.hide();
        // Delay to ensure window is gone from OS screen buffer
        await new Promise(r => setTimeout(r, 300)); 

        const sources = await desktopCapturer.getSources({ 
            types: ['screen'], 
            thumbnailSize: { width: 1920, height: 1080 } 
        });

        mainWindow.show();

        if (sources.length > 0) {
            return { success: true, data: sources[0].thumbnail.toDataURL() };
        }
        throw new Error("No screen source detected");
    } catch (e) {
        mainWindow.show();
        return { success: false, error: e.message };
    }
});
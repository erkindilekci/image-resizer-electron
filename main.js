const path = require("path");
const os = require("os");
const fs = require("fs");
const resizeImg = require("resize-img");

const { app, BrowserWindow, Menu, ipcMain, shell } = require("electron");

const isMac = process.platform === "darwin";

let mainWindow;

const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        title: "Image Resizer",
        icon: `${__dirname}/assets/icons/Icon_256x256.png`,
        width: 600,
        height: 800,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    mainWindow.loadFile(path.join(__dirname, "./renderer/index.html"));
};

const createAboutWindow = () => {
    const aboutWindow = new BrowserWindow({
        title: "About Image Resizer",
        width: 300,
        height: 300,
    });

    aboutWindow.loadFile(path.join(__dirname, "./renderer/about.html"));
};

app.whenReady().then(() => {
    createMainWindow();

    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);

    mainWindow.on("closed", () => (mainWindow = null));

    app.on("activate", () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow();
        }
    });
});

const menu = [
    ...(isMac
        ? [
              {
                  label: app.name,
                  submenu: [{ label: "About", click: createAboutWindow }],
              },
          ]
        : []),
    { role: "fileMenu" },
    ...(!isMac
        ? [
              {
                  label: "Help",
                  submenu: [{ label: "About", click: createAboutWindow }],
              },
          ]
        : []),
];

const resizeImage = async ({ imgPath, width, height, dest }) => {
    try {
        const newPath = await resizeImg(fs.readFileSync(imgPath), {
            width: +width,
            height: +height,
        });

        const fileName = path.basename(imgPath);

        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest);
        }

        fs.writeFileSync(path.join(dest, fileName), newPath);

        mainWindow.webContents.send("image:done");

        shell.openPath(dest);
    } catch (error) {
        console.error(error);
    }
};

ipcMain.on("image:resize", (e, options) => {
    options.dest = path.join(os.homedir(), "imageresizer");
    resizeImage(options);
});

app.on("window-all-closed", () => {
    if (!isMac) {
        app.quit();
    }
});

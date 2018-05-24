const { app } = require('electron');

let instance = null;
class Settings {
  constructor() {
    if (!instance) {
      instance = this;
    }
    return instance;
  }

  // @returns "Application Support/Mist" in production mode
  // @returns "Application Support/Electron" in development mode
  get userDataPath() {
    return app.getPath('userData');
  }

  get appDataPath() {
    // Application Support/
    return app.getPath('appData');
  }

  get userHomePath() {
    return app.getPath('home');
  }
  
}

module.exports = new Settings();
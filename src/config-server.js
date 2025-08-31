const express = require('express');
const cors = require('cors');
const path = require('path');
const os = require('os');
const gcal = require('./gcal');

class ConfigServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.port = 3000;
    this.onServiceKeyReceived = null;
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    // Enable CORS for all routes
    this.app.use(cors());
    
    // Parse JSON bodies
    this.app.use(express.json({ limit: '10mb' }));
    
    // Parse URL-encoded bodies
    this.app.use(express.urlencoded({ extended: true }));
    
    // Serve static files
    this.app.use(express.static(path.join(__dirname, 'templates', 'web-config')));
  }

  setupRoutes() {
    // Serve the configuration page
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'templates', 'web-config', 'index.html'));
    });

    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        message: 'Booking Pal Configuration Server is running',
        timestamp: new Date().toISOString()
      });
    });

    // Receive service key configuration
    this.app.post('/api/service-key', async (req, res) => {
      try {
        const { serviceKey, roomName, calendarId } = req.body;

        if (!serviceKey) {
          return res.status(400).json({ 
            success: false, 
            error: 'Service key is required' 
          });
        }

        // Validate the service key
        console.log('Validating received service key...');
        const testResult = await gcal.testServiceKey(serviceKey);
        
        if (!testResult.valid) {
          return res.status(400).json({ 
            success: false, 
            error: testResult.error 
          });
        }

        console.log('Service key validation successful');

        // If callback is provided, call it with the validated data
        if (this.onServiceKeyReceived) {
          await this.onServiceKeyReceived({
            serviceKey,
            roomName,
            calendarId
          });
        }

        res.json({ 
          success: true, 
          message: 'Service key validated and saved successfully. The configuration server will shut down shortly.' 
        });

        // Shut down the server after a brief delay
        setTimeout(() => {
          this.stop();
        }, 2000);

      } catch (error) {
        console.error('Error processing service key:', error);
        res.status(500).json({ 
          success: false, 
          error: error.message 
        });
      }
    });

    // Get device info for display
    this.app.get('/api/device-info', (req, res) => {
      res.json({
        hostname: os.hostname(),
        platform: os.platform(),
        networkInterfaces: this.getNetworkAddresses()
      });
    });
  }

  getNetworkAddresses() {
    const interfaces = os.networkInterfaces();
    const addresses = [];

    for (const name in interfaces) {
      for (const iface of interfaces[name]) {
        // Skip internal and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          addresses.push({
            name: name,
            address: iface.address
          });
        }
      }
    }

    return addresses;
  }

  getAccessURL() {
    const addresses = this.getNetworkAddresses();
    const primaryAddress = addresses[0]?.address || 'localhost';
    return `http://${primaryAddress}:${this.port}`;
  }

  start() {
    return new Promise((resolve, reject) => {
      // Try to start on the preferred port, or find an available port
      const tryPort = (port) => {
        this.server = this.app.listen(port, '0.0.0.0', (err) => {
          if (err) {
            if (err.code === 'EADDRINUSE' && port < 3010) {
              console.log(`Port ${port} is in use, trying ${port + 1}...`);
              tryPort(port + 1);
            } else {
              reject(err);
            }
          } else {
            this.port = port;
            console.log(`Configuration server started on port ${this.port}`);
            console.log(`Access URL: ${this.getAccessURL()}`);
            resolve({
              port: this.port,
              url: this.getAccessURL()
            });
          }
        });
      };

      tryPort(3000);
    });
  }

  stop() {
    if (this.server) {
      console.log('Stopping configuration server...');
      this.server.close(() => {
        console.log('Configuration server stopped');
      });
      this.server = null;
    }
  }

  setServiceKeyCallback(callback) {
    this.onServiceKeyReceived = callback;
  }
}

module.exports = ConfigServer;
let Store;

class ConfigStore {
  constructor() {
    this.store = null;
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      if (!Store) {
        Store = (await import('electron-store')).default;
      }
      this.store = new Store({
        name: 'booking-pal-config',
        defaults: {
          calendar: {
            id: null,
            title: null
          },
          serviceKey: null
        }
      });
      this.initialized = true;
    }
  }

  // Calendar configuration methods
  async getCalendarConfig() {
    await this.initialize();
    return this.store.get('calendar');
  }

  async setCalendarConfig(calendarId, title) {
    await this.initialize();
    if (!calendarId || !title) {
      throw new Error('Calendar ID and title are required');
    }
    
    this.store.set('calendar', {
      id: calendarId,
      title: title
    });
    
    return await this.getCalendarConfig();
  }

  async hasCalendarConfig() {
    const calendar = await this.getCalendarConfig();
    return calendar && calendar.id && calendar.title;
  }

  // Service key methods
  async getServiceKey() {
    await this.initialize();
    return this.store.get('serviceKey');
  }

  async setServiceKey(serviceKey) {
    await this.initialize();
    if (!serviceKey) {
      throw new Error('Service key is required');
    }
    
    this.store.set('serviceKey', serviceKey);
    return await this.getServiceKey();
  }

  async hasServiceKey() {
    const serviceKey = await this.getServiceKey();
    return serviceKey !== null && serviceKey !== undefined;
  }

  // Complete configuration methods
  async getAllConfig() {
    await this.initialize();
    return {
      calendar: await this.getCalendarConfig(),
      serviceKey: await this.getServiceKey()
    };
  }

  async setAllConfig(config) {
    await this.initialize();
    if (config.serviceKey) {
      await this.setServiceKey(config.serviceKey);
    }
    
    if (config.calendarId && config.roomName) {
      await this.setCalendarConfig(config.calendarId, config.roomName);
    }
    
    return await this.getAllConfig();
  }

  // Clear all configuration
  async clear() {
    await this.initialize();
    this.store.clear();
  }

  // Get current configuration for UI display
  async getCurrentConfig() {
    await this.initialize();
    const calendar = await this.getCalendarConfig();
    const serviceKey = await this.getServiceKey();
    
    return {
      roomName: calendar?.title || null,
      calendarId: calendar?.id || null,
      serviceKey: serviceKey
    };
  }
}

module.exports = ConfigStore;
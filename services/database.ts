
import { NotificationData, OLTDetail, User } from '../types';
import { INITIAL_NOTIFICATIONS, MOCK_OLT_DETAILS, MOCK_USERS } from '../constants';

const KEYS = {
  NOTIFICATIONS: 'dishhome_notifications_db',
  OLTS: 'dishhome_olts_db',
  USERS: 'dishhome_users_db'
};

export const db = {
  // Initialize Database with default data if empty
  init: () => {
    if (!localStorage.getItem(KEYS.NOTIFICATIONS)) {
      localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    }
    if (!localStorage.getItem(KEYS.OLTS)) {
      localStorage.setItem(KEYS.OLTS, JSON.stringify(MOCK_OLT_DETAILS));
    }
    if (!localStorage.getItem(KEYS.USERS)) {
      localStorage.setItem(KEYS.USERS, JSON.stringify(MOCK_USERS));
    }
  },

  // --- Notifications Operations ---
  getNotifications: (): NotificationData[] => {
    try {
      const data = localStorage.getItem(KEYS.NOTIFICATIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },
  
  saveNotification: (notification: NotificationData) => {
    const list = db.getNotifications();
    const index = list.findIndex(n => n.id === notification.id);
    if (index >= 0) {
      list[index] = notification;
    } else {
      list.unshift(notification);
    }
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(list));
    return list;
  },

  deleteNotification: (id: string) => {
    const list = db.getNotifications().filter(n => n.id !== id);
    localStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(list));
    return list;
  },

  // --- OLT Operations ---
  getOLTs: (): OLTDetail[] => {
    try {
      const data = localStorage.getItem(KEYS.OLTS);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },

  saveOLT: (olt: OLTDetail) => {
    const list = db.getOLTs();
    const index = list.findIndex(o => o.id === olt.id);
    if (index >= 0) {
      list[index] = olt;
    } else {
      list.unshift(olt);
    }
    localStorage.setItem(KEYS.OLTS, JSON.stringify(list));
    return list;
  },

  bulkSaveOLTs: (newOlts: OLTDetail[]) => {
    const current = db.getOLTs();
    const updated = [...newOlts, ...current];
    localStorage.setItem(KEYS.OLTS, JSON.stringify(updated));
    return updated;
  },

  deleteOLT: (id: string) => {
    const list = db.getOLTs().filter(o => o.id !== id);
    localStorage.setItem(KEYS.OLTS, JSON.stringify(list));
    return list;
  },

  // --- User Operations ---
  getUsers: (): User[] => {
    try {
      const data = localStorage.getItem(KEYS.USERS);
      return data ? JSON.parse(data) : [];
    } catch (e) { return []; }
  },

  saveUser: (user: User) => {
    const list = db.getUsers();
    const index = list.findIndex(u => u.id === user.id);
    if (index >= 0) {
      list[index] = user;
    } else {
      list.push(user);
    }
    localStorage.setItem(KEYS.USERS, JSON.stringify(list));
    return list;
  },

  deleteUser: (id: string) => {
    const list = db.getUsers().filter(u => u.id !== id);
    localStorage.setItem(KEYS.USERS, JSON.stringify(list));
    return list;
  },

  // --- Database Management ---
  getStats: () => {
    return {
      users: db.getUsers().length,
      notifications: db.getNotifications().length,
      olts: db.getOLTs().length,
      lastBackup: new Date().toLocaleString()
    };
  },

  getFullBackup: () => {
    return {
      users: db.getUsers(),
      notifications: db.getNotifications(),
      olts: db.getOLTs(),
      timestamp: new Date().toISOString()
    };
  },

  resetDatabase: () => {
    localStorage.clear();
    db.init();
    return true;
  }
};

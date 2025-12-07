
export type Role = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  lastLogin: string;
  active: boolean;
  permissions: {
    canViewDashboard: boolean;
    canViewNotifications: boolean;
    canManageUsers?: boolean;
    canCreateNotifications?: boolean;
    canManageOLTs?: boolean;
  };
}

export interface NotificationData {
  id: string;
  title: string;
  mastersDownCount: number;
  affectedMasters: string[]; // Comma separated names
  oltsDownCount: number;
  downOltsList: string[];
  impactedCustomers: number;
  reason: string;
  estimatedTime: string; // e.g., "2 Hours"
  alertTime: string; // Time when issue was reported/investigation started
  maintenanceStartTime?: string; // Time when status moved to RUNNING
  resolvedTime?: string; // Time when status moved to COMPLETED
  status: 'WARNING' | 'RUNNING' | 'COMPLETED';
  screenshotUrl?: string;
  createdBy: string;
  notifiedPersons?: string[]; // List of responsible persons alerted
}

export interface OLTData {
  id: string;
  name: string;
  region: string;
  masterName: string;
  slotName: string;
  frameName: string;
  customerCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface OLTDetail {
  id: string;
  vendorName: string;
  podName: string;
  oltCode: string;
  masterName: string;
  responsiblePerson: string;
  region: string;
  addedAt: string;
  status: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
}

export interface DashboardStats {
  totalOLTs: number;
  totalCustomers: number;
  activeOLTs: number;
  inactiveOLTs: number;
  regionDistribution: { name: string; count: number }[];
  podList: OLTData[];
}

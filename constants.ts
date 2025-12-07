
import { User, DashboardStats, NotificationData, OLTData, OLTDetail } from './types';

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Super Admin',
    email: 'admin@dishhome.com.np',
    role: 'SUPER_ADMIN',
    region: 'All',
    lastLogin: '2023-10-27 10:30 AM',
    active: true,
    permissions: {
      canViewDashboard: true,
      canViewNotifications: true,
      canManageUsers: true,
      canCreateNotifications: true,
      canManageOLTs: true,
      canExportData: true,
    },
  },
  {
    id: 'u2',
    name: 'Network Engineer (KTM)',
    email: 'engineer@dishhome.com.np',
    role: 'ADMIN',
    region: 'Kathmandu',
    lastLogin: '2023-10-26 09:15 AM',
    active: true,
    permissions: {
      canViewDashboard: true,
      canViewNotifications: true,
      canManageUsers: false,
      canCreateNotifications: true,
      canManageOLTs: true,
      canExportData: true,
    },
  },
  {
    id: 'u3',
    name: 'Support Staff (PKR)',
    email: 'support@dishhome.com.np',
    role: 'USER',
    region: 'Pokhara',
    lastLogin: '2023-10-27 08:00 AM',
    active: true,
    permissions: {
      canViewDashboard: true,
      canViewNotifications: true,
      canManageUsers: false,
      canCreateNotifications: false,
      canManageOLTs: false,
      canExportData: false,
    },
  },
];

export const MOCK_OLT_DETAILS: OLTDetail[] = [
  {
    id: 'd1',
    vendorName: 'Huawei',
    podName: 'KTM-POD-01',
    oltCode: 'KTM-OLT-01',
    masterName: 'KTM-Core-01',
    responsiblePerson: 'Ramesh Gupta',
    region: 'Kathmandu',
    addedAt: '2023-01-15',
    status: 'ACTIVE'
  },
  {
    id: 'd2',
    vendorName: 'Nokia',
    podName: 'BKT-POD-05',
    oltCode: 'BKT-OLT-01',
    masterName: 'BKT-Core-01',
    responsiblePerson: 'Suresh Shrestha',
    region: 'Bhaktapur',
    addedAt: '2023-02-20',
    status: 'ACTIVE'
  },
  {
    id: 'd3',
    vendorName: 'ZTE',
    podName: 'LAL-POD-02',
    oltCode: 'LAL-OLT-01',
    masterName: 'LAL-Core-01',
    responsiblePerson: 'Anita Rai',
    region: 'Lalitpur',
    addedAt: '2023-03-10',
    status: 'INACTIVE'
  },
  {
    id: 'd4',
    vendorName: 'Huawei',
    podName: 'PKR-POD-10',
    oltCode: 'PKR-OLT-01',
    masterName: 'PKR-Core-01',
    responsiblePerson: 'Hari Sharma',
    region: 'Pokhara',
    addedAt: '2023-04-05',
    status: 'MAINTENANCE'
  }
];

export const MOCK_OLT_DATA: OLTData[] = [
  { id: 'olt1', name: 'KTM-OLT-01', region: 'Kathmandu', masterName: 'KTM-Core-01', slotName: 'Slot-1', frameName: 'Frame-A', customerCount: 1200, status: 'ACTIVE' },
  { id: 'olt2', name: 'KTM-OLT-02', region: 'Kathmandu', masterName: 'KTM-Core-01', slotName: 'Slot-2', frameName: 'Frame-A', customerCount: 950, status: 'ACTIVE' },
  { id: 'olt3', name: 'BKT-OLT-01', region: 'Bhaktapur', masterName: 'BKT-Core-01', slotName: 'Slot-1', frameName: 'Frame-B', customerCount: 800, status: 'INACTIVE' },
  { id: 'olt4', name: 'LAL-OLT-01', region: 'Lalitpur', masterName: 'LAL-Core-01', slotName: 'Slot-5', frameName: 'Frame-C', customerCount: 1500, status: 'ACTIVE' },
  { id: 'olt5', name: 'PKR-OLT-01', region: 'Pokhara', masterName: 'PKR-Core-01', slotName: 'Slot-1', frameName: 'Frame-A', customerCount: 600, status: 'ACTIVE' },
];

export const INITIAL_NOTIFICATIONS: NotificationData[] = [
  {
    id: 'n1',
    title: 'Major Fiber Cut - Bhaktapur Area',
    region: 'Bhaktapur',
    mastersDownCount: 1,
    affectedMasters: ['BKT-Core-01'],
    oltsDownCount: 3,
    downOltsList: ['BKT-OLT-01', 'BKT-OLT-02', 'BKT-OLT-05'],
    impactedCustomers: 2400,
    reason: 'NEA Pole Shifting caused fiber cut near Sallaghari.',
    estimatedTime: '4 Hours',
    alertTime: '2023-10-27 10:00 AM',
    status: 'WARNING',
    createdBy: 'Network Engineer',
  },
  {
    id: 'n2',
    title: 'Scheduled Maintenance - Lalitpur',
    region: 'Lalitpur',
    mastersDownCount: 0,
    affectedMasters: [],
    oltsDownCount: 1,
    downOltsList: ['LAL-OLT-03'],
    impactedCustomers: 500,
    reason: 'Software upgrade on OLT.',
    estimatedTime: 'Completed',
    alertTime: '2023-10-26 02:00 AM',
    maintenanceStartTime: '2023-10-26 02:15 AM',
    resolvedTime: '2023-10-26 04:00 AM',
    status: 'COMPLETED',
    createdBy: 'Super Admin',
  },
];

export const MOCK_STATS: DashboardStats = {
  totalOLTs: 150,
  totalCustomers: 45000,
  activeOLTs: 142,
  inactiveOLTs: 8,
  regionDistribution: [
    { name: 'Kathmandu', count: 60 },
    { name: 'Lalitpur', count: 40 },
    { name: 'Bhaktapur', count: 20 },
    { name: 'Pokhara', count: 15 },
    { name: 'Chitwan', count: 15 },
  ],
  podList: MOCK_OLT_DATA,
};

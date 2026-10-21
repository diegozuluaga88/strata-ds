import type { Notification } from './types';

export const mockNotifications: Notification[] = [
    {
        id: '1',
        type: 'discrepancy',
        priority: 'high',
        title: 'Quantity Mismatch',
        message: 'Order vs Invoice: 24 → 22 units',
        meta: '#DSC-112',
        timestamp: '2 min ago',
        unread: true,
        actions: [
            { label: 'Resolve', primary: true },
            // Arrow icon will be added in component
        ]
    },
    {
        id: '2',
        type: 'discrepancy',
        priority: 'high',
        title: 'Price Discrepancy',
        message: 'PO #4521 - $2,340 variance',
        meta: '#DSC-118',
        timestamp: '15 min ago',
        unread: true,
        actions: [
            { label: 'Review', primary: true }
        ]
    },
    {
        id: '3',
        type: 'discrepancy',
        priority: 'medium',
        title: 'SKU Mismatch',
        message: 'Wrong product code detected',
        meta: '#DSC-124',
        timestamp: '1 hour ago',
        unread: true,
        actions: [
            { label: 'Fix', primary: true }
        ]
    },
    {
        id: '4',
        type: 'invoice',
        priority: 'high',
        title: 'Overdue Invoice',
        message: '$12,450 - 15 days overdue',
        meta: '#INV-7834',
        timestamp: '2 hours ago',
        unread: true,
        actions: [
            { label: 'Collect', primary: true }
        ]
    },
    {
        id: '5',
        type: 'payment',
        priority: 'medium',
        title: 'Pending Payment',
        message: '$8,920 awaiting confirmation',
        meta: '#PAY-445',
        timestamp: '3 hours ago',
        unread: true,
        actions: [
            { label: 'Follow Up', primary: true }
        ]
    },
    {
        id: '6',
        type: 'payment',
        priority: 'high',
        title: 'Failed Transaction',
        message: 'Card declined - retry needed',
        meta: '#TXN-892',
        timestamp: '4 hours ago',
        unread: true,
        actions: [
            { label: 'Retry', primary: true }
        ]
    },
    {
        id: '7',
        type: 'approval',
        priority: 'high',
        title: 'Review Quote',
        message: 'Alderway Pivot - $45,230',
        meta: '#QT-2847',
        timestamp: '5 hours ago',
        unread: true,
        actions: [
            { label: 'Convert', primary: true }
        ]
    },
    {
        id: '8',
        type: 'approval',
        priority: 'high',
        title: 'Approve Order',
        message: 'Kestrel Clinical recliner batch',
        meta: '#OR-9823',
        timestamp: '6 hours ago',
        unread: true,
        actions: [
            { label: 'Approve', primary: true }
        ]
    },
    {
        id: '9',
        type: 'approval',
        priority: 'medium',
        title: 'Pending Quote',
        message: 'Knoll workspace setup',
        meta: '#Q1-2851',
        timestamp: '1 day ago',
        unread: false,
        actions: [
            { label: 'Review', primary: true }
        ]
    },
    {
        id: '10',
        type: 'approval',
        priority: 'low',
        title: 'Contract Renewal',
        message: 'Annual maintenance agreement',
        meta: '#CN-44',
        timestamp: '2 days ago',
        unread: false,
        actions: [
            { label: 'Sign', primary: true }
        ]
    },
    {
        id: '11',
        type: 'announcement',
        priority: 'medium',
        title: 'New Feature: IMS Integration',
        message: 'The new Inventory Management System is now live.',
        meta: 'System Update',
        timestamp: '10 min ago',
        unread: true,
        actions: [
            { label: 'Learn More', primary: true }
        ]
    },
    {
        id: '12',
        type: 'live_chat',
        priority: 'high',
        title: 'Support Message',
        message: 'Hi John, regarding your ticket #442...',
        meta: 'Sarah from Support',
        timestamp: 'Just now',
        unread: true,
        actions: [
            { label: 'Reply', primary: true }
        ]
    }
];

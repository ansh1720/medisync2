import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  BellIcon,
  XMarkIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  HeartIcon,
  CalendarDaysIcon,
  ChatBubbleLeftIcon,
  NewspaperIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

const NOTIFICATION_TYPES = {
  HEALTH_ALERT: {
    icon: ExclamationTriangleIcon,
    color: 'text-red-600 bg-red-100',
    borderColor: 'border-red-200'
  },
  APPOINTMENT_REMINDER: {
    icon: CalendarDaysIcon,
    color: 'text-blue-600 bg-blue-100',
    borderColor: 'border-blue-200'
  },
  MEDICATION_REMINDER: {
    icon: HeartIcon,
    color: 'text-green-600 bg-green-100',
    borderColor: 'border-green-200'
  },
  COMMUNITY_UPDATE: {
    icon: ChatBubbleLeftIcon,
    color: 'text-purple-600 bg-purple-100',
    borderColor: 'border-purple-200'
  },
  NEWS_UPDATE: {
    icon: NewspaperIcon,
    color: 'text-indigo-600 bg-indigo-100',
    borderColor: 'border-indigo-200'
  },
  SYSTEM_ALERT: {
    icon: InformationCircleIcon,
    color: 'text-gray-600 bg-gray-100',
    borderColor: 'border-gray-200'
  }
};

// Mock notifications for development
const MOCK_NOTIFICATIONS = [
  {
    _id: '1',
    type: 'HEALTH_ALERT',
    title: 'Blood Pressure Alert',
    message: 'Your latest blood pressure reading (160/95) is above normal. Consider consulting with your doctor.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    isRead: false,
    priority: 'high',
    actionUrl: '/equipment',
    actionText: 'View Reading'
  },
  {
    _id: '2',
    type: 'APPOINTMENT_REMINDER',
    title: 'Upcoming Appointment',
    message: 'You have a consultation with Dr. Smith tomorrow at 2:00 PM.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    isRead: false,
    priority: 'medium',
    actionUrl: '/consultations',
    actionText: 'View Details'
  },
  {
    _id: '3',
    type: 'MEDICATION_REMINDER',
    title: 'Medication Reminder',
    message: 'Time to take your morning medications: Metformin and Lisinopril.',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
    isRead: true,
    priority: 'medium',
    actionUrl: '/profile',
    actionText: 'Update Medications'
  },
  {
    _id: '4',
    type: 'COMMUNITY_UPDATE',
    title: 'New Reply to Your Post',
    message: 'Someone replied to your post about diabetes management in the community forum.',
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
    isRead: true,
    priority: 'low',
    actionUrl: '/forum',
    actionText: 'View Reply'
  },
  {
    _id: '5',
    type: 'NEWS_UPDATE',
    title: 'Health News Update',
    message: 'New breakthrough in diabetes treatment: Clinical trial shows 85% success rate.',
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
    isRead: true,
    priority: 'low',
    actionUrl: '/news',
    actionText: 'Read Article'
  }
];

function NotificationCenter() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'health', 'appointments'

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
        auth: {
          token: localStorage.getItem('medisync_token')
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to notification server');
      });

      newSocket.on('notification', (notification) => {
        console.log('New notification received:', notification);
        
        // Add to notifications list
        setNotifications(prev => [notification, ...prev]);
        
        // Show toast notification
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <BellSolidIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {notification.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Close
              </button>
            </div>
          </div>
        ), {
          duration: 5000,
          position: 'top-right'
        });
        
        // Update unread count
        if (!notification.isRead) {
          setUnreadCount(prev => prev + 1);
        }
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from notification server');
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [user]);

  // Load initial notifications
  useEffect(() => {
    // For now, use mock data
    setNotifications(MOCK_NOTIFICATIONS);
    setUnreadCount(MOCK_NOTIFICATIONS.filter(n => !n.isRead).length);
    
    // In a real app, you would fetch from API:
    // fetchNotifications();
  }, []);

  // Mark notification as read
  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification._id === notificationId 
          ? { ...notification, isRead: true }
          : notification
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
    
    // In a real app, send to API
    // notificationAPI.markAsRead(notificationId);
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
    setUnreadCount(0);
    
    // In a real app, send to API
    // notificationAPI.markAllAsRead();
  };

  // Delete notification
  const deleteNotification = (notificationId) => {
    setNotifications(prev => 
      prev.filter(notification => notification._id !== notificationId)
    );
    
    // Update unread count if it was unread
    const notification = notifications.find(n => n._id === notificationId);
    if (notification && !notification.isRead) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    // In a real app, send to API
    // notificationAPI.deleteNotification(notificationId);
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'unread':
        return !notification.isRead;
      case 'health':
        return ['HEALTH_ALERT', 'MEDICATION_REMINDER'].includes(notification.type);
      case 'appointments':
        return notification.type === 'APPOINTMENT_REMINDER';
      default:
        return true;
    }
  });

  // Format time ago
  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diff = now - notificationDate;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else if (days < 7) {
      return `${days}d ago`;
    } else {
      return notificationDate.toLocaleDateString();
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      case 'low': return 'border-l-blue-500';
      default: return 'border-l-gray-300';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
      >
        <BellIcon className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex border-b border-gray-200">
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'health', label: 'Health' },
                { key: 'appointments', label: 'Appointments' }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`flex-1 px-3 py-2 text-xs font-medium ${
                    filter === tab.key
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  {tab.key === 'unread' && unreadCount > 0 && (
                    <span className="ml-1 bg-red-100 text-red-600 rounded-full px-2 py-0.5 text-xs">
                      {unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center">
                  <BellIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {filter === 'unread' 
                      ? "You're all caught up!" 
                      : 'Notifications will appear here when you receive them.'
                    }
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredNotifications.map((notification) => {
                    const typeInfo = NOTIFICATION_TYPES[notification.type];
                    const IconComponent = typeInfo.icon;
                    
                    return (
                      <div
                        key={notification._id}
                        className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityColor(notification.priority)} ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${typeInfo.color}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </p>
                              <div className="flex items-center space-x-1">
                                {!notification.isRead && (
                                  <button
                                    onClick={() => markAsRead(notification._id)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title="Mark as read"
                                  >
                                    <CheckIcon className="h-4 w-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNotification(notification._id)}
                                  className="text-gray-400 hover:text-red-600"
                                  title="Delete notification"
                                >
                                  <XMarkIcon className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                            
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="mt-2 flex items-center justify-between">
                              <div className="flex items-center text-xs text-gray-500">
                                <ClockIcon className="h-3 w-3 mr-1" />
                                {formatTimeAgo(notification.timestamp)}
                              </div>
                              
                              {notification.actionUrl && (
                                <a
                                  href={notification.actionUrl}
                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                                  onClick={() => setIsOpen(false)}
                                >
                                  {notification.actionText || 'View'}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {filteredNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 text-center">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default NotificationCenter;
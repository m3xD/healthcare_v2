// src/layouts/MainLayout.js (updated)
import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Drawer, Avatar, Space, Dropdown, Badge } from 'antd';
import {
  UserOutlined,
  HomeOutlined,
  HistoryOutlined,
  LogoutOutlined,
  RobotOutlined,
  MenuOutlined,
  LoginOutlined,
  UserAddOutlined,
  DashboardOutlined,
  CalendarOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  DollarOutlined,
  BellOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationService } from '../api/services/notificationService';

const { Header, Content, Footer } = Layout;

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);

  // Fetch unread notifications for the badge count
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const response = await notificationService.getUnreadNotifications();
      setNotifications(response.data);
      setNotificationCount(response.data.length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const showDrawer = () => {
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };

  const handleMenuClick = (path) => {
    navigate(path);
    setVisible(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    setVisible(false);
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotificationCount(0);
      fetchNotifications(); // Refresh notifications
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  // Menu items for sidebar/drawer
  const getMenuItems = () => {
    const baseItems = [
      {
        key: '/',
        icon: <HomeOutlined />,
        label: 'Home',
        onClick: () => handleMenuClick('/')
      },
      {
        key: '/doctors',
        icon: <TeamOutlined />,
        label: 'Find Doctors',
        onClick: () => handleMenuClick('/doctors')
      },
      {
        key: '/ai-chat',
        icon: <RobotOutlined />,
        label: 'AI Health Assistant',
        onClick: () => handleMenuClick('/ai-chat')
      }
    ];

    // Add authenticated menu items
    if (user) {
      return [
        ...baseItems,
        {
          key: '/dashboard',
          icon: <DashboardOutlined />,
          label: 'Dashboard',
          onClick: () => handleMenuClick('/dashboard')
        },
        {
          key: '/appointments',
          icon: <CalendarOutlined />,
          label: 'Appointments',
          onClick: () => handleMenuClick('/appointments')
        },
        {
          key: '/history',
          icon: <HistoryOutlined />,
          label: 'Diagnosis History',
          onClick: () => handleMenuClick('/history')
        },
        {
          key: '/profile',
          icon: <UserOutlined />,
          label: 'Profile',
          onClick: () => handleMenuClick('/profile')
        },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: 'Logout',
          onClick: handleLogout
        }
      ];
    }

    // Add non-authenticated menu items
    return [
      ...baseItems,
      {
        key: '/login',
        icon: <LoginOutlined />,
        label: 'Login',
        onClick: () => handleMenuClick('/login')
      },
      {
        key: '/register',
        icon: <UserAddOutlined />,
        label: 'Register',
        onClick: () => handleMenuClick('/register')
      }
    ];
  };

  // Notification dropdown menu
  const notificationMenu = {
    items: notifications.map((notification, index) => ({
      key: notification.id,
      label: (
        <div style={{ maxWidth: '300px' }}>
          <div style={{ fontWeight: 'bold' }}>{notification.title}</div>
          <div style={{ whiteSpace: 'normal', wordWrap: 'break-word' }}>{notification.message}</div>
        </div>
      )
    })),
    onClick: ({ key }) => {
      // Mark specific notification as read
      notificationService.markAsRead(key);

      // You could also navigate to the related item based on notification type
      // For now, just reduce the count
      setNotificationCount(prev => Math.max(0, prev - 1));
    },
    footer: (
      <div style={{ textAlign: 'center', padding: '5px 0' }}>
        <Button type="link" onClick={handleMarkAllRead}>
          Mark all as read
        </Button>
      </div>
    )
  };

  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      {/* Header for all screen sizes */}
      <Header style={{
        padding: '0 16px',
        position: 'sticky',
        top: 0,
        zIndex: 1,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center' }}>
            <RobotOutlined style={{ fontSize: '24px', color: 'white', marginRight: '10px' }} />
            <h1 style={{
              color: 'white',
              margin: 0,
              fontSize: '18px',
              display: 'none',
              '@media (min-width: 576px)': {
                display: 'block'
              }
            }}>AI Health Assistant</h1>
          </Link>
        </div>

        {/* Desktop Menu */}
        <div className="desktop-menu" style={{
          display: 'none',
          '@media (min-width: 768px)': {
            display: 'block'
          }
        }}>
          <Menu
            theme="dark"
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={getMenuItems()}
          />
        </div>

        {/* Mobile Menu Button */}
        <div className="mobile-menu" style={{
          display: 'block',
          '@media (min-width: 768px)': {
            display: 'none'
          }
        }}>
          <Button
            type="text"
            icon={<MenuOutlined style={{ color: 'white', fontSize: '20px' }} />}
            onClick={showDrawer}
          />
        </div>

        {/* User profile for desktop */}
        {user && (
          <div style={{
            display: 'none',
            '@media (min-width: 768px)': {
              display: 'flex',
              alignItems: 'center'
            },
            marginLeft: 'auto'
          }}>
            <Space>
              {/* Notifications dropdown */}
              <Dropdown
                menu={notificationMenu}
                placement="bottomRight"
                trigger={['click']}
              >
                <Badge count={notificationCount} overflowCount={9}>
                  <Button
                    type="text"
                    icon={<BellOutlined style={{ color: 'white', fontSize: '18px' }} />}
                  />
                </Badge>
              </Dropdown>

              <Avatar icon={<UserOutlined />} />
              <span style={{ color: 'white' }}>{user.username}</span>
            </Space>
          </div>
        )}
      </Header>

      {/* Drawer for mobile */}
      <Drawer
        title="Menu"
        placement="right"
        onClose={onClose}
        visible={visible}
        bodyStyle={{ padding: 0 }}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          style={{ height: '100%' }}
          items={getMenuItems()}
        />
      </Drawer>

      {/* Main content */}
      <Content style={{ padding: '16px', margin: '0 auto', maxWidth: '1200px', width: '100%' }}>
        <div className="site-layout-content" style={{ minHeight: 'calc(100vh - 134px)' }}>
          {children}
        </div>
      </Content>

      {/* Footer */}
      <Footer style={{ textAlign: 'center', padding: '12px 50px' }}>
        <div style={{ fontSize: '12px' }}>
          AI Health Assistant ©{new Date().getFullYear()} All rights reserved.
        </div>
      </Footer>
    </Layout>
  );
};

export default MainLayout;
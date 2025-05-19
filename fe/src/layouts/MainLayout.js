// src/layouts/MainLayout.js
import React, { useState } from 'react';
import { Layout, Menu, Button, Drawer, Avatar, Space } from 'antd';
import {
  UserOutlined,
  HomeOutlined,
  HistoryOutlined,
  LogoutOutlined,
  RobotOutlined,
  MenuOutlined,
  LoginOutlined,
  UserAddOutlined
} from '@ant-design/icons';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Header, Content, Footer } = Layout;

const MainLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

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

  // Menu items
  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: 'Trang chủ',
      onClick: () => handleMenuClick('/')
    }
  ];

  // Add authenticated menu items
  if (user) {
    menuItems.push(
      {
        key: '/history',
        icon: <HistoryOutlined />,
        label: 'Lịch sử',
        onClick: () => handleMenuClick('/history')
      },
      {
        key: '/profile',
        icon: <UserOutlined />,
        label: 'Hồ sơ',
        onClick: () => handleMenuClick('/profile')
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
        onClick: () => {
          logout();
          setVisible(false);
        }
      }
    );
  } else {
    menuItems.push(
      {
        key: '/login',
        icon: <LoginOutlined />,
        label: 'Đăng nhập',
        onClick: () => handleMenuClick('/login')
      },
      {
        key: '/register',
        icon: <UserAddOutlined />,
        label: 'Đăng ký',
        onClick: () => handleMenuClick('/register')
      }
    );
  }

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
            items={menuItems}
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
          items={menuItems}
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
          AI Health Assistant ©{new Date().getFullYear()} Created with Ant Design
        </div>
      </Footer>
    </Layout>
  );
};

export default MainLayout;
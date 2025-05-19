// src/pages/Login.js
import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Divider,
  Alert,
  Space
} from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const Login = () => {
  const { login, loading, error } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  const onFinish = async (values) => {
    const success = await login(values.username, values.password);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div style={{
      maxWidth: '450px',
      margin: '0 auto',
      padding: '20px 0'
    }}>
      <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2}>Đăng nhập</Title>
          <Text type="secondary">
            Đăng nhập để lưu trữ lịch sử chẩn đoán và quản lý thông tin sức khỏe của bạn
          </Text>
        </div>

        {error && (
          <Alert
            message="Lỗi đăng nhập"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        <Form
          form={form}
          name="login"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="Tên đăng nhập"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<LoginOutlined />}
              loading={loading}
              block
              size="large"
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <Divider>
          <Text type="secondary">Hoặc</Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Chưa có tài khoản?</Text>
            <Button type="default" block>
              <Link to="/register">Đăng ký ngay</Link>
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Login;
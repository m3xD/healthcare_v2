// src/pages/Register.js
import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Divider,
  Alert,
  Space,
  Row,
  Col
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  MailOutlined,
  UserAddOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

const Register = () => {
  const { register, loading, error } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const onFinish = async (values) => {
    const userData = {
      username: values.username,
      email: values.email,
      password: values.password,
      password2: values.confirm,
      first_name: values.firstName || '',
      last_name: values.lastName || ''
    };

    const success = await register(userData);
    if (success) {
      navigate('/login', {
        state: {
          message: 'Đăng ký thành công! Vui lòng đăng nhập.'
        }
      });
    }
  };

  return (
    <div style={{
      maxWidth: '600px',
      margin: '0 auto',
      padding: '20px 0'
    }}>
      <Card bordered={false} style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={2}>Đăng ký tài khoản</Title>
          <Text type="secondary">
            Tạo tài khoản để lưu trữ lịch sử chẩn đoán và quản lý thông tin sức khỏe
          </Text>
        </div>

        {error && (
          <Alert
            message="Lỗi đăng ký"
            description={error}
            type="error"
            showIcon
            style={{ marginBottom: '24px' }}
          />
        )}

        <Form
          form={form}
          name="register"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Tên đăng nhập"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Vui lòng nhập email!' },
                  { type: 'email', message: 'Email không hợp lệ!' }
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="Email"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="firstName"
                label="Tên"
              >
                <Input
                  prefix={<IdcardOutlined />}
                  placeholder="Tên"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="lastName"
                label="Họ"
              >
                <Input
                  prefix={<IdcardOutlined />}
                  placeholder="Họ"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} md={12}>
              <Form.Item
                name="password"
                label="Mật khẩu"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' },
                  { min: 8, message: 'Mật khẩu phải có ít nhất 8 ký tự!' }
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Mật khẩu"
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="confirm"
                label="Xác nhận mật khẩu"
                dependencies={['password']}
                rules={[
                  { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('password') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Hai mật khẩu không khớp!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Xác nhận mật khẩu"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<UserAddOutlined />}
              loading={loading}
              block
              size="large"
            >
              Đăng ký
            </Button>
          </Form.Item>
        </Form>

        <Divider>
          <Text type="secondary">Hoặc</Text>
        </Divider>

        <div style={{ textAlign: 'center' }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>Đã có tài khoản?</Text>
            <Button type="default" block>
              <Link to="/login">Đăng nhập ngay</Link>
            </Button>
          </Space>
        </div>
      </Card>
    </div>
  );
};

export default Register;
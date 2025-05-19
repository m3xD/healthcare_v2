// src/pages/Profile.js
import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Avatar,
  Row,
  Col,
  Upload,
  DatePicker,
  Divider,
  Alert,
  Tabs,
  Statistic,
  message
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  CalendarOutlined,
  UploadOutlined,
  EditOutlined,
  SaveOutlined,
  IdcardOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import moment from 'moment';
import { diagnosisApi } from '../api/api';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const Profile = () => {
  const { user, updateProfile, loading, error } = useAuth();
  const [form] = Form.useForm();
  const [editing, setEditing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    lastDiagnosis: null
  });
  const [recentDiagnoses, setRecentDiagnoses] = useState([]);

  useEffect(() => {
    // Lấy thống kê chẩn đoán
    const fetchStats = async () => {
      try {
        // Lấy danh sách chẩn đoán để tính toán thống kê
        const response = await diagnosisApi.getHistory();
        const diagnoses = response.data.results || [];

        setStats({
          total: diagnoses.length,
          lastDiagnosis: diagnoses.length > 0 ? diagnoses[0] : null
        });

        setRecentDiagnoses(diagnoses.slice(0, 3));
      } catch (err) {
        console.error('Error fetching diagnosis stats:', err);
      }
    };

    if (user) {
      fetchStats();

      // Điền thông tin người dùng vào form
      form.setFieldsValue({
        username: user.username,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        bio: user.profile?.bio || '',
        dateOfBirth: user.profile?.date_of_birth ? moment(user.profile.date_of_birth) : null
      });
    }
  }, [user, form]);

  const onFinish = async (values) => {
    const profileData = {
      first_name: values.firstName,
      last_name: values.lastName,
      email: values.email,
      bio: values.bio,
      date_of_birth: values.dateOfBirth ? values.dateOfBirth.format('YYYY-MM-DD') : null
    };

    const success = await updateProfile(profileData);
    if (success) {
      message.success('Hồ sơ đã được cập nhật thành công!');
      setEditing(false);
    }
  };

  const toggleEdit = () => {
    setEditing(!editing);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <Row gutter={[24, 24]}>
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Avatar
                size={100}
                icon={<UserOutlined />}
                src={user?.profile?.avatar}
              />
              <Title level={3} style={{ marginTop: '16px', marginBottom: '4px' }}>
                {user?.first_name ? `${user.first_name} ${user.last_name}` : user?.username}
              </Title>
              <Text type="secondary">{user?.email}</Text>

              {user?.profile?.bio && (
                <Paragraph style={{ marginTop: '16px', textAlign: 'left' }}>
                  {user.profile.bio}
                </Paragraph>
              )}

              <Divider />

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="Tổng chẩn đoán"
                    value={stats.total}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Ngày tham gia"
                    value={user?.date_joined ? moment(user.date_joined).format('DD/MM/YYYY') : 'N/A'}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </Col>
              </Row>
            </div>
          </Card>

          {recentDiagnoses.length > 0 && (
            <Card title="Chẩn đoán gần đây" style={{ marginTop: '24px' }}>
              {recentDiagnoses.map(diagnosis => (
                <div key={diagnosis.id} style={{ marginBottom: '16px' }}>
                  <Title level={5}>{diagnosis.disease_name}</Title>
                  <Text type="secondary">
                    {moment(diagnosis.created_at).format('DD/MM/YYYY HH:mm')}
                  </Text>
                  <div style={{ marginTop: '8px' }}>
                    {diagnosis.symptoms
                      .filter(s => s.is_present)
                      .map((s, i) => (
                        <Text key={i} type="secondary" style={{ marginRight: '8px', fontSize: '12px' }}>
                          {s.symptom_name}
                        </Text>
                      ))
                    }
                  </div>
                </div>
              ))}
            </Card>
          )}
        </Col>

        <Col xs={24} md={16}>
          <Card>
            <Tabs defaultActiveKey="profile">
              <TabPane
                tab={
                  <span><UserOutlined /> Thông tin cá nhân</span>
                }
                key="profile"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                  <Title level={4}>Thông tin cá nhân</Title>
                  <Button
                    type={editing ? "primary" : "default"}
                    icon={editing ? <SaveOutlined /> : <EditOutlined />}
                    onClick={toggleEdit}
                  >
                    {editing ? 'Lưu thông tin' : 'Chỉnh sửa'}
                  </Button>
                </div>

                {error && (
                  <Alert
                    message="Lỗi cập nhật"
                    description={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: '24px' }}
                  />
                )}

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  disabled={!editing}
                >
                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="firstName"
                        label="Tên"
                      >
                        <Input prefix={<IdcardOutlined />} placeholder="Tên" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="lastName"
                        label="Họ"
                      >
                        <Input prefix={<IdcardOutlined />} placeholder="Họ" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="username"
                        label="Tên đăng nhập"
                      >
                        <Input
                          prefix={<UserOutlined />}
                          placeholder="Tên đăng nhập"
                          disabled
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                          { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                      >
                        <Input prefix={<MailOutlined />} placeholder="Email" />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="dateOfBirth"
                        label="Ngày sinh"
                      >
                        <DatePicker
                          style={{ width: '100%' }}
                          format="DD/MM/YYYY"
                          placeholder="Chọn ngày sinh"
                        />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item
                        name="avatar"
                        label="Ảnh đại diện"
                      >
                        <Upload
                          maxCount={1}
                          listType="picture"
                          showUploadList={true}
                          beforeUpload={() => false}
                        >
                          <Button icon={<UploadOutlined />}>Tải lên ảnh</Button>
                        </Upload>
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    name="bio"
                    label="Giới thiệu"
                  >
                    <Input.TextArea
                      rows={4}
                      placeholder="Giới thiệu ngắn về bạn"
                    />
                  </Form.Item>

                  {editing && (
                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                      >
                        Cập nhật thông tin
                      </Button>
                    </Form.Item>
                  )}
                </Form>
              </TabPane>

              <TabPane
                tab={
                  <span><CalendarOutlined /> Lịch sử chẩn đoán</span>
                }
                key="history"
              >
                <div style={{ textAlign: 'center', padding: '20px' }}>
                  <Title level={4}>Lịch sử chẩn đoán</Title>
                  <Button type="primary" href="/history">
                    Xem toàn bộ lịch sử chẩn đoán
                  </Button>
                </div>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Profile;
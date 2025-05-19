// src/components/dashboard/PatientDashboard.js
import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Typography, List, Calendar, Badge, Space, Tag, Button, Skeleton } from 'antd';
import { CalendarOutlined, MedicineBoxOutlined, ExperimentOutlined, DollarOutlined, HeartOutlined, FileTextOutlined, BellOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../../api/services/appointmentService';
import { pharmacyService } from '../../api/services/pharmacyService';
import { laboratoryService } from '../../api/services/laboratoryService';
import { billingService } from '../../api/services/billingService';
import { notificationService } from '../../api/services/notificationService';
import moment from 'moment';

const { Title, Text } = Typography;

const PatientDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    upcomingAppointments: [],
    recentPrescriptions: [],
    recentLabResults: [],
    pendingBills: [],
    notifications: []
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch data in parallel
        const [
          appointmentsResponse,
          prescriptionsResponse,
          labRequestsResponse,
          billsResponse,
          notificationsResponse
        ] = await Promise.all([
          appointmentService.getUpcomingAppointments(),
          pharmacyService.getPrescriptions(),
          laboratoryService.getLabRequests(),
          billingService.getBills(),
          notificationService.getUnreadNotifications()
        ]);

        // Set dashboard data
        setDashboardData({
          upcomingAppointments: appointmentsResponse.data.slice(0, 3),
         recentPrescriptions: prescriptionsResponse.data.slice(0, 3),
          recentLabResults: labRequestsResponse.data.filter(r => r.status === 'completed').slice(0, 3),
          pendingBills: billsResponse.data.filter(b => b.status === 'pending').slice(0, 3),
          notifications: notificationsResponse.data.slice(0, 5)
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getCardContent = () => {
    if (loading) {
      return (
        <Skeleton active paragraph={{ rows: 3 }} />
      );
    }

    return (
      <>
        {/* Statistics Row */}
        <Row gutter={16} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Upcoming Appointments"
                value={dashboardData.upcomingAppointments.length}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Active Prescriptions"
                value={dashboardData.recentPrescriptions.filter(p => p.status === 'pending').length}
                prefix={<MedicineBoxOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Lab Results Ready"
                value={dashboardData.recentLabResults.length}
                prefix={<ExperimentOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Bills Due"
                value={dashboardData.pendingBills.length}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
        </Row>

        {/* Main Dashboard Content */}
        <Row gutter={24}>
          {/* Left Column */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <CalendarOutlined />
                  <span>Upcoming Appointments</span>
                </Space>
              }
              extra={<Button type="link" onClick={() => navigate('/appointments')}>View All</Button>}
              style={{ marginBottom: '24px' }}
            >
              {dashboardData.upcomingAppointments.length > 0 ? (
                <List
                  dataSource={dashboardData.upcomingAppointments}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Button type="link" onClick={() => navigate(`/appointments/${item.id}`)}>View</Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={`Dr. ${item.doctor_details.user.first_name} ${item.doctor_details.user.last_name}`}
                        description={
                          <Space direction="vertical">
                            <Text>{moment(item.appointment_date).format('MMM D, YYYY')} | {moment(item.start_time, 'HH:mm:ss').format('h:mm A')}</Text>
                            <Text type="secondary">{item.reason}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Text type="secondary">No upcoming appointments</Text>
              )}
            </Card>

            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Card
                  title={
                    <Space>
                      <MedicineBoxOutlined />
                      <span>Recent Prescriptions</span>
                    </Space>
                  }
                  extra={<Button type="link" onClick={() => navigate('/prescriptions')}>View All</Button>}
                  style={{ marginBottom: '24px' }}
                >
                  {dashboardData.recentPrescriptions.length > 0 ? (
                    <List
                      dataSource={dashboardData.recentPrescriptions}
                      renderItem={item => (
                        <List.Item>
                          <List.Item.Meta
                            title={
                              <Space>
                                <Text>{item.doctor_name}</Text>
                                <Tag color={item.status === 'filled' ? 'green' : 'blue'}>
                                  {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                                </Tag>
                              </Space>
                            }
                            description={
                              <Text>{moment(item.issue_date).format('MMM D, YYYY')}</Text>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Text type="secondary">No recent prescriptions</Text>
                  )}
                </Card>
              </Col>

              <Col xs={24} md={12}>
                <Card
                  title={
                    <Space>
                      <ExperimentOutlined />
                      <span>Lab Results</span>
                    </Space>
                  }
                  extra={<Button type="link" onClick={() => navigate('/lab-results')}>View All</Button>}
                  style={{ marginBottom: '24px' }}
                >
                  {dashboardData.recentLabResults.length > 0 ? (
                    <List
                      dataSource={dashboardData.recentLabResults}
                      renderItem={item => (
                        <List.Item>
                          <List.Item.Meta
                            title={
                              <Text>Test Request #{item.id}</Text>
                            }
                            description={
                              <Space direction="vertical">
                                <Text>{moment(item.request_date).format('MMM D, YYYY')}</Text>
                                <Tag color="green">Results Available</Tag>
                              </Space>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Text type="secondary">No recent lab results</Text>
                  )}
                </Card>
              </Col>
            </Row>
          </Col>

          {/* Right Column */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <BellOutlined />
                  <span>Notifications</span>
                </Space>
              }
              extra={<Button type="link" onClick={() => navigate('/notifications')}>View All</Button>}
              style={{ marginBottom: '24px' }}
            >
              {dashboardData.notifications.length > 0 ? (
                <List
                  dataSource={dashboardData.notifications}
                  renderItem={item => (
                    <List.Item>
                      <List.Item.Meta
                        title={item.title}
                        description={
                          <Space direction="vertical">
                            <Text type="secondary">{moment(item.created_at).fromNow()}</Text>
                            <Text>{item.message}</Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Text type="secondary">No new notifications</Text>
              )}
            </Card>

            <Card
              title={
                <Space>
                  <DollarOutlined />
                  <span>Pending Bills</span>
                </Space>
              }
              extra={<Button type="link" onClick={() => navigate('/billing')}>View All</Button>}
              style={{ marginBottom: '24px' }}
            >
              {dashboardData.pendingBills.length > 0 ? (
                <List
                  dataSource={dashboardData.pendingBills}
                  renderItem={item => (
                    <List.Item
                      actions={[
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => navigate(`/billing/${item.id}`)}
                        >
                          Pay
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text>Bill #{item.id}</Text>
                            <Tag color="red">Due: {moment(item.due_date).format('MMM D')}</Tag>
                          </Space>
                        }
                        description={
                          <Text>${item.total_amount.toFixed(2)}</Text>
                        }
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Text type="secondary">No pending bills</Text>
              )}
            </Card>

            <Card
              title={
                <Space>
                  <HeartOutlined />
                  <span>Health Tips</span>
                </Space>
              }
            >
              <List
                dataSource={[
                  "Stay hydrated: Drink at least 8 glasses of water daily",
                  "Regular exercise: Aim for 30 minutes of moderate activity most days",
                  "Sleep well: Adults need 7-9 hours of quality sleep each night",
                  "Balanced diet: Include plenty of fruits, vegetables, and whole grains"
                ]}
                renderItem={item => (
                  <List.Item>
                    <Text>{item}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <HeartOutlined /> My Health Dashboard
      </Title>

      {getCardContent()}
    </Space>
  );
};

export default PatientDashboard;
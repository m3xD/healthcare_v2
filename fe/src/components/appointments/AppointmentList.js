// src/components/appointments/AppointmentList.js
import React, { useState, useEffect } from 'react';
import { List, Card, Tag, Button, Typography, Space, Tabs, Avatar, Empty, Skeleton, Badge, Calendar } from 'antd';
import { ScheduleOutlined, EditOutlined, DeleteOutlined, UserOutlined, ClockCircleOutlined, EyeOutlined, CalendarOutlined, FilterOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { appointmentService } from '../../api/services/appointmentService';
import moment from 'moment';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const AppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('upcoming');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const navigate = useNavigate();

  useEffect(() => {
    fetchAppointments();
  }, [selectedTab]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      let response;

      if (selectedTab === 'upcoming') {
        response = await appointmentService.getUpcomingAppointments();
      } else {
        response = await appointmentService.getAppointments();
      }

      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAppointment = (id) => {
    navigate(`/appointments/${id}`);
  };

  const handleCancelAppointment = async (id) => {
    try {
      await appointmentService.cancelAppointment(id);
      fetchAppointments(); // Refresh the list
    } catch (error) {
      console.error('Error cancelling appointment:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'blue';
      case 'completed':
        return 'green';
      case 'cancelled':
        return 'red';
      case 'no_show':
        return 'orange';
      default:
        return 'default';
    }
  };

  const renderCalendarAppointments = () => {
    const dateCellRender = (value) => {
      const dateStr = value.format('YYYY-MM-DD');
      const dateAppointments = appointments.filter(
        appointment => appointment.appointment_date === dateStr
      );

      return (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {dateAppointments.map(appointment => (
            <li key={appointment.id}>
              <Badge
                status={getStatusColor(appointment.status) === 'green' ? 'success' :
                       getStatusColor(appointment.status) === 'red' ? 'error' : 'processing'}
                text={`${moment(appointment.start_time, 'HH:mm:ss').format('HH:mm')} - Dr. ${appointment.doctor_details.user.last_name}`}
                onClick={() => handleViewAppointment(appointment.id)}
                style={{ cursor: 'pointer' }}
              />
            </li>
          ))}
        </ul>
      );
    };

    return (
      <Calendar
        dateCellRender={dateCellRender}
        style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}
      />
    );
  };

  const renderAppointmentList = () => {
    if (loading) {
      return (
        <Card>
          <Skeleton active avatar paragraph={{ rows: 4 }} />
        </Card>
      );
    }

    if (appointments.length === 0) {
      return (
        <Empty
          description={
            selectedTab === 'upcoming'
              ? "You don't have any upcoming appointments"
              : "No appointments found"
          }
        />
      );
    }

    return (
      <List
        dataSource={appointments}
        renderItem={appointment => (
          <List.Item
            actions={[
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => handleViewAppointment(appointment.id)}
              >
                View
              </Button>,
              appointment.status === 'scheduled' && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleCancelAppointment(appointment.id)}
                >
                  Cancel
                </Button>
              )
            ].filter(Boolean)}
          >
            <List.Item.Meta
              avatar={
                <Avatar icon={<UserOutlined />} />
              }
              title={
                <Space>
                  <Text strong>Dr. {appointment.doctor_details.user.first_name} {appointment.doctor_details.user.last_name}</Text>
                  <Tag color={getStatusColor(appointment.status)}>
                    {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                  </Tag>
                </Space>
              }
              description={
                <Space direction="vertical" size="small">
                  <Text><CalendarOutlined /> {moment(appointment.appointment_date).format('MMMM D, YYYY')}</Text>
                  <Text><ClockCircleOutlined /> {moment(appointment.start_time, 'HH:mm:ss').format('h:mm A')} - {moment(appointment.end_time, 'HH:mm:ss').format('h:mm A')}</Text>
                  <Text type="secondary">{appointment.reason}</Text>
                </Space>
              }
            />
          </List.Item>
        )}
      />
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>
          <ScheduleOutlined /> My Appointments
        </Title>

        <Space>
          <Button
            icon={viewMode === 'list' ? <CalendarOutlined /> : <UnorderedListOutlined />}
            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
          >
            {viewMode === 'list' ? 'Calendar View' : 'List View'}
          </Button>

          <Button
            type="primary"
            icon={<ScheduleOutlined />}
            onClick={() => navigate('/appointments/new')}
          >
            Book Appointment
          </Button>
        </Space>
      </div>

      <Tabs
        activeKey={selectedTab}
        onChange={setSelectedTab}
      >
        <TabPane tab="Upcoming Appointments" key="upcoming" />
        <TabPane tab="All Appointments" key="all" />
      </Tabs>

      {viewMode === 'calendar' ? renderCalendarAppointments() : renderAppointmentList()}
    </Space>
  );
};

export default AppointmentList;
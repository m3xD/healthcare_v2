// src/components/appointments/AppointmentDetail.js
import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Badge, Button, Typography, Space, Divider, Tag, Timeline, Input, Form, List, Skeleton, Empty, Modal, message } from 'antd';
import { ScheduleOutlined, CalendarOutlined, ClockCircleOutlined, UserOutlined, PhoneOutlined, MailOutlined, CommentOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentService } from '../../api/services/appointmentService';
import moment from 'moment';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { confirm } = Modal;

const AppointmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchAppointment();
  }, [id]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await appointmentService.getAppointmentById(id);
      setAppointment(response.data);
    } catch (error) {
      console.error('Error fetching appointment details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = () => {
    confirm({
      title: 'Are you sure you want to cancel this appointment?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes, Cancel',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          await appointmentService.cancelAppointment(id);
          message.success('Appointment cancelled successfully');
          fetchAppointment(); // Refresh the data
        } catch (error) {
          console.error('Error cancelling appointment:', error);
          message.error('Failed to cancel appointment');
        }
      }
    });
  };

  const handleAddNote = async () => {
    try {
      setAddingNote(true);
      await appointmentService.addNote(id, noteContent);
      setNoteContent('');
      fetchAppointment(); // Refresh to show the new note
      message.success('Note added successfully');
    } catch (error) {
      console.error('Error adding note:', error);
      message.error('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled':
        return <Badge status="processing" text="Scheduled" />;
      case 'completed':
        return <Badge status="success" text="Completed" />;
      case 'cancelled':
        return <Badge status="error" text="Cancelled" />;
      case 'no_show':
        return <Badge status="warning" text="No Show" />;
      default:
        return <Badge status="default" text={status} />;
    }
  };

  if (loading) {
    return (
      <Card>
        <Skeleton active avatar paragraph={{ rows: 6 }} />
      </Card>
    );
  }

  if (!appointment) {
    return (
      <Empty description="Appointment not found" />
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>
          <ScheduleOutlined /> Appointment Details
        </Title>

        <Space>
          {appointment.status === 'scheduled' && (
            <>
              <Button
                icon={<EditOutlined />}
                onClick={() => navigate(`/appointments/edit/${id}`)}
              >
                Reschedule
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={handleCancelAppointment}
              >
                Cancel
              </Button>
            </>
          )}
        </Space>
      </div>

      <Card>
        <Descriptions title="Appointment Information" bordered>
          <Descriptions.Item label="Status" span={3}>
            {getStatusBadge(appointment.status)}
          </Descriptions.Item>
          <Descriptions.Item label="Date" span={1}>
            {moment(appointment.appointment_date).format('MMMM D, YYYY')}
          </Descriptions.Item>
          <Descriptions.Item label="Time" span={2}>
            {moment(appointment.start_time, 'HH:mm:ss').format('h:mm A')} - {moment(appointment.end_time, 'HH:mm:ss').format('h:mm A')}
          </Descriptions.Item>
          <Descriptions.Item label="Doctor" span={3}>
            <Space>
              <UserOutlined />
              Dr. {appointment.doctor_details.user.first_name} {appointment.doctor_details.user.last_name}
              <Tag color="blue">{appointment.doctor_details.specialization}</Tag>
            </Space>
          </Descriptions.Item>
          <Descriptions.Item label="Reason for Visit" span={3}>
            {appointment.reason}
          </Descriptions.Item>
          <Descriptions.Item label="Notes" span={3}>
            {appointment.notes || "No additional notes"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Appointment Notes">
        {appointment.notes && appointment.notes.length > 0 ? (
          <Timeline>
            {appointment.notes.map(note => (
              <Timeline.Item key={note.id}>
                <div style={{ backgroundColor: note.is_private ? '#fffbe6' : '#f0f2f5', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <Text strong>{note.created_by_name}</Text>
                    <Text type="secondary" style={{ marginLeft: '10px' }}>
                      {moment(note.created_at).format('MMM D, YYYY h:mm A')}
                    </Text>
                    {note.is_private && (
                      <Tag color="orange" style={{ marginLeft: '10px' }}>Private</Tag>
                    )}
                  </div>
                  <Paragraph>{note.content}</Paragraph>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        ) : (
          <Empty description="No notes yet" />
        )}

        <Divider />

        <Form form={form}>
          <Form.Item>
            <TextArea
              rows={4}
              placeholder="Add a note..."
              value={noteContent}
              onChange={e => setNoteContent(e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              icon={<CommentOutlined />}
              onClick={handleAddNote}
              loading={addingNote}
              disabled={!noteContent.trim()}
            >
              Add Note
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
};

export default AppointmentDetail;
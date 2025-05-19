// src/components/doctors/DoctorDetail.js
import React, {useState, useEffect} from 'react';
import {Card, Descriptions, Tabs, Calendar, Button, Typography, Space, Avatar, Tag, List, Empty, Skeleton} from 'antd';
import {
    UserOutlined,
    CalendarOutlined,
    MailOutlined,
    PhoneOutlined,
    BookOutlined,
    ScheduleOutlined
} from '@ant-design/icons';
import {useParams, useNavigate} from 'react-router-dom';
import {doctorService} from '../../api/services/doctorService';
import moment from 'moment';

const {Title, Text, Paragraph} = Typography;
const {TabPane} = Tabs;

const DoctorDetail = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [doctor, setDoctor] = useState(null);
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(moment());
    const [availableSlots, setAvailableSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);

// src/components/doctors/DoctorDetail.js
// Trong đoạn code lấy thông tin doctor

    useEffect(() => {
        const fetchDoctorData = async () => {
            try {
                setLoading(true);
                const doctorResponse = await doctorService.getDoctorById(id);
                setDoctor(doctorResponse.data);

                // Không cần gọi API riêng cho schedules vì đã có trong doctor data
                const scheduleData = doctorResponse.data.schedules || [];
                setSchedule(scheduleData);

                // Fetch available slots for current date
                await fetchAvailableSlots(moment().format('YYYY-MM-DD'));
            } catch (error) {
                console.error('Error fetching doctor details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDoctorData();
    }, [id]);

    const fetchAvailableSlots = async (date) => {
        try {
            setLoadingSlots(true);
            const response = await doctorService.getAvailableSlots(id, date);
            setAvailableSlots(response.data.available_slots || []);
        } catch (error) {
            console.error('Error fetching available slots:', error);
            setAvailableSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    };

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        fetchAvailableSlots(date.format('YYYY-MM-DD'));
    };

    const handleBookAppointment = (slot) => {
        navigate('/appointments/new', {
            state: {
                doctorId: id,
                date: selectedDate.format('YYYY-MM-DD'),
                slot
            }
        });
    };

    if (loading) {
        return (
            <Card>
                <Skeleton active avatar paragraph={{rows: 10}}/>
            </Card>
        );
    }

    if (!doctor) {
        return (
            <Empty description="Doctor not found"/>
        );
    }

    // Format working days for display
    const workingDays = schedule.map(s => {
        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        return `${dayNames[s.day_of_week]}: ${s.start_time} - ${s.end_time}`;
    }).join(', ');

    return (
        <Space direction="vertical" size="large" style={{width: '100%'}}>
            <Card>
                <Space align="start" size="large">
                    <Avatar
                        size={120}
                        src={doctor.profile_image}
                        icon={<UserOutlined/>}
                    />

                    <Space direction="vertical" size="small">
                        <Title level={2}>Dr. {doctor.user.first_name} {doctor.user.last_name}</Title>
                        <Space size="middle">
                            <Tag color="blue" icon={<UserOutlined/>}>{doctor.specialization}</Tag>
                            <Text type="secondary">{doctor.experience_years} years experience</Text>
                        </Space>

                        <Paragraph>{doctor.education}</Paragraph>

                        <Space size="middle">
                            <Button
                                type="primary"
                                icon={<CalendarOutlined/>}
                                onClick={() => navigate(`/appointments/new?doctor=${id}`)}
                            >
                                Book Appointment
                            </Button>
                            <Button icon={<MailOutlined/>}>
                                Send Message
                            </Button>
                        </Space>
                    </Space>
                </Space>
            </Card>
            <Tabs defaultActiveKey="about">
                <TabPane tab="About" key="about">
                    <Card>
                        <Descriptions title="Doctor Information" bordered>
                            <Descriptions.Item label="Full Name"
                                               span={3}>Dr. {doctor.user.first_name} {doctor.user.last_name}</Descriptions.Item>
                            <Descriptions.Item label="Specialization"
                                               span={2}>{doctor.specialization}</Descriptions.Item>
                            <Descriptions.Item label="Experience">{doctor.experience_years} years</Descriptions.Item>
                            <Descriptions.Item label="License Number">{doctor.license_number}</Descriptions.Item>
                            <Descriptions.Item label="Status" span={2}>
                                {doctor.available_for_appointment ?
                                    <Tag color="green">Available for Appointments</Tag> :
                                    <Tag color="red">Not Available</Tag>
                                }
                            </Descriptions.Item>
                            <Descriptions.Item label="Working Hours" span={3}>{workingDays}</Descriptions.Item>
                            <Descriptions.Item label="Education" span={3}>{doctor.education}</Descriptions.Item>
                        </Descriptions>
                    </Card>
                </TabPane>

                <TabPane tab="Schedule" key="schedule">
                    <Card>
                        <Space direction="vertical" style={{width: '100%'}}>
                            <Title level={4}>Book an Appointment</Title>
                            <Paragraph>Select a date to see available slots</Paragraph>

                            <div style={{display: 'flex', flexDirection: 'row', gap: '20px'}}>
                                <div style={{flex: 1}}>
                                    <Calendar
                                        fullscreen={false}
                                        value={selectedDate}
                                        onSelect={handleDateSelect}
                                        disabledDate={(current) => {
                                            // Disable past dates and dates beyond 30 days
                                            return current && (current < moment().startOf('day') ||
                                                current > moment().add(30, 'days'));
                                        }}
                                    />
                                </div>

                                <div style={{flex: 1}}>
                                    <Card title={`Available Slots for ${selectedDate.format('MMMM D, YYYY')}`}>
                                        {loadingSlots ? (
                                            <Skeleton active paragraph={{rows: 3}}/>
                                        ) : availableSlots.length > 0 ? (
                                            <List
                                                size="small"
                                                dataSource={availableSlots}
                                                renderItem={slot => (
                                                    <List.Item
                                                        actions={[
                                                            <Button
                                                                type="primary"
                                                                size="small"
                                                                onClick={() => handleBookAppointment(slot)}
                                                            >
                                                                Book
                                                            </Button>
                                                        ]}
                                                    >
                                                        <List.Item.Meta
                                                            avatar={<ScheduleOutlined/>}
                                                            title={`${slot.start_time} - ${slot.end_time}`}
                                                        />
                                                    </List.Item>
                                                )}
                                            />
                                        ) : (
                                            <Empty description="No available slots for this date"/>
                                        )}
                                    </Card>
                                </div>
                            </div>
                        </Space>
                    </Card>
                </TabPane>
            </Tabs>
        </Space>
    );
};

export default DoctorDetail;
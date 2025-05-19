// src/components/appointments/AppointmentForm.js
import React, { useState, useEffect } from 'react';
import { Form, Input, Select, DatePicker, TimePicker, Button, Card, Typography, message, Space, Spin } from 'antd';
import { ScheduleOutlined, UserOutlined, MedicineBoxOutlined, CommentOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { doctorService } from '../../api/services/doctorService';
import { appointmentService } from '../../api/services/appointmentService';
import moment from 'moment';
import {useAuth} from "../../context/AuthContext";

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TextArea } = Input;


const AppointmentForm = () => {
   const { user } = useAuth(); //

  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Get pre-selected doctor and date from location state (if coming from doctor detail)
  const preSelectedDoctor = location.state?.doctorId;
  const preSelectedDate = location.state?.date ? moment(location.state.date) : null;
  const preSelectedSlot = location.state?.slot;

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        console.log(user)
        setLoading(true);
        const response = await doctorService.getDoctors();
        console.log("Doctors API Response:", response); // Debug log

        // Xử lý đúng cấu trúc response API (có phân trang)
        const doctorsData = response.data.results || [];

        // Chỉ lấy bác sĩ có available_for_appointment = true
        const availableDoctors = doctorsData.filter(doctor => doctor.available_for_appointment);
        setDoctors(availableDoctors);

        // Nếu có preSelectedDoctor, tìm và set selected doctor
        if (preSelectedDoctor) {
          const selected = availableDoctors.find(doc => doc.id === parseInt(preSelectedDoctor));
          if (selected) {
            setSelectedDoctor(selected);
            form.setFieldsValue({ doctor: selected.id });
          }
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        message.error('Failed to load doctors');
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();

    // Set initial form values if provided
    if (preSelectedDate) {
      form.setFieldsValue({ appointment_date: preSelectedDate });
      if (preSelectedDoctor) {
        fetchAvailableSlots(preSelectedDoctor, preSelectedDate);
      }
    }

    if (preSelectedSlot) {
      form.setFieldsValue({
        start_time: moment(preSelectedSlot.start_time, 'HH:mm:ss'),
        end_time: moment(preSelectedSlot.end_time, 'HH:mm:ss')
      });
    }
  }, [form, preSelectedDoctor, preSelectedDate, preSelectedSlot]);

  const fetchAvailableSlots = async (doctorId, date) => {
    if (!doctorId || !date) return;

    try {
      setLoadingSlots(true);
      const formattedDate = date.format('YYYY-MM-DD');
      const response = await doctorService.getAvailableSlots(doctorId, formattedDate);

      // Mock data for available slots (vì endpoint available_slots có thể chưa triển khai)
      // Trong thực tế, bạn sẽ sử dụng dữ liệu từ response

      // Nếu API trả về dữ liệu slots
      if (response.data && Array.isArray(response.data.available_slots)) {
        setAvailableSlots(response.data.available_slots);
      } else {
        // Tạo slots dựa trên lịch làm việc của bác sĩ
        const selectedDoc = doctors.find(d => d.id === parseInt(doctorId));

        if (selectedDoc && selectedDoc.schedules) {
          const dayOfWeek = date.day(); // 0 = Sunday, 1 = Monday, ...
          // Điều chỉnh cho lịch làm việc: 0 = Monday, ..., 6 = Sunday
          const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

          // Tìm lịch làm việc cho ngày đã chọn
          const daySchedule = selectedDoc.schedules.find(s => s.day_of_week === adjustedDayOfWeek);

          if (daySchedule) {
            // Tạo các slot 1 giờ từ giờ bắt đầu đến giờ kết thúc
            const startTime = moment(daySchedule.start_time, 'HH:mm:ss');
            const endTime = moment(daySchedule.end_time, 'HH:mm:ss');

            const slots = [];
            let currentSlot = startTime.clone();

            while (currentSlot.isBefore(endTime)) {
              const slotEndTime = currentSlot.clone().add(1, 'hour');
              if (slotEndTime.isAfter(endTime)) break;

              slots.push({
                start_time: currentSlot.format('HH:mm:ss'),
                end_time: slotEndTime.format('HH:mm:ss')
              });

              currentSlot = slotEndTime;
            }

            setAvailableSlots(slots);
          } else {
            setAvailableSlots([]);
            message.info('Doctor does not work on this day');
          }
        } else {
          setAvailableSlots([]);
        }
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      message.error('Failed to load available time slots');
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDoctorChange = (value) => {
    const doctorId = parseInt(value);
    const selected = doctors.find(d => d.id === doctorId);
    setSelectedDoctor(selected);

    const date = form.getFieldValue('appointment_date');
    if (date) {
      fetchAvailableSlots(doctorId, date);
    }
  };

  const handleDateChange = (date) => {
    const doctorId = form.getFieldValue('doctor');
    if (doctorId) {
      fetchAvailableSlots(doctorId, date);
    }
  };

  const handleSlotSelect = (slot) => {
    form.setFieldsValue({
      start_time: moment(slot.start_time, 'HH:mm:ss'),
      end_time: moment(slot.end_time, 'HH:mm:ss')
    });
  };

  const onFinish = async (values) => {
    try {
      setSubmitting(true);

      if (!user || !user.id) {
        message.error('You must be logged in to book an appointment');
        navigate('/login', { state: { from: location } });
        return;
      }

      const appointmentData = {
        doctor: values.doctor,
        patient: user.id, // Sử dụng ID của user đang đăng nhập
        appointment_date: values.appointment_date.format('YYYY-MM-DD'),
        start_time: values.start_time.format('HH:mm:ss'),
        end_time: values.end_time.format('HH:mm:ss'),
        reason: values.reason,
        notes: values.notes || ""
      };

      await appointmentService.createAppointment(appointmentData);

      message.success('Appointment booked successfully!');
      navigate('/appointments');
    } catch (error) {
      console.error('Error booking appointment:', error);
      message.error('Failed to book appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if a date is a working day for the selected doctor
  const isWorkingDay = (date) => {
    if (!selectedDoctor || !selectedDoctor.schedules || selectedDoctor.schedules.length === 0) {
      return false;
    }

    // Get day of week (0 = Sunday, 1 = Monday, ...)
    const dayOfWeek = date.day();
    // Adjust for schedule day format (0 = Monday, ..., 6 = Sunday)
    const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    // Check if the doctor works on this day
    return selectedDoctor.schedules.some(schedule => schedule.day_of_week === adjustedDayOfWeek);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Loading doctors..." />
      </div>
    );
  }

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <ScheduleOutlined /> Book an Appointment
      </Title>

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            appointment_date: preSelectedDate,
            doctor: preSelectedDoctor
          }}
        >
          <Form.Item
            name="doctor"
            label="Select Doctor"
            rules={[{ required: true, message: 'Please select a doctor' }]}
          >
            <Select
              placeholder="Select a doctor"
              onChange={handleDoctorChange}
              loading={loading}
              disabled={submitting}
            >
              {doctors.map(doctor => (
                <Option key={doctor.id} value={doctor.id}>
                  Dr. {doctor.user.first_name} {doctor.user.last_name} - {doctor.specialization}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="appointment_date"
            label="Select Date"
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              onChange={handleDateChange}
              disabledDate={(current) => {
                // Disable past dates, dates beyond 30 days, and non-working days
                const isPastDate = current && current < moment().startOf('day');
                const isFutureDate = current && current > moment().add(30, 'days');
                const isNonWorkingDay = selectedDoctor && !isWorkingDay(current);

                return isPastDate || isFutureDate || isNonWorkingDay;
              }}
              disabled={submitting}
            />
          </Form.Item>

          <Form.Item label="Available Slots">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
              {loadingSlots ? (
                <Spin size="small" />
              ) : availableSlots.length > 0 ? (
                availableSlots.map((slot, index) => (
                  <Button
                    key={index}
                    onClick={() => handleSlotSelect(slot)}
                    style={{ margin: '5px' }}
                  >
                    {moment(slot.start_time, 'HH:mm:ss').format('h:mm A')} - {moment(slot.end_time, 'HH:mm:ss').format('h:mm A')}
                  </Button>
                ))
              ) : (
                <Text type="secondary">No available slots for selected date</Text>
              )}
            </div>
          </Form.Item>

          <Form.Item
            name="start_time"
            label="Start Time"
            rules={[{ required: true, message: 'Please select a start time' }]}
          >
            <TimePicker
              format="HH:mm"
              style={{ width: '100%' }}
              disabled={submitting}
            />
          </Form.Item>

          <Form.Item
            name="end_time"
            label="End Time"
            rules={[{ required: true, message: 'Please select an end time' }]}
          >
            <TimePicker
              format="HH:mm"
              style={{ width: '100%' }}
              disabled={submitting}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label="Reason for Visit"
            rules={[{ required: true, message: 'Please provide a reason for your visit' }]}
          >
            <TextArea
              rows={3}
              placeholder="Describe the reason for your appointment"
              disabled={submitting}
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="Additional Notes"
          >
            <TextArea
              rows={3}
              placeholder="Any additional information for the doctor"
              disabled={submitting}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<ScheduleOutlined />}
              loading={submitting}
              block
            >
              Book Appointment
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );
};

export default AppointmentForm;
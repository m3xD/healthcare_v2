// src/components/doctors/DoctorList.js
import React, { useState, useEffect } from 'react';
import { Card, List, Avatar, Tag, Input, Select, Button, Typography, Space, Spin } from 'antd';
import { UserOutlined, MedicineBoxOutlined, FilterOutlined, SearchOutlined } from '@ant-design/icons';
import { doctorService } from '../../api/services/doctorService';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;

const DoctorList = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [specializations, setSpecializations] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const response = await doctorService.getDoctors();
        console.log("API Response:", response); // Debug log

        // Xử lý đúng cấu trúc response API (có phân trang)
        const doctorsData = response.data.results || [];
        setDoctors(doctorsData);

        // Extract unique specializations from the fetched doctors
        if (doctorsData.length > 0) {
          const specs = [...new Set(doctorsData.map(doc => doc.specialization))];
          setSpecializations(specs);
        }
      } catch (error) {
        console.error('Error fetching doctors:', error);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  const filteredDoctors = doctors.filter(doctor => {
    const nameMatch = `${doctor.user?.first_name || ''} ${doctor.user?.last_name || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const specializationMatch = specialization ? doctor.specialization === specialization : true;
    return nameMatch && specializationMatch;
  });

  const handleDoctorClick = (doctorId) => {
    navigate(`/doctors/${doctorId}`);
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
        <MedicineBoxOutlined /> Find a Doctor
      </Title>

      {/* Search and Filters */}
      <Card>
        <Space direction="horizontal" size="middle" style={{ width: '100%', marginBottom: '20px' }}>
          <Input
            placeholder="Search doctors by name"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            prefix={<SearchOutlined />}
            style={{ width: '300px' }}
          />

          <Select
            placeholder="Filter by Specialization"
            style={{ width: '250px' }}
            value={specialization}
            onChange={setSpecialization}
            allowClear
          >
            {specializations.map(spec => (
              <Option key={spec} value={spec}>{spec}</Option>
            ))}
          </Select>

          <Button
            icon={<FilterOutlined />}
            onClick={() => {
              setSearchTerm('');
              setSpecialization('');
            }}
          >
            Clear Filters
          </Button>
        </Space>
      </Card>

      {/* Doctor List */}
      {doctors.length === 0 ? (
        <Card>
          <Text>No doctors found. Please check your backend API.</Text>
        </Card>
      ) : (
        <List
          grid={{
            gutter: 16,
            xs: 1,
            sm: 1,
            md: 2,
            lg: 3,
            xl: 3,
            xxl: 4,
          }}
          dataSource={filteredDoctors}
          renderItem={doctor => (
            <List.Item>
              <Card
                hoverable
                onClick={() => handleDoctorClick(doctor.id)}
                cover={
                  <div style={{ padding: '20px', textAlign: 'center' }}>
                    <Avatar
                      size={100}
                      src={doctor.profile_image}
                      icon={<UserOutlined />}
                    />
                  </div>
                }
              >
                <Card.Meta
                  title={
                    <Text strong>Dr. {doctor.user?.first_name} {doctor.user?.last_name}</Text>
                  }
                  description={
                    <Space direction="vertical" size="small">
                      <Tag color="blue">{doctor.specialization}</Tag>
                      <Text>{doctor.experience_years} years experience</Text>
                      {doctor.available_for_appointment ? (
                        <Tag color="green">Available for Appointment</Tag>
                      ) : (
                        <Tag color="red">Not Available</Tag>
                      )}
                      <Button type="primary" size="small" style={{ marginTop: '10px' }}>
                        View Profile
                      </Button>
                    </Space>
                  }
                />
              </Card>
            </List.Item>
          )}
        />
      )}
    </Space>
  );
};

export default DoctorList;
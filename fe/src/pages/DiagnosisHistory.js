// src/pages/DiagnosisHistory.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  List,
  Button,
  Tag,
  Skeleton,
  Empty,
  Pagination,
  Space,
  Row,
  Col,
  Statistic,
  Alert
} from 'antd';
import {
  HistoryOutlined,
  MedicineBoxOutlined,
  ClockCircleOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { diagnosisApi } from '../api/api';
import moment from 'moment';

const { Title, Text } = Typography;

const DiagnosisHistory = () => {
  const [loading, setLoading] = useState(true);
  const [diagnoses, setDiagnoses] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    total: 0
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchDiagnoses = async (page = 1) => {
    setLoading(true);
    try {
      const response = await diagnosisApi.getHistory(`?page=${page}`);
      setDiagnoses(response.data.results || []);
      setPagination({
        ...pagination,
        current: page,
        total: response.data.count || 0
      });
    } catch (err) {
      console.error('Error fetching diagnosis history:', err);
      setError('Không thể tải lịch sử chẩn đoán. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnoses();
  }, []);

  const handlePageChange = (page) => {
    fetchDiagnoses(page);
  };

  const viewDetails = (id) => {
    navigate(`/history/${id}`);
  };

  // Tính toán thống kê
  const stats = {
    total: pagination.total,
    mostCommon: diagnoses.length > 0
      ? Object.entries(
          diagnoses.reduce((acc, diagnosis) => {
            const disease = diagnosis.disease_name;
            acc[disease] = (acc[disease] || 0) + 1;
            return acc;
          }, {})
        ).sort((a, b) => b[1] - a[1])[0]
      : null,
    latestDate: diagnoses.length > 0
      ? moment(diagnoses[0].created_at).format('DD/MM/YYYY')
      : null
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Title level={2}>
        <HistoryOutlined /> Lịch sử chẩn đoán
      </Title>

      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Tổng số chẩn đoán"
              value={stats.total}
              prefix={<FileSearchOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Bệnh phổ biến nhất"
              value={stats.mostCommon ? stats.mostCommon[0] : 'N/A'}
              suffix={stats.mostCommon ? `(${stats.mostCommon[1]} lần)` : ''}
              prefix={<MedicineBoxOutlined />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Chẩn đoán gần nhất"
              value={stats.latestDate || 'N/A'}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {error && (
        <Alert
          message="Lỗi"
          description={error}
          type="error"
          showIcon
        />
      )}

      <Card title="Danh sách chẩn đoán" bordered={false}>
        <List
          loading={loading}
          dataSource={diagnoses}
          renderItem={(diagnosis) => (
            <List.Item
              actions={[
                <Button
                  type="primary"
                  onClick={() => viewDetails(diagnosis.id)}
                  size="small"
                >
                  Xem chi tiết
                </Button>
              ]}
            >
              <Skeleton loading={loading} active avatar paragraph={{ rows: 2 }}>
                <List.Item.Meta
                  avatar={
                    <div style={{
                      width: 40,
                      height: 40,
                      background: '#1890ff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white'
                    }}>
                      <MedicineBoxOutlined />
                    </div>
                  }
                  title={
                    <Space>
                      <Text strong>{diagnosis.disease_name}</Text>
                      <Tag color={getConfidenceColor(diagnosis.prediction_data.confidence)}>
                        {Math.round(diagnosis.prediction_data.confidence * 100)}% Confidence
                      </Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary">
                        <ClockCircleOutlined /> {moment(diagnosis.created_at).format('DD/MM/YYYY HH:mm')}
                      </Text>
                      <div style={{ marginTop: 8 }}>
                        {diagnosis.symptoms
                          .filter(s => s.is_present)
                          .slice(0, 3)
                          .map((symptom, index) => (
                            <Tag key={index} style={{ marginRight: 4 }}>
                              {symptom.symptom_name}
                            </Tag>
                          ))}
                        {diagnosis.symptoms.filter(s => s.is_present).length > 3 && (
                          <Tag>+{diagnosis.symptoms.filter(s => s.is_present).length - 3} more</Tag>
                        )}
                      </div>
                    </div>
                  }
                />
              </Skeleton>
            </List.Item>
          )}
          locale={{
            emptyText: <Empty description="Không có dữ liệu chẩn đoán" />
          }}
        />

        {pagination.total > 0 && (
          <div style={{ textAlign: 'center', marginTop: 16 }}>
            <Pagination
              current={pagination.current}
              pageSize={pagination.pageSize}
              total={pagination.total}
              onChange={handlePageChange}
              showSizeChanger={false}
            />
          </div>
        )}
      </Card>
    </Space>
  );
};

// Helper để xác định màu dựa vào độ tin cậy
const getConfidenceColor = (confidence) => {
  const percent = confidence * 100;
  if (percent >= 70) return 'success';
  if (percent >= 40) return 'warning';
  return 'error';
};

export default DiagnosisHistory;

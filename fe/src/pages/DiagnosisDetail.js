// src/pages/DiagnosisDetail.js
import React, { useState, useEffect } from 'react';
import {
  Card,
  Typography,
  Space,
  Row,
  Col,
  Tag,
  Divider,
  Button,
  Alert,
  Skeleton,
  Progress,
  Descriptions
} from 'antd';
import {
  ArrowLeftOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { diagnosisApi } from '../api/api';
import DiagnosisBarChart from '../components/charts/DiagnosisBarChart';
import SymptomRadarChart from '../components/charts/SymptomRadarChart';
import moment from 'moment';

const { Title, Text } = Typography;

const DiagnosisDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDiagnosis = async () => {
      setLoading(true);
      try {
        const response = await diagnosisApi.getDetail(id);
        setDiagnosis(response.data);
      } catch (err) {
        console.error('Error fetching diagnosis details:', err);
        setError('Không thể tải thông tin chẩn đoán. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchDiagnosis();
  }, [id]);

  if (loading) {
    return (
      <Card>
        <Skeleton active avatar paragraph={{ rows: 10 }} />
      </Card>
    );
  }

  if (error) {
    return (
      <Alert
        message="Lỗi"
        description={error}
        type="error"
        showIcon
        action={
          <Button size="small" onClick={() => navigate('/history')}>
            Quay lại
          </Button>
        }
      />
    );
  }

  if (!diagnosis) {
    return (
      <Alert
        message="Không tìm thấy"
        description="Không tìm thấy thông tin chẩn đoán này."
        type="warning"
        showIcon
        action={
          <Button size="small" onClick={() => navigate('/history')}>
            Quay lại
          </Button>
        }
      />
    );
  }

  // Format data
  const confidencePercent = Math.round(diagnosis.prediction_data.confidence * 100);
  const uncertaintyPercent = Math.round(diagnosis.prediction_data.uncertainty * 100);
  const presentSymptoms = diagnosis.symptoms.filter(s => s.is_present);

  // Prepare data for charts
  const chartData = {
    probabilities: diagnosis.prediction_data.probabilities,
    uncertainties: diagnosis.prediction_data.uncertainties
  };

  // Prepare data for radar chart
  const allSymptoms = diagnosis.symptoms.map(s => s.symptom_name);
  const symptomValues = diagnosis.symptoms.map(s => s.is_present ? 1 : 0);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/history')}
      >
        Quay lại lịch sử
      </Button>

      <Card>
        <div style={{
          background: '#1890ff',
          padding: '20px',
          borderRadius: '8px',
          color: 'white',
          position: 'relative'
        }}>
          <Title level={2} style={{ color: 'white', margin: 0 }}>
            <MedicineBoxOutlined /> {diagnosis.disease_name}
          </Title>
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.2)',
            padding: '5px 15px',
            borderRadius: '20px'
          }}>
            Độ tin cậy: {confidencePercent}%
          </div>
          <Text style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginTop: '8px' }}>
            <ClockCircleOutlined /> {moment(diagnosis.created_at).format('DD/MM/YYYY HH:mm')}
          </Text>
        </div>

        <div style={{ padding: '20px' }}>
          <Descriptions title="Thông tin chẩn đoán" bordered column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Bệnh">
              {diagnosis.disease_name}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày chẩn đoán">
              {moment(diagnosis.created_at).format('DD/MM/YYYY HH:mm')}
            </Descriptions.Item>
            <Descriptions.Item label="Độ tin cậy">
              {confidencePercent}% (±{uncertaintyPercent}%)
            </Descriptions.Item>
            <Descriptions.Item label="Thuốc đề xuất">
              {diagnosis.prediction_data.medicine_recommendation}
            </Descriptions.Item>
            <Descriptions.Item label="Xét nghiệm đề xuất" span={2}>
              {diagnosis.prediction_data.test_recommendation}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Title level={5}>Độ tin cậy của chẩn đoán</Title>
              <Progress
                percent={confidencePercent}
                status={confidencePercent > 70 ? "success" : "normal"}
                strokeColor={confidencePercent > 70 ? "#52c41a" : "#1890ff"}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Text type="secondary">0%</Text>
                <Text>
                  Mức độ không chắc chắn:
                  <Tag style={{ marginLeft: '8px' }}>±{uncertaintyPercent}%</Tag>
                </Text>
                <Text type="secondary">100%</Text>
              </div>
            </Col>

            <Col xs={24} md={12}>
              <Title level={5}>Triệu chứng đã chọn</Title>
              <div>
                {presentSymptoms.length > 0 ? (
                  presentSymptoms.map((symptom, index) => (
                    <Tag
                      key={index}
                      color="blue"
                      style={{ marginBottom: '8px', padding: '5px 10px' }}
                    >
                      <CheckCircleOutlined /> {symptom.symptom_name}
                    </Tag>
                  ))
                ) : (
                  <Text type="secondary">Không có triệu chứng nào được chọn.</Text>
                )}
              </div>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Card>
                <Space>
                  <div style={{
                    background: '#1890ff',
                    color: 'white',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    <ExperimentOutlined />
                  </div>
                  <div>
                    <Title level={5}>Xét nghiệm đề xuất</Title>
                    <Text>{diagnosis.prediction_data.test_recommendation}</Text>
                  </div>
                </Space>
              </Card>
            </Col>

            <Col xs={24} md={12}>
              <Card>
                <Space>
                  <div style={{
                    background: '#1890ff',
                    color: 'white',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px'
                  }}>
                    <MedicineBoxOutlined />
                  </div>
                  <div>
                    <Title level={5}>Thuốc đề xuất</Title>
                    <Text>{diagnosis.prediction_data.medicine_recommendation}</Text>
                  </div>
                </Space>
              </Card>
            </Col>
          </Row>

          <Alert
            style={{ marginTop: '24px' }}
            message="Lưu ý quan trọng"
            description="Kết quả chẩn đoán này được tạo ra bởi mô hình AI và chỉ mang tính chất tham khảo. Vui lòng tham khảo ý kiến của bác sĩ để có chẩn đoán chính xác và phương pháp điều trị phù hợp."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
          />
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="Xác suất chẩn đoán" className="chart-card">
            <DiagnosisBarChart data={chartData} />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Mô hình triệu chứng" className="chart-card">
            <SymptomRadarChart
              symptoms={allSymptoms}
              symptomValues={symptomValues}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default DiagnosisDetail;
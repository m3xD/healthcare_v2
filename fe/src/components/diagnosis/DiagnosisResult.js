// src/components/diagnosis/DiagnosisResult.js
import React from 'react';
import {
  Card,
  Typography,
  Progress,
  Space,
  Row,
  Col,
  Tag,
  Divider,
  Alert,
  Statistic
} from 'antd';
import {
  CheckCircleOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import DiagnosisBarChart from '../charts/DiagnosisBarChart';
import SymptomRadarChart from '../charts/SymptomRadarChart';

const { Title, Text } = Typography;

const DiagnosisResult = ({ result, symptoms }) => {
  if (!result) {
    return <Alert message="No diagnosis result found" type="error" />;
  }

  // Format confidence as percentage
  const confidencePercent = Math.round(result.confidence * 100);
  const uncertaintyPercent = Math.round(result.uncertainty * 100);

  // Get present symptoms
  const presentSymptoms = result.symptoms ?
    symptoms.filter((_, index) => result.symptoms[index] === 1) : [];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <div style={{
          background: '#1890ff',
          padding: '20px',
          borderRadius: '8px',
          color: 'white',
          position: 'relative'
        }}>
          <Title level={2} style={{ color: 'white', margin: 0 }}>
            <MedicineBoxOutlined /> {result.diagnosis}
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
        </div>

        <div style={{ padding: '20px' }}>
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
              <Title level={5}>Triệu chứng của bạn</Title>
              <div>
                {presentSymptoms.length > 0 ? (
                  presentSymptoms.map((symptom, index) => (
                    <Tag
                      key={index}
                      color="blue"
                      style={{ marginBottom: '8px', padding: '5px 10px' }}
                    >
                      <CheckCircleOutlined /> {symptom}
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
                    <Text>{result.test_recommendation}</Text>
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
                    <Text>{result.medicine_recommendation}</Text>
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
            <DiagnosisBarChart data={result} />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Mô hình triệu chứng" className="chart-card">
            {symptoms && result.symptoms && (
              <SymptomRadarChart
                symptoms={symptoms}
                symptomValues={result.symptoms}
              />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
};

export default DiagnosisResult;
// src/pages/DiagnosisResult.js
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
  Descriptions,
  message,
  Image
} from 'antd';
import {
  ArrowLeftOutlined,
  MedicineBoxOutlined,
  ExperimentOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SaveOutlined,
  HistoryOutlined,
  PrinterOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import moment from 'moment';

// Import the same chart components used in DiagnosisDetail
import DiagnosisBarChart from '../components/charts/DiagnosisBarChart';
import SymptomRadarChart from '../components/charts/SymptomRadarChart';

const { Title, Text } = Typography;

const DiagnosisResult = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingDiagnosis, setSavingDiagnosis] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Lấy kết quả chẩn đoán từ localStorage
        const diagnosisResult = localStorage.getItem('diagnosisResult');
        if (diagnosisResult) {
          const parsedResult = JSON.parse(diagnosisResult);
          setResult(parsedResult);
        } else {
          setError('Không tìm thấy dữ liệu chẩn đoán. Vui lòng thực hiện chẩn đoán mới.');
        }
      } catch (err) {
        console.error('Error loading diagnosis result:', err);
        setError('Đã xảy ra lỗi khi tải kết quả chẩn đoán.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Xử lý khi người dùng lưu chẩn đoán
  const handleSaveDiagnosis = async () => {
    if (!user) {
      message.info('Vui lòng đăng nhập để lưu chẩn đoán này.');
      return;
    }

    if (!result) {
      message.error('Không có dữ liệu chẩn đoán để lưu.');
      return;
    }

    try {
      setSavingDiagnosis(true);

      // Chuẩn bị dữ liệu - biến đổi triệu chứng thành mảng 0, 1
      const symptomArray = [];
      if (result.symptoms && Array.isArray(result.symptoms)) {
        // Nếu symptoms là array object với is_present
        result.symptoms.forEach(symptom => {
          symptomArray.push(symptom.is_present ? 1 : 0);
        });
      } else if (result.prediction_data?.symptoms && Array.isArray(result.prediction_data.symptoms)) {
        // Nếu symptoms là array binary trong prediction_data
        symptomArray.push(...result.prediction_data.symptoms);
      } else if (result.prediction_data?.symptoms) {
        // Trường hợp symptoms không phải là array - convert sang array nếu có thể
        try {
          const symptomsData = result.prediction_data.symptoms;
          if (typeof symptomsData === 'object' && symptomsData !== null) {
            // Nếu là object, lấy giá trị
            symptomArray.push(...Object.values(symptomsData));
          } else if (typeof symptomsData === 'string') {
            // Nếu là string, thử parse JSON
            try {
              const parsedSymptoms = JSON.parse(symptomsData);
              if (Array.isArray(parsedSymptoms)) {
                symptomArray.push(...parsedSymptoms);
              }
            } catch (parseErr) {
              console.error('Error parsing symptoms string:', parseErr);
            }
          }
        } catch (err) {
          console.error('Error processing symptoms data:', err);
          // Fallback to default empty array
        }
      }

      // Gọi API lưu chẩn đoán
      const response = await api.post('/api/ai/diagnoses/', {
        symptom_values: symptomArray.length > 0 ? symptomArray : [0, 0, 0, 0, 0, 0, 0, 0, 0],
        prediction_data: result.prediction_data || result
      });

      message.success('Đã lưu chẩn đoán thành công!');

      // Cập nhật localStorage với response mới
      localStorage.setItem('diagnosisResult', JSON.stringify(response.data));
      setResult(response.data);
    } catch (err) {
      console.error('Error saving diagnosis:', err);
      message.error('Không thể lưu chẩn đoán. Vui lòng thử lại sau.');
    } finally {
      setSavingDiagnosis(false);
    }
  };

  // Chuyển đến trang lịch sử
  const goToHistory = () => {
    if (result?.id) {
      navigate(`/history/${result.id}`);
    } else {
      navigate('/history');
    }
  };

  // Hàm xử lý in kết quả
  const handlePrint = () => {
    window.print();
  };

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
          <Button size="small" onClick={() => navigate('/')}>
            Quay lại trang chủ
          </Button>
        }
      />
    );
  }

  if (!result) {
    return (
      <Alert
        message="Không tìm thấy"
        description="Không tìm thấy thông tin chẩn đoán."
        type="warning"
        showIcon
        action={
          <Button size="small" onClick={() => navigate('/')}>
            Quay lại trang chủ
          </Button>
        }
      />
    );
  }

  // Trích xuất dữ liệu từ cấu trúc response
  const diagnosis = result.disease_name || result.prediction_data?.diagnosis || result.diagnosis;
  const confidencePercent = Math.round((result.prediction_data?.confidence || result.confidence) * 100);
  const uncertaintyPercent = Math.round((result.prediction_data?.uncertainty || result.uncertainty) * 100);
  const testRecommendation = result.prediction_data?.test_recommendation || result.test_recommendation;
  const medicineRecommendation = result.prediction_data?.medicine_recommendation || result.medicine_recommendation;

  // Xác định các triệu chứng đã chọn
  const presentSymptoms = (result.symptoms || []).filter(symptom => symptom.is_present);

  // Chuẩn bị dữ liệu biểu đồ cho Bar Chart
  const chartData = {
    probabilities: result.prediction_data?.probabilities || result.probabilities || {},
    uncertainties: result.prediction_data?.uncertainties || result.uncertainties || {}
  };

  // Chuẩn bị dữ liệu biểu đồ Radar
  const allSymptoms = result.symptoms?.map(s => s.symptom_name) || [];
  const symptomValues = result.symptoms?.map(s => s.is_present ? 1 : 0) || [];

  // Kiểm tra xem chẩn đoán đã được lưu chưa
  const isSaved = result.id != null;

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
        >
          Quay lại trang chủ
        </Button>

        <Space>
          {user && !isSaved && (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveDiagnosis}
              loading={savingDiagnosis}
            >
              Lưu chẩn đoán
            </Button>
          )}

          <Button
            icon={<PrinterOutlined />}
            onClick={handlePrint}
          >
            In kết quả
          </Button>

          {user && (
            <Button
              icon={<HistoryOutlined />}
              onClick={goToHistory}
            >
              {isSaved ? 'Xem chi tiết trong lịch sử' : 'Xem lịch sử'}
            </Button>
          )}
        </Space>
      </div>

      {/* Main Diagnosis Card */}
      <Card>
        <div style={{
          background: '#1890ff',
          padding: '20px',
          borderRadius: '8px',
          color: 'white',
          position: 'relative'
        }}>
          <Title level={2} style={{ color: 'white', margin: 0 }}>
            <MedicineBoxOutlined /> {diagnosis}
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

          {result.created_at && (
            <Text style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginTop: '8px' }}>
              <ClockCircleOutlined /> {moment(result.created_at).format('DD/MM/YYYY HH:mm')}
            </Text>
          )}

          {result.user_details && (
            <Text style={{ color: 'rgba(255,255,255,0.8)', display: 'block', marginTop: '4px' }}>
              <UserOutlined /> {result.user_details.first_name} {result.user_details.last_name} ({result.user_details.username})
            </Text>
          )}
        </div>

        <div style={{ padding: '20px' }}>
          <Descriptions title="Thông tin chẩn đoán" bordered column={{ xs: 1, sm: 2 }}>
            <Descriptions.Item label="Bệnh">
              {diagnosis}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày chẩn đoán">
              {result.created_at ? moment(result.created_at).format('DD/MM/YYYY HH:mm') : 'Mới - Chưa lưu'}
            </Descriptions.Item>
            <Descriptions.Item label="Độ tin cậy">
              {confidencePercent}% (±{uncertaintyPercent}%)
            </Descriptions.Item>
            <Descriptions.Item label="Thuốc đề xuất">
              {medicineRecommendation}
            </Descriptions.Item>
            <Descriptions.Item label="Xét nghiệm đề xuất" span={2}>
              {testRecommendation}
            </Descriptions.Item>
          </Descriptions>

          <Divider />

          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Title level={5}>Độ tin cậy của chẩn đoán</Title>
              <Progress
                percent={confidencePercent}
                status={confidencePercent > 70 ? "success" : confidencePercent > 40 ? "normal" : "exception"}
                strokeColor={confidencePercent > 70 ? "#52c41a" : confidencePercent > 40 ? "#1890ff" : "#ff4d4f"}
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
                    <Text>{testRecommendation}</Text>
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
                    <Text>{medicineRecommendation}</Text>
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

      {/* Charts Section */}
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

      {/* Bottom Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px', marginBottom: '40px' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/')}
        >
          Quay lại trang chủ
        </Button>

        {user ? (
          <Button
            type="primary"
            icon={<HistoryOutlined />}
            onClick={goToHistory}
          >
            {isSaved ? 'Xem chi tiết trong lịch sử' : 'Xem lịch sử chẩn đoán'}
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={() => navigate('/login')}
          >
            Đăng nhập để lưu kết quả
          </Button>
        )}
      </div>

      {/* Print Styles - only visible when printing */}
      <style type="text/css" media="print">
        {`
          button { display: none !important; }
          .ant-layout-header, .ant-layout-footer { display: none !important; }
          @page { size: A4; margin: 2cm; }
        `}
      </style>
    </Space>
  );
};

export default DiagnosisResult;
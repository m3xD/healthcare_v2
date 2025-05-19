// src/pages/Home.js
import React, {useState, useEffect} from 'react';
import {
    Card,
    Typography,
    Alert,
    Checkbox,
    Button,
    Row,
    Col,
    Space,
    Divider,
    Tag,
    Spin,
    Grid,
    Empty,
    message
} from 'antd';
import {
    SearchOutlined,
    InfoCircleOutlined,
    WarningOutlined,
    ExperimentOutlined,
    BarChartOutlined,
    HeartOutlined,
    RobotOutlined
} from '@ant-design/icons';
import {useNavigate} from 'react-router-dom';
import api from '../api/api';
import {useAuth} from '../context/AuthContext';

const {Title, Paragraph, Text} = Typography;
const {useBreakpoint} = Grid;

const Home = () => {
    const [symptoms, setSymptoms] = useState([]);
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fetchingSymptoms, setFetchingSymptoms] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const screens = useBreakpoint();
    const {user} = useAuth();

    // Fetch danh sách triệu chứng khi component mount
    useEffect(() => {
        const fetchSymptoms = async () => {
            try {
                setFetchingSymptoms(true);
                const response = await api.get('/api/v1/symptoms/');
                if (Array.isArray(response.data)) {
                    // Trường hợp 1: response.data là mảng trực tiếp
                    setSymptoms(response.data);
                } else if (response.data && response.data.results && Array.isArray(response.data.results)) {
                    // Trường hợp 2: response.data.results là mảng (format phân trang phổ biến)
                    setSymptoms(response.data.results);
                } else if (response.data && typeof response.data === 'object') {
                    // Trường hợp 3: response.data là object, thử chuyển thành mảng
                    const symptomsArray = Object.values(response.data);
                    setSymptoms(Array.isArray(symptomsArray) ? symptomsArray : []);
                } else {
                    // Không phải là cấu trúc dự kiến, đặt mảng rỗng
                    console.error('Unexpected API response structure:', response.data);
                    setSymptoms([]);
                    setError('Định dạng dữ liệu không đúng. Vui lòng liên hệ quản trị viên.');
                }
            } catch (err) {
                console.error('Error fetching symptoms:', err);
                setError('Không thể tải danh sách triệu chứng. Vui lòng thử lại sau.');
            } finally {
                setFetchingSymptoms(false);
            }
        };

        fetchSymptoms();
    }, []);

    // Xử lý khi người dùng chọn/bỏ chọn triệu chứng
    const handleSymptomChange = (symptomId, checked) => {
        if (checked) {
            setSelectedSymptoms(prev => [...prev, symptomId]);
        } else {
            setSelectedSymptoms(prev => prev.filter(id => id !== symptomId));
        }
    };

    // Xử lý khi người dùng nhấn nút phân tích triệu chứng
    const handleDiagnose = async () => {
        if (selectedSymptoms.length === 0) {
            message.warning('Vui lòng chọn ít nhất một triệu chứng');
            return;
        }

        setLoading(true);
        try {
            // Chuyển đổi selectedSymptoms thành mảng binary dựa trên tất cả triệu chứng
            const symptomValues = symptoms.map(symptom =>
                selectedSymptoms.includes(symptom.id) ? 1 : 0
            );

            // Gọi API chẩn đoán
            const response = await api.post('/api/v1/diagnoses/diagnose/', {symptom_values: symptomValues});

            // Lưu kết quả vào localStorage để hiển thị ở trang kết quả
            localStorage.setItem('diagnosisResult', JSON.stringify(response.data));

            // Chuyển hướng đến trang kết quả
            navigate('/result');
        } catch (err) {
            console.error('Error during diagnosis:', err);

            // Xử lý và hiển thị lỗi từ API
            const errorMessage = err.response?.data?.error || 'Đã xảy ra lỗi trong quá trình chẩn đoán. Vui lòng thử lại.';
            message.error(errorMessage);
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Space direction="vertical" size="large" style={{width: '100%'}}>
            {/* Hero Section */}
            <Card>
                <div style={{
                    textAlign: 'center',
                    padding: screens.xs ? '10px 0' : '20px 0'
                }}>
                    <Title level={screens.xs ? 3 : 1}>
                        <RobotOutlined style={{color: '#1890ff', marginRight: '10px'}}/>
                        <span style={{color: '#1890ff'}}>AI Health Assistant</span>
                    </Title>
                    <Paragraph style={{
                        fontSize: screens.xs ? '14px' : '18px',
                        margin: screens.xs ? '8px 0' : '16px 0'
                    }}>
                        Trợ lý sức khỏe thông minh sử dụng AI để phân tích triệu chứng và cung cấp chẩn đoán sơ bộ
                    </Paragraph>
                    <Space wrap style={{justifyContent: 'center'}}>
                        <Tag color="gold" icon={<ExperimentOutlined/>}>AI Powered</Tag>
                        <Tag color="blue" icon={<BarChartOutlined/>}>Data Analysis</Tag>
                        <Tag color="green" icon={<HeartOutlined/>}>Health Insights</Tag>
                    </Space>
                </div>
            </Card>

            {/* Thông báo lỗi (nếu có) */}
            {error && (
                <Alert
                    message="Đã xảy ra lỗi"
                    description={error}
                    type="error"
                    showIcon
                    closable
                    onClose={() => setError(null)}
                />
            )}

            {/* Instructions Card */}
            <Card
                title={<><InfoCircleOutlined/> Hướng dẫn sử dụng</>}
                size={screens.xs ? "small" : "default"}
            >
                <ol style={{paddingLeft: screens.xs ? '20px' : '40px'}}>
                    <li><Text>Đánh dấu vào các triệu chứng mà bạn đang gặp phải từ danh sách bên dưới.</Text></li>
                    <li><Text>Nhấn nút <strong>"Phân tích triệu chứng"</strong> để nhận kết quả chẩn đoán.</Text></li>
                    <li><Text>Hệ thống sẽ phân tích các triệu chứng của bạn và đưa ra chẩn đoán sơ bộ.</Text></li>
                    <li><Text>Kết quả sẽ bao gồm khuyến nghị về các xét nghiệm cần thực hiện và thuốc có thể được sử
                        dụng.</Text></li>
                </ol>

                <Alert
                    message={<><WarningOutlined/> Lưu ý quan trọng</>}
                    description="Công cụ này chỉ nhằm mục đích cung cấp thông tin và không thay thế cho lời khuyên y tế chuyên nghiệp. Vui lòng tham khảo ý kiến bác sĩ để được tư vấn chính xác."
                    type="warning"
                    showIcon
                />
            </Card>

            {/* Symptoms Selection Card */}
            <Card
                title={<><InfoCircleOutlined/> Chọn triệu chứng của bạn</>}
                size={screens.xs ? "small" : "default"}
                extra={user ? (
                    <Text type="secondary">Đăng nhập với: {user.username}</Text>
                ) : (
                    <Text type="secondary">Đăng nhập để lưu lịch sử</Text>
                )}
            >
                {fetchingSymptoms ? (
                    <div style={{textAlign: 'center', padding: '40px 0'}}>
                        <Spin tip="Đang tải danh sách triệu chứng..." size="large"/>
                    </div>
                ) : symptoms.length === 0 ? (
                    <Empty
                        description="Không thể tải danh sách triệu chứng"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                ) : (
                    <>
                        <Row gutter={[12, 12]}>
                            {symptoms.map(symptom => (
                                <Col xs={24} sm={12} md={8} lg={6} key={symptom.id}>
                                    <Card
                                        hoverable
                                        size="small"
                                        style={{
                                            backgroundColor: selectedSymptoms.includes(symptom.id) ? '#e6f7ff' : 'white',
                                            transition: 'all 0.3s',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center'
                                        }}
                                        onClick={() => handleSymptomChange(
                                            symptom.id,
                                            !selectedSymptoms.includes(symptom.id)
                                        )}
                                    >
                                        <Checkbox
                                            checked={selectedSymptoms.includes(symptom.id)}
                                            onChange={e => handleSymptomChange(symptom.id, e.target.checked)}
                                        >
                                            {symptom.name}
                                            {symptom.description && (
                                                <Paragraph type="secondary" style={{fontSize: '12px', margin: 0}}>
                                                    {symptom.description}
                                                </Paragraph>
                                            )}
                                        </Checkbox>
                                    </Card>
                                </Col>
                            ))}
                        </Row>

                        <Divider/>

                        <div style={{textAlign: 'center'}}>
                            <Text type="secondary" style={{display: 'block', marginBottom: '16px'}}>
                                Đã chọn {selectedSymptoms.length} triệu chứng
                            </Text>

                            <Button
                                type="primary"
                                icon={<SearchOutlined/>}
                                size={screens.xs ? "middle" : "large"}
                                onClick={handleDiagnose}
                                loading={loading}
                                block={screens.xs}
                                disabled={selectedSymptoms.length === 0}
                            >
                                Phân tích triệu chứng
                            </Button>
                        </div>
                    </>
                )}
            </Card>

            {/* Benefits Section */}
            <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                    <Card title="Chẩn đoán nhanh" bordered={false}>
                        <Paragraph>
                            Nhận kết quả chẩn đoán sơ bộ dựa trên triệu chứng chỉ trong vài giây, không cần đợi đặt lịch
                            hẹn.
                        </Paragraph>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card title="Dựa trên AI" bordered={false}>
                        <Paragraph>
                            Sử dụng các thuật toán học máy hiện đại để phân tích triệu chứng và đưa ra dự đoán về các
                            bệnh có thể mắc phải.
                        </Paragraph>
                    </Card>
                </Col>

                <Col xs={24} md={8}>
                    <Card title="Đề xuất thông minh" bordered={false}>
                        <Paragraph>
                            Nhận đề xuất về xét nghiệm và thuốc có thể cần thiết để điều trị tình trạng sức khỏe của
                            bạn.
                        </Paragraph>
                    </Card>
                </Col>
            </Row>

            {/* FAQ Section */}
            <Card title="Câu hỏi thường gặp" style={{marginBottom: '20px'}}>
                <Row gutter={[16, 16]}>
                    <Col xs={24} md={12}>
                        <Title level={5}>Công cụ này có thay thế bác sĩ không?</Title>
                        <Paragraph>
                            Không. Công cụ này chỉ cung cấp thông tin ban đầu và không thay thế cho chẩn đoán y tế
                            chuyên nghiệp. Vui lòng luôn tham khảo ý kiến bác sĩ.
                        </Paragraph>
                    </Col>

                    <Col xs={24} md={12}>
                        <Title level={5}>Dữ liệu của tôi có được bảo mật không?</Title>
                        <Paragraph>
                            Có. Chúng tôi không lưu trữ bất kỳ thông tin cá nhân nào trừ khi bạn đăng nhập để lưu lịch
                            sử chẩn đoán. Mọi dữ liệu đều được mã hóa và bảo mật.
                        </Paragraph>
                    </Col>

                    <Col xs={24} md={12}>
                        <Title level={5}>Độ chính xác của công cụ này như thế nào?</Title>
                        <Paragraph>
                            Công cụ này sử dụng AI để đưa ra gợi ý với độ chính xác dao động từ 60-90% tùy thuộc vào
                            bệnh và triệu chứng. Kết quả luôn hiển thị mức độ tin cậy.
                        </Paragraph>
                    </Col>

                    <Col xs={24} md={12}>
                        <Title level={5}>Tôi có thể sử dụng công cụ này bao nhiêu lần?</Title>
                        <Paragraph>
                            Bạn có thể sử dụng công cụ này không giới hạn số lần. Nếu đăng nhập, bạn có thể xem lại lịch
                            sử chẩn đoán trước đó của mình.
                        </Paragraph>
                    </Col>
                </Row>
            </Card>
        </Space>
    );
};

export default Home;
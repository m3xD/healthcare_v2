// src/components/chat/AIChat.js
import React, { useState, useEffect, useRef } from 'react';
import {
  Card, Input, Button, Typography, Space, List, Avatar,
  Divider, Alert, Spin, Badge, Empty, Tooltip, Modal
} from 'antd';
import {
  SendOutlined, RobotOutlined, UserOutlined,
  InfoCircleOutlined, CloseCircleOutlined,
  DeleteOutlined, QuestionCircleOutlined,
  ClockCircleOutlined, HistoryOutlined,
  FileImageOutlined, SmileOutlined
} from '@ant-design/icons';
import { chatService } from '../../api/services/chatService';
import moment from 'moment';
import ReactMarkdown from 'react-markdown';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AIChat = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatRoomId, setChatRoomId] = useState(null);
  const [previousChats, setPreviousChats] = useState([]);
  const [showPreviousChats, setShowPreviousChats] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // FAQ for the help modal
  const faqItems = [
    {
      question: "What kind of health questions can I ask?",
      answer: "You can ask about symptoms, general health advice, medical conditions, and wellness tips. The AI can help identify possible conditions based on symptoms you describe."
    },
    {
      question: "Is this a replacement for medical advice?",
      answer: "No. This AI assistant provides information only. Always consult with a healthcare professional for medical diagnosis and treatment."
    },
    {
      question: "How accurate are the responses?",
      answer: "The AI uses a trained model to suggest possible conditions, but accuracy varies. Consider results as informational only, not as definitive diagnoses."
    },
    {
      question: "Is my conversation private?",
      answer: "Yes, your chat history is stored securely and only accessible to you. We prioritize your privacy and data security."
    }
  ];

  const commonSymptoms = [
    "Fever", "Cough", "Fatigue", "Headache",
    "Sore throat", "Body aches", "Chills", "Loss of taste"
  ];

  useEffect(() => {
    const initChat = async () => {
      try {
        // Load previous chat rooms
        await fetchChatRooms();

        // Check if there's an existing AI chat room
        const response = await chatService.getChatRooms();
        const aiChatRoom = response.data.find(room => room.is_ai_chat);

        if (aiChatRoom) {
          // Use existing chat room
          setChatRoomId(aiChatRoom.id);
          fetchMessages(aiChatRoom.id);
        } else {
          // Create a new AI chat room
          createNewChatRoom();
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    initChat();

    // Focus the input field when component mounts
    setTimeout(() => {
      inputRef.current?.focus();
    }, 500);
  }, []);

  const fetchChatRooms = async () => {
    try {
      const response = await chatService.getChatRooms();
      const aiChatRooms = response.data.filter(room => room.is_ai_chat);
      setPreviousChats(aiChatRooms);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    }
  };

  const createNewChatRoom = async () => {
    try {
      setLoading(true);
      const newRoomResponse = await chatService.createChatRoom({
        title: 'AI Health Assistant Chat',
        is_ai_chat: true,
        participant_ids: [] // No additional participants
      });

      setChatRoomId(newRoomResponse.data.id);
      fetchChatRooms(); // Refresh the list of chat rooms
      setMessages([]); // Clear messages for new chat
    } catch (error) {
      console.error('Error creating new chat room:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId) => {
    if (!roomId) return;

    try {
      setLoading(true);
      const response = await chatService.getChatMessages(roomId);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const switchChatRoom = (roomId) => {
    setChatRoomId(roomId);
    fetchMessages(roomId);
    setShowPreviousChats(false);
  };

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !chatRoomId) return;

    try {
      setSending(true);

      // Add user message to the UI immediately for responsiveness
      const userMessage = {
        id: `temp-${new Date().getTime()}`,
        content: inputMessage,
        is_ai_message: false,
        sent_at: new Date().toISOString(),
        sender_name: 'You'
      };

      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');

      // Focus back on input after sending
      inputRef.current?.focus();

      // Send message to backend
      await chatService.sendMessage(chatRoomId, {
        content: inputMessage
      });

      // Add loading message while waiting for AI response
      const loadingMessage = {
        id: `loading-${new Date().getTime()}`,
        content: '...',
        is_ai_message: true,
        is_loading: true,
        sent_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, loadingMessage]);

      // Fetch all messages after sending
      // This will include the AI response which is generated on the backend
      setTimeout(async () => {
        await fetchMessages(chatRoomId);
        setSending(false);
      }, 1000); // Give backend a second to generate response
    } catch (error) {
      console.error('Error sending message:', error);
      setSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSymptomClick = (symptom) => {
    setInputMessage(prev => {
      const newMessage = prev ? `${prev} ${symptom.toLowerCase()}` : `I have ${symptom.toLowerCase()}`;
      return newMessage;
    });
    inputRef.current?.focus();
  };

  const renderMessageContent = (content) => {
    // Basic markdown support for AI messages
    return (
      <ReactMarkdown>
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>
          <RobotOutlined /> AI Health Assistant
        </Title>

        <Space>
          <Tooltip title="Help & FAQs">
            <Button
              type="text"
              icon={<QuestionCircleOutlined />}
              onClick={() => setShowHelpModal(true)}
            />
          </Tooltip>

          <Tooltip title="Chat History">
            <Badge count={previousChats.length} size="small" offset={[-5, 5]}>
              <Button
                type="text"
                icon={<HistoryOutlined />}
                onClick={() => setShowPreviousChats(!showPreviousChats)}
              />
            </Badge>
          </Tooltip>

          <Tooltip title="New Chat">
            <Button
              type="primary"
              onClick={createNewChatRoom}
              disabled={loading}
            >
              New Chat
            </Button>
          </Tooltip>
        </Space>
      </div>

      {showPreviousChats && (
        <Card title="Previous Conversations" size="small">
          {previousChats.length > 0 ? (
            <List
              size="small"
              dataSource={previousChats}
              renderItem={chat => (
                <List.Item
                  key={chat.id}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: chat.id === chatRoomId ? '#f0f8ff' : 'transparent'
                  }}
                  onClick={() => switchChatRoom(chat.id)}
                  actions={[
                    <Button type="text" size="small" icon={<ClockCircleOutlined />}>
                      {moment(chat.last_message_time || chat.created_at).format('MMM D, YYYY')}
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />}
                    title={chat.title || 'AI Health Chat'}
                    description={`${chat.messages_count || 0} messages`}
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="No previous chats found" />
          )}
        </Card>
      )}

      <Alert
        message="How can I help you today?"
        description={
          <div>
            <p>I can answer your health-related questions, help you understand your symptoms, or provide general health advice.</p>
            <div style={{ marginTop: '10px' }}>
              <Text strong>Common symptoms:</Text>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                {commonSymptoms.map((symptom, index) => (
                  <Button key={index} size="small" onClick={() => handleSymptomClick(symptom)}>
                    {symptom}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        }
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: '20px' }}
      />

      <Card
        style={{
          height: '500px',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <div
          style={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '0 10px',
            marginBottom: '10px'
          }}
        >
          {loading && messages.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <Spin tip="Loading conversation..." />
            </div>
          ) : messages.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <RobotOutlined style={{ fontSize: '48px', color: '#1890ff', marginBottom: '16px' }} />
              <Text type="secondary">Start a conversation with your AI Health Assistant</Text>
              <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
                Try asking about symptoms or health questions
              </Text>
            </div>
          ) : (
            <List
              itemLayout="horizontal"
              dataSource={messages}
              renderItem={message => (
                <List.Item
                  style={{
                    textAlign: message.is_ai_message ? 'left' : 'right',
                    padding: '10px 0'
                  }}
                >
                  <Space
                    style={{
                      maxWidth: '80%',
                      marginLeft: message.is_ai_message ? '0' : 'auto',
                      marginRight: message.is_ai_message ? 'auto' : '0'
                    }}
                  >
                    {message.is_ai_message && (
                      <Avatar icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
                    )}

                    <div
                      style={{
                        backgroundColor: message.is_ai_message ? '#f0f2f5' : '#1890ff',
                        color: message.is_ai_message ? 'rgba(0, 0, 0, 0.85)' : 'white',
                        borderRadius: '8px',
                        padding: '10px 16px',
                        textAlign: 'left',
                        minWidth: '120px'
                      }}
                    >
                      <div>
                        <Text
                          strong
                          style={{ color: message.is_ai_message ? 'rgba(0, 0, 0, 0.85)' : 'white' }}
                        >
                          {message.is_ai_message ? 'AI Assistant' : 'You'}
                        </Text>
                        <Text
                          type="secondary"
                          style={{
                            fontSize: '12px',
                            marginLeft: '8px',
                            color: message.is_ai_message ? 'rgba(0, 0, 0, 0.45)' : 'rgba(255, 255, 255, 0.75)'
                          }}
                        >
                          {moment(message.sent_at).format('h:mm A')}
                        </Text>
                      </div>

                      {message.is_loading ? (
                        <div style={{ padding: '10px 0' }}>
                          <Spin size="small" /> <Text type="secondary">Thinking...</Text>
                        </div>
                      ) : (
                        <div
                          style={{
                            margin: '5px 0 0 0',
                            color: message.is_ai_message ? 'rgba(0, 0, 0, 0.85)' : 'white',
                            wordWrap: 'break-word'
                          }}
                        >
                          {message.is_ai_message ? renderMessageContent(message.content) : message.content}
                        </div>
                      )}
                    </div>

                    {!message.is_ai_message && (
                      <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />
                    )}
                  </Space>
                </List.Item>
              )}
            />
          )}
          <div ref={messagesEndRef} />
        </div>

        <Divider style={{ margin: '10px 0' }} />

        <div style={{ display: 'flex', gap: '10px' }}>
          <TextArea
            ref={inputRef}
            placeholder="Type your health question here..."
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            autoSize={{ minRows: 1, maxRows: 4 }}
            style={{ flexGrow: 1 }}
            disabled={!chatRoomId || sending || loading}
          />
          <Space>
            <Tooltip title="Send message">
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                loading={sending}
                disabled={!inputMessage.trim() || !chatRoomId || loading}
              />
            </Tooltip>

            <Tooltip title="Add emoji">
              <Button
                icon={<SmileOutlined />}
                disabled={!chatRoomId || loading}
              />
            </Tooltip>

            <Tooltip title="Upload image">
              <Button
                icon={<FileImageOutlined />}
                disabled={!chatRoomId || loading}
              />
            </Tooltip>
          </Space>
        </div>
      </Card>

      {/* Help Modal */}
      <Modal
        title="AI Health Assistant Help"
        open={showHelpModal}
        onCancel={() => setShowHelpModal(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setShowHelpModal(false)}>
            Close
          </Button>
        ]}
      >
        <div>
          <Paragraph>
            The AI Health Assistant can help you with health-related questions and provide information based on symptoms you describe.
          </Paragraph>

          <Title level={4}>Frequently Asked Questions</Title>
          <List
            itemLayout="vertical"
            dataSource={faqItems}
            renderItem={item => (
              <List.Item>
                <Text strong>{item.question}</Text>
                <Paragraph style={{ marginTop: 5 }}>{item.answer}</Paragraph>
              </List.Item>
            )}
          />

          <Alert
            message="Important Note"
            description="This AI assistant is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment."
            type="warning"
            showIcon
            style={{ marginTop: 20 }}
          />
        </div>
      </Modal>
    </Space>
  );
};

export default AIChat;
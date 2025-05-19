// src/context/ChatContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { chatService } from '../api/services/chatService';
import { useAuth } from './AuthContext';
import { message } from 'antd';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      fetchChatRooms();
    }
  }, [user]);

  const fetchChatRooms = async () => {
    try {
      setLoading(true);
      const response = await chatService.getChatRooms();
      setChatRooms(response.data.results || []);

      // Tính số tin nhắn chưa đọc
      let count = 0;
      if (response.data.results) {
        response.data.results.forEach(room => {
          count += room.unread_count || 0;
        });
      }
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewChatRoom = async () => {
    try {
      setLoading(true);
      const response = await chatService.createChatRoom({
        title: 'AI Health Assistant Chat',
        is_ai_chat: true,
        participant_ids: []
      });

      await fetchChatRooms();
      return response.data;
    } catch (error) {
      console.error('Error creating chat room:', error);
      message.error('Failed to create new chat');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteChatRoom = async (roomId) => {
    try {
      setLoading(true);
      await chatService.deleteChatRoom(roomId);
      await fetchChatRooms();
      return true;
    } catch (error) {
      console.error('Error deleting chat room:', error);
      message.error('Failed to delete chat');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    chatRooms,
    loading,
    unreadCount,
    fetchChatRooms,
    createNewChatRoom,
    deleteChatRoom
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => useContext(ChatContext);
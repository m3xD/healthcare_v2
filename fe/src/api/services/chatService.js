// src/api/services/chatService.js
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // Replace with your actual API base URL
const API_ENDPOINTS = {
  CHAT_ROOMS: '/api/chat/rooms/',
  MESSAGES: '/api/chat/messages/',
};

export const chatService = {
  /**
   * Get all chat rooms for the current user
   * @returns {Promise} Promise with chat rooms data
   */
  getChatRooms: async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}${API_ENDPOINTS.CHAT_ROOMS}`);
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a new chat room
   * @param {Object} chatRoomData - Data for creating a chat room
   * @param {string} chatRoomData.title - Title of the chat room
   * @param {boolean} chatRoomData.is_ai_chat - Whether this is an AI chat
   * @param {Array} chatRoomData.participant_ids - IDs of participants to add
   * @returns {Promise} Promise with created chat room data
   */
  createChatRoom: async (chatRoomData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.CHAT_ROOMS}`,
        chatRoomData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get messages for a specific chat room
   * @param {string} roomId - ID of the chat room
   * @returns {Promise} Promise with messages data
   */
  getChatMessages: async (roomId) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}${API_ENDPOINTS.CHAT_ROOMS}${roomId}/messages/`
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Send a message to a chat room
   * @param {string} roomId - ID of the chat room
   * @param {Object} messageData - Message data
   * @param {string} messageData.content - Content of the message
   * @returns {Promise} Promise with sent message data
   */
  sendMessage: async (roomId, messageData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.CHAT_ROOMS}${roomId}/send_message/`,
        messageData
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Mark a message as read
   * @param {string} messageId - ID of the message
   * @returns {Promise} Promise with response data
   */
  markMessageAsRead: async (messageId) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}${API_ENDPOINTS.MESSAGES}${messageId}/mark_read/`
      );
      return response;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Delete a message
   * @param {string} messageId - ID of the message
   * @returns {Promise} Promise with response data
   */
  deleteMessage: async (messageId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}${API_ENDPOINTS.MESSAGES}${messageId}/`
      );
      return response;
    } catch (error) {
      throw error;
    }
  }
};
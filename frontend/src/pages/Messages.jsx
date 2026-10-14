import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  MessageSquare,
  Send,
  User,
  Package,
  Loader2
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  getMyConversations,
  getMessages,
  sendMessage,
  markMessagesAsRead
} from "../api/conversations";

import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";


const Messages = () => {

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { user } = useAuth();
  const { socket } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const [messages, setMessages] = useState([]);

  const [text, setText] = useState("");

  const [loadingConversations, setLoadingConversations] =
    useState(true);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==========================================
  // LOAD CONVERSATIONS
  // ==========================================

  useEffect(() => {

    const loadConversations = async () => {

      try {

        setLoadingConversations(true);
        setError("");

        const data = await getMyConversations();

        const list = data.conversations || [];

        setConversations(list);

        // Open conversation from URL if supplied
        const conversationId =
          searchParams.get("conversation");

        if (conversationId) {

          const found = list.find(
            (conversation) =>
              conversation._id === conversationId
          );

          if (found) {
            setSelectedConversation(found);
          }

        }

      } catch (err) {

        console.error(
          "Failed to load conversations:",
          err
        );

        setError(
          err.response?.data?.message ||
          "Failed to load conversations"
        );

      } finally {

        setLoadingConversations(false);

      }

    };

    loadConversations();

  }, [searchParams]);


  // ==========================================
  // LOAD MESSAGES
  // ==========================================

  useEffect(() => {

    if (!selectedConversation) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {

      try {

        setLoadingMessages(true);

        const data = await getMessages(
          selectedConversation._id
        );

        setMessages(data.messages || []);

        await markMessagesAsRead(
          selectedConversation._id
        );

        // Remove unread count locally
        setConversations((previous) =>
          previous.map((conversation) =>
            conversation._id === selectedConversation._id
              ? {
                  ...conversation,
                  unreadCount: 0
                }
              : conversation
          )
        );

      } catch (err) {

        console.error(
          "Failed to load messages:",
          err
        );

        setError(
          err.response?.data?.message ||
          "Failed to load messages"
        );

      } finally {

        setLoadingMessages(false);

      }

    };

    loadMessages();

  }, [selectedConversation]);


  // ==========================================
  // JOIN SOCKET CONVERSATION
  // ==========================================

  useEffect(() => {

    if (!socket || !selectedConversation) {
      return;
    }

    socket.emit(
      "join_conversation",
      selectedConversation._id
    );

    return () => {

      socket.emit(
        "leave_conversation",
        selectedConversation._id
      );

    };

  }, [socket, selectedConversation]);


  // ==========================================
  // RECEIVE REAL-TIME MESSAGES
  // ==========================================

  useEffect(() => {

    if (!socket) {
      return;
    }

    const handleNewMessage = (message) => {

      if (
        !message ||
        !message.conversation
      ) {
        return;
      }

      const conversationId =
        message.conversation._id ||
        message.conversation;

      // Only add message to currently open conversation
      if (
        selectedConversation &&
        conversationId.toString() ===
          selectedConversation._id.toString()
      ) {

        setMessages((previous) => {

          const alreadyExists = previous.some(
            (item) => item._id === message._id
          );

          if (alreadyExists) {
            return previous;
          }

          return [...previous, message];

        });

        // Mark incoming message as read
        if (
          message.sender?._id &&
          message.sender._id.toString() !==
            user?._id?.toString()
        ) {

          markMessagesAsRead(
            selectedConversation._id
          ).catch(console.error);

        }

      }

      // Update conversation preview
      setConversations((previous) => {

        return previous
          .map((conversation) => {

            if (
              conversation._id !==
              conversationId
            ) {
              return conversation;
            }

            const senderId =
              message.sender?._id ||
              message.sender;

            const isFromCurrentUser =
              senderId?.toString() ===
              user?._id?.toString();

            return {
              ...conversation,
              lastMessage: message.text,
              lastMessageAt: message.createdAt,

              unreadCount:
                !isFromCurrentUser &&
                (!selectedConversation ||
                  selectedConversation._id !==
                    conversation._id)
                  ? (conversation.unreadCount || 0) + 1
                  : conversation.unreadCount
            };

          })
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt || b.updatedAt) -
              new Date(a.lastMessageAt || a.updatedAt)
          );

      });

    };

    socket.on(
      "new_message",
      handleNewMessage
    );

    return () => {

      socket.off(
        "new_message",
        handleNewMessage
      );

    };

  }, [socket, selectedConversation, user]);


  // ==========================================
  // SELECT CONVERSATION
  // ==========================================

  const selectConversation = (conversation) => {

    setSelectedConversation(conversation);

    navigate(
      `/messages?conversation=${conversation._id}`
    );

  };


  // ==========================================
  // OTHER PARTICIPANT
  // ==========================================

  const getOtherParticipant = (conversation) => {
    const participant = conversation.participants?.find(
        (participant) =>
            participant._id?.toString() !==
            user?._id?.toString()
    );

    if (participant?.isDeleted) {
        return {
            ...participant,
            name: "Deleted User"
        };
    }

    return participant;
};


  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const handleSendMessage = async (event) => {

    event.preventDefault();

    const cleanText = text.trim();

    if (
      !cleanText ||
      !selectedConversation ||
      sending
    ) {
      return;
    }

    try {

      setSending(true);

      const data = await sendMessage(
        selectedConversation._id,
        cleanText
      );

      const newMessage = data.data;

      setMessages((previous) => {

        const exists = previous.some(
          (message) =>
            message._id === newMessage._id
        );

        if (exists) {
          return previous;
        }

        return [
          ...previous,
          newMessage
        ];

      });

      setText("");

      // Update conversation preview
      setConversations((previous) =>
        previous.map((conversation) =>
          conversation._id ===
          selectedConversation._id
            ? {
                ...conversation,
                lastMessage: cleanText,
                lastMessageAt:
                  newMessage.createdAt
              }
            : conversation
        )
      );

    } catch (err) {

      console.error(
        "Failed to send message:",
        err
      );

      setError(
        err.response?.data?.message ||
        "Failed to send message"
      );

    } finally {

      setSending(false);

    }

  };


  // ==========================================
  // ENTER KEY
  // ==========================================

  const handleKeyDown = (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      handleSendMessage(event);

    }

  };


  // ==========================================
  // FORMAT TIME
  // ==========================================

  const formatTime = (date) => {

    if (!date) {
      return "";
    }

    return new Date(date).toLocaleTimeString(
      [],
      {
        hour: "2-digit",
        minute: "2-digit"
      }
    );

  };


  const formatConversationTime = (date) => {

    if (!date) {
      return "";
    }

    return new Date(date).toLocaleDateString(
      [],
      {
        month: "short",
        day: "numeric"
      }
    );

  };


  // ==========================================
  // SORTED MESSAGES
  // ==========================================

  const sortedMessages = useMemo(
    () => messages,
    [messages]
  );


  // ==========================================
  // RENDER
  // ==========================================

  return (

    <div className="min-h-screen bg-slate-50">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* PAGE HEADER */}

        <div className="flex items-center gap-3 mb-6">

          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-white text-slate-600 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>

            <h1 className="text-2xl font-bold text-slate-900">
              Messages
            </h1>

            <p className="text-sm text-slate-500">
              Chat with buyers and sellers
            </p>

          </div>

        </div>


        {/* ERROR */}

        {error && (

          <div className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
            {error}
          </div>

        )}


        {/* MAIN CHAT BOX */}

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">

          <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] min-h-[650px]">


            {/* =================================
                CONVERSATION LIST
            ================================= */}

            <div className="border-r border-slate-200">

              <div className="p-5 border-b border-slate-200">

                <div className="flex items-center gap-2">

                  <MessageSquare className="w-5 h-5 text-indigo-600" />

                  <h2 className="font-bold text-slate-800">
                    Conversations
                  </h2>

                </div>

              </div>


              {loadingConversations ? (

                <div className="flex justify-center py-12">

                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />

                </div>

              ) : conversations.length === 0 ? (

                <div className="p-8 text-center">

                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />

                  <p className="font-semibold text-slate-600">
                    No conversations yet
                  </p>

                  <p className="text-sm text-slate-400 mt-1">
                    Open a product and chat with its seller.
                  </p>

                </div>

              ) : (

                <div className="divide-y divide-slate-100">

                  {conversations.map(
                    (conversation) => {

                      const other =
                        getOtherParticipant(
                          conversation
                        );

                      const isSelected =
                        selectedConversation?._id ===
                        conversation._id;

                      return (

                        <button
                          key={conversation._id}
                          onClick={() =>
                            selectConversation(
                              conversation
                            )
                          }
                          className={`w-full text-left p-4 transition ${
                            isSelected
                              ? "bg-indigo-50"
                              : "hover:bg-slate-50"
                          }`}
                        >

                          <div className="flex gap-3">

                            <div className="w-11 h-11 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">

                              <User className="w-5 h-5 text-indigo-600" />

                            </div>


                            <div className="min-w-0 flex-1">

                              <div className="flex items-center justify-between gap-2">

                                <p className="font-semibold text-slate-800 truncate">

                                  {other?.name ||
                                    "User"}

                                </p>

                                <span className="text-[10px] text-slate-400 flex-shrink-0">

                                  {formatConversationTime(
                                    conversation.lastMessageAt
                                  )}

                                </span>

                              </div>


                              <div className="flex items-center justify-between gap-2 mt-1">

                                <p className="text-xs text-slate-500 truncate">

                                  {conversation.product?.title ||
                                    "Product"}

                                </p>

                                {conversation.unreadCount >
                                  0 && (

                                  <span className="min-w-5 h-5 px-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">

                                    {conversation.unreadCount >
                                    9
                                      ? "9+"
                                      : conversation.unreadCount}

                                  </span>

                                )}

                              </div>


                              <p className="text-xs text-slate-400 truncate mt-1">

                                {conversation.lastMessage ||
                                  "Start a conversation"}

                              </p>

                            </div>

                          </div>

                        </button>

                      );

                    }
                  )}

                </div>

              )}

            </div>


            {/* =================================
                CHAT WINDOW
            ================================= */}

            <div className="flex flex-col min-h-[650px]">


              {!selectedConversation ? (

                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">

                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">

                    <MessageSquare className="w-8 h-8 text-indigo-600" />

                  </div>

                  <h2 className="text-xl font-bold text-slate-800">
                    Select a conversation
                  </h2>

                  <p className="text-sm text-slate-500 mt-2 max-w-sm">
                    Choose a conversation from the left to start messaging.
                  </p>

                </div>

              ) : (

                <>

                  {/* CHAT HEADER */}

                  <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">

                    <div className="flex items-center gap-3">

                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">

                        <User className="w-5 h-5 text-indigo-600" />

                      </div>

                      <div>

                        <p className="font-bold text-slate-800">

                          {getOtherParticipant(
                            selectedConversation
                          )?.name ||
                            "User"}

                        </p>

                        <p className="text-xs text-slate-500">

                          {selectedConversation.product?.title ||
                            "Product"}

                        </p>

                      </div>

                    </div>


                    <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500">

                      <Package className="w-4 h-4" />

                      {selectedConversation.product?.title ||
                        "Product"}

                    </div>

                  </div>


                  {/* MESSAGES */}

                  <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-slate-50">

                    {loadingMessages ? (

                      <div className="h-full flex items-center justify-center">

                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />

                      </div>

                    ) : sortedMessages.length === 0 ? (

                      <div className="h-full flex flex-col items-center justify-center text-center">

                        <MessageSquare className="w-10 h-10 text-slate-300 mb-3" />

                        <p className="font-semibold text-slate-600">
                          No messages yet
                        </p>

                        <p className="text-sm text-slate-400">
                          Send the first message.
                        </p>

                      </div>

                    ) : (

                      <div className="space-y-3">

                        {sortedMessages.map(
                          (message) => {

                            const senderId =
                              message.sender?._id ||
                              message.sender;

                            const isMine =
                              senderId?.toString() ===
                              user?._id?.toString();

                            return (

                              <div
                                key={message._id}
                                className={`flex ${
                                  isMine
                                    ? "justify-end"
                                    : "justify-start"
                                }`}
                              >

                                <div
                                  className={`max-w-[80%] sm:max-w-[65%] px-4 py-3 rounded-2xl ${
                                    isMine
                                      ? "bg-indigo-600 text-white rounded-br-md"
                                      : "bg-white border border-slate-200 text-slate-700 rounded-bl-md"
                                  }`}
                                >

                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {message.text}
                                  </p>

                                  <p
                                    className={`text-[10px] mt-1 text-right ${
                                      isMine
                                        ? "text-indigo-100"
                                        : "text-slate-400"
                                    }`}
                                  >
                                    {formatTime(
                                      message.createdAt
                                    )}
                                  </p>

                                </div>

                              </div>

                            );

                          }
                        )}

                      </div>

                    )}

                  </div>


                  {/* MESSAGE INPUT */}

                  <form
                    onSubmit={handleSendMessage}
                    className="p-4 border-t border-slate-200 bg-white"
                  >

                    <div className="flex items-end gap-2">

                      <textarea
                        value={text}
                        onChange={(event) =>
                          setText(event.target.value)
                        }
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message..."
                        rows={1}
                        maxLength={1000}
                        className="flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />

                      <button
                        type="submit"
                        disabled={
                          !text.trim() ||
                          sending
                        }
                        className="w-11 h-11 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition"
                      >

                        {sending ? (

                          <Loader2 className="w-5 h-5 animate-spin" />

                        ) : (

                          <Send className="w-5 h-5" />

                        )}

                      </button>

                    </div>

                    <p className="text-[10px] text-slate-400 mt-2">
                      Press Enter to send • Shift + Enter for a new line
                    </p>

                  </form>

                </>

              )}

            </div>

          </div>

        </div>

      </div>

    </div>

  );

};

export default Messages;
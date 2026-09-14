import React, { useEffect, useRef, useState } from 'react';
import api, { assetUrl } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useNotifications } from '../context/NotificationContext';
import ImageUpload from './ImageUpload';

export default function ChatWindow({ otherUser }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { refreshUnread } = useNotifications();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // Load message history whenever the conversation partner changes
  useEffect(() => {
    if (!otherUser?.id) return;
    api.get(`/messages/${otherUser.id}`).then(({ data }) => {
      setMessages(data.messages);
      // The GET above marks incoming messages as read server-side, so sync the badge
      refreshUnread();
    });
  }, [otherUser?.id, refreshUnread]);

  // Listen for real-time incoming messages relevant to this conversation
  useEffect(() => {
    if (!socket) return;

    function handleReceive(msg) {
      const belongsHere =
        (msg.sender === otherUser.id && msg.receiver === user.id) ||
        (msg.sender === user.id && msg.receiver === otherUser.id);
      if (belongsHere) setMessages((prev) => [...prev, msg]);
    }
    function handleTyping({ userId }) {
      if (userId === otherUser.id) setOtherTyping(true);
    }
    function handleStopTyping({ userId }) {
      if (userId === otherUser.id) setOtherTyping(false);
    }

    socket.on('receive_message', handleReceive);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);

    return () => {
      socket.off('receive_message', handleReceive);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [socket, otherUser?.id, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherTyping]);

  function handleTypingInput(value) {
    setText(value);
    if (!socket) return;
    socket.emit('typing', { receiverId: otherUser.id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop_typing', { receiverId: otherUser.id });
    }, 1200);
  }

  function handleImageSelected(file) {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function handleSend() {
    if (!text.trim() && !imageFile) return;
    setSending(true);
    try {
      let imageURL = '';
      if (imageFile) {
        const form = new FormData();
        form.append('image', imageFile);
        const { data } = await api.post('/messages/upload-image', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        imageURL = data.imageURL;
      }

      if (socket) {
        socket.emit('send_message', { receiverId: otherUser.id, text: text.trim(), imageURL });
      } else {
        // Fallback to REST if socket isn't connected yet
        await api.post('/messages', { receiverId: otherUser.id, text: text.trim(), imageURL });
      }

      setText('');
      setImageFile(null);
      setImagePreview('');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => {
          const mine = m.sender === user.id;
          return (
            <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                  mine ? 'bg-taarof-500 text-white rounded-br-sm' : 'bg-white border border-gray-100 rounded-bl-sm'
                }`}
              >
                {m.imageURL && (
                  <img src={assetUrl(m.imageURL)} alt="shared" className="rounded-lg mb-1 max-h-64 object-cover" />
                )}
                {m.text && <p className="text-sm whitespace-pre-wrap">{m.text}</p>}
              </div>
            </div>
          );
        })}
        {otherTyping && <p className="text-xs text-dune-900/40 italic">{otherUser.name} is typing…</p>}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-gray-100 p-3">
        {imagePreview && (
          <ImageUpload
            previewSrc={imagePreview}
            onClearPreview={() => {
              setImageFile(null);
              setImagePreview('');
            }}
            onFileSelected={handleImageSelected}
          >
            {null}
          </ImageUpload>
        )}
        <div className="flex items-center gap-2">
          <ImageUpload onFileSelected={handleImageSelected}>
            <span className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-taarof-50 text-xl">📷</span>
          </ImageUpload>
          <input
            className="input-field flex-1"
            placeholder={`Message ${otherUser.name}…`}
            value={text}
            onChange={(e) => handleTypingInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button onClick={handleSend} disabled={sending || (!text.trim() && !imageFile)} className="btn-primary !px-4 !py-2">
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

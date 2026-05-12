import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import './App.css';

const SERVER_URL = 'http://localhost:3001';
const DOC_ID = 'my-first-document';
const USER = { 
  name: 'User_' + Math.floor(Math.random() * 100), 
  color: '#6366f1' 
};

function App() {
  const [content, setContent] = useState('');
  const [users, setUsers] = useState([]);
  const [saved, setSaved] = useState(true);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const saveTimer = useRef(null);

  useEffect(() => {
    const socket = io(SERVER_URL);
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join-document', { docId: DOC_ID, user: USER });
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('receive-changes', (newContent) => {
      setContent(newContent);
    });

    socket.on('users-update', (activeUsers) => {
      setUsers(activeUsers);
    });

    socket.on('document-saved', () => setSaved(true));

    return () => socket.disconnect();
  }, []);

  const handleChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);
    setSaved(false);

    socketRef.current?.emit('send-changes', { 
      docId: DOC_ID, 
      delta: newContent 
    });

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      socketRef.current?.emit('save-document', { 
        docId: DOC_ID, 
        content: newContent 
      });
      setSaved(true);
    }, 2000);
  };

  return (
    <div className="app">
      {/* Header */}
      <div className="header">
        <div className="logo">📄 CollabDocs</div>
        <div className="doc-title">Internship Task 3</div>
        <div className="header-right">
          <div className="users-list">
            {users.map((u, i) => (
              <div key={i} className="user-badge"
                style={{ background: u.color || '#6366f1' }}
                title={u.name}>
                {u.name?.[0]?.toUpperCase()}
              </div>
            ))}
          </div>
          <div className={`status ${connected ? 'online' : 'offline'}`}>
            {connected ? '🟢 Connected' : '🔴 Offline'}
          </div>
          <div className={`save-status ${saved ? 'saved' : 'saving'}`}>
            {saved ? '✓ Saved' : '⏳ Saving...'}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <span className="toolbar-label">✏️ Real-Time Collaborative Editor</span>
        <span className="toolbar-info">
          {users.length} user(s) online · Doc: {DOC_ID}
        </span>
      </div>

      {/* Editor */}
      <textarea
        className="editor"
        value={content}
        onChange={handleChange}
        placeholder="Start typing... your changes sync in real-time with all connected users!"
        spellCheck="true"
      />

      {/* Footer */}
      <div className="footer">
        <span>Auto-saves every 2 seconds</span>
        <span>{content.split(/\s+/).filter(Boolean).length} words</span>
        <span>{content.length} characters</span>
      </div>
    </div>
  );
}

export default App;
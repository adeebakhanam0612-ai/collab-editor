const Document = require('./models/Document');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected!'))
  .catch(err => console.error('MongoDB error:', err));

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Track connected users
const activeUsers = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-document', ({ docId, user }) => {
    socket.join(docId);
    activeUsers[socket.id] = { ...user, docId };
    
    // Tell everyone in room who is online
    io.to(docId).emit('users-update', 
      Object.values(activeUsers).filter(u => u.docId === docId)
    );
    console.log(`${user.name} joined document: ${docId}`);
  });

  socket.on('send-changes', ({ docId, delta }) => {
    // Broadcast change to everyone EXCEPT sender
    socket.broadcast.to(docId).emit('receive-changes', delta);
  });

  socket.on('cursor-move', ({ docId, cursor, user }) => {
    socket.broadcast.to(docId).emit('cursor-update', { cursor, user });
  });

  socket.on('save-document', async ({ docId, content }) => {
    try {
      await Document.findByIdAndUpdate(docId, { content }, { upsert: true });
      io.to(docId).emit('document-saved');
    } catch (err) {
      console.error('Save error:', err);
    }
  });

  socket.on('disconnect', () => {
    const user = activeUsers[socket.id];
    if (user) {
      delete activeUsers[socket.id];
      io.to(user.docId).emit('users-update',
        Object.values(activeUsers).filter(u => u.docId === user.docId)
      );
    }
    console.log('User disconnected:', socket.id);
  });
});

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'CollabDocs server is running!' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
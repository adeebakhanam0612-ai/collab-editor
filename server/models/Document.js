const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  _id: String,
  title: {
    type: String,
    default: 'Untitled Document'
  },
  content: {
    type: String,
    default: ''
  },
  versions: [
    {
      content: String,
      savedAt: { type: Date, default: Date.now },
      savedBy: String,
    }
  ],
  collaborators: [String],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Document', DocumentSchema);
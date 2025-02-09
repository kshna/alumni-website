const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    graduationYear: { type: Number, required: true },
    photo: { type: String },
    password: { type: String, required: true },
    connections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    pendingConnections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('User', UserSchema);


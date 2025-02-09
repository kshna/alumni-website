const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');


// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Registration route
router.post('/register', upload.single('photo'), [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('graduationYear', 'Graduation year is required').not().isEmpty(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, graduationYear, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const photoPath = req.file? `uploads/${req.file.filename}` : ''
        user = new User({ name, email, graduationYear, password: hashedPassword, photo: photoPath });
        await user.save();
        const token = jwt.sign({ id: user._id }, 'your_secret_key', { expiresIn: '1h' });
        res.status(201).json({ token, user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Registration route
/*router.post('/register', [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('graduationYear', 'Graduation year is required').not().isEmpty(),
    check('password', 'Password must be 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, graduationYear, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({ name, email, graduationYear, password: hashedPassword });
        await user.save();
        const token = jwt.sign({ id: user._id }, 'your_secret_key', { expiresIn: '1h' });
        res.status(201).json({ token, user });
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});
*/
// Login route
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }
        const token = jwt.sign({ id: user._id }, 'your_secret_key', { expiresIn: '1h' });
        res.json({ token, user });
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

// Search Alumni route
router.get('/search', auth, async (req, res) => {
    const { name } = req.query;
    try {
        const users = await User.find({ name: new RegExp(name, 'i') });
        res.json(users);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

// Send Connection Request route
router.post('/connect/:id', auth, async (req, res) => {
    const { id } = req.params;
    const userId = req.user;
    try {
        const user = await User.findById(userId);
        const recipient = await User.findById(id);
        if (!recipient.pendingConnections.includes(userId) && !recipient.connections.includes(userId)) {
            recipient.pendingConnections.push(userId);
            await recipient.save();
            res.json({ message: 'Connection request sent' });
        } else {
            res.status(400).json({ message: 'Connection request already sent' });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

// Accept Connection Request route
router.post('/accept/:id', auth, async (req, res) => {
    const { id } = req.params;
    const userId = req.user;
    try {
        const user = await User.findById(userId);
        const sender = await User.findById(id);
        if (user.pendingConnections.includes(id)) {
            user.connections.push(id);
            user.pendingConnections = user.pendingConnections.filter(conn => conn.toString() !== id);
            sender.connections.push(userId);
            await user.save();
            await sender.save();
            res.json({ message: 'Connection request accepted' });
        } else {
            res.status(400).json({ message: 'No connection request found' });
        }
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

// List Connections route
router.get('/:id/connections', auth, async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id).populate('connections');
        res.json(user.connections);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('Server error');
    }
});

// Get Pending Connection Requests route
router.get('/:id/pending-requests', auth, async (req, res) => {
    const { id } = req.params;
    try {
        const user = await User.findById(id).populate('pendingConnections');
        res.json(user.pendingConnections);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Fetch all users route
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;


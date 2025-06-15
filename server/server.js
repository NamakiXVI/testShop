const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path'); // Hinzugefügt
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Statische Dateien für den Store-Frontend
app.use(express.static(path.join(__dirname, '../store-front')));

// Statische Dateien für das Admin-Panel
app.use('/admin', express.static(path.join(__dirname, '../admin-site')));

// Data paths
const productsPath = path.join(__dirname, 'products.json');
const ordersPath = path.join(__dirname, 'orders.json');

// Read initial data
let products = [];
let orders = [];

try {
    products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));
    orders = JSON.parse(fs.readFileSync(ordersPath, 'utf8')) || [];
} catch (err) {
    console.error('Error reading data files:', err);
    // Initialize with sample data if files don't exist
    products = [
        {
            id: 1,
            name: "Quantum Smartwatch",
            price: 399.99,
            description: "Next-gen wearable with holographic display",
            icon: "fas fa-clock"
        },
        {
            id: 2,
            name: "Neural Headphones",
            price: 249.99,
            description: "AI-powered adaptive sound technology",
            icon: "fas fa-headphones"
        },
        {
            id: 3,
            name: "Holo Projector",
            price: 599.99,
            description: "True 3D holographic projection system",
            icon: "fas fa-cube"
        },
        {
            id: 4,
            name: "Quantum Keyboard",
            price: 199.99,
            description: "Zero-latency mechanical keyboard",
            icon: "fas fa-keyboard"
        }
    ];
    orders = [];
}

// Save data to files
function saveProducts() {
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');
}

function saveOrders() {
    fs.writeFileSync(ordersPath, JSON.stringify(orders, null, 2), 'utf8');
}

// Simple admin credentials (for demo only - use proper auth in production)
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "securepassword123";
const JWT_SECRET = "supersecretkey";

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Routes

// Get all products
app.get('/api/products', (req, res) => {
    res.json(products);
});

// Get single product
app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
});

// Create new order
app.post('/api/orders', (req, res) => {
    const order = req.body;
    
    // Generate unique shipping ID
    const shippingId = 'NX-' + Date.now().toString(36).toUpperCase();
    
    // Create order object with new status
    const newOrder = {
        ...order,
        shippingId,
        date: new Date().toISOString(),
        status: 'Order Received', // Default status
        trackingNumber: '',
        notes: ''
    };
    
    // Add to orders
    orders.push(newOrder);
    saveOrders();
    
    res.status(201).json({
        message: 'Order created successfully',
        shippingId
    });
});
// Admin login
app.post('/api/admin/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        // Create JWT token
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Get all orders (protected)
app.get('/api/admin/orders', authenticateToken, (req, res) => {
    // Return both orders and status options
    res.json({
        orders: orders,
        statusOptions: ["Order Received", "Processing", "Shipped", "Delivered"]
    });
});

// Update order status (protected)
app.patch('/api/admin/orders/:shippingId', authenticateToken, (req, res) => {
    const { shippingId } = req.params;
    const { status } = req.body;
    
    const order = orders.find(o => o.shippingId === shippingId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    order.status = status;
    saveOrders();
    
    res.json({
        message: 'Order status updated',
        order
    });
});

// Export orders to CSV (protected)
app.get('/api/admin/orders/export', authenticateToken, (req, res) => {
    let csv = 'Shipping ID,Date,Customer,Total,Status\n';
    
    orders.forEach(order => {
        csv += `"${order.shippingId}","${order.date}","${order.customer.name}","${order.total}","${order.status}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=orders.csv');
    res.send(csv);
});

// Update order structure to include trackingNumber and notes
// New endpoint for order tracking

app.post('/api/orders/track', (req, res) => {
    const { orderId, email } = req.body;
    
    if (!orderId && !email) {
        return res.status(400).json({ message: 'Please provide order ID or email' });
    }
    
    let order;
    if (orderId) {
        order = orders.find(o => o.shippingId === orderId);
    } else {
        // If email is provided, find the most recent order for that email
        const customerOrders = orders.filter(o => o.customer.email === email);
        if (customerOrders.length > 0) {
            // Sort by date descending to get the most recent
            customerOrders.sort((a, b) => new Date(b.date) - new Date(a.date));
            order = customerOrders[0];
        }
    }
    
    if (!order) {
        return res.status(404).json({ message: 'Order not found' });
    }
    
    // For security, we don't return all customer data, only what's needed for tracking
    const { shippingId, status, trackingNumber, notes, date, items, total } = order;
    res.json({
        shippingId,
        status,
        trackingNumber,
        notes,
        date,
        items,
        total,
        customer: {
            name: order.customer.name
        }
    });
});

// Update existing PATCH endpoint to handle trackingNumber and notes
app.patch('/api/admin/orders/:shippingId', authenticateToken, (req, res) => {
    const { shippingId } = req.params;
    const { status, trackingNumber, notes } = req.body;
    
    const order = orders.find(o => o.shippingId === shippingId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    
    // Validate status
    const validStatuses = ["Order Received", "Processing", "Shipped", "Delivered"];
    if (status && !validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }
    
    if (status) order.status = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    if (notes) order.notes = notes;
    
    saveOrders();
    
    res.json({
        message: 'Order updated',
        order
    });
});

//NEW STUFF
// Add messages.json persistence
const messagesPath = path.join(__dirname, 'messages.json');
let messages = [];

try {
    messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8')) || [];
} catch (err) {
    messages = [];
}

function saveMessages() {
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2), 'utf8');
}

// Contact form endpoint
app.post('/api/contact', (req, res) => {
    const { firstName, lastName, email, phone, subject, message } = req.body;
    
    if (!firstName || !lastName || !email || !message) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const newMessage = {
        id: 'MSG-' + Date.now().toString(36).toUpperCase(),
        name: `${firstName} ${lastName}`,
        email,
        phone: phone || '',
        subject: subject || 'General Inquiry',
        message,
        date: new Date().toISOString(),
        read: false,
        responses: []
    };
    
    messages.push(newMessage);
    saveMessages();
    
    res.json({ message: 'Contact message received' });
});

// Admin message endpoints
app.get('/api/admin/messages', authenticateToken, (req, res) => {
    // Sort by unread first, then by date
    const sortedMessages = [...messages].sort((a, b) => {
        if (a.read === b.read) {
            return new Date(b.date) - new Date(a.date);
        }
        return a.read ? 1 : -1;
    });
    
    res.json(sortedMessages);
});

app.patch('/api/admin/messages/:id/read', authenticateToken, (req, res) => {
    const message = messages.find(m => m.id === req.params.id);
    
    if (message) {
        message.read = true;
        saveMessages();
        res.json({ message: 'Message marked as read' });
    } else {
        res.status(404).json({ message: 'Message not found' });
    }
});

app.post('/api/admin/messages/:id/respond', authenticateToken, (req, res) => {
    const message = messages.find(m => m.id === req.params.id);
    
    if (!message) {
        return res.status(404).json({ message: 'Message not found' });
    }
    
    const { response } = req.body;
    
    if (!response) {
        return res.status(400).json({ message: 'Response content required' });
    }
    
    // Add response to message
    message.responses = message.responses || [];
    message.responses.push({
        content: response,
        date: new Date().toISOString(),
        admin: req.user.username
    });
    
    saveMessages();
    
    // In a real app, you would send an email here
    console.log(`Sending response to ${message.email}: ${response}`);
    
    res.json({ message: 'Response sent' });
});

//NEW STUFF

// Update order status options
const ORDER_STATUSES = {
  RECEIVED: 'Order Received',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered'
};

// Update PATCH endpoint
app.patch('/api/admin/orders/:shippingId', authenticateToken, (req, res) => {
  const { shippingId } = req.params;
  const { status, trackingNumber, notes } = req.body;
  
  const order = orders.find(o => o.shippingId === shippingId);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  
  if (status) order.status = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  if (notes) order.notes = notes;
  
  saveOrders();
  
  res.json({
    message: 'Order updated',
    order
  });
});

// Add status options to GET orders endpoint
app.get('/api/admin/orders', authenticateToken, (req, res) => {
  res.json({
    orders,
    statusOptions: Object.values(ORDER_STATUSES)
  });
});

// Add this after the other route handlers
// DELETE order endpoint
app.delete('/api/admin/orders/:shippingId', authenticateToken, (req, res) => {
    const shippingId = req.params.shippingId;
    
    // Find index of order
    const orderIndex = orders.findIndex(o => o.shippingId === shippingId);
    
    if (orderIndex === -1) {
        return res.status(404).json({
            success: false,
            message: `Order ${shippingId} not found`
        });
    }
    
    // Remove the order
    orders.splice(orderIndex, 1);
    saveOrders();
    
    res.json({
        success: true,
        message: `Order ${shippingId} deleted successfully`
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
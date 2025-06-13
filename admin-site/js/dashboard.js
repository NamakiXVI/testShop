// Auto-generated: Admin dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
    // Check for token
    const token = localStorage.getItem('adminToken');
    if (!token) {
        redirectToLogin();
        return;
    }
    
    // Setup logout button
    document.getElementById('logout-btn').addEventListener('click', logout);
    
    // Setup export button
    document.getElementById('export-btn').addEventListener('click', exportOrders);
    
    // Load orders
    loadOrders();
    document.getElementById('refreshOrders').addEventListener('click', loadOrders);
    document.getElementById('statusFilter').addEventListener('change', loadOrders);
    document.getElementById('searchOrders').addEventListener('input', debounce(loadOrders, 300));
});

function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Update renderOrders function
function renderOrders(orders) {
    const container = document.getElementById('orders-container');
    container.innerHTML = '';
    
    orders.forEach(order => {
        const orderEl = document.createElement('div');
        orderEl.className = 'order-card';
        orderEl.innerHTML = `
            <div class="order-header">
                <div class="order-id">${order.shippingId}</div>
                <div class="order-date">${formatDate(order.date)}</div>
                <div class="order-status ${order.status}">${order.status}</div>
            </div>
            <div class="order-customer">
                <div class="customer-name">${order.customer.name}</div>
                <div class="customer-email">${order.customer.email}</div>
                <div class="customer-address">${order.customer.address.street}, ${order.customer.address.city}, ${order.customer.address.postalCode}, ${order.customer.address.country}</div>
            </div>
            <div class="order-items">
                <h4>Items</h4>
                <ul>
                    ${order.items.map(item => `
                        <li>${item.name} - ${item.quantity} x $${item.price.toFixed(2)}</li>
                    `).join('')}
                </ul>
            </div>
            <div class="order-footer">
                <div class="order-total">Total: $${order.total.toFixed(2)}</div>
                
                <div class="tracking-info">
                    <div class="form-group">
                        <label>Tracking Number</label>
                        <input type="text" class="tracking-input" value="${order.trackingNumber || ''}" 
                               placeholder="Enter tracking number" data-id="${order.shippingId}">
                    </div>
                    <div class="form-group">
                        <label>Order Notes</label>
                        <textarea class="notes-textarea" placeholder="Add notes for customer"
                                  data-id="${order.shippingId}">${order.notes || ''}</textarea>
                    </div>
                </div>
                
                <div class="order-actions">
                    <select class="status-select" data-id="${order.shippingId}">
                        <option value="pending" ${order.status === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="processing" ${order.status === 'processing' ? 'selected' : ''}>Processing</option>
                        <option value="shipped" ${order.status === 'shipped' ? 'selected' : ''}>Shipped</option>
                        <option value="delivered" ${order.status === 'delivered' ? 'selected' : ''}>Delivered</option>
                    </select>
                    <button class="btn btn-primary update-order" data-id="${order.shippingId}">
                        Update Order
                    </button>
                </div>
            </div>
        `;
        container.appendChild(orderEl);
    });
    
    // Add event listeners to update buttons
    document.querySelectorAll('.update-order').forEach(button => {
        button.addEventListener('click', updateOrder);
    });
}

// New updateOrder function
async function updateOrder(event) {
    const shippingId = event.target.dataset.id;
    const status = document.querySelector(`.status-select[data-id="${shippingId}"]`).value;
    const trackingNumber = document.querySelector(`.tracking-input[data-id="${shippingId}"]`).value;
    const notes = document.querySelector(`.notes-textarea[data-id="${shippingId}"]`).value;
    
    event.target.disabled = true;
    event.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    
    try {
        const response = await fetch(`http://localhost:3000/api/admin/orders/${shippingId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ status, trackingNumber, notes })
        });
        
        if (response.ok) {
            // Reload orders
            loadOrders();
        } else {
            throw new Error('Failed to update order status');
        }
    } catch (error) {
        console.error('Update error:', error);
        alert('Failed to update order');
        event.target.disabled = false;
        event.target.innerHTML = 'Update Order';
    }
}
    
    // Add event listeners
    document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', async (e) => {
            const orderId = e.target.dataset.orderId;
            const status = e.target.value;
            
            try {
                const response = await fetch(`http://localhost:3000/api/admin/orders/${orderId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: JSON.stringify({ status })
                });
                
                if (!response.ok) throw new Error('Update failed');
                
                // Update UI
                const orderCard = e.target.closest('.order-card');
                const statusBadge = orderCard.querySelector('.order-status');
                statusBadge.textContent = status;
                statusBadge.className = `order-status ${status}`;
            } catch (error) {
                alert('Failed to update order status');
            }
        });
    });
    
    document.querySelectorAll('.update-tracking').forEach(button => {
        button.addEventListener('click', async (e) => {
            const orderId = e.target.dataset.orderId;
            const trackingInput = document.querySelector(`.tracking-input input[data-order-id="${orderId}"]`);
            const trackingNumber = trackingInput.value.trim();
            
            try {
                const response = await fetch(`http://localhost:3000/api/admin/orders/${orderId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: JSON.stringify({ trackingNumber })
                });
                
                if (!response.ok) throw new Error('Update failed');
                
                alert('Tracking number updated successfully');
            } catch (error) {
                alert('Failed to update tracking number');
            }
        });
    });
    
    document.querySelectorAll('.update-notes').forEach(button => {
        button.addEventListener('click', async (e) => {
            const orderId = e.target.dataset.orderId;
            const notesInput = document.querySelector(`.notes-input textarea[data-order-id="${orderId}"]`);
            const adminNotes = notesInput.value.trim();
            
            try {
                const response = await fetch(`http://localhost:3000/api/admin/orders/${orderId}`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                    },
                    body: JSON.stringify({ adminNotes })
                });
                
                if (!response.ok) throw new Error('Update failed');
                
                alert('Notes updated successfully');
            } catch (error) {
                alert('Failed to update notes');
            }
        });
    });


function redirectToLogin() {
    window.location.href = 'admin.html';
}

function logout() {
    localStorage.removeItem('adminToken');
    redirectToLogin();
}

async function loadOrders() {
    const container = document.getElementById('orders-container');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch('http://localhost:3000/api/admin/orders', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
            const data = await response.json();
            
            // Check if we got the new response format
            if (data.orders && data.statusOptions) {
                renderOrders(data.orders, data.statusOptions);
            } else {
                // Fallback to old format
                renderOrders(data, [
                    "Order Received", 
                    "Processing", 
                    "Shipped", 
                    "Delivered"
                ]);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            container.innerHTML = '<p class="error">Failed to load orders. Please try again later.</p>';
        }
}

    function renderOrders(orders, statusOptions) {
        const container = document.getElementById('orders-container');
        container.innerHTML = '';

        orders.forEach(order => {
            // FIX: Use a safe status class generator
            const statusClass = getStatusClass(order.status);
            
            const orderEl = document.createElement('div');
            orderEl.className = 'order-card';
            orderEl.innerHTML = `
                <div class="order-header">
                    <div class="order-id">${order.shippingId}</div>
                    <div class="order-date">${formatDate(order.date)}</div>
                    <div class="order-status ${statusClass}">${order.status}</div>
                </div>
                <div class="order-customer">
                    <div class="customer-name">${order.customer.name}</div>
                    <div class="customer-email">${order.customer.email}</div>
                    <div class="customer-address">${order.customer.address.street}, ${order.customer.address.city}, ${order.customer.address.postalCode}, ${order.customer.address.country}</div>
                </div>
                <div class="order-items">
                    <h4>Items</h4>
                    <ul>
                        ${order.items.map(item => `
                            <li>${item.name} - ${item.quantity} x $${item.price.toFixed(2)}</li>
                        `).join('')}
                    </ul>
                </div>
                <div class="order-footer">
                    <div class="order-total">Total: $${order.total.toFixed(2)}</div>
                    
                    <div class="tracking-info">
                        <div class="form-group">
                            <label>Tracking Number</label>
                            <input type="text" class="tracking-input" value="${order.trackingNumber || ''}" 
                                   placeholder="Enter tracking number" data-id="${order.shippingId}">
                        </div>
                        <div class="form-group">
                            <label>Order Notes</label>
                            <textarea class="notes-textarea" placeholder="Add notes for customer"
                                      data-id="${order.shippingId}">${order.notes || ''}</textarea>
                        </div>
                    </div>
                    
                    <div class="order-actions">
                        <select class="status-select" data-id="${order.shippingId}">
                            ${statusOptions.map(option => `
                                <option value="${option}" ${order.status === option ? 'selected' : ''}>
                                    ${option}
                                </option>
                            `).join('')}
                        </select>
                        <button class="btn btn-primary update-order" data-id="${order.shippingId}">
                            Update Order
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(orderEl);
        });
        
        // Add event listeners to update buttons
        document.querySelectorAll('.update-order').forEach(button => {
            button.addEventListener('click', updateOrder);
        });
    }

function getStatusClass(status) {
        if (!status) return '';
        
        const statusMap = {
            'Order Received': 'status-received',
            'Processing': 'status-processing',
            'Shipped': 'status-shipped',
            'Delivered': 'status-delivered',
            'pending': 'status-pending',
            'processing': 'status-processing',
            'shipped': 'status-shipped',
            'delivered': 'status-delivered'
        };
        
        // Try direct match first
        if (statusMap[status]) return statusMap[status];
        
        // Try case-insensitive match
        const lowerStatus = status.toLowerCase();
        for (const key in statusMap) {
            if (key.toLowerCase() === lowerStatus) {
                return statusMap[key];
            }
        }
        
        return '';
    }

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function markAsShipped(event) {
    const shippingId = event.target.dataset.id;
    event.target.disabled = true;
    event.target.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    
    try {
        const response = await fetch(`http://localhost:3000/api/admin/orders/${shippingId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ status: 'shipped' })
        });
        
        if (response.ok) {
            // Reload orders
            loadOrders();
        } else {
            throw new Error('Failed to update order status');
        }
    } catch (error) {
        console.error('Update error:', error);
        alert('Failed to mark order as shipped');
        event.target.disabled = false;
        event.target.innerHTML = 'Mark as Shipped';
    }
}

function exportOrders() {
    // Trigger download by creating a temporary link
    const token = localStorage.getItem('adminToken');
    const link = document.createElement('a');
    link.href = `http://localhost:3000/api/admin/orders/export?token=${token}`;
    link.download = 'orders.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Add to existing dashboard.js

// Tab switching NEW STUFF
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Update active tab
        document.querySelectorAll('.admin-tab').forEach(t => {
            t.classList.remove('active');
        });
        this.classList.add('active');
        
        // Show active tab content
        const tabId = this.dataset.tab;
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabId}-tab`).classList.add('active');
        
        // Load content if needed
        if (tabId === 'inbox') {
            loadMessages();
        }
    });
});

// Message loading
async function loadMessages() {
    const container = document.getElementById('messages-list');
    container.innerHTML = '<div class="spinner"></div>';
    
    try {
        const response = await fetch('http://localhost:3000/api/admin/messages', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (response.status === 401) {
            redirectToLogin();
            return;
        }
        
        const messages = await response.json();
        
        if (messages.length === 0) {
            container.innerHTML = '<p class="empty">No messages found.</p>';
            return;
        }
        
        renderMessages(messages);
    } catch (error) {
        console.error('Error loading messages:', error);
        container.innerHTML = '<p class="error">Failed to load messages. Please try again later.</p>';
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messages-list');
    container.innerHTML = '';
    
    messages.forEach(message => {
        const messageEl = document.createElement('div');
        messageEl.className = `message-card ${message.read ? '' : 'message-unread'}`;
        messageEl.dataset.id = message.id;
        messageEl.innerHTML = `
            <div class="message-header">
                <div class="message-name">${message.name}</div>
                <div class="message-date">${formatDate(message.date)}</div>
            </div>
            <div class="message-subject">${message.subject}</div>
            <div class="message-preview">${message.message.substring(0, 100)}...</div>
        `;
        container.appendChild(messageEl);
        
        // Add click event to view message
        messageEl.addEventListener('click', () => {
            viewMessage(message);
        });
    });
}

async function viewMessage(message) {
    // Mark as read
    await fetch(`http://localhost:3000/api/admin/messages/${message.id}/read`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
    });
    
    // Update UI
    document.querySelector(`.message-card[data-id="${message.id}"]`).classList.remove('message-unread');
    
    // Show message details
    document.getElementById('message-subject').textContent = message.subject;
    document.getElementById('message-from').textContent = `${message.name} <${message.email}>`;
    document.getElementById('message-date').textContent = formatDate(message.date);
    document.getElementById('message-content').textContent = message.message;
    
    document.getElementById('message-detail').style.display = 'block';
    document.getElementById('messages-list').style.display = 'none';
    
    // Setup response form
    document.getElementById('response-form').dataset.id = message.id;
    document.getElementById('response-content').value = '';
}

// Close message view
document.getElementById('close-message').addEventListener('click', () => {
    document.getElementById('message-detail').style.display = 'none';
    document.getElementById('messages-list').style.display = 'block';
});

// Send response
document.getElementById('response-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const messageId = this.dataset.id;
    const content = document.getElementById('response-content').value;
    
    try {
        const response = await fetch(`http://localhost:3000/api/admin/messages/${messageId}/respond`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            },
            body: JSON.stringify({ response: content })
        });
        
        if (response.ok) {
            alert('Response sent successfully!');
            document.getElementById('response-content').value = '';
        } else {
            throw new Error('Failed to send response');
        }
    } catch (error) {
        console.error('Response error:', error);
        alert('Failed to send response: ' + error.message);
    }
});

// Update renderOrders function with new statuses
function renderOrders(orders) {
    const container = document.getElementById('orders-container');
    container.innerHTML = '';
    
    orders.forEach(order => {
        const statusClass = `status-${order.status.toLowerCase().replace(/\s+/g, '-')}`;
        
        const orderEl = document.createElement('div');
        orderEl.className = 'order-card';
        console.log(order.shippingId);
        orderEl.innerHTML = `
            <div class="order-header">
                <div class="order-id">${order.shippingId}</div>
                <div class="order-date">${formatDate(order.date)}</div>
                <div class="order-status ${statusClass}">${order.status}</div>
            </div>
            <div class="order-customer">
                <div class="customer-name">${order.customer.name}</div>
                <div class="customer-email">${order.customer.email}</div>
                <div class="customer-address">${order.customer.address.street}, ${order.customer.address.city}, ${order.customer.address.postalCode}, ${order.customer.address.country}</div>
            </div>
            <div class="order-items">
                <h4>Items</h4>
                <ul>
                    ${order.items.map(item => `
                        <li>${item.name} - ${item.quantity} x $${item.price.toFixed(2)}</li>
                    `).join('')}
                </ul>
            </div>
            <div class="order-footer">
                <div class="order-total">Total: $${order.total.toFixed(2)}</div>
                
                <div class="tracking-info">
                    <div class="form-group">
                        <label>Tracking Number</label>
                        <input type="text" class="tracking-input" value="${order.trackingNumber || ''}" 
                               placeholder="Enter tracking number" data-id="${order.shippingId}">
                    </div>
                    <div class="form-group">
                        <label>Order Notes</label>
                        <textarea class="notes-textarea" placeholder="Add notes for customer"
                                  data-id="${order.shippingId}">${order.notes || ''}</textarea>
                    </div>
                </div>
                
                <div class="order-actions">
                    <select class="status-select" data-id="${order.shippingId}">
                        ${Object.values(order.statusOptions).map(option => `
                            <option value="${option}" ${order.status === option ? 'selected' : ''}>
                                ${option}
                            </option>
                        `).join('')}
                    </select>
                    <button class="btn btn-primary update-order" data-id="${order.shippingId}">
                        Update Order
                    </button>
                </div>
            </div>
        `;
        container.appendChild(orderEl);
    });
    
    // Add event listeners to update buttons
    document.querySelectorAll('.update-order').forEach(button => {
        button.addEventListener('click', updateOrder);
    });
}
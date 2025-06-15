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
    
    // Tab switching
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
    
    // Load orders
    loadOrders();
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
        
        // Handle 401 and 403 responses
        if (response.status === 401 || response.status === 403) {
            redirectToLogin();
            return;
        }
        
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Unexpected response: ${text}`);
        }
        
        const data = await response.json();
        
        // Check if we got the new response format
        let orders, statusOptions;
        if (data.orders && data.statusOptions) {
            orders = data.orders;
            statusOptions = data.statusOptions;
        } else {
            // Fallback to old format
            orders = data;
            statusOptions = ["Order Received", "Processing", "Shipped", "Delivered"];
        } 
        renderOrders(orders, statusOptions);
    } catch (error) {
        console.error('Error loading orders:', error);
        container.innerHTML = '<p class="error">Failed to load orders. Please try again later.</p>';
    }
}

// Single renderOrders function with statusOptions parameter
function renderOrders(orders, statusOptions) {
    const container = document.getElementById('orders-container');
    container.innerHTML = '';

    orders.forEach(order => {
        const orderTotal = order.total || 0;
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
                        <li>${item.name} - ${item.quantity} x $${(item.price || 0).toFixed(2)}</li>
                    `).join('')}
                </ul>
            </div>
            <div class="order-footer">
                <div class="order-total">Total: $${orderTotal.toFixed(2)}</div>
                
                <div class="order-actions" style="display: flex; gap: 8px; align-items: center;">
                    <select class="status-select" data-id="${order.shippingId}" style="flex: 1;">
                        ${statusOptions.map(option => `
                            <option value="${option}" ${order.status === option ? 'selected' : ''}>
                                ${option}
                            </option>
                        `).join('')}
                    </select>
                    <button class="btn btn-primary update-order" style="width: 100%;" style="flex: 1; white-space: nowrap;" data-id="${order.shippingId}">
                        Update Order
                    </button>
                    <!-- DELETE BUTTON ADDED HERE -->
                    <!--                     
                    <button class="btn btn-danger delete-order" data-id="${order.shippingId}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                    -->
                    
                </div>
            </div>
        `;
        container.appendChild(orderEl);
    });
    
    // Add event listeners to update buttons
    document.querySelectorAll('.update-order').forEach(button => {
        button.addEventListener('click', updateOrder);
    });
    
    // Add event listeners to delete buttons
    document.querySelectorAll('.delete-order').forEach(button => {
        button.addEventListener('click', deleteOrder);
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

// Update order function
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

function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.innerHTML = `
        <i class="fas ${isError ? 'fa-exclamation-circle' : 'fa-check-circle'}"></i>
        <span>${message}</span>
    `;
    
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Remove notification after delay
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

async function deleteOrder(event) {
    const button = event.target.closest('.delete-order');
    const shippingId = button.dataset.id;
    const orderCard = button.closest('.order-card');
    
    if (!confirm(`Are you sure you want to permanently delete order ${shippingId}? This action cannot be undone.`)) {
        return;
    }
    
    // Show deleting state
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
    button.disabled = true;
    
    try {
        const response = await fetch(`http://localhost:3000/api/admin/orders/${shippingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to delete order');
        }
        
        const result = await response.json();
        
        if (result.success) {
            // Add animation for deletion
            orderCard.style.opacity = '1';
            
            // Animate removal
            let opacity = 1;
            const fadeOut = setInterval(() => {
                opacity -= 0.05;
                orderCard.style.opacity = opacity;
                
                if (opacity <= 0) {
                    clearInterval(fadeOut);
                    orderCard.remove();
                    
                    // Show success notification
                    showNotification(`Order ${shippingId} deleted successfully`);
                }
            }, 30);
        } else {
            throw new Error(result.message || 'Failed to delete order');
        }
    } catch (error) {
        console.error('Delete error:', error);
        
        // Reset button state
        button.innerHTML = originalText;
        button.disabled = false;
        
        // Show error notification
        showNotification(`Delete failed: ${error.message}`, true);
    }
}
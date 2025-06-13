// Auto-generated: Checkout page functionality
document.addEventListener('DOMContentLoaded', () => {
    // Update cart count
    updateCartCount();
    
    // Load order summary
    loadOrderSummary();
    
    // Setup form submission
    const checkoutForm = document.getElementById('checkout-form');
    checkoutForm.addEventListener('submit', placeOrder);
});

async function loadOrderSummary() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const orderItemsContainer = document.getElementById('order-items');
    orderItemsContainer.innerHTML = '';
    
    let subtotal = 0;
    
    for (const item of cart) {
        try {
            const response = await fetch(`http://localhost:3000/api/products/${item.id}`);
            const product = await response.json();
            
            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;
            
            const orderItemEl = document.createElement('div');
            orderItemEl.className = 'order-item';
            orderItemEl.innerHTML = `
                <div class="order-item-name">
                    <span>${product.name}</span>
                    <span>${item.quantity} x $${product.price.toFixed(2)}</span>
                </div>
                <div class="order-item-total">$${itemTotal.toFixed(2)}</div>
            `;
            orderItemsContainer.appendChild(orderItemEl);
        } catch (error) {
            console.error('Error loading product:', error);
        }
    }
    
    document.getElementById('order-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('order-total').textContent = `$${subtotal.toFixed(2)}`;
}

async function placeOrder(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Basic validation
    if (!data.name || !data.email || !data.address || !data.city || !data.postal || !data.country) {
        alert('Please fill in all fields');
        return;
    }
    
    // Get cart
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    if (cart.length === 0) {
        alert('Your cart is empty');
        return;
    }
    
    // Calculate total
    let total = 0;
    const items = [];
    
    for (const item of cart) {
        const response = await fetch(`http://localhost:3000/api/products/${item.id}`);
        const product = await response.json();
        items.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: item.quantity
        });
        total += product.price * item.quantity;
    }
    
    // Create order object
    const order = {
        customer: {
            name: data.name,
            email: data.email,
            address: {
                street: data.address,
                city: data.city,
                postalCode: data.postal,
                country: data.country
            }
        },
        items,
        total
    };
    
    // Show loading
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    
    try {
        // Send order to server
        const response = await fetch('http://localhost:3000/api/orders', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(order)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            // Redirect to confirmation page
            window.location.href = `confirmation.html?shippingId=${result.shippingId}`;
        } else {
            throw new Error(result.message || 'Failed to place order');
        }
    } catch (error) {
        console.error('Order error:', error);
        alert('Failed to place order: ' + error.message);
        submitButton.disabled = false;
        submitButton.innerHTML = 'Place Order';
    }
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
    });
}
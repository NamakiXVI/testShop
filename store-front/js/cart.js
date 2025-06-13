// Auto-generated: Cart page functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Update cart count
    updateCartCount();
    
    // Load cart items
    loadCart();
});

async function loadCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartItemsContainer = document.getElementById('cart-items');
    const emptyCart = document.getElementById('empty-cart');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    if (cart.length === 0) {
        emptyCart.style.display = 'block';
        checkoutBtn.disabled = true;
        return;
    }
    
    emptyCart.style.display = 'none';
    checkoutBtn.disabled = false;
    
    // Clear container
    cartItemsContainer.innerHTML = '';
    
    let subtotal = 0;
    
    // Fetch product details for each item in cart
    for (const item of cart) {
        try {
            const response = await fetch(`http://localhost:3000/api/products/${item.id}`);
            const product = await response.json();
            
            const itemTotal = product.price * item.quantity;
            subtotal += itemTotal;
            
            const cartItemEl = document.createElement('div');
            cartItemEl.className = 'cart-item';
            cartItemEl.innerHTML = `
                <div class="cart-item-image">
                    <i class="${product.icon}"></i>
                </div>
                <div class="cart-item-details">
                    <h3 class="cart-item-title">${product.name}</h3>
                    <p class="cart-item-price">$${product.price.toFixed(2)}</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn minus" data-id="${product.id}">-</button>
                    <span class="quantity">${item.quantity}</span>
                    <button class="quantity-btn plus" data-id="${product.id}">+</button>
                </div>
                <div class="cart-item-total">$${itemTotal.toFixed(2)}</div>
                <button class="cart-item-remove" data-id="${product.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            cartItemsContainer.appendChild(cartItemEl);
        } catch (error) {
            console.error('Error loading product:', error);
        }
    }
    
    // Update summary
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('total').textContent = `$${subtotal.toFixed(2)}`;
    
    // Add event listeners
    document.querySelectorAll('.quantity-btn.minus').forEach(btn => {
        btn.addEventListener('click', decreaseQuantity);
    });
    
    document.querySelectorAll('.quantity-btn.plus').forEach(btn => {
        btn.addEventListener('click', increaseQuantity);
    });
    
    document.querySelectorAll('.cart-item-remove').forEach(btn => {
        btn.addEventListener('click', removeItem);
    });
}

function decreaseQuantity(event) {
    const productId = event.target.dataset.id;
    updateQuantity(productId, -1);
}

function increaseQuantity(event) {
    const productId = event.target.dataset.id;
    updateQuantity(productId, 1);
}

function updateQuantity(productId, change) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const item = cart.find(item => item.id === productId);
    
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            // Remove item if quantity becomes zero or negative
            cart = cart.filter(item => item.id !== productId);
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        loadCart(); // Refresh the cart
    }
}

function removeItem(event) {
    const productId = event.target.closest('button').dataset.id;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    cart = cart.filter(item => item.id !== productId);
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    loadCart(); // Refresh the cart
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
    });
}
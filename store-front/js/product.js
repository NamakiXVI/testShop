// Auto-generated: Product page functionality
document.addEventListener('DOMContentLoaded', async () => {
    // Update cart count
    updateCartCount();
    
    // Get product ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (!productId) {
        // Redirect or show error
        document.getElementById('product-container').innerHTML = '<p class="error">Product not found.</p>';
        return;
    }
    
    try {
        // Show loading state
        const container = document.getElementById('product-container');
        container.innerHTML = '<div class="spinner"></div>';
        
        // Fetch product
        const response = await fetch(`http://localhost:3000/api/products/${productId}`);
        const product = await response.json();
        
        // Render product
        renderProduct(product);
    } catch (error) {
        console.error('Error loading product:', error);
        document.getElementById('product-container').innerHTML = '<p class="error">Failed to load product. Please try again later.</p>';
    }
});

function renderProduct(product) {
    const container = document.getElementById('product-container');
    container.innerHTML = `
        <div class="product-image">
            <i class="${product.icon}"></i>
        </div>
        <div class="product-info">
            <h1>${product.name}</h1>
            <p class="price">$${product.price.toFixed(2)}</p>
            <p class="description">${product.description}</p>
            <button class="btn btn-primary add-to-cart" data-id="${product.id}">Add to Cart</button>
        </div>
    `;
    
    // Add event listener to the button
    container.querySelector('.add-to-cart').addEventListener('click', addToCart);
}

// Add to cart function
function addToCart(event) {
    const productId = event.target.dataset.id;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showNotification('Product added to cart!');
}

function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
    });
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
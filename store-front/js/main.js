// Main store functionality
document.addEventListener('DOMContentLoaded', () => {
    // Initialize cart count
    updateCartCount();
    
    // Load featured products
    loadProducts();
    
    // Add event listeners
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', addToCart);
    });
});

// Fetch and display products
async function loadProducts() {
    try {
        // Show loading state
        const container = document.getElementById('featured-products');
        container.innerHTML = '<div class="spinner"></div>';
        
        // Fetch products from server
        const response = await fetch('https://testshop-ltuc.onrender.com/api/products');
        const products = await response.json();
        
        // Render products
        renderProducts(products.slice(0, 4)); // Show first 4 as featured
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('featured-products').innerHTML = '<p class="error">Failed to load products. Please try again later.</p>';
    }
}

// Render products to the page
function renderProducts(products) {
    const container = document.getElementById('featured-products');
    container.innerHTML = '';
    
    products.forEach(product => {
        const productEl = document.createElement('div');
        productEl.className = 'product-card';
        productEl.innerHTML = `
            <div class="product-image">
                <i class="${product.icon}"></i>
            </div>
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <div class="product-actions">
                    <button class="btn btn-primary add-to-cart" data-id="${product.id}">Add to Cart</button>
                    <a href="product.html?id=${product.id}" class="btn btn-secondary">Details</a>
                </div>
            </div>
        `;
        container.appendChild(productEl);
    });
    
    // Add event listeners to new buttons
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', addToCart);
    });
}

// Add product to cart
function addToCart(event) {
    const productId = event.target.dataset.id;
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // Check if product is already in cart
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            quantity: 1
        });
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart count
    updateCartCount();
    
    // Show success message
    showNotification('Product added to cart!');
}

// Update cart count in header
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = totalItems;
    });
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
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

/*
I have an existing website with a two-part structure: a **store front** and an **admin side**. I want you to *revolutionize the UI and UX design* of both sides to create a **modern, futuristic experience** that deeply satisfies the user through **immersive dark design**, **smooth animations**, and **subtle 3D effects**.

### Goals:

* Keep all functionalities unchanged — focus **only** on improving design and user experience.
* Create a **futuristic dark theme** that feels immersive and elegant.
* Introduce **3D animations** and **fluid transitions** that feel smooth and satisfying.
* Design with a **strong sense of layout hierarchy** and user flow.
* Ensure mobile and desktop responsiveness.

### Design Principles:

* Use glassmorphism, neon accents, soft shadows, and layered depth for a 3D futuristic feel.
* Smooth hover animations, fluid transitions between pages, and delightful micro-interactions.
* Clean, spacious layout with clear visual hierarchy.
* Consistent dark color palette with accent colors for interactive elements.
* Elevate both the **store front** and the **admin panel** with distinct but visually cohesive design languages.

### Folder Structure of My Website:

```
futuristic-store/
├── store-front/
│   ├── index.html
│   ├── product.html
│   ├── cart.html
│   ├── checkout.html
│   ├── confirmation.html
│   ├── css/
│   │   ├── main.css
│   │   └── variables.css
│   └── js/
│       ├── main.js
│       ├── cart.js
│       ├── checkout.js
│       └── product.js
├── admin-site/
│   ├── admin.html
│   ├── dashboard.html
│   ├── css/
│   │   └── admin.css
│   └── js/
│       ├── admin.js
│       └── dashboard.js
```

### Focus:

* Improve **visual aesthetics** (not functionality).
* Enhance **user satisfaction** through design.
* Make both front-end and admin-side feel like part of the same futuristic brand.
*/
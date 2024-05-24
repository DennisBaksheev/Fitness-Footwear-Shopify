document.addEventListener('DOMContentLoaded', function() {
    setupMenuAndSearch();
    updateCart();
    setupModalEvents();
});

function setupModalEvents() {
    var feedbackModal = document.getElementById('feedback-modal');
    var cartModal = document.getElementById('add-to-cart-modal');
    var feedbackCloseBtn = document.querySelector('.feedback-close-btn');
    var cartCloseBtn = document.querySelector('.add-to-cart-close-btn');

    if (feedbackCloseBtn) {
        feedbackCloseBtn.addEventListener('click', function() {
            feedbackModal.style.display = 'none';
        });
    }

    if (cartCloseBtn) {
        cartCloseBtn.addEventListener('click', function() {
            cartModal.style.display = 'none';
        });
    }

    
    
    document.querySelectorAll('.add-to-cart-btn').forEach(button => {
        button.addEventListener('click', function() {
            var productHandle = this.getAttribute('data-product-handle');
            var productId = this.getAttribute('data-product-id');
            if (!productHandle) {
                console.error('Product handle is undefined for product ID:', productId);
                return;
            }
            addToCart(productId);
            showAddedProductDetails(productHandle); // Ensure this uses handle
        });
    });
    window.onclick = function(event) {
        if (event.target == feedbackModal) {
            feedbackModal.style.display = 'none';
        }
        if (event.target == cartModal) {
            cartModal.style.display = 'none';
        }
    };
}

function setupMenuAndSearch() {
    var menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(function(item) {
        var menuItem = item.querySelector('.margin-menu-items');
        menuItem.addEventListener('click', function(event) {
            event.stopPropagation();
            var dropdown = this.parentNode.querySelector('.dropdown-content');
            var isOpen = dropdown.style.display === 'block';
            closeAllDropdowns();
            if (!isOpen) {
                dropdown.style.display = 'block';
            }
        });
    });
}

function closeAllDropdowns() {
    var dropdowns = document.querySelectorAll('.dropdown-content');
    dropdowns.forEach(function(dropdown) {
        dropdown.style.display = 'none';
    });
}

function toggleSearch(event) {
    event.preventDefault();
    var searchBox = document.getElementById('search-box');
    searchBox.style.display = searchBox.style.display === 'block' ? 'none' : 'block';
    if (searchBox.style.display === 'block') {
        searchBox.focus();
    }
}

function formatMoney(amount) {
    return '$' + (amount / 100).toFixed(2);
}

function addToCart(productId) {
    var selectElement = document.getElementById('size-select-' + productId);
    if (!selectElement) {
        console.error('Select element not found for product ID:', productId);
        return;
    }
    var variantId = selectElement.value; // This captures the selected variant ID
    var quantity = 1;

    var data = { "items": [{ "id": variantId, "quantity": quantity }] };
    console.log("Data to be sent to cart/add.js: ", data);

    fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log("Response from cart/add.js: ", data);
        var productHandle = document.querySelector(`[data-product-id='${productId}']`).getAttribute('data-product-handle');
        showAddedProductDetails(productHandle, variantId); // Pass the productHandle and variantId to the detail function
    })
    .catch(error => console.error('Error adding item to cart:', error));
}



function showAddedProductDetails(productHandle, variantId) {
    console.log("Fetching product details for handle: ", productHandle);
    fetch(`/products/${productHandle}.json`)
    .then(response => response.json())
    .then(data => {
        console.log("Product details fetched: ", data);  // Debug for checking the data structure
        var modal = document.getElementById('add-to-cart-modal');

        var product = data.product;
        var selectedVariant = product.variants.find(variant => variant.id.toString() === variantId);
        var imageSrc = selectedVariant && selectedVariant.featured_image ? selectedVariant.featured_image.src : product.images[0].src || 'path/to/default/image.png';

        document.getElementById('modal-product-image').src = imageSrc;
        document.getElementById('modal-product-title').textContent = product.title;
        // Update the text to include the size from the selected variant
        document.getElementById('modal-product-size').textContent = 'Size: ' + (selectedVariant ? selectedVariant.option1 : 'N/A');

        modal.style.display = 'flex';  // Make sure the modal is displayed
    })
    .catch(error => console.error('Error fetching product details:', error));
}
function updateCart() {
    fetch('/cart.js')
    .then(response => response.json())
    .then(cart => {
        console.log(cart);
        document.querySelector('#cart-count').textContent = cart.item_count;
        updateCartDisplay(cart);
    })
    .catch(error => {
        console.error('Error fetching cart:', error);
    });
}

function updateCartDisplay(cart) {
    const cartContent = document.getElementById('cart-content');
    if (!cartContent) {
        console.log('Cart content div not found on this page.');
        return;
    }
    let itemsHtml = '';
    if (cart.items.length > 0) {
        cart.items.forEach((item, index) => {
            const size = item.variant_options && item.variant_options.length > 0 ? item.variant_options[0] : 'No size';
            itemsHtml += `
                <div class="new-cart-item" data-line="${index + 1}">
                    <img src="${item.image}" alt="${item.title}" class="new-cart-item-img" style="width: 80px; height: 80px; object-fit: cover;">
                    <div class="new-cart-details">
                        <p class="new-cart-title">${item.title}</p>
                        <p class="new-cart-price">${item.quantity} x ${formatMoney(item.final_line_price)}</p>
                        <button class="new-cart-remove-btn" onclick="removeFromCart(${index + 1})">Remove</button>
                    </div>
                </div>`;
        });
        itemsHtml += `
            <div class="new-cart-total">
                <strong>Total:</strong> ${formatMoney(cart.total_price)}
            </div>
            <div class="checkout-flex">
                <button class="checkout-btn" onclick="window.location.href='/checkout'">Checkout</button>
            </div>`;
    } else {
        itemsHtml = '<div class="checkout-flex"><p class="new-empty-cart-message">Your cart is empty!</p></div>';
    }
    cartContent.innerHTML = itemsHtml;
}

function removeFromCart(lineItemIndex) {
    var data = { "line": lineItemIndex, "quantity": 0 };
    fetch('/cart/change.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(cart => updateCart())
    .catch(error => console.error('Error removing item from cart:', error));
}



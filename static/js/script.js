let appData = {};
let currentLang = localStorage.getItem('language') || 'bn';
let cart = JSON.parse(localStorage.getItem('cart')) || [];

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch data
    try {
        const response = await fetch('/api/data');
        appData = await response.json();
        initApp();
        checkActiveDropdown();

        // Check for open_modal query param
        const urlParams = new URLSearchParams(window.location.search);
        const openModalId = urlParams.get('open_modal');
        if (openModalId) {
            // Remove the param from URL without reloading
            const newUrl = window.location.pathname;
            window.history.replaceState({}, document.title, newUrl);

            // Open the modal
            openProductDetails(openModalId);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});

function checkActiveDropdown() {
    const path = window.location.pathname;
    if (path.includes('/category/')) {
        const id = path.split('/').pop();
        // Find which main category this id belongs to
        let mainCatId = null;

        appData.categories.forEach(cat => {
            if (cat.id === id) {
                mainCatId = cat.id;
            } else if (cat.subcategories) {
                const sub = cat.subcategories.find(s => s.id === id);
                if (sub) mainCatId = cat.id;
            }
        });

        if (mainCatId) {
            const dropdown = document.getElementById(`${mainCatId}-dropdown`);
            if (dropdown) {
                dropdown.classList.add('open');
                dropdown.parentElement.classList.add('active');
            }
        }
    }
}

function initApp() {
    populateDropdown();
    setupLanguageSwitcher();
    updateLanguage();
    updateCartUI();
}

function populateDropdown() {
    populateCategoryDropdown('homeservice', 'homeservice-dropdown');
    populateCategoryDropdown('grocery', 'grocery-dropdown');
}

function populateCategoryDropdown(categoryId, elementId) {
    const dropdownContent = document.getElementById(elementId);
    if (!dropdownContent) return;

    const category = appData.categories.find(c => c.id === categoryId);
    if (category && category.subcategories) {
        dropdownContent.innerHTML = ''; // Clear existing
        category.subcategories.forEach(sub => {
            if (sub.items && sub.items.length > 0) {
                // Create nested dropdown container
                const container = document.createElement('div');
                container.className = 'nested-dropdown-container';

                // Trigger link (Subcategory)
                const trigger = document.createElement('a');
                trigger.href = '#'; // Prevent navigation
                trigger.className = 'nested-trigger';
                trigger.dataset.key = `categories.${categoryId}.subcategories.${sub.id}.name`;
                trigger.textContent = sub.name[currentLang];

                // Toggle nested dropdown on click
                trigger.onclick = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    container.classList.toggle('open');
                };

                container.appendChild(trigger);

                // Nested content (Items)
                const nestedContent = document.createElement('div');
                nestedContent.className = 'nested-content';

                sub.items.forEach(item => {
                    const itemLink = document.createElement('a');
                    itemLink.href = `/category/${sub.id}`; // Navigate to subcategory page
                    itemLink.textContent = item.name[currentLang];
                    // Removed onclick handler to allow default navigation
                    nestedContent.appendChild(itemLink);
                });

                container.appendChild(nestedContent);
                dropdownContent.appendChild(container);
            } else {
                // Standard link
                const link = document.createElement('a');
                link.href = `/category/${sub.id}`;
                link.dataset.key = `categories.${categoryId}.subcategories.${sub.id}.name`;
                link.textContent = sub.name[currentLang];
                dropdownContent.appendChild(link);
            }
        });
    }
}

function setupLanguageSwitcher() {
    const switcher = document.getElementById('lang-switch');
    switcher.value = currentLang;
    switcher.addEventListener('change', (e) => {
        currentLang = e.target.value;
        localStorage.setItem('language', currentLang);
        updateLanguage();
    });
}

function updateLanguage() {
    // Update static elements with data-key
    document.querySelectorAll('[data-key]').forEach(el => {
        const key = el.dataset.key;
        const value = getNestedValue(appData, key, currentLang);
        if (value) {
            el.textContent = value;
        }
    });

    // Update dynamic dropdown items
    // Update dynamic dropdown items (Re-populate to ensure correct language)
    populateDropdown();

    // Update product names on category page if present
    if (typeof currentCategory !== 'undefined') {
        document.getElementById('page-title').textContent = currentCategory.name[currentLang];
        document.querySelectorAll('.item-name').forEach(el => {
            const id = el.dataset.id;
            let item = findItem(id);

            // If not found in items, check subcategories of currentCategory
            if (!item && currentCategory.subcategories) {
                item = currentCategory.subcategories.find(s => s.id === id);
            }

            if (item) {
                el.textContent = item.name[currentLang];

                // Update profile details if present
                const card = el.closest('.product-card');
                if (card && item.experience) {
                    const expEl = card.querySelector('.exp-text');
                    if (expEl) expEl.textContent = item.experience[currentLang];

                    const expertEl = card.querySelector('.expertise');
                    if (expertEl) expertEl.textContent = item.expertise[currentLang];
                }
            }
        });

        // Update add to cart buttons text (handled by data-key, but ensure context)
    }

    updateCartUI(); // To translate cart labels if any dynamic
}

function getNestedValue(obj, key, lang) {
    try {
        const keys = key.split('.');
        let current = obj;
        for (const k of keys) {
            current = current[k];
        }
        return current[lang] || current;
    } catch (e) {
        return null;
    }
}

function findItem(id) {
    if (!appData.categories) {
        console.error('AppData not loaded yet');
        return null;
    }
    for (const cat of appData.categories) {
        if (cat.items) {
            const item = cat.items.find(i => i.id === id);
            if (item) return item;
        }
        if (cat.subcategories) {
            for (const sub of cat.subcategories) {
                const item = sub.items.find(i => i.id === id);
                if (item) return item;
            }
        }
    }
    return null;
}

// Cart Functions
function toggleCart() {
    document.getElementById('cart-sidebar').classList.toggle('open');
}

function addToCart(id, nameEn, nameBn, price) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name: { en: nameEn, bn: nameBn }, price, quantity: 1 });
    }
    saveCart();
    updateCartUI();
    toggleCart(); // Open cart to show feedback
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartUI() {
    const cartCount = document.getElementById('cart-count');
    const cartItems = document.getElementById('cart-items');
    const cartTotal = document.getElementById('cart-total');

    let count = 0;
    let total = 0;

    cartItems.innerHTML = '';

    cart.forEach(item => {
        count += item.quantity;
        total += item.price * item.quantity;

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name[currentLang]}</h4>
                <p>৳${item.price} x ${item.quantity}</p>
            </div>
            <button onclick="removeFromCart('${item.id}')" class="remove-btn">&times;</button>
        `;
        cartItems.appendChild(div);
    });

    cartCount.textContent = count;
    cartTotal.textContent = total;
}

// Mobile Sidebar Toggle
document.querySelector('.mobile-toggle').addEventListener('click', () => {
    document.querySelector('.sidebar').classList.toggle('active');
});

// Sidebar Collapse
const sidebar = document.getElementById('sidebar');

// Collapse Button (Desktop & Mobile)
const collapseBtn = document.getElementById('collapse-btn');
if (collapseBtn) {
    collapseBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            // On mobile, this button closes the sidebar
            sidebar.classList.remove('active');
        } else {
            // On desktop, it toggles collapsed state
            sidebar.classList.toggle('collapsed');
        }
    });
}

// Close sidebar when clicking outside on mobile
document.addEventListener('click', (e) => {
    if (window.innerWidth <= 768 && sidebar.classList.contains('active')) {
        const mobileToggle = document.querySelector('.mobile-toggle');
        // Check if click is outside sidebar AND not on the toggle button
        if (!sidebar.contains(e.target) && (!mobileToggle || !mobileToggle.contains(e.target))) {
            sidebar.classList.remove('active');
        }
    }
});

// Checkout Modal
const modal = document.getElementById('checkout-modal');
const closeModal = document.querySelector('.close-modal');
const checkoutBtn = document.querySelector('.checkout-btn');

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        modal.classList.add('open');
        toggleCart(); // Close cart sidebar
    });
}

if (closeModal) {
    closeModal.addEventListener('click', () => {
        modal.classList.remove('open');
    });
}

window.onclick = (event) => {
    if (event.target === modal) {
        modal.classList.remove('open');
    }
};

async function submitOrder(event) {
    event.preventDefault();

    const submitBtn = document.querySelector('.submit-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Sending...';
    submitBtn.disabled = true;

    const payload = {
        name: document.getElementById('name').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        address: document.getElementById('address').value,
        message: document.getElementById('message').value,
        cart: cart
    };

    try {
        const res = await fetch("/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        alert(data.message);

        if (res.ok) {
            document.getElementById("checkout-form").reset();
            modal.classList.remove('open');
            cart = [];
            saveCart();
            updateCartUI();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Failed to place order. Please try again.');
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Product Details Modal Logic
let currentModalItem = null;
let modalQuantity = 1;

function openProductDetails(id) {
    console.log('Opening details for:', id);
    console.log('AppData:', appData);
    const item = findItem(id);
    console.log('Found item:', item);
    if (!item) return;

    currentModalItem = item;
    modalQuantity = 1;

    // Populate modal
    const modalImage = document.querySelector('.modal-image');
    if (item.image) {
        modalImage.innerHTML = `<img src="/static/${item.image}" alt="${item.name.en}" style="width: 100%; height: 100%; object-fit: contain;">`;
    } else {
        modalImage.innerHTML = `<div class="img-placeholder" style="font-size: 3rem;">${item.name.en[0]}</div>`;
    }

    document.getElementById('modal-brand').textContent = item.brand ? item.brand[currentLang] : 'Generic';
    document.getElementById('modal-title').textContent = item.name[currentLang];
    document.getElementById('modal-price').textContent = `৳${item.price}`;

    // Rating
    const ratingContainer = document.querySelector('.modal-rating');
    if (item.rating) {
        ratingContainer.style.display = 'flex';
        ratingContainer.querySelector('.stars').textContent = '⭐'.repeat(Math.round(item.rating));
        document.getElementById('modal-reviews').textContent = item.reviews_count || 0;
    } else {
        ratingContainer.style.display = 'none';
    }

    // Price
    document.getElementById('modal-price').textContent = item.price;
    const originalPriceEl = document.getElementById('modal-original-price');
    const discountEl = document.getElementById('modal-discount');

    if (item.original_price && item.original_price > item.price) {
        originalPriceEl.parentElement.style.display = 'inline';
        originalPriceEl.textContent = item.original_price;

        const discount = Math.round(((item.original_price - item.price) / item.original_price) * 100);
        discountEl.style.display = 'inline';
        discountEl.textContent = `${discount}% OFF`;
    } else {
        originalPriceEl.parentElement.style.display = 'none';
        discountEl.style.display = 'none';
    }

    // Description & Meta
    document.getElementById('modal-description').textContent = item.short_description ? item.short_description[currentLang] : 'No description available.';

    const deliveryLabel = document.querySelector('#modal-delivery').previousElementSibling;
    if (item.unit === 'per hour' || item.unit === 'per visit' || item.unit === 'per work') {
        deliveryLabel.textContent = currentLang === 'en' ? 'Arrival:' : 'পৌঁছাবে:';
    } else {
        deliveryLabel.textContent = currentLang === 'en' ? 'Delivery:' : 'ডেলিভারি:';
    }
    document.getElementById('modal-delivery').textContent = item.delivery_time ? item.delivery_time[currentLang] : 'Standard';

    // Quantity & Add Button
    updateModalQuantityUI();

    const modal = document.getElementById('product-modal');
    modal.classList.add('open');

    // Update URL
    if (item.url) {
        history.pushState({ modalOpen: true, productId: item.id }, '', item.url);
    }
}

function updateModalQuantity(change) {
    const newQty = modalQuantity + change;
    if (newQty >= 1) {
        modalQuantity = newQty;
        updateModalQuantityUI();
    }
}

function updateModalQuantityUI() {
    document.getElementById('modal-quantity').textContent = modalQuantity;
    if (currentModalItem) {
        document.getElementById('modal-total-price').textContent = currentModalItem.price * modalQuantity;
    }
}

// Handle Browser Back Button
window.addEventListener('popstate', (event) => {
    const modal = document.getElementById('product-modal');
    if (modal.classList.contains('open')) {
        modal.classList.remove('open');
        currentModalItem = null;
    }
});

document.getElementById('modal-add-btn').addEventListener('click', () => {
    if (currentModalItem) {
        addToCart(currentModalItem.id, currentModalItem.name.en, currentModalItem.name.bn, currentModalItem.price, modalQuantity);
        // Go back in history to close modal and revert URL
        if (history.state && history.state.modalOpen) {
            history.back();
        } else {
            document.getElementById('product-modal').classList.remove('open');
        }
    }
});

document.getElementById('close-product-modal').addEventListener('click', () => {
    // Go back in history to close modal and revert URL
    if (history.state && history.state.modalOpen) {
        history.back();
    } else {
        document.getElementById('product-modal').classList.remove('open');
    }
});

// Update addToCart to accept quantity
function addToCart(id, nameEn, nameBn, price, quantity = 1) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ id, name: { en: nameEn, bn: nameBn }, price, quantity: quantity });
    }
    saveCart();
    updateCartUI();
    toggleCart(); // Open cart to show feedback
}

// Search Functionality
let allProducts = [];
let allSubcategories = [];

function flattenProducts() {
    allProducts = [];
    allSubcategories = [];
    if (!appData.categories) return;

    appData.categories.forEach(cat => {
        if (cat.subcategories) {
            cat.subcategories.forEach(sub => {
                // Collect subcategories
                allSubcategories.push({
                    id: sub.id,
                    name: sub.name,
                    type: cat.type // Inherit type from parent category
                });

                if (sub.items) {
                    sub.items.forEach(item => {
                        allProducts.push({
                            ...item,
                            categoryName: sub.name,
                            subcategoryId: sub.id,
                            type: cat.type // Inherit type from parent category
                        });
                    });
                }
            });
        }
    });
}

// Initialize search when data is loaded
const searchInput = document.getElementById('product-search');
const liveResults = document.getElementById('live-search-results');
const searchCategories = document.getElementById('search-categories');
const searchProducts = document.getElementById('search-products');

if (searchInput && liveResults) {
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();

        // Ensure data is flattened
        if (allProducts.length === 0) flattenProducts();

        if (query.length === 0) {
            liveResults.classList.remove('active');
            return;
        }

        // 1. Find matching subcategories
        const matchedCats = allSubcategories.filter(sub => {
            return sub.name.en.toLowerCase().includes(query) || sub.name.bn.toLowerCase().includes(query);
        });

        // 2. Find matching products (by name)
        const matchedItemsByName = allProducts.filter(item => {
            const nameEn = item.name.en.toLowerCase();
            const nameBn = item.name.bn.toLowerCase();
            return nameEn.includes(query) || nameBn.includes(query);
        });

        // 3. Find products from matching subcategories
        const matchedItemsByCat = allProducts.filter(item => {
            return matchedCats.some(cat => cat.id === item.subcategoryId);
        });

        // Combine and deduplicate products
        const combinedItems = [...matchedItemsByName];
        matchedItemsByCat.forEach(item => {
            if (!combinedItems.find(i => i.id === item.id)) {
                combinedItems.push(item);
            }
        });

        renderLiveResults(matchedCats, combinedItems);
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !liveResults.contains(e.target)) {
            liveResults.classList.remove('active');
        }
    });
}

function renderLiveResults(categories, products) {
    if (categories.length === 0 && products.length === 0) {
        liveResults.classList.remove('active');
        return;
    }

    // Render Categories (Chips)
    if (categories.length > 0) {
        searchCategories.style.display = 'flex';
        searchCategories.innerHTML = categories.map(cat => `
            <div class="search-category-chip" onclick="window.location.href='/category/${cat.id}'">
                <span>${cat.name[currentLang]}</span>
                <span style="font-size: 0.7em;">›</span>
            </div>
        `).join('');
    } else {
        searchCategories.style.display = 'none';
        searchCategories.innerHTML = '';
    }

    // Render Products (Cards)
    if (products.length > 0) {
        searchProducts.innerHTML = products.map(item => renderProductCard(item)).join('');
    } else {
        searchProducts.innerHTML = '<p style="padding: 1rem; color: #666;">No products found.</p>';
    }

    liveResults.classList.add('active');
}

function renderProductCard(item) {
    const isService = item.type === 'service';

    if (isService) {
        return `
        <div class="product-card profile-card" onclick="handleSearchResultClick('${item.id}', '${item.subcategoryId}')">
            <div class="product-image profile-image">
                ${item.image ? `<img src="/static/${item.image}" alt="${item.name.en}" class="card-img">` : `<div class="img-placeholder">${item.name.en[0]}</div>`}
            </div>
            <div class="product-info">
                <h3 class="item-name">${item.name[currentLang]}</h3>
                <div class="profile-details">
                    <p><strong>${currentLang === 'en' ? 'Rating' : 'রেটিং'}</strong>: ⭐ ${item.rating || 'N/A'}</p>
                </div>
                <p class="price">৳${item.price}</p>
                <button class="add-to-cart-btn hire-btn"
                    onclick="event.stopPropagation(); addToCart('${item.id}', '${item.name.en}', '${item.name.bn}', ${item.price})">
                    ${currentLang === 'en' ? 'Hire Now' : 'হায়ার করুন'}
                </button>
            </div>
        </div>`;
    } else {
        return `
        <div class="product-card" onclick="handleSearchResultClick('${item.id}', '${item.subcategoryId}')">
            <div class="product-image">
                ${item.image ? `<img src="/static/${item.image}" alt="${item.name.en}" class="card-img">` : `<div class="img-placeholder">${item.name.en[0]}</div>`}
                ${item.original_price && item.original_price > item.price ? '<span class="card-discount-badge">Sale</span>' : ''}
            </div>
            <div class="product-info">
                <h3 class="item-name">${item.name[currentLang]}</h3>
                <div class="card-rating">
                    <span class="stars">★</span> ${item.rating || 0} <span class="review-count">(${item.reviews_count || 0})</span>
                </div>
                <p class="price">৳${item.price}</p>
                <button class="add-to-cart-btn"
                    onclick="event.stopPropagation(); addToCart('${item.id}', '${item.name.en}', '${item.name.bn}', ${item.price})">
                    ${currentLang === 'en' ? 'Add to Cart' : 'কার্টে যোগ করুন'}
                </button>
            </div>
        </div>`;
    }
}

function handleSearchResultClick(id, subcategoryId) {
    // Check if we are already on the correct subcategory page
    const currentPath = window.location.pathname;
    const targetPath = `/category/${subcategoryId}`;

    if (currentPath === targetPath) {
        openProductDetails(id);
    } else {
        // Navigate to the subcategory page with a query param to open the modal
        window.location.href = `${targetPath}?open_modal=${id}`;
    }

    document.getElementById('product-search').value = ''; // Clear search
    document.getElementById('live-search-results').classList.remove('active');
}

// Auto-open modal if query param exists
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const openModalId = urlParams.get('open_modal');

    if (openModalId) {
        // We need to wait for appData to be loaded. 
        // Since fetch is async, we can poll or use a custom event. 
        // For simplicity, we'll check in the initApp or after fetch.
        // Actually, let's hook into the existing fetch promise chain in the main event listener.
    }
});

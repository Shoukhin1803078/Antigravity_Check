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
                // dropdown.classList.add('open'); // Removed to allow toggle
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
    updateCartUI();
    setupDropdownListeners();
    updateBreadcrumbs();
}

function updateBreadcrumbs() {
    const container = document.getElementById('breadcrumbs');
    if (!container) return;

    const path = window.location.pathname;
    const parts = path.split('/').filter(p => p);

    let html = `<a href="/" class="breadcrumb-item" data-key="nav.home">Home</a>`;

    if (parts.length > 0) {
        // Category
        if (parts[0] === 'category' && parts[1]) {
            const catId = parts[1];
            let catName = catId; // Fallback

            // Find category name
            if (appData.categories) {
                const cat = appData.categories.find(c => c.id === catId);
                if (cat) {
                    catName = cat.name[currentLang];
                } else {
                    // Check subcategories
                    appData.categories.forEach(c => {
                        if (c.subcategories) {
                            const sub = c.subcategories.find(s => s.id === catId);
                            if (sub) catName = sub.name[currentLang];
                        }
                    });
                }
            }

            html += ` <span class="breadcrumb-separator">›</span> <a href="/category/${catId}" class="breadcrumb-item">${catName}</a>`;

            // Product
            if (parts[2] === 'product' && parts[3]) {
                const prodId = parts[3];
                let prodName = prodId; // Fallback

                // Find product name (need flattened data or search)
                const item = findItem(prodId);
                if (item) prodName = item.name[currentLang];

                html += ` <span class="breadcrumb-separator">›</span> <span class="breadcrumb-item active">${prodName}</span>`;
            }
        }
    }

    container.innerHTML = html;
}

function setupDropdownListeners() {
    document.querySelectorAll('.dropdown-header').forEach(header => {
        header.addEventListener('click', (e) => {
            // Prevent navigation to allow toggle behavior
            e.preventDefault();
            const container = header.parentElement;
            container.classList.toggle('active');
        });
    });
}

function populateDropdown() {
    if (!appData.categories) return;

    appData.categories.forEach(category => {
        if (category.subcategories) {
            populateCategoryDropdown(category.id, `${category.id}-dropdown`);
        }
    });
}

function populateCategoryDropdown(categoryId, elementId) {
    const dropdownContent = document.getElementById(elementId);
    if (!dropdownContent) {
        console.error(`Dropdown element not found: ${elementId}`);
        return;
    }

    const category = appData.categories.find(c => c.id === categoryId);
    console.log(`Populating ${categoryId}:`, category);

    if (category && category.subcategories) {
        console.log(`Found ${category.subcategories.length} subcategories for ${categoryId}`);
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

    // Update Product Detail Page
    const detailTitle = document.getElementById('detail-title');
    if (detailTitle) {
        const path = window.location.pathname;
        const parts = path.split('/');
        const prodId = parts[parts.length - 1]; // Assuming /product/ID format

        const item = findItem(prodId);
        if (item) {
            detailTitle.textContent = item.name[currentLang];

            const detailBrand = document.getElementById('detail-brand');
            if (detailBrand && item.brand) detailBrand.textContent = item.brand[currentLang];

            const detailModel = document.getElementById('detail-model');
            if (detailModel && item.model_name) detailModel.textContent = item.model_name[currentLang];

            const detailShortDesc = document.getElementById('detail-short-desc');
            if (detailShortDesc && item.short_description) detailShortDesc.textContent = item.short_description[currentLang];

            const detailLongDesc = document.getElementById('detail-long-desc');
            if (detailLongDesc && item.long_description) detailLongDesc.innerHTML = item.long_description[currentLang];

            const detailExperience = document.getElementById('detail-experience');
            if (detailExperience && item.experience) detailExperience.textContent = item.experience[currentLang];

            const detailExpertise = document.getElementById('detail-expertise');
            if (detailExpertise && item.expertise) detailExpertise.textContent = item.expertise[currentLang];

            const detailBtnText = document.getElementById('detail-btn-text');
            if (detailBtnText) {
                if (item.type === 'service') {
                    detailBtnText.textContent = currentLang === 'en' ? 'Hire Now' : 'হায়ার করুন';
                } else {
                    detailBtnText.textContent = currentLang === 'en' ? 'Add to Cart' : 'কার্টে যোগ করুন';
                }
            }
        }
    }
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



// Update addToCart to accept model and brand
function addToCart(id, nameEn, nameBn, price, quantity = 1, modelEn = null, modelBn = null, brandEn = null, brandBn = null) {
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += quantity;
    } else {
        const cartItem = {
            id,
            name: { en: nameEn, bn: nameBn },
            price,
            quantity: quantity
        };

        // Add model if provided
        if (modelEn || modelBn) {
            cartItem.model = { en: modelEn || modelBn, bn: modelBn || modelEn };
        }

        // Add brand if provided
        if (brandEn || brandBn) {
            cartItem.brand = { en: brandEn || brandBn, bn: brandBn || brandEn };
        }

        cart.push(cartItem);
    }
    saveCart();
    updateCartUI();
    toggleCart(); // Open cart to show feedback
}

// Global event listener for Add to Cart buttons
document.addEventListener('click', (e) => {
    const btn = e.target.closest('.add-to-cart-btn');
    if (btn) {
        e.preventDefault();
        e.stopPropagation();

        const id = btn.dataset.id;
        const nameEn = btn.dataset.nameEn;
        const nameBn = btn.dataset.nameBn;
        const price = parseFloat(btn.dataset.price);
        const modelEn = btn.dataset.modelEn || null;
        const modelBn = btn.dataset.modelBn || null;
        const brandEn = btn.dataset.brandEn || null;
        const brandBn = btn.dataset.brandBn || null;

        if (id && nameEn && price) {
            addToCart(id, nameEn, nameBn || nameEn, price, 1, modelEn, modelBn, brandEn, brandBn);
        } else {
            console.error('Missing data attributes on add-to-cart button', btn);
        }
    }
});

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
        <a href="/category/${item.subcategoryId || item.categoryId}/product/${item.id}" class="product-card profile-card" style="text-decoration: none; color: inherit; display: block;">
            <div class="product-image profile-image">
                ${item.image ? `<img src="/static/${item.image}" alt="${item.name.en}" class="card-img">` : `<div class="img-placeholder">${item.name.en[0]}</div>`}
            </div>
            <div class="product-info">
                <h3 class="item-name">${item.name[currentLang]}</h3>
                ${item.brand ? `<p class="item-brand" style="font-size: 0.85rem; color: #666; margin-bottom: 0.2rem;">${item.brand[currentLang]}</p>` : ''}
                <div class="profile-details">
                    <p><strong>${currentLang === 'en' ? 'Rating' : 'রেটিং'}</strong>: ⭐ ${item.rating || 'N/A'}</p>
                </div>
                <p class="price">৳${item.price}</p>
                <button class="add-to-cart-btn hire-btn"
                    data-id="${item.id}"
                    data-name-en="${item.name.en}"
                    data-name-bn="${item.name.bn}"
                    data-price="${item.price}">
                    ${currentLang === 'en' ? 'Hire Now' : 'হায়ার করুন'}
                </button>
            </div>
        </a>`;
    } else {
        return `
        <a href="/category/${item.subcategoryId || item.categoryId}/product/${item.id}" class="product-card" style="text-decoration: none; color: inherit; display: block;">
            <div class="product-image">
                ${item.image ? `<img src="/static/${item.image}" alt="${item.name.en}" class="card-img">` : `<div class="img-placeholder">${item.name.en[0]}</div>`}
                ${item.original_price && item.original_price > item.price ? '<span class="card-discount-badge">Sale</span>' : ''}
            </div>
            <div class="product-info">
                <h3 class="item-name">${item.name[currentLang]}</h3>
                ${item.brand ? `<p class="item-brand" style="font-size: 0.85rem; color: #666; margin-bottom: 0.2rem;">${item.brand[currentLang]}</p>` : ''}
                <div class="card-rating">
                    <span class="stars">★</span> ${item.rating || 0} <span class="review-count">(${item.reviews_count || 0})</span>
                </div>

                <div class="price-row">
                    <p class="price">৳${item.price}</p>
                    ${item.original_price ? `<p class="original-price-sm">৳${item.original_price}</p>` : ''}
                </div>

                <button class="add-to-cart-btn"
                    data-id="${item.id}"
                    data-name-en="${item.name.en}"
                    data-name-bn="${item.name.bn}"
                    data-price="${item.price}">
                    ${currentLang === 'en' ? 'Add to Cart' : 'কার্টে যোগ করুন'}
                </button>
            </div>
        </a>`;
    }
}



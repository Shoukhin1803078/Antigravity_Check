# Bazar-Sodai

A bilingual (English/Bangla) e-commerce application for Grocery and Home Services with dynamic content management through `data.json`.

## Features

- 🌐 **Bilingual Support**: Full English and Bangla language support
- 🛒 **Shopping Cart**: Add items to cart with quantity management
- 📧 **Email Notifications**: Detailed order emails with product information
- 🔍 **Search**: Live search across categories and products
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🎨 **Modern UI**: Glassmorphism effects, sticky header, breadcrumbs

## Setup

### Prerequisites
- Python 3.8+
- Gmail account with App Password (for email functionality)

### Installation

1. **Clone the repository**
   ```bash
   cd Antigravity_Check
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   GMAIL_APP_PASSWORD=your_gmail_app_password_here
   ```

5. **Run the server**
   ```bash
   uvicorn app.main:app --reload
   ```

6. **Open in browser**
   
   Navigate to `http://127.0.0.1:8000`

## Data Structure (`data.json`)

The entire application is **data-driven**. All categories, products, and content are defined in `data.json`. The codebase automatically renders everything based on this file.

### Complete JSON Structure

```json
{
  "settings": {
    "title": { "en": "E Mart", "bn": "ই মার্ট" },
    "nav": {
      "home": { "en": "Home", "bn": "হোম" },
      "cart": { "en": "Cart", "bn": "কার্ট" }
    },
    "cart_labels": {
      "add_to_cart": { "en": "Add to Cart", "bn": "কার্টে যোগ করুন" },
      "total": { "en": "Total", "bn": "মোট" }
    }
  },
  "categories": [
    // Array of category objects (see below)
  ]
}
```

### Category Structure

#### Option 1: Category with Subcategories (Dropdown Menu)

Use this for categories that group items into subcategories (e.g., Home Accessories → Fan, Light, AC).

```json
{
  "id": "homeaccessories",
  "name": {
    "en": "Home Accessories",
    "bn": "ঘর সাজানোর সামগ্রী"
  },
  "subcategories": [
    {
      "id": "fan",
      "name": {
        "en": "Fan",
        "bn": "ফ্যান"
      },
      "items": [
        // Array of product items (see Product Structure below)
      ]
    }
  ]
}
```

#### Option 2: Category with Direct Items (No Subcategories)

Use this for simple categories without subcategories.

```json
{
  "id": "cylinder",
  "name": {
    "en": "Cylinder",
    "bn": "সিলিন্ডার"
  },
  "items": [
    // Array of product items (see Product Structure below)
  ]
}
```

### Product Structure

#### For Physical Products

```json
{
  "id": "fan_1",
  "name": {
    "en": "Ceiling Fan",
    "bn": "সিলিং ফ্যান"
  },
  "price": 2500,
  "original_price": 2800,  // Optional: for showing discounts
  "rating": 4.5,
  "reviews_count": 56,
  "brand": {
    "en": "BRB",
    "bn": "বিআরবি"
  },
  "model_name": {  // Optional: for Home Accessories & Grocery items
    "en": "BRB-CF-5600",
    "bn": "বিআরবি-সিএফ-৫৬০০"
  },
  "delivery_time": {
    "en": "2 Days",
    "bn": "২ দিন"
  },
  "short_description": {
    "en": "High speed ceiling fan with 5 star energy rating.",
    "bn": "৫ স্টার এনার্জি রেটিং সহ হাই স্পিড সিলিং ফ্যান।"
  },
  "long_description": {
    "en": "<h3>Product Details</h3><p>Detailed HTML description...</p>",
    "bn": "<h3>পণ্যের বিবরণ</h3><p>বিস্তারিত বিবরণ...</p>"
  },
  "image": "images/homeservice/home_accessories/fan.jpeg",
  "url": "/category/fan/product/fan_1",
  "unit": "piece"  // Optional: for grocery items (kg, liter, etc.)
}
```

#### For Service Providers

```json
{
  "id": "elec_1",
  "type": "service",  // Important: marks this as a service
  "name": {
    "en": "Electrician Service",
    "bn": "ইলেকট্রিশিয়ান সার্ভিস"
  },
  "price": 500,
  "rating": 4.8,
  "reviews_count": 120,
  "brand": {
    "en": "Professional",
    "bn": "পেশাদার"
  },
  "experience": {
    "en": "5 years",
    "bn": "৫ বছর"
  },
  "expertise": {
    "en": "Home wiring, repairs",
    "bn": "বাড়ির তারের কাজ, মেরামত"
  },
  "short_description": {
    "en": "Expert electrician for all home electrical needs.",
    "bn": "সব ধরনের বৈদ্যুতিক কাজের জন্য দক্ষ ইলেকট্রিশিয়ান।"
  },
  "long_description": {
    "en": "<h3>Service Details</h3><p>Description...</p>",
    "bn": "<h3>সেবার বিবরণ</h3><p>বিবরণ...</p>"
  },
  "image": "images/homeservice/electricians/person1.jpg",
  "url": "/category/electricians/product/elec_1"
}
```

## Field Reference

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique identifier (use lowercase, underscores) |
| `name` | object | `{ "en": "...", "bn": "..." }` |
| `price` | number | Price in BDT |
| `short_description` | object | Brief description in both languages |
| `long_description` | object | Detailed HTML description |
| `url` | string | Product detail page URL |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `original_price` | number | Original price (for showing discounts) |
| `rating` | number | Rating out of 5 |
| `reviews_count` | number | Number of reviews |
| `brand` | object | Brand name in both languages |
| `model_name` | object | Model number/name (for appliances, grocery) |
| `delivery_time` | object | Estimated delivery time |
| `image` | string | Path to product image (relative to `static/`) |
| `unit` | string | Unit of measurement (kg, liter, piece) |
| `type` | string | Set to `"service"` for service providers |
| `experience` | object | Years of experience (for services) |
| `expertise` | object | Areas of expertise (for services) |

## Adding New Content

### Adding a New Category

1. Open `data.json`
2. Add a new object to the `categories` array:

```json
{
  "id": "electronics",
  "name": {
    "en": "Electronics",
    "bn": "ইলেকট্রনিক্স"
  },
  "subcategories": [
    // Add subcategories here
  ]
}
```

3. Save the file - the website will automatically update!

### Adding a New Product

1. Navigate to the appropriate category/subcategory in `data.json`
2. Add a new object to the `items` array
3. Follow the Product Structure template above
4. Ensure the `id` is unique
5. Add the product image to `static/images/`

### Adding a New Subcategory

1. Find the parent category in `data.json`
2. Add a new object to the `subcategories` array:

```json
{
  "id": "refrigerator",
  "name": {
    "en": "Refrigerator",
    "bn": "রেফ্রিজারেটর"
  },
  "items": [
    // Add products here
  ]
}
```

## Email Notifications

When a customer places an order, an email is sent with:
- Customer details (name, phone, email, address)
- Order items with:
  - Item name and quantity
  - Item ID
  - Brand (if available)
  - Model (if available)
  - Price breakdown
- Total price
- Customer message

## File Structure

```
Antigravity_Check/
├── app/
│   └── main.py           # FastAPI backend
├── static/
│   ├── css/
│   │   └── style.css     # Styles
│   ├── js/
│   │   └── script.js     # Frontend logic
│   └── images/           # Product images
├── templates/
│   ├── base.html         # Base template
│   ├── index.html        # Home page
│   ├── category.html     # Category listing
│   └── product_detail.html  # Product details
├── data.json             # All content and products
├── .env                  # Environment variables
└── requirements.txt      # Python dependencies
```

## Tips

1. **IDs**: Use lowercase with underscores (e.g., `ceiling_fan_1`)
2. **Images**: Place in `static/images/category/subcategory/` for organization
3. **Translations**: Always provide both English and Bangla text
4. **Testing**: After editing `data.json`, refresh the browser to see changes
5. **Validation**: Ensure JSON is valid (use a JSON validator)

## Troubleshooting

**Products not showing?**
- Check `data.json` syntax (use JSONLint)
- Verify image paths are correct
- Check browser console for errors

**Email not sending?**
- Verify `.env` has correct Gmail App Password
- Check Gmail account allows less secure apps
- Review server logs for errors

## License

This project is for educational purposes.
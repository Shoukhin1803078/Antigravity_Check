from typing import Optional
from fastapi import FastAPI, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
import json
import os
from dotenv import load_dotenv


app = FastAPI()


load_dotenv()

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Templates
templates = Jinja2Templates(directory="templates")

# Load data
def load_data():
    with open("data.json", "r", encoding="utf-8") as f:
        return json.load(f)

@app.get("/")
async def read_root(request: Request):
    data = load_data()
    return templates.TemplateResponse("index.html", {"request": request, "data": data})

@app.get("/api/data")
async def get_data():
    return load_data()

@app.get("/category/{category_id}")
async def read_category(request: Request, category_id: str):
    data = load_data()
    category = next((c for c in data["categories"] if c["id"] == category_id), None)
    
    if not category:
        # Check subcategories if not found in main categories
        for cat in data["categories"]:
            if "subcategories" in cat:
                sub = next((s for s in cat["subcategories"] if s["id"] == category_id), None)
                if sub:
                    category = sub
                    break
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    return templates.TemplateResponse("category.html", {"request": request, "category": category, "data": data})

@app.get("/category/{category_id}/product/{product_id}")
async def read_product(request: Request, category_id: str, product_id: str):
    data = load_data()
    
    # Find category
    category = next((c for c in data["categories"] if c["id"] == category_id), None)
    if not category:
        # Check subcategories if not found in main categories
        for cat in data["categories"]:
            if "subcategories" in cat:
                sub = next((s for s in cat["subcategories"] if s["id"] == category_id), None)
                if sub:
                    category = sub
                    break
    
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Find product
    product = None
    if "items" in category:
        product = next((i for i in category["items"] if i["id"] == product_id), None)
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Determine current language (simple logic for now, can be improved)
    # In a real app, this might come from a cookie or query param
    # For now, we'll pass 'en' as default, but the template can use JS to switch
    # However, since we are rendering server-side, we need to know the lang.
    # Let's check cookies or default to 'en'
    current_lang = request.cookies.get("lang", "en")

    return templates.TemplateResponse("product_detail.html", {
        "request": request, 
        "product": product, 
        "category": category, 
        "data": data,
        "current_lang": current_lang
    })


class OrderPayload(BaseModel):
    name: str
    phone: str
    email: Optional[str] = None
    address: str
    message: Optional[str] = None
    cart: list

@app.post("/send-email")
async def send_email(order: OrderPayload):
    # Format the message
    cart_details = ""
    total_price = 0
    for item in order.cart:
        item_total = item['price'] * item['quantity']
        total_price += item_total
        
        # Build detailed item info
        item_info = f"- {item['name']['en']} (x{item['quantity']}): ৳{item_total}\n"
        item_info += f"  Item ID: {item['id']}\n"
        
        # Add brand if available
        if 'brand' in item and item['brand']:
            brand = item['brand'].get('en', 'N/A')
            item_info += f"  Brand: {brand}\n"
        
        # Add model if available
        if 'model' in item and item['model']:
            model = item['model'].get('en', 'N/A')
            item_info += f"  Model: {model}\n"
        
        cart_details += item_info + "\n"
    
    full_message = f"""
    New Order Received!
    
    Customer Details:
    Name: {order.name}
    Phone: {order.phone}
    Email: {order.email or 'N/A'}
    Address: {order.address}
    
    Order Details:
    {cart_details}
    
    Total Price: ৳{total_price}
    
    Customer Message:
    {order.message or 'N/A'}
    """

    msg = MIMEText(full_message)
    msg["Subject"] = "New Order from Bazar-Sodai"
    msg["From"] = "alamintokdercse@gmail.com"
    msg["To"] = "alamintokdercse@gmail.com"

    try:
        # Note: In a real production app, use a background task for sending emails
        # to avoid blocking the request.
        password = os.getenv("GMAIL_APP_PASSWORD")
        if not password:
             print("GMAIL_APP_PASSWORD not set")
             return JSONResponse(status_code=500, content={"message": "Server misconfiguration: Email password not set."})

        server = smtplib.SMTP_SSL("smtp.gmail.com", 465)
        server.login("alamintokdercse@gmail.com", password)
        server.sendmail(
            "alamintokdercse@gmail.com",
            "alamintokdercse@gmail.com",
            msg.as_string()
        )
        server.quit()

        return JSONResponse(status_code=200, content={"message": "Order placed successfully!"})
    except Exception as e:
        print(f"Email error: {e}")
        return JSONResponse(status_code=500, content={"message": "Failed to place order. Please try again."})

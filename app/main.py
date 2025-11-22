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

class OrderPayload(BaseModel):
    name: str
    phone: str
    email: str | None = None
    address: str
    message: str | None = None
    cart: list

@app.post("/send-email")
async def send_email(order: OrderPayload):
    # Format the message
    cart_details = ""
    total_price = 0
    for item in order.cart:
        item_total = item['price'] * item['quantity']
        total_price += item_total
        cart_details += f"- {item['name']['en']} (x{item['quantity']}): ৳{item_total}\n"
    
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

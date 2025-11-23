import json

def add_long_description():
    with open("data.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    def update_item(item):
        if "long_description" not in item:
            # Generate a default long description based on the short description or name
            short_desc = item.get("short_description", {}).get("en", "")
            name = item.get("name", {}).get("en", "")
            
            long_desc_en = f"""
            <h3>Product Details</h3>
            <p>{short_desc}</p>
            <p>This {name} is a high-quality product designed to meet your needs. It offers excellent performance and durability.</p>
            
            <h3>Key Features</h3>
            <ul>
                <li>Premium quality materials</li>
                <li>Long-lasting durability</li>
                <li>Excellent performance</li>
                <li>Value for money</li>
            </ul>
            
            <h3>Advantages</h3>
            <p>Using this product will enhance your daily life with its superior functionality and reliability.</p>
            """
            
            long_desc_bn = f"""
            <h3>পণ্যের বিবরণ</h3>
            <p>{item.get("short_description", {}).get("bn", "")}</p>
            <p>এই {item.get("name", {}).get("bn", "")} আপনার প্রয়োজন মেটানোর জন্য ডিজাইন করা একটি উচ্চ-মানের পণ্য। এটি চমৎকার কর্মক্ষমতা এবং স্থায়িত্ব প্রদান করে।</p>
            
            <h3>মূল বৈশিষ্ট্য</h3>
            <ul>
                <li>প্রিমিয়াম মানের উপকরণ</li>
                <li>দীর্ঘস্থায়ী স্থায়িত্ব</li>
                <li>চমৎকার কর্মক্ষমতা</li>
                <li>টাকার সঠিক মূল্য</li>
            </ul>
            
            <h3>সুবিধাসমূহ</h3>
            <p>এই পণ্যটি ব্যবহার করা আপনার দৈনন্দিন জীবনকে এর উন্নত কার্যকারিতা এবং নির্ভরযোগ্যতার সাথে উন্নত করবে।</p>
            """
            
            item["long_description"] = {
                "en": long_desc_en.strip(),
                "bn": long_desc_bn.strip()
            }

    for category in data["categories"]:
        if "subcategories" in category:
            for sub in category["subcategories"]:
                if "items" in sub:
                    for item in sub["items"]:
                        update_item(item)
        elif "items" in category:
            for item in category["items"]:
                update_item(item)

    with open("data.json", "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    
    print("Successfully added long_description to all items")

if __name__ == "__main__":
    add_long_description()

import json

file_path = '/Users/mdalamintokder/Documents/Others/Antigravity_check/data.json'

with open(file_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for category in data.get('categories', []):
    for subcategory in category.get('subcategories', []):
        for item in subcategory.get('items', []):
            # Create a slug from the English name or ID
            item_id = item.get('id')
            # New URL structure: /category/{subcategory_id}/product/{id}
            sub_id = subcategory.get('id')
            item['url'] = f"/category/{sub_id}/product/{item_id}"

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=4, ensure_ascii=False)

print("Updated data.json with URLs")

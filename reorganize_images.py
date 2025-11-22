import json
import os
import shutil

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, 'data.json')
STATIC_IMAGES_DIR = os.path.join(BASE_DIR, 'static', 'images')

def load_data():
    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_data(data):
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)

def reorganize():
    data = load_data()
    categories = data.get('categories', [])
    
    moved_files = set()

    for category in categories:
        cat_id = category['id']
        subcategories = category.get('subcategories', [])
        
        for sub in subcategories:
            sub_id = sub['id']
            items = sub.get('items', [])
            
            # Target directory for this subcategory
            target_dir = os.path.join(STATIC_IMAGES_DIR, cat_id, sub_id)
            os.makedirs(target_dir, exist_ok=True)
            
            for item in items:
                image_name = item.get('image')
                if not image_name:
                    continue
                
                # Check if it's already a path or just a filename
                if '/' in image_name:
                    # Already processed or has path
                    filename = os.path.basename(image_name)
                else:
                    filename = image_name
                
                # Source path (assuming it was in root of static/images)
                source_path = os.path.join(STATIC_IMAGES_DIR, filename)
                target_path = os.path.join(target_dir, filename)
                
                # Move file if it exists in source and hasn't been moved yet
                if os.path.exists(source_path):
                    shutil.move(source_path, target_path)
                    print(f"Moved {filename} to {cat_id}/{sub_id}/")
                    moved_files.add(filename)
                elif os.path.exists(target_path):
                    # Already there (maybe moved by another item)
                    pass
                else:
                    # Check if it might be in another subfolder (if we are re-running)
                    # For now, assume if not in root, it might be missing or already moved
                    pass

                # Update data.json path
                # The path should be relative to static folder or just the image path?
                # Usually static/images/...
                # Let's use 'images/category/subcategory/filename'
                new_image_path = f"images/{cat_id}/{sub_id}/{filename}"
                item['image'] = new_image_path

    save_data(data)
    print("Data.json updated.")

if __name__ == "__main__":
    reorganize()

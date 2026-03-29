import os
import json

BASE_DIR = os.path.dirname(__file__)

IMAGES_FOLDER = os.path.join(BASE_DIR, "images", "bollards")
OUTPUT_FILE = os.path.join(BASE_DIR, "data", "bollards.json")

valid_extensions = {".png", ".jpg", ".jpeg", ".webp"}

bollards = []
current_id = 1

for country_folder in sorted(os.listdir(IMAGES_FOLDER)):
    country_path = os.path.join(IMAGES_FOLDER, country_folder)

    if not os.path.isdir(country_path):
        continue

    # convert folder → readable country name
    country_name = country_folder.replace("_", " ").title()

    for filename in sorted(os.listdir(country_path)):
        file_path = os.path.join(country_path, filename)

        if not os.path.isfile(file_path):
            continue

        ext = os.path.splitext(filename)[1].lower()
        if ext not in valid_extensions:
            continue

        bollards.append({
            "id": current_id,
            "country": country_name,
            "folder": country_folder,
            "image": f"images/bollards/{country_folder}/{filename}"
        })

        current_id += 1

# make sure data folder exists
os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    json.dump(bollards, f, indent=2)

print(f"Created {OUTPUT_FILE} with {len(bollards)} entries.")
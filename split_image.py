from PIL import Image, ImageDraw, ImageFont
import os

# === CONFIG ===
IMAGE_PATH = "assets/spider_man.png"   # your source image
OUTPUT_DIR = "assets/fragments"        # output folder
ROWS = 2                               # number of rows
COLS = 2                               # number of columns

# === SCRIPT ===
def split_image(image_path, rows, cols, output_dir):
    # Create output folder
    os.makedirs(output_dir, exist_ok=True)
    
    # Open image
    img = Image.open(image_path)
    width, height = img.size
    print(f"Loaded image: {image_path} ({width}x{height})")

    # Calculate fragment size
    frag_w, frag_h = width // cols, height // rows

    # Try to load a default font
    try:
        font = ImageFont.truetype("arial.ttf", 30)
    except:
        font = ImageFont.load_default()

    count = 1
    for r in range(rows):
        for c in range(cols):
            left = c * frag_w
            upper = r * frag_h
            right = (c + 1) * frag_w
            lower = (r + 1) * frag_h

            # Crop each fragment
            fragment = img.crop((left, upper, right, lower))

            # Draw fragment number
            draw = ImageDraw.Draw(fragment)
            draw.text((10, 10), str(count), fill="red", font=font)

            # Save fragment
            output_path = os.path.join(output_dir, f"fragment_{count}.png")
            fragment.save(output_path)
            print(f"✅ Saved {output_path}")
            count += 1

    print(f"\n✅ Done! {count - 1} fragments created in '{output_dir}'")

if __name__ == "__main__":
    split_image(IMAGE_PATH, ROWS, COLS, OUTPUT_DIR)

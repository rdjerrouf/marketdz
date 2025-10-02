#!/usr/bin/env python3
"""
Download test photos for MarketDZ testing
Downloads high-resolution photos to test compression and upload flow
"""
import os
import requests
from concurrent.futures import ThreadPoolExecutor
import sys

# Directory to save the photos
OUTPUT_DIR = "test_photos"

# Number of photos to download
NUM_PHOTOS = 100  # Start with 100, can increase later

# Base URL for random high-resolution photos (using Lorem Picsum)
BASE_URL = "https://picsum.photos/1920/1080"

def download_photo(photo_id):
    """Download a single photo."""
    try:
        response = requests.get(BASE_URL, stream=True, timeout=30)
        if response.status_code == 200:
            file_path = os.path.join(OUTPUT_DIR, f"photo_{photo_id:04d}.jpg")
            with open(file_path, "wb") as file:
                for chunk in response.iter_content(1024):
                    file.write(chunk)
            file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
            print(f"✅ Downloaded: {file_path} ({file_size_mb:.2f} MB)")
            return True
        else:
            print(f"❌ Failed to download photo {photo_id}: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error downloading photo {photo_id}: {e}")
        return False

def main():
    # Get number of photos from command line if provided
    num_photos = int(sys.argv[1]) if len(sys.argv) > 1 else NUM_PHOTOS

    print(f"📸 Downloading {num_photos} high-resolution photos to '{OUTPUT_DIR}'...")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Download photos with thread pool
    with ThreadPoolExecutor(max_workers=10) as executor:
        results = list(executor.map(download_photo, range(1, num_photos + 1)))

    # Summary
    success_count = sum(results)
    total_size = sum(
        os.path.getsize(os.path.join(OUTPUT_DIR, f))
        for f in os.listdir(OUTPUT_DIR)
        if f.endswith('.jpg')
    )
    total_size_mb = total_size / (1024 * 1024)

    print(f"\n🎉 Download complete!")
    print(f"   ✅ Successfully downloaded: {success_count}/{num_photos}")
    print(f"   📦 Total size: {total_size_mb:.2f} MB")
    print(f"   📁 Location: {os.path.abspath(OUTPUT_DIR)}")

if __name__ == "__main__":
    main()

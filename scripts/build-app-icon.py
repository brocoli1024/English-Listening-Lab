"""Render the app's original record mark. Development-only: requires Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parent.parent
size = 1024
image = Image.new('RGBA', (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((0, 0, 1023, 1023), radius=210, fill='#F3F0E7')
draw.ellipse((96, 96, 928, 928), fill='#242620')
for inset in (142, 186, 230, 274):
    draw.ellipse((inset, inset, 1024-inset, 1024-inset), outline='#54564B', width=5)
draw.ellipse((334, 334, 690, 690), fill='#FF5935')
for x, height in ((416, 70), (464, 130), (512, 192), (560, 130), (608, 70)):
    draw.rounded_rectangle((x-12, 512-height//2, x+12, 512+height//2), radius=12, fill='#F3F0E7')
target = root / 'assets/images'
image.save(target / 'listening-lab.png')
image.save(target / 'listening-lab.ico', sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])

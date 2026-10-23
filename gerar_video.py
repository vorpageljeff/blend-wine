from pathlib import Path
from PIL import Image
import imageio_ffmpeg

SOURCE = Path('/tmp/blend-wine-full.png')
OUTPUT = Path(__file__).with_name('apresentacao-blend-wine.mp4')
FPS = 30
WIDTH, HEIGHT = 1280, 720

page = Image.open(SOURCE).convert('RGB')
source_w, source_h = page.size
crop_h = round(source_w * HEIGHT / WIDTH)
max_y = source_h - crop_h

segments = [
    (5.0, 0, 80),
    (5.0, 80, 650),
    (8.0, 650, 1600),
    (7.0, 1600, 2450),
    (7.0, 2450, 3300),
    (7.0, 3300, 4000),
    (6.0, 4000, 4600),
    (5.0, 4600, max_y),
    (3.0, max_y, max_y),
]

def smoothstep(value: float) -> float:
    return value * value * (3 - 2 * value)

def frame_at(y: float) -> Image.Image:
    y = max(0, min(int(y), max_y))
    crop = page.crop((0, y, source_w, y + crop_h))
    return crop.resize((WIDTH, HEIGHT), Image.Resampling.LANCZOS)

writer = imageio_ffmpeg.write_frames(str(OUTPUT), (WIDTH, HEIGHT), fps=FPS, codec='libx264', quality=7, pix_fmt_in='rgb24', pix_fmt_out='yuv420p', output_params=['-movflags', '+faststart'])
writer.send(None)
for duration, start_y, end_y in segments:
    count = round(duration * FPS)
    for index in range(count):
        progress = index / max(count - 1, 1)
        y = start_y + (end_y - start_y) * smoothstep(progress)
        writer.send(frame_at(y).tobytes())
writer.close()
print(OUTPUT)

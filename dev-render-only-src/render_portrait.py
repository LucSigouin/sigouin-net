"""Portrait (phone) stills of the login workstation: the monitor fills the width.
Run: blender -b -P render_portrait.py -- <width> <height> <samples> <outdir>
"""
import bpy, sys
from pathlib import Path
from mathutils import Vector
HERE = Path(__file__).resolve().parent
BLEND = Path('/Users/ls/Claude-Workspace/personal/vybe-workstation/revisions/network-reference/outputs/vybe-workstation.blend')
w, h, samples, out = sys.argv[sys.argv.index('--') + 1:]
OUT = Path(out); OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(BLEND))
s = bpy.context.scene
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'; prefs.get_devices()
for d in prefs.devices: d.use = True
s.cycles.device = 'GPU'
s.cycles.use_denoising = True
image = bpy.data.images.load(str(HERE / 'login-still.png'), check_existing=False)
for node in bpy.data.materials['Screen.Dashboard'].node_tree.nodes:
    if node.type == 'TEX_IMAGE':
        node.image = image
cam = bpy.data.cameras.new('Camera.Portrait'); cam.lens = 50; cam.sensor_width = 36; cam.sensor_fit = 'HORIZONTAL'
portrait = bpy.data.objects.new('Camera.Portrait', cam); s.collection.objects.link(portrait)
# Monitor display spans x -1.70..0.28, z 0.97..2.04 at y 0.26; frame ~2.5 wide so the rack edge peeks in.
target = Vector((-0.6, 0.26, 1.75))
portrait.location = (-0.5, -3.05, 2.2)
portrait.rotation_euler = (target - portrait.location).to_track_quat('-Z', 'Y').to_euler()
s.camera = portrait
s.render.resolution_x, s.render.resolution_y = int(w), int(h)
s.render.resolution_percentage = 100
s.cycles.samples = int(samples)
for pose, frame in [('closed', 1), ('open', 60)]:
    s.frame_set(frame)
    s.render.filepath = str(OUT / f'portrait-{pose}.png')
    bpy.ops.render.render(write_still=True)
    if len(sys.argv) and 'test' in out: break

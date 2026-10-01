"""Re-renders the four homepage stills with the login screen on the monitor.

Same scene, cameras and settings as vybe-workstation revisions monitor-waveform (desktop,
Camera.Reference 1600x900, 64 samples) and mobile-v1 (Camera.Mobile 960x800, 32 samples).
Run: blender -b -P render_login_stills.py
"""
import bpy
from pathlib import Path
from mathutils import Vector
HERE = Path(__file__).resolve().parent
BLEND = Path('/Users/ls/Claude-Workspace/personal/vybe-workstation/revisions/network-reference/outputs/vybe-workstation.blend')
OUT = HERE / 'renders'
OUT.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(BLEND))
s = bpy.context.scene
s.cycles.device = 'CPU'
s.cycles.use_denoising = True
image = bpy.data.images.load(str(HERE / 'login-still.png'), check_existing=False)
for node in bpy.data.materials['Screen.Dashboard'].node_tree.nodes:
    if node.type == 'TEX_IMAGE':
        node.image = image
cam = bpy.data.cameras.new('Camera.Mobile'); cam.lens = 50; cam.sensor_width = 36; cam.sensor_fit = 'HORIZONTAL'
mobile = bpy.data.objects.new('Camera.Mobile', cam); s.collection.objects.link(mobile)
mobile.location = (.15, -5.8, 2.9)
mobile.rotation_euler = (Vector((-.33, 0, 1.18)) - mobile.location).to_track_quat('-Z', 'Y').to_euler()
for prefix, camera, res, samples in [('', bpy.data.objects['Camera.Reference'], (1600, 900), 64), ('mobile-', mobile, (960, 800), 32)]:
    s.camera = camera
    s.render.resolution_x, s.render.resolution_y = res
    s.render.resolution_percentage = 100
    s.cycles.samples = samples
    for pose, frame in [('closed', 1), ('open', 60)]:
        s.frame_set(frame)
        s.render.filepath = str(OUT / f'{prefix}{pose}.png')
        bpy.ops.render.render(write_still=True)

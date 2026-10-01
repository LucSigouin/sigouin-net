"""Phone stills: the rack fills the screen and a rack-mount monitor with the login screen
replaces the blank top panel and the UNRAID status display.
Run: blender -b -P render_rack.py -- <width> <height> <samples> <outdir> [straight|angle ...]
"""
import bpy, sys
from pathlib import Path
from mathutils import Vector
HERE = Path(__file__).resolve().parent
BLEND = Path('/Users/ls/Claude-Workspace/personal/vybe-workstation/revisions/network-reference/outputs/vybe-workstation.blend')
args = sys.argv[sys.argv.index('--') + 1:]
w, h, samples, out = args[:4]; views = args[4:] or ['straight']
OUT = Path(out); OUT.mkdir(parents=True, exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(BLEND))
s = bpy.context.scene
prefs = bpy.context.preferences.addons['cycles'].preferences
prefs.compute_device_type = 'METAL'; prefs.get_devices()
for d in prefs.devices: d.use = True
s.cycles.device = 'GPU'; s.cycles.use_denoising = True
# The desk monitor keeps its login screen too.
still = bpy.data.images.load(str(HERE / 'login-still.png'), check_existing=False)
for node in bpy.data.materials['Screen.Dashboard'].node_tree.nodes:
    if node.type == 'TEX_IMAGE': node.image = still

def hide(root):
    root.hide_render = True
    for child in root.children_recursive: child.hide_render = True
hide(bpy.data.objects['Rack.Header'])
hide(bpy.data.objects['Rack.StatusDisplay'])

# Rack-mount monitor over the freed bays: z 1.795..2.275, between the rails.
x0, x1, z0, z1 = 0.893, 1.487, 1.795, 2.275
bpy.ops.mesh.primitive_cube_add(location=((x0 + x1) / 2, 0.05, (z0 + z1) / 2))
bezel = bpy.context.object; bezel.name = 'Rack.LoginMonitor'
bezel.scale = ((x1 - x0) / 2, 0.24, (z1 - z0) / 2)
bezel.data.materials.append(bpy.data.materials['Metal.Graphite'])
m = 0.022
bpy.ops.mesh.primitive_plane_add(location=((x0 + x1) / 2, -0.1915, (z0 + z1) / 2), rotation=(1.5707963, 0, 0))
glass = bpy.context.object; glass.name = 'Rack.LoginScreen'
glass.scale = ((x1 - x0) / 2 - m, (z1 - z0) / 2 - m, 1)
mat = bpy.data.materials['Screen.Dashboard'].copy(); mat.name = 'Screen.RackLogin'
for node in mat.node_tree.nodes:
    if node.type == 'TEX_IMAGE': node.image = bpy.data.images.load(str(HERE / 'login-rack.png'), check_existing=False)
glass.data.materials.append(mat)

cam = bpy.data.cameras.new('Camera.Rack'); cam.lens = 50; cam.sensor_width = 36; cam.sensor_fit = 'HORIZONTAL'
rig = bpy.data.objects.new('Camera.Rack', cam); s.collection.objects.link(rig); s.camera = rig
POSES = {  # camera location, look-at
    'straight': ((1.19, -1.75, 1.55), (1.19, 0.0, 1.3)),
    'angle': ((0.55, -1.7, 1.6), (1.15, 0.1, 1.3)),
}
s.render.resolution_x, s.render.resolution_y = int(w), int(h)
s.render.resolution_percentage = 100
s.cycles.samples = int(samples)
for view in views:
    loc, look = POSES[view]
    rig.location = loc
    rig.rotation_euler = (Vector(look) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    for pose, frame in [('closed', 1), ('open', 60)]:
        s.frame_set(frame)
        s.render.filepath = str(OUT / f'rack-{view}-{pose}.png')
        bpy.ops.render.render(write_still=True)

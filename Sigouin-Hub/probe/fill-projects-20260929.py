"""One-off (2026-09-29): card images respect the /hub/ base, and fill the hub project slots."""
import json
import pathlib

HUB = pathlib.Path(__file__).resolve().parent.parent

overlays = HUB / 'src/ui/overlays.ts'
text = overlays.read_text()
old = '? `<img src="${esc(entry.image)}"'
new = "? `<img src=\"${esc(entry.image.startsWith('/') ? import.meta.env.BASE_URL + entry.image.slice(1) : entry.image)}\""
if old in text:
    overlays.write_text(text.replace(old, new, 1))

projects = HUB / 'src/content/projects.json'
data = json.loads(projects.read_text())


def put(building, exhibit, title, blurb, url=None, image=None):
    entry = next(e for e in data['buildings'][building]['entries'] if e['exhibit'] == exhibit)
    entry.update(title=title, blurb=blurb, url=url, image=image)


put('computer-lab', 'projector', 'Undergrowth',
    'A tower defence garden you play in the browser. Plant, grow, and hold the keep.',
    'https://undergrowth.pages.dev/', '/shots/undergrowth.jpg')
put('computer-lab', 'monitor-1', 'Dragonwilds Field Guide',
    'Search every item and recipe, and find resources on the Ashenfall world map.',
    'https://dragonwilds.sigouin.net/', '/shots/dragonwilds.jpg')
put('computer-lab', 'monitor-2', 'Game servers for friends',
    'Dedicated servers I host for the group, set up and backed up automatically.')
put('music-studio', 'mixing-desk', 'SiGz',
    'My electronic music and DJ mixes, streamed from my own site.',
    'https://sigzmusic.com/', '/shots/sigz.jpg')
put('office', 'server-rack', 'Gardens homelab',
    'Three servers on a private mesh, running media, backups and everything else at home.')
put('office', 'whiteboard', 'TeeTimes Ottawa',
    'Every free tee time around Ottawa on one map, with a link to book at the course.',
    'https://teetime.sigouin.net/', '/shots/teetimes.jpg')
put('office', 'desk-1', 'RsyncGui',
    'A web app for running and watching rsync backups on Unraid, shipped as a Docker container.')
put('ai-workspace', 'brain', 'The fleet',
    'How this site gets built: one brief, several AI coders, tests before anything ships.',
    '/process/', '/shots/process.jpg')
put('ai-workspace', 'terminal-1', 'Tripo 3D tool',
    'A small server that lets Claude turn a picture or a sentence into a 3D model.')

projects.write_text(json.dumps(data, indent=2, ensure_ascii=False) + '\n')
for building_id, building in data['buildings'].items():
    for e in building['entries']:
        print(building_id, e['exhibit'], '|', e['title'], '|', e['url'], '|', e['image'])

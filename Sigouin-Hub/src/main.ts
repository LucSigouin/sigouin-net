import './ui/styles.css';
import { Boot } from './boot/boot';
import { Links } from './ui/links';

import type { HubApi } from './hubApi';

const hub = { state: () => 'boot', bootProgress: 0 } as unknown as HubApi;
window.__hub = hub;

const boot = new Boot();
boot.onProgress = (p) => { hub.bootProgress = Math.round(p * 100); };
const links = new Links();
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);

function hasWebGL2() {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}

async function run() {
  const webgl = hasWebGL2();
  if (!webgl || params.has('links')) {
    boot.abort();
    links.show({
      canReturn: false,
      note: webgl ? undefined : 'This browser cannot show the 3D courtyard, so here is the same hub as a plain list.',
    });
    hub.state = () => 'links';
    return;
  }
  try {
    // ?probe loads the self-test layer in its own chunk; normal visits never fetch it.
    const probe = params.has('probe') ? await import('./probe/probe') : null;
    probe?.early(params);
    boot.setProgress(0.04);
    const { createApp } = await import('./core/app');
    boot.setProgress(0.14);
    const app = await createApp({ onProgress: (f) => boot.setProgress(0.14 + f * 0.86), reducedMotion: reduced, links });
    Object.assign(hub, app.hooks());
    probe?.install(app, params);
    await boot.finish(reduced ? 0 : 1800, () => app.reveal());
  } catch (err) {
    console.error('[hub] 3D failed to start', err);
    boot.abort();
    links.show({ canReturn: false, note: 'The 3D courtyard could not start on this device, so here is the plain version.' });
    hub.state = () => 'links';
  }
}

void run();

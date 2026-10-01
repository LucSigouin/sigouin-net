/* Round 18 background clips, shared by / and /process/.
   One rule lives here: when the visitor asks for less motion, or their connection reports
   saveData, neither background clip plays and the poster stays on screen instead. This
   file is a plain script placed immediately after the clips in the markup, so it runs
   during parse and stops playback before the first frame is ever painted. */
(function () {
  var conn = navigator.connection || navigator.webkitConnection;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    !!(conn && conn.saveData);
  document.documentElement.dataset.motion = still ? 'still' : 'play';
  if (!still) return;
  var clips = document.querySelectorAll('video[data-bg]');
  for (var i = 0; i < clips.length; i++) {
    clips[i].autoplay = false;
    clips[i].removeAttribute('autoplay');
    clips[i].removeAttribute('loop');
    clips[i].preload = 'none';
    clips[i].pause();
  }
})();

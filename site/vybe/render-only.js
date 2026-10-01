// With the "Explore in 3D" button hidden, a tap on the still starts the live scene instead.
const scene = document.querySelector('#scene');
scene.addEventListener('click', () => {
  if (scene.dataset.mode === 'still') document.querySelector('#explore-3d').click();
});

// Coming back from the hub (walking out of the garden, or the browser's Back button): the room
// fades back in from the same blur it left through.
function playReturn() {
  const body = document.body;
  body.classList.remove('leaving', 'returning');
  void body.offsetWidth;
  body.classList.add('returning');
  setTimeout(() => body.classList.remove('returning'), 1200);
}
if (location.hash === '#from-hub') {
  history.replaceState(null, '', location.pathname + location.search);
  playReturn();
}
addEventListener('pageshow', (event) => {
  if (event.persisted && document.body.classList.contains('leaving')) playReturn();
});

// Phones: the rack still. Its top monitor enters the hub; the rack below opens the door.
const rackView = document.querySelector('#rack-view');
const rackDoor = document.querySelector('#rack-door');
document.querySelector('#rack-enter').addEventListener('click', () => {
  if (document.body.classList.contains('leaving')) return;
  document.body.classList.add('leaving');
  setTimeout(() => { location.href = '/hub/'; }, 650);
});
rackDoor.addEventListener('click', () => {
  const open = rackView.classList.toggle('open');
  rackDoor.setAttribute('aria-pressed', String(open));
  rackDoor.setAttribute('aria-label', open ? 'Close the rack' : 'Open the rack');
});

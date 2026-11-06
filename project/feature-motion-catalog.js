(() => {
  const create = window.createMotionMedia;
  const userClips = {items: [
    {key: 'tui-first-steps', src: '/assets/tui/first-steps.mp4', fps: 30},
    {key: 'tui-first-steps-detail', src: '/assets/tui/first-steps-detail.mp4', fps: 30},
    {key: 'worker-contrast-stone-age', src: '/assets/new-footage/stone-age.mp4', fps: 30},
    {key: 'worker-contrast-factory', src: '/assets/user-media/factory_eighteen.mp4'},
  ]};
  window.createMotionMedia = (catalogs, ...args) => create([...catalogs, userClips], ...args);
})();

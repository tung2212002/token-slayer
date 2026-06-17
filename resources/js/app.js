import './echo';

// Phaser is ~1 MB — only load when battlefield canvas is present
window.__battlefieldModule = import('./battlefield');
window.__battlefieldModule.then(m => { window.bootBattlefield = m.bootBattlefield; });

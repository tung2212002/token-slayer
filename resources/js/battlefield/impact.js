import { BOSS_ANCHOR, TIMINGS, HP_BAR } from './config.js';

export function applyImpact(scene, hpAfter) {
  if (!scene.anims.exists('explosion-once')) {
    scene.anims.create({
      key: 'explosion-once',
      frames: scene.anims.generateFrameNumbers('explosion', { start: 0, end: 3 }),
      frameRate: 18,
    });
  }
  const burst = scene.add
    .sprite(BOSS_ANCHOR.x, BOSS_ANCHOR.y, 'explosion')
    .setScale(2);
  burst.play('explosion-once').once('animationcomplete', () => burst.destroy());

  const boss = scene.bossSprite;
  const baseScaleX = boss.scaleX;
  const baseScaleY = boss.scaleY;
  scene.tweens.add({
    targets: boss,
    scaleX: baseScaleX * 1.1,
    scaleY: baseScaleY * 0.9,
    duration: TIMINGS.flinchMs / 2,
    yoyo: true,
    ease: 'Quad.easeOut',
  });
  boss.setTintFill(0xffffff);
  scene.time.delayedCall(80, () => boss.clearTint());

  scene.cameras.main.shake(
    TIMINGS.cameraShake.duration,
    TIMINGS.cameraShake.intensity,
  );

  const max = scene.bossState.maxHp;
  const targetWidth = HP_BAR.width * (hpAfter / max);
  scene.tweens.add({
    targets: scene.hpBarFill,
    width: targetWidth,
    duration: TIMINGS.hpBarMs,
    ease: 'Quad.easeOut',
  });
  const counter = { v: scene.bossState.currentHp };
  scene.tweens.add({
    targets: counter,
    v: hpAfter,
    duration: TIMINGS.hpBarMs,
    ease: 'Quad.easeOut',
    onUpdate: () => scene.hpText.setText(`${Math.round(counter.v)} / ${max}`),
  });
  scene.bossState.currentHp = hpAfter;
}

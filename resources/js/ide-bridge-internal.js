// Testable helpers used by ide-bridge.js. Pure functions only.
export function shouldForwardToHost(message, hasVscodeApi, hasParent) {
    if (!message || typeof message !== 'object' || typeof message.type !== 'string') return false;
    return hasVscodeApi || hasParent;
}

export function packHit(payload, currentUserId) {
    if (currentUserId === null || Number(payload.user_id) !== currentUserId) return null;
    return {
        type: 'hit-landed',
        userId: Number(payload.user_id),
        damage: Number(payload.damage),
        bossId: Number(payload.boss_id),
        bossHpAfter: Number(payload.boss_hp_after),
        bossMaxHp: Number(payload.boss_max_hp),
    };
}

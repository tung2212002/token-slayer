export function computeFighterPositions(count, [minX, maxX], topY, perRow = 14, rowSpacing = 27) {
  if (count === 0) {
    return [];
  }
  const positions = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const rowStart = row * perRow;
    const rowCount = Math.min(perRow, count - rowStart);
    const idxInRow = i - rowStart;
    const x = rowCount === 1
      ? minX + (maxX - minX) * 0.3
      : minX + ((maxX - minX) / (rowCount - 1)) * idxInRow;
    const y = topY + row * rowSpacing;
    positions.push({ x, y });
  }
  return positions;
}

// Up to +40% bigger for the top contributor
export function damageScaleMultiplier(damage, maxHp) {
  if (!maxHp) {
    return 1;
  }
  return 1 + Math.min(damage / maxHp, 1) * 0.4;
}

// Foot anchor for the charge particle emitters (≈ 0.35 leg height × 0.6)
export function chargeFootY(posY, displaySize) {
  return posY + Math.round(displaySize * 0.21);
}

export function rowsNeeded(count, perRow = 14) {
  return Math.max(1, Math.ceil(count / perRow));
}

export function fighterDisplayConfig(count, mode = 'landscape') {
  if (mode === 'portrait') {
    // Canvas 540×960. Boss area ends ~430. Fighters fill 430–960.
    if (count <= 8) {
      return { displaySize: 120, topY: 620, rowSpacing: 130, showHandle: true,  perRow: 8 };
    }
    return   { displaySize: 96,  topY: 610, rowSpacing: 110, showHandle: false, perRow: 8 };
  }
  // Canvas 960×540. Boss area ends ~310. HP bar at 300. Fighters fill 320–540.
  if (count <= 14) {
    return { displaySize: 120, topY: 460, rowSpacing: 130, showHandle: true,  perRow: 14 };
  }
  if (count <= 28) {
    return { displaySize: 96,  topY: 380, rowSpacing: 106, showHandle: false, perRow: 14 };
  }
  return   { displaySize: 60,  topY: 365, rowSpacing: 70,  showHandle: false, perRow: 14 };
}

import * as vscode from 'vscode';
import type { AuthService } from '../auth/AuthService';
import type { BattlefieldPanel } from '../webview/BattlefieldPanel';

export function registerStatusBarItem(
  context: vscode.ExtensionContext,
  auth: AuthService,
  panel: BattlefieldPanel,
): void {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.command = 'aiorg.openBattlefield';

  const render = (text: string) => {
    item.text = `$(zap) ${text}`;
    item.show();
  };

  const setSignedOut = () => {
    item.text = '$(zap) aiorg: signed out';
    item.command = 'aiorg.signIn';
    item.show();
  };

  context.subscriptions.push(item);

  let currentBossLabel: string | null = null;

  auth.onAuthChanged(async (state) => {
    if (!state.signedIn) {
      setSignedOut();
      return;
    }
    item.command = 'aiorg.openBattlefield';
    render('connecting…');
  });

  panel.onBridgeEvent((m) => {
    switch (m.type) {
      case 'connection-state':
        if (m.state === 'connected') {
          render(currentBossLabel ?? 'ready');
        } else {
          render(m.state);
        }
        return;
      case 'boss-spawned':
        currentBossLabel = `${m.name} ${m.maxHp.toLocaleString()}HP`;
        render(currentBossLabel);
        return;
      case 'boss-defeated':
        currentBossLabel = 'no boss';
        render(currentBossLabel);
        return;
      case 'hit-landed':
        render(`hit ${m.damage.toLocaleString()} — boss ${m.bossHpAfter.toLocaleString()}/${m.bossMaxHp.toLocaleString()}`);
        return;
      case 'charging-updated':
        if (m.activity) render(`charging: ${m.activity}`);
        else if (currentBossLabel) render(currentBossLabel);
        return;
      default:
        return;
    }
  });

  void auth.isSignedIn().then((signedIn) => {
    if (signedIn) render('connecting…');
    else setSignedOut();
  });
}

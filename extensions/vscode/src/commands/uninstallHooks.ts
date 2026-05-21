import * as vscode from 'vscode';
import type { AiorgClient } from '../api/AiorgClient';
import { removeHooks } from '../hooks/HookManager';
import { InvalidSettingsError, SettingsFile } from '../hooks/SettingsFile';

export function registerUninstallHooks(
  context: vscode.ExtensionContext,
  client: AiorgClient,
  settingsFile = new SettingsFile(),
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('aiorg.uninstallHooks', async () => {
      try {
        const config = await client.get<{ namespace: string }>('/api/ide/hook-config');
        const existing = await settingsFile.read();
        const next = removeHooks(existing, config.namespace);

        if (JSON.stringify(existing) === JSON.stringify(next)) {
          void vscode.window.showInformationMessage('No aiorg hooks installed.');
          return;
        }

        await settingsFile.write(next);
        void vscode.window.showInformationMessage(
          `aiorg hooks removed from ${settingsFile.filePath}`,
        );
      } catch (err) {
        if (err instanceof InvalidSettingsError) {
          void vscode.window.showErrorMessage(
            `aiorg: ${settingsFile.filePath} is not valid JSON.`,
          );
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        void vscode.window.showErrorMessage(`aiorg: uninstall failed (${message})`);
      }
    }),
  );
}

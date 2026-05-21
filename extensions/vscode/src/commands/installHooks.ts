import * as vscode from 'vscode';
import type { AiorgClient } from '../api/AiorgClient';
import { mergeHooks, type HookConfig } from '../hooks/HookManager';
import { InvalidSettingsError, SettingsFile } from '../hooks/SettingsFile';

export function registerInstallHooks(
  context: vscode.ExtensionContext,
  client: AiorgClient,
  settingsFile = new SettingsFile(),
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('aiorg.installHooks', async () => {
      try {
        const config = await client.get<HookConfig>('/api/ide/hook-config');
        const existing = await settingsFile.read();
        const next = mergeHooks(existing, config);

        if (JSON.stringify(existing) === JSON.stringify(next)) {
          void vscode.window.showInformationMessage('aiorg hooks already up to date.');
          return;
        }

        await settingsFile.write(next);
        void vscode.window.showInformationMessage(
          `aiorg hooks installed in ${settingsFile.filePath}`,
        );
      } catch (err) {
        if (err instanceof InvalidSettingsError) {
          const open = 'Open file';
          const choice = await vscode.window.showErrorMessage(
            `aiorg: ${settingsFile.filePath} is not valid JSON. Fix it and retry.`,
            open,
          );
          if (choice === open) {
            await vscode.window.showTextDocument(vscode.Uri.file(settingsFile.filePath));
          }
          return;
        }
        const message = err instanceof Error ? err.message : String(err);
        void vscode.window.showErrorMessage(`aiorg: install failed (${message})`);
      }
    }),
  );
}

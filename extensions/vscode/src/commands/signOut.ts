import * as vscode from 'vscode';
import type { AuthService } from '../auth/AuthService';

export function registerSignOut(context: vscode.ExtensionContext, auth: AuthService): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('aiorg.signOut', async () => {
      await auth.signOut();
      void vscode.window.showInformationMessage('aiorg: signed out.');
    }),
  );
}

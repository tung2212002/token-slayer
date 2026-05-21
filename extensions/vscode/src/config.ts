import * as vscode from 'vscode';

export function getServerUrl(): string {
  const raw = vscode.workspace.getConfiguration('aiorg').get<string>('serverUrl', 'https://aiorg.app');
  return raw.replace(/\/+$/, '');
}

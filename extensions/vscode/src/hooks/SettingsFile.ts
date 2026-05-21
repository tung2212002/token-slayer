import { promises as fs } from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import type { ClaudeSettings } from './HookManager';

const DEFAULT_PATH = path.join(os.homedir(), '.claude', 'settings.json');

export class InvalidSettingsError extends Error {
  constructor(public readonly filePath: string) {
    super(`Invalid JSON at ${filePath}`);
  }
}

export class SettingsFile {
  constructor(public readonly filePath: string = DEFAULT_PATH) {}

  async read(): Promise<ClaudeSettings> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      try {
        return JSON.parse(raw) as ClaudeSettings;
      } catch {
        throw new InvalidSettingsError(this.filePath);
      }
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return {};
      throw err;
    }
  }

  async write(settings: ClaudeSettings): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true });
    await fs.writeFile(this.filePath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');
  }
}

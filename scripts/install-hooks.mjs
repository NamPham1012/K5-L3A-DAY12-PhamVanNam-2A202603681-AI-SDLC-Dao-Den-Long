import { execSync } from 'node:child_process';
import fs from 'node:fs';

try {
  if (fs.existsSync('.git')) {
    execSync('git config core.hooksPath .githooks', { stdio: 'inherit' });
    console.log('Git hooks configured: core.hooksPath=.githooks');
  }
} catch (err) {
  console.warn('Failed to install git hooks:', err.message);
}

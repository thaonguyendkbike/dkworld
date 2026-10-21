const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

console.log('1. Building production bundle...');
execSync('npm run build', { cwd: rootDir, stdio: 'inherit' });

console.log('2. Preparing gh-pages branch from dist...');
const gitInDist = path.join(distDir, '.git');
if (fs.existsSync(gitInDist)) {
  fs.rmSync(gitInDist, { recursive: true, force: true });
}

execSync('git init', { cwd: distDir, stdio: 'inherit' });
execSync('git checkout -b gh-pages', { cwd: distDir, stdio: 'inherit' });
execSync('git config user.name "Thao Nguyen"', { cwd: distDir });
execSync('git config user.email "thaonguyendkbike@gmail.com"', { cwd: distDir });
execSync('git add -A', { cwd: distDir, stdio: 'inherit' });
execSync('git commit -m "deploy: update GitHub Pages build"', { cwd: distDir, stdio: 'inherit' });

console.log('3. Pushing to origin/gh-pages...');
execSync('git push -f https://thaonguyendkbike@github.com/thaonguyendkbike/dkworld.git gh-pages', {
  cwd: distDir,
  env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  stdio: 'inherit',
});

fs.rmSync(gitInDist, { recursive: true, force: true });
console.log('Done! Successfully deployed to gh-pages branch.');

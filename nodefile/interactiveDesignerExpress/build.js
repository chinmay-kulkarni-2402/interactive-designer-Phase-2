const fs = require('fs');
const path = require('path');

// Folders and files to copy
const itemsToCopy = [
  'app.js',
  'server.js',
  'controllers',
  'middleware',
  'models',
  'routes',
  'services',
  'views',
  'config',
  'utils',
  'seeders',
  'templates',
  'uploads',
  'package.json',
  'package-lock.json'
];

// Folders to exclude
const excludeFolders = ['node_modules', 'dist', '.git', '.vscode'];

// Create dist folder
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  console.log('Cleaning dist folder...');
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath);

// Copy function
function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`Skipping ${src} (doesn't exist)`);
    return;
  }

  const stats = fs.statSync(src);

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const files = fs.readdirSync(src);
    files.forEach(file => {
      if (!excludeFolders.includes(file)) {
        copyRecursive(path.join(src, file), path.join(dest, file));
      }
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy items
console.log('Building project...');
itemsToCopy.forEach(item => {
  const srcPath = path.join(__dirname, item);
  const destPath = path.join(distPath, item);
  
  if (fs.existsSync(srcPath)) {
    console.log(`Copying ${item}...`);
    copyRecursive(srcPath, destPath);
  } else {
    console.log(`Skipping ${item} (not found)`);
  }
});

// Create a production package.json (without dev dependencies)
const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
delete packageJson.devDependencies;
fs.writeFileSync(
  path.join(distPath, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

console.log('\n✅ Build complete!');
console.log('📁 Files are in the "dist" folder');
console.log('\nTo deploy:');
console.log('1. Upload the "dist" folder to your server');
console.log('2. Run: npm install --production');
console.log('3. Run: npm start');
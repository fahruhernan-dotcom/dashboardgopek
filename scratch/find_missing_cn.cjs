const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const srcDir = path.join(__dirname, '../src');
walkDir(srcDir, (filePath) => {
  if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
    const content = fs.readFileSync(filePath, 'utf8');
    // Check if the file contains "cn("
    if (content.includes('cn(')) {
      // Check if it imports cn
      if (!content.includes('import { cn }') && !content.includes('import cn ') && !content.includes('const cn =')) {
        console.log(`Missing cn import in: ${filePath}`);
      }
    }
  }
});

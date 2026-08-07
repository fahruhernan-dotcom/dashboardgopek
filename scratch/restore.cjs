const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

try {
  console.log('Restoring MobileBeranda.jsx from git...');
  const content = execSync('git show HEAD:src/dashboard/broker/sembako_broker/components/beranda/MobileBeranda.jsx');
  const targetPath = path.join(__dirname, '../src/dashboard/broker/sembako_broker/components/beranda/MobileBeranda.jsx');
  fs.writeFileSync(targetPath, content);
  console.log('Success! MobileBeranda.jsx has been restored.');
} catch (err) {
  console.error('Error restoring file:', err);
}

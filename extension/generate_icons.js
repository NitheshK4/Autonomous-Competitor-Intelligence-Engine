const fs = require('fs');
const path = require('path');

// Base64 encoded solid-color icon PNGs to avoid dependency on image libraries during build
const icon16 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMElEQVR42mNk+M9QDwADLkGDwYgNAAYgDIhRAAygGBDjABhAMSDEAWAAYyBsGgwGAMAADL4Bw4B5t5QAAAAASUVORK5CYII=', 'base64');
const icon48 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAAMElEQVR42u3BAQEAAACAkP6v7ggKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgLcDv8ABwYAxmwAAAAASUVORK5CYII=', 'base64');
const icon128 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAMElEQVR42u3BAQEAAACAkP6v7ggKAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgLcBG5EBwV3s2QAAAABJRU5ErkJggg==', 'base64');

fs.writeFileSync(path.join(__dirname, 'icon16.png'), icon16);
fs.writeFileSync(path.join(__dirname, 'icon48.png'), icon48);
fs.writeFileSync(path.join(__dirname, 'icon128.png'), icon128);

console.log('Icons generated successfully.');

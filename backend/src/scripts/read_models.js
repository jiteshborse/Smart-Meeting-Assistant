const fs = require('fs');
try {
    // Try reading as utf16le which is common for PowerShell redirected files
    const data = fs.readFileSync('models.json', 'utf16le');
    fs.writeFileSync('models_final.json', data, 'utf8');
    console.log('Written to models_final.json');
} catch (e) {
    console.log('Error reading file:', e);
}

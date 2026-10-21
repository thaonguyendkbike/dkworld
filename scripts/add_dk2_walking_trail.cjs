// scripts/add_dk2_walking_trail.cjs
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'src', 'main.js');
const configPath = path.join(__dirname, '..', 'src', 'config.js');
const indexPath = path.join(__dirname, '..', 'index.html');

let mainCode = fs.readFileSync(mainPath, 'utf8');
let configCode = fs.readFileSync(configPath, 'utf8');
let indexCode = fs.readFileSync(indexPath, 'utf8');

console.log('Read files successfully. Total main.js length:', mainCode.length);

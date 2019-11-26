require('dotenv').config();
const reqDir = require('require-dir');
const View = require('./View.js');

const views = reqDir('./create/');

const allComplete = [];

for (let v in views) {
  console.log('Creating: ', v);
  allComplete.push(views[v](View));
}

Promise.all(allComplete).then(_ => process.exit());

const fs = require('fs');
const path = require('path');

// Load the util.js function manually for testing (since it's meant for browser)
const root = path.resolve(__dirname, '..');
const utilCode = fs.readFileSync(path.join(root, 'util.js'), 'utf8');

// A minimal mock of DOM so util.js can execute without crashing
global.HTMLElement = function(){};
global.HTMLElement.prototype = {};
global.NodeList = function(){};
global.NodeList.prototype = {};
global.document = {
  createElement: () => ({}),
  querySelectorAll: () => [],
  addEventListener: () => {},
  body: {
    addEventListener: () => {}
  }
};
global.window = {
  shellReply: {},
  Tool: {}
};
global.Tool = {};
global.screen = {};
global.navigator = {};

// Evaluate the util.js code in this context
eval(utilCode);

function testLog(name) {
  const logPath = path.join(__dirname, 'samples', name);
  if (!fs.existsSync(logPath)) {
    console.log(`Log file not found: ${name}`);
    return;
  }
  const logData = fs.readFileSync(logPath, 'utf8');
  
  const chunks = logData.splitPrompts();
  console.log(`\n=== Testing ${name} ===`);
  console.log(`Found ${chunks.length} chunks.`);
  chunks.forEach((c, i) => {
    console.log(`  Chunk ${i+1}: ${JSON.stringify(c.substring(0, 60))} ...`);
  });
}

testLog('android-arm64_user-log.txt');
testLog('darwin-arm64_user-log.txt');

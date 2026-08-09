const fs = require('fs');

const rawText = "\\u001b[?2004h\\u001b[0;32m~\\u001b[0m \\u001b[0;97m$\\u001b[0m whoami\\r\\n\\u001b[?2004l\\ru0_a410";
const ansiRegex = /\\x1B(?:\[[0-?]*[ -/]*[@-~]|\][^\x07]+\\x07)/g;

let flatToRaw = [];
let flatText = '';
let match;
let lastIndex = 0;
ansiRegex.lastIndex = 0;

while ((match = ansiRegex.exec(rawText)) !== null) {
    for (let i = lastIndex; i < match.index; i++) {
        flatToRaw.push(i);
        flatText += rawText[i];
    }
    lastIndex = ansiRegex.lastIndex;
}
for (let i = lastIndex; i < rawText.length; i++) {
    flatToRaw.push(i);
    flatText += rawText[i];
}
flatToRaw.push(rawText.length);

console.log("FLAT TEXT:", JSON.stringify(flatText));

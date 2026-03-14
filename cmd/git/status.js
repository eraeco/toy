window.renderStatus = function(statusText, containerEl) {
    var lines = statusText.split(/\r?\n/);
    var listDiv = document.createElement('div');
    listDiv.className = 'ls';
    containerEl.replaceChildren();
    if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) {
        listDiv.appendChild(statusNote('Working tree clean.'));
        containerEl.appendChild(listDiv);
        return;
    }
    lines.forEach(function(line) {
        var fileStr = '';
        var statusStr = '';
        var matchShort;
        var matchLong;
        var isHint;
        var info;
        if (!line.trim()) { return; }
        matchShort = line.match(/^([ MADRCU?!]{2})\s+(.+)$/);
        matchLong = line.match(/^[\t ]+(?:([a-z ]+):\s+)?(.+)$/);
        isHint = line.trim().startsWith('(') || line.trim().startsWith('no changes') || line.trim().startsWith('nothing to commit') || line.trim().startsWith('Changes');
        if (matchShort && !line.match(/^[\t ]/)) {
            statusStr = matchShort[1];
            fileStr = matchShort[2].trim();
        } else if (matchLong && !isHint) {
            info = statusFromLong(matchLong);
            statusStr = info.sta;
            fileStr = info.file;
        }
        if (!fileStr || isHint) {
            listDiv.appendChild(statusNote(line));
            return;
        }
        listDiv.appendChild(statusCard(fileStr, statusStr));
    });
    containerEl.appendChild(listDiv);
};

function statusFromLong(matchLong) {
    var action = matchLong[1] ? matchLong[1].trim() : '';
    var path = matchLong[2].trim();
    var fileStr = path.indexOf(' -> ') >= 0 ? path.split(' -> ')[1] : path;
    var statusStr = ' M';
    if (action.indexOf('modified') >= 0) { statusStr = ' M'; }
    else if (action.indexOf('new file') >= 0) { statusStr = 'A '; }
    else if (action.indexOf('deleted') >= 0) { statusStr = ' D'; }
    else if (action.indexOf('renamed') >= 0) { statusStr = ' R'; }
    else if (!action) { statusStr = '??'; }
    return {file: fileStr, sta: statusStr};
}

function statusNote(txt) {
    var v = document.getElementById('textm').content.firstElementChild.cloneNode(true);
    v.textContent = txt;
    return v;
}

function statusCard(fileStr, statusStr) {
    var a = document.getElementById('statm').content.firstElementChild.cloneNode(true);
    var icon = a.querySelector('.sticon');
    var file = a.querySelector('.stfile');
    var tag = a.querySelector('.sttag');
    var info = statusLook(statusStr);
    var isStagedOnly = statusStr[1] === ' ' && statusStr[0] !== ' ' && statusStr[0] !== '?';
    var diffFlag = isStagedOnly ? '--cached' : '';
    icon.textContent = info.icon;
    icon.style.color = info.color;
    icon.style.filter = 'drop-shadow(0 0 5px ' + info.color + ')';
    file.textContent = fileStr;
    file.style.color = info.color;
    tag.textContent = '[' + statusStr + ']';
    tag.style.color = info.color;
    a.onpointerdown = function() {
        if (statusStr.indexOf('?') >= 0) { window.kit.say('cat "' + fileStr + '"', 'prompt.try'); }
        else { window.kit.say('git diff ' + diffFlag + ' "' + fileStr + '"', 'prompt.try'); }
    };
    a.onclick = function() {
        if (statusStr.indexOf('?') >= 0) { window.kit.say('cat "' + fileStr + '"', 'prompt'); }
        else { window.kit.say('git diff ' + diffFlag + ' "' + fileStr + '"', 'prompt'); }
    };
    return a;
}

function statusLook(statusStr) {
    var info = {color: 'white', icon: '📄'};
    if (statusStr.indexOf('M') >= 0) { info = {color: '#00ffc8', icon: '📝'}; }
    else if (statusStr.indexOf('?') >= 0) { info = {color: '#ff0055', icon: '✨'}; }
    else if (statusStr.indexOf('A') >= 0) { info = {color: '#34c759', icon: '➕'}; }
    else if (statusStr.indexOf('D') >= 0) { info = {color: '#ff3b30', icon: '🗑️'}; }
    return info;
}

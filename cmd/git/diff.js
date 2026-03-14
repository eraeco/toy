window.renderDiff = function(diffText, containerEl) {
    var diffs;
    containerEl.replaceChildren();
    if (!window.Diff2Html) {
        containerEl.textContent = "Diff2Html not loaded.";
        return;
    }
    try {
        diffs = Diff2Html.parse(diffText);
    } catch(e) {
        containerEl.textContent = "Error parsing diff: " + e.message;
        return;
    }
    if (!diffs || !diffs.length) {
        containerEl.appendChild(diffEmpty('No changes.'));
        return;
    }
    diffs.forEach(function(d) {
        var name = d.newName.replace(/^b\//, '') || d.oldName.replace(/^a\//, '');
        var raw = extractRawDiff(diffText, d);
        var card = diffCard();
        var head = card.querySelector('.file-header');
        var btn = card.querySelector('.btn-save-header');
        var nameDiv = card.querySelector('.file-name');
        var ta = card.querySelector('textarea');
        var cm;
        var wait;
        nameDiv.textContent = name;
        ta.value = raw;
        head.onclick = function(e) {
            if (e.target.closest('.btn-save-header')) { return; }
            card.classList.toggle('collapsed');
            if (!card.classList.contains('collapsed') && card.cm) {
                setTimeout(function() {
                    card.cm.refresh();
                    highlightInlineDiffs(card.cm);
                }, 50);
            }
        };
        btn.onpointerdown = function(e) {
            e.stopPropagation();
            window.kit.say(diffCmd(card.cm ? card.cm.getValue() : raw), 'prompt.try');
        };
        btn.onclick = function(e) {
            e.stopPropagation();
            window.kit.say(diffCmd(card.cm ? card.cm.getValue() : raw), 'prompt');
        };
        containerEl.appendChild(card);
        cm = window.CodeMirror.fromTextArea(ta, {
            mode: 'diff',
            lineNumbers: true,
            lineWrapping: true,
            viewportMargin: Infinity,
            theme: 'default' 
        });
        cm.getWrapperElement().classList.add('cmfat');
        cm.on('change', function() {
            clearTimeout(wait);
            wait = setTimeout(function(){ highlightInlineDiffs(cm); }, 300);
        });
        card.cm = cm;
    });
};

function diffEmpty(msg) {
    var v = document.getElementById('empt').content.firstElementChild.cloneNode(true);
    v.textContent = msg;
    return v;
}

function diffCard() {
    return document.getElementById('diffm').content.firstElementChild.cloneNode(true);
}

function diffCmd(txt) {
    return "cat << 'EOF_PATCH' | git apply --whitespace=nowarn\n" + txt + "\nEOF_PATCH\n";
}

function extractRawDiff(fullDiff, diffObj) {
    var lines = fullDiff.split(/\r?\n/);
    var startIdx = -1;
    var endIdx = lines.length;
    var targetHeader = 'diff --git ' + diffObj.oldName + ' ' + diffObj.newName;
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('diff --git ') && startIdx !== -1) {
            endIdx = i;
            break;
        }
        if (lines[i].startsWith(targetHeader)) {
            startIdx = i;
        }
    }
    
    if (startIdx !== -1) {
        return lines.slice(startIdx, endIdx).join('\n') + '\n';
    }
    return '';
}

function highlightInlineDiffs(cm) {
    cm.getAllMarks().forEach(m => m.clear());
    var getCommon = function(s1, s2) {
        var pre = 0;
        var suf = 0;
        while(pre < s1.length && pre < s2.length && s1[pre] === s2[pre]) { pre++; }
        while(suf < s1.length - pre && suf < s2.length - pre && s1[s1.length - 1 - suf] === s2[s2.length - 1 - suf]) { suf++; }
        return [pre, suf];
    };
    var doc = cm.getDoc();
    var lineCount = doc.lineCount();
    var pendingDelLine = -1;
    var pendingDelText = null;
    for (var i = 0; i < lineCount; i++) {
        var lineText = doc.getLine(i);
        if (lineText.startsWith('-') && !lineText.startsWith('--- ')) {
            pendingDelLine = i;
            pendingDelText = lineText.substring(1);
        } else if (lineText.startsWith('+') && !lineText.startsWith('+++ ')) {
            if (pendingDelLine !== -1 && pendingDelLine === i - 1) {
                var addText = lineText.substring(1);
                var same = getCommon(pendingDelText, addText);
                var pre = same[0];
                var suf = same[1];
                if (pendingDelText.length - suf > pre || addText.length - suf > pre) {
                    cm.markText(
                        {line: pendingDelLine, ch: pre + 1},
                        {line: pendingDelLine, ch: pendingDelText.length - suf + 1},
                        {className: 'cm-diff-inline-del'}
                    );
                    cm.markText(
                        {line: i, ch: pre + 1},
                        {line: i, ch: addText.length - suf + 1},
                        {className: 'cm-diff-inline-add'}
                    );
                }
            }
            pendingDelLine = -1;
            pendingDelText = null;
        } else {
            pendingDelLine = -1;
            pendingDelText = null;
        }
    }
}

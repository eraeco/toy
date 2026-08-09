window.renderConfig = function(raw, container) {
    var lines = raw.split(/\r?\n/);
    var header = lines[0];
    var output = lines.slice(1);
    
    var wipe = node => node.replaceChildren();
    var make = (tag, cls, txt) => {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (txt !== undefined) node.textContent = txt;
        return node;
    };

    wipe(container);
    var ui = make('div', 'config-ui');
    var list = make('div', 'config-list');
    
    output.forEach(function(line) {
        if (!line.trim() || line.indexOf('=') === -1) return;
        var idx = line.indexOf('=');
        var k = line.substring(0, idx);
        var v = line.substring(idx + 1);
        
        var row = make('div', 'config-row');
        row.appendChild(make('div', 'config-key', k));
        
        var input = make('input', 'config-val');
        input.value = v;
        input.onchange = function() {
            window.parent.kit.say('git config ' + k + ' "' + input.value + '"', 'host');
        };
        row.appendChild(input);
        list.appendChild(row);
    });
    ui.appendChild(list);

    var addSection = make('div', 'config-add');
    addSection.appendChild(make('h3', '', 'Add Setting'));
    var addRow = make('div', 'config-add-row');
    var newKey = make('input', 'config-val');
    newKey.placeholder = 'key (e.g. user.name)';
    var newVal = make('input', 'config-val');
    newVal.placeholder = 'value';
    var addBtn = make('button', 'btn-add', 'Add');
    
    addBtn.onclick = function() {
        if (newKey.value && newVal.value) {
            window.parent.kit.say('git config ' + newKey.value + ' "' + newVal.value + '"', 'host');
            setTimeout(function() {
                window.parent.kit.say('git config --list', 'prompt');
            }, 500);
        }
    };
    
    addRow.appendChild(newKey);
    addRow.appendChild(newVal);
    addRow.appendChild(addBtn);
    addSection.appendChild(addRow);
    ui.appendChild(addSection);
    
    container.appendChild(ui);
};

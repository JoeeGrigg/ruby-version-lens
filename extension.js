// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const axios = require('axios');

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Decorators
	const upToDateDecorationType = vscode.window.createTextEditorDecorationType({
		backgroundColor: 'rgba(100,255,0,0.1)'
	});
	const outOfDateDecorationType = vscode.window.createTextEditorDecorationType({
		backgroundColor: 'rgba(255,0,0,0.1)'
	});

    // Get active editor
	let activeEditor = vscode.window.activeTextEditor;
	if (activeEditor) {
		triggerUpdateDecorations();
	}

    // Trigger Decoration Updates
	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) { triggerUpdateDecorations(); }
	}, null, context.subscriptions);
	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) { triggerUpdateDecorations(); }
	}, null, context.subscriptions);

    // Debounce decoration updates
	var timeout = null;
	function triggerUpdateDecorations() {
		if (timeout) { clearTimeout(timeout); }
		timeout = setTimeout(updateDecorations, 500);
	}

    // Update Decorations
	function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		const regEx = /gem ["']([a-zA-z\d]+)["'], ["']([~><=\d.]+)["'].*/gm;
        const text = activeEditor.document.getText();
		const upToDateLines = [];
		const outOfDateLines = [];
        let match;
        let promises = [];
        console.log('------------------------------------------------------------------------')
		while (match = regEx.exec(text)) {
            let i = match 
            promises.push(
                axios.get(`https://rubygems.org/api/v1/gems/${match[1]}.json`)
                .then(res => {
                    const startPos = activeEditor.document.positionAt(i.index);
                    const endPos = activeEditor.document.positionAt(i.index + i[0].length);
                    const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: `Up to date` };
                    upToDateLines.push(decoration);
                })
                .catch(err => {})
            )
        }
        Promise.all(promises).then(() => {
		    activeEditor.setDecorations(upToDateDecorationType, upToDateLines);
		    activeEditor.setDecorations(outOfDateDecorationType, outOfDateLines);
        })
    }
    
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
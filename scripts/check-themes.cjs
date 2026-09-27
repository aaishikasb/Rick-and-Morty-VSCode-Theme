// Run with `npm test`. Uses only Node; VS Code loads the JSON directly.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const rgba = hex => {
  assert.match(hex, /^#[\da-f]{6}([\da-f]{2})?$/i, `Invalid sRGB hex: ${hex}`);
  const channels = hex.slice(1).match(/../g).map(channel => parseInt(channel, 16) / 255);
  return [...channels.slice(0, 3), channels[3] ?? 1];
};
const over = (top, bottom) => {
  const [r, g, b, a] = rgba(top);
  return [r, g, b].map((channel, i) => channel * a + bottom[i] * (1 - a));
};
const luminance = rgb => rgb.slice(0, 3).map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4)
  .reduce((sum, c, i) => sum + c * [.2126, .7152, .0722][i], 0);
const contrast = (foreground, background) => {
  const a = luminance(over(foreground, background));
  const b = luminance(background);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
};
// Known answers protect the checker itself, including alpha compositing.
assert.equal(contrast('#ffffff', rgba('#000000')), 21);
assert.equal(contrast('#00000000', rgba('#ffffff')), 1);
assert.deepEqual(over('#ffffff80', [0, 0, 0]), [128 / 255, 128 / 255, 128 / 255]);
assert.equal(manifest.contributes.themes.length, 2);
assert.equal(manifest.contributes.themes[0].id, 'Rick and Morty Theme', 'Keep existing users’ saved theme ID');
assert.equal(manifest.main, undefined, 'A color theme needs no activation code');
assert.equal(manifest.browser, undefined);
const themes = manifest.contributes.themes.map(entry => ({entry, theme: read(entry.path)}));
assert.deepEqual(themes.map(({theme}) => theme.type).sort(), ['dark', 'light']);
assert.deepEqual(Object.keys(themes[0].theme.colors).sort(), Object.keys(themes[1].theme.colors).sort());
assert.deepEqual(themes[0].theme.tokenColors.map(t => t.scope), themes[1].theme.tokenColors.map(t => t.scope));
assert.deepEqual(Object.keys(themes[0].theme.semanticTokenColors).sort(), Object.keys(themes[1].theme.semanticTokenColors).sort());

for (const {entry, theme} of themes) {
  assert.equal(entry.uiTheme, theme.type === 'dark' ? 'vs-dark' : 'vs');
  assert.equal(entry.label, theme.name);
  assert.equal(theme.semanticHighlighting, true);
  const c = theme.colors;
  Object.values(c).forEach(rgba);
  for (const key of ['editor.inactiveSelectionBackground', 'editor.selectionHighlightBackground', 'editor.wordHighlightBackground', 'editor.wordHighlightStrongBackground', 'editor.findMatchHighlightBackground', 'diffEditor.insertedTextBackground', 'diffEditor.removedTextBackground', 'diffEditor.insertedLineBackground', 'diffEditor.removedLineBackground']) {
    assert.ok(rgba(c[key])[3] < 1, `${key} must preserve underlying decorations`);
  }
  const color = key => { assert.ok(c[key], `Missing ${key}`); return c[key]; };
  let checks = 0, textMin = 21, uiMin = 21;
  const check = (label, foreground, background, minimum = 4.5) => {
    const ratio = contrast(foreground, background);
    assert.ok(ratio >= minimum, `${theme.name}: ${label} = ${ratio.toFixed(3)}:1, needs ${minimum}:1`);
    if (minimum === 4.5) textMin = Math.min(textMin, ratio);
    else uiMin = Math.min(uiMin, ratio);
    checks++;
  };
  const pair = (fg, bg, minimum = 4.5) => check(`${fg} on ${bg}`, color(fg), rgba(color(bg)), minimum);
  const editor = rgba(color('editor.background'));
  const editorBackgrounds = ['editor.background', 'editor.lineHighlightBackground', 'editor.selectionBackground',
    'editor.inactiveSelectionBackground', 'editor.findMatchBackground', 'editor.findMatchHighlightBackground',
    'editor.wordHighlightBackground', 'editor.wordHighlightStrongBackground', 'editor.selectionHighlightBackground',
    'diffEditor.insertedLineBackground', 'diffEditor.removedLineBackground']
    .map(key => [key, over(color(key), editor)]);
  for (const kind of ['inserted', 'removed']) {
    editorBackgrounds.push([`diff ${kind} word on line`, over(color(`diffEditor.${kind}TextBackground`), over(color(`diffEditor.${kind}LineBackground`), editor))]);
  }
  const tokens = [['editor.foreground', color('editor.foreground')], ...theme.tokenColors.map(t => [t.name, t.settings.foreground]),
    ...Object.entries(theme.semanticTokenColors).map(([name, value]) => [name, typeof value === 'string' ? value : value.foreground]).filter(([,value]) => value)];
  for (const [name, foreground] of tokens) {
    assert.equal(rgba(foreground)[3], 1, `Syntax should be opaque: ${name}`);
    for (const [backgroundName, background] of editorBackgrounds) check(`${name} on ${backgroundName}`, foreground, background);
  }
  const groups = {
    'editor.background': ['editorLineNumber.foreground', 'editorLineNumber.activeForeground', 'editorCodeLens.foreground', 'editorGhostText.foreground'],
    'editorInlayHint.background': ['editorInlayHint.foreground'],
    'sideBar.background': ['sideBar.foreground', 'sideBarTitle.foreground', 'descriptionForeground', 'gitDecoration.ignoredResourceForeground'],
    'sideBarSectionHeader.background': ['sideBarSectionHeader.foreground'],
    'activityBar.background': ['activityBar.foreground', 'activityBar.inactiveForeground'],
    'tab.activeBackground': ['tab.activeForeground', 'tab.unfocusedActiveForeground'],
    'tab.inactiveBackground': ['tab.inactiveForeground', 'tab.unfocusedInactiveForeground'],
    'titleBar.activeBackground': ['titleBar.activeForeground'],
    'titleBar.inactiveBackground': ['titleBar.inactiveForeground'],
    'statusBar.background': ['statusBar.foreground'],
    'statusBar.noFolderBackground': ['statusBar.noFolderForeground'],
    'statusBar.debuggingBackground': ['statusBar.debuggingForeground'],
    'statusBarItem.hoverBackground': ['statusBar.foreground'],
    'statusBarItem.remoteBackground': ['statusBarItem.remoteForeground'],
    'input.background': ['input.foreground', 'input.placeholderForeground'],
    'dropdown.background': ['dropdown.foreground'],
    'dropdown.listBackground': ['dropdown.foreground'],
    'button.background': ['button.foreground'],
    'button.hoverBackground': ['button.foreground'],
    'button.secondaryBackground': ['button.secondaryForeground'],
    'button.secondaryHoverBackground': ['button.secondaryForeground'],
    'badge.background': ['badge.foreground'],
    'activityBarBadge.background': ['activityBarBadge.foreground'],
    'inputOption.activeBackground': ['inputOption.activeForeground'],
    'list.activeSelectionBackground': ['list.activeSelectionForeground', 'list.highlightForeground'],
    'list.inactiveSelectionBackground': ['list.inactiveSelectionForeground'],
    'list.focusBackground': ['list.focusForeground', 'list.focusHighlightForeground'],
    'list.hoverBackground': ['list.hoverForeground'],
    'quickInput.background': ['quickInput.foreground', 'descriptionForeground'],
    'quickInputList.focusBackground': ['quickInputList.focusForeground', 'descriptionForeground'],
    'editorWidget.background': ['editorWidget.foreground'],
    'editorHoverWidget.background': ['editorHoverWidget.foreground'],
    'editorSuggestWidget.background': ['editorSuggestWidget.foreground', 'editorSuggestWidget.highlightForeground'],
    'editorSuggestWidget.selectedBackground': ['editorSuggestWidget.selectedForeground', 'editorSuggestWidget.focusHighlightForeground'],
    'notifications.background': ['notifications.foreground'],
    'menu.background': ['menu.foreground'],
    'menu.selectionBackground': ['menu.selectionForeground'],
    'panel.background': ['panelTitle.activeForeground', 'panelTitle.inactiveForeground'],
    'terminal.background': ['terminal.foreground', ...Object.keys(c).filter(key => key.startsWith('terminal.ansi'))],
  };
  for (const [background, foregrounds] of Object.entries(groups)) for (const foreground of foregrounds) pair(foreground, background);
  for (const background of ['editor.background', 'sideBar.background', 'editorWidget.background', 'notifications.background', 'list.activeSelectionBackground']) {
    for (const foreground of ['foreground', 'descriptionForeground', 'textLink.foreground', 'textLink.activeForeground', 'errorForeground']) pair(foreground, background);
    pair('focusBorder', background, 3);
    for (const foreground of Object.keys(c).filter(key => key.startsWith('gitDecoration.'))) pair(foreground, background);
  }
  check('terminal selection', color('terminal.selectionForeground'), over(color('terminal.selectionBackground'), rgba(color('terminal.background'))));
  for (const foreground of ['editorCursor.foreground', 'editorError.foreground', 'editorWarning.foreground', 'editorInfo.foreground', 'editorHint.foreground', 'editorBracketMatch.border', 'editor.findMatchBorder']) {
    for (const [name, background] of editorBackgrounds) check(`${foreground} on ${name}`, color(foreground), background, 3);
  }
  pair('input.border', 'input.background', 3);
  pair('dropdown.border', 'dropdown.background', 3);
  pair('list.focusOutline', 'list.focusBackground', 3);
  for (const key of Object.keys(c).filter(key => /^editorBracketHighlight.foreground/.test(key))) pair(key, 'editor.background');
  console.log(`${theme.name}: ${checks} contrast checks passed; text minimum ${textMin.toFixed(2)}:1; UI minimum ${uiMin.toFixed(2)}:1.`);
  console.log(`  Editor ${contrast(c['editor.foreground'], editor).toFixed(2)}:1; comments ${contrast(theme.tokenColors[0].settings.foreground, editor).toFixed(2)}:1.`);
}

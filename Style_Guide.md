# Webview UI Toolkit Style Guide for VS Code Sidebar Extensions

You are building a VS Code extension with a webview sidebar. Use the Webview UI Toolkit to create native-looking controls that match the editor’s design language and automatically support color themes.

## Installation

Install the toolkit in your extension:

npm install @vscode/webview-ui-toolkit

## Basic Setup

Import components in your webview HTML:

&lt;!DOCTYPE html&gt;&lt;html lang=“en”&gt;&lt;head&gt;&lt;meta charset=“UTF-8”&gt;&lt;meta name=“viewport” content=“width=device-width, initial-scale=1.0”&gt;&lt;script type=“module” src=“@vscode/webview-ui-toolkit/dist/toolkit.js”&gt;&lt;/script&gt;&lt;/head&gt;&lt;body&gt;&lt;!-- Your components here –&gt;&lt;/body&gt;&lt;/html&gt;If bundling with Webpack or similar, import in your webview script:

import { provideVSCodeDesignSystem, vsCodeButton, vsCodeTextField } from ‘@vscode/webview-ui-toolkit’;

provideVSCodeDesignSystem().register(vsCodeButton(), vsCodeTextField());

Component Usage### Buttons

Use vscode-button for primary actions. Add appearance=“secondary” for less emphasis, or appearance=“icon” for icon-only buttons.

&lt;vscode-button&gt;Primary Action&lt;/vscode-button&gt;&lt;vscode-button appearance=“secondary”&gt;Secondary Action&lt;/vscode-button&gt;&lt;vscode-button appearance=“icon”&gt;&lt;span class=“codicon codicon-add”&gt;&lt;/span&gt;&lt;/vscode-button&gt;### Text Fields

Use vscode-text-field for single-line text input. Add placeholder for hints.

&lt;vscode-text-field placeholder=“Enter value”&gt;Label&lt;/vscode-text-field&gt;&lt;vscode-text-field placeholder=“Search…” value=“”&gt;&lt;span slot=“start” class=“codicon codicon-search”&gt;&lt;/span&gt;&lt;/vscode-text-field&gt;### Text Areas

Use vscode-text-area for multi-line text input. Set rows to control height.

&lt;vscode-text-area rows=“5” placeholder=“Enter description”&gt;Description&lt;/vscode-text-area&gt;&lt;vscode-text-area resize=“vertical”&gt;Notes&lt;/vscode-text-area&gt;### Dropdowns

Use vscode-dropdown for single-selection lists. Nest vscode-option elements inside.

&lt;vscode-dropdown&gt;&lt;vscode-option&gt;Option 1&lt;/vscode-option&gt;&lt;vscode-option&gt;Option 2&lt;/vscode-option&gt;&lt;vscode-option&gt;Option 3&lt;/vscode-option&gt;&lt;/vscode-dropdown&gt;### Checkboxes

Use vscode-checkbox for boolean selections. Add checked attribute for initial state.

&lt;vscode-checkbox&gt;Enable feature&lt;/vscode-checkbox&gt;&lt;vscode-checkbox checked&gt;Auto-save enabled&lt;/vscode-checkbox&gt;### Radio Groups

Use vscode-radio-group with nested vscode-radio elements for mutually exclusive options.

&lt;vscode-radio-group&gt;&lt;label slot=“label”&gt;Select an option&lt;/label&gt;&lt;vscode-radio&gt;Option A&lt;/vscode-radio&gt;&lt;vscode-radio checked&gt;Option B&lt;/vscode-radio&gt;&lt;vscode-radio&gt;Option C&lt;/vscode-radio&gt;&lt;/vscode-radio-group&gt;### Tabs

Use vscode-panels and vscode-panel-tab for tabbed interfaces. Match id attributes to connect tabs with panels.

&lt;vscode-panels&gt;&lt;vscode-panel-tab id=“tab-1”&gt;TAB 1&lt;/vscode-panel-tab&gt;&lt;vscode-panel-tab id=“tab-2”&gt;TAB 2&lt;/vscode-panel-tab&gt;&lt;vscode-panel-view id=“view-1”&gt;Content for tab 1&lt;/vscode-panel-view&gt;&lt;vscode-panel-view id=“view-2”&gt;Content for tab 2&lt;/vscode-panel-view&gt;&lt;/vscode-panels&gt;### Links

Use vscode-link for clickable links that match VS Code’s link styling.

&lt;vscode-link href=“https://example.com”&gt;Documentation&lt;/vscode-link&gt;

### Dividers

Use vscode-divider to separate sections visually.

&lt;vscode-divider&gt;&lt;/vscode-divider&gt;

### Progress Rings

Use vscode-progress-ring for loading states.

&lt;vscode-progress-ring&gt;&lt;/vscode-progress-ring&gt;

### Badges

Use vscode-badge for counts or status indicators.

&lt;vscode-badge&gt;3&lt;/vscode-badge&gt;

### Tags

Use vscode-tag for labels or categories.

&lt;vscode-tag&gt;personal&lt;/vscode-tag&gt;&lt;vscode-tag&gt;work&lt;/vscode-tag&gt;## Layout Patterns

### Form Layout

Structure forms with consistent spacing and grouping:

&lt;div class=“form-group”&gt;&lt;vscode-text-field placeholder=“Repository name”&gt;Name&lt;/vscode-text-field&gt;&lt;/div&gt;&lt;div class=“form-group”&gt;&lt;vscode-text-area rows=“4” placeholder=“Description”&gt;Description&lt;/vscode-text-area&gt;&lt;/div&gt;&lt;div class=“form-group”&gt;&lt;vscode-checkbox&gt;Initialize with README&lt;/vscode-checkbox&gt;&lt;/div&gt;&lt;div class=“button-group”&gt;&lt;vscode-button&gt;Create&lt;/vscode-button&gt;&lt;vscode-button appearance=“secondary”&gt;Cancel&lt;/vscode-button&gt;&lt;/div&gt;Add CSS for spacing:

.form-group {margin-bottom: 16px;}.button-group {display: flex;gap: 8px;margin-top: 20px;}### List with Actions

Create action lists with buttons:

&lt;section&gt;&lt;h3&gt;Actions&lt;/h3&gt;&lt;vscode-button&gt;Open Browser&lt;/vscode-button&gt;&lt;vscode-button&gt;Save Settings&lt;/vscode-button&gt;&lt;vscode-button&gt;Export Data&lt;/vscode-button&gt;&lt;/section&gt;Style for full-width buttons:

section {display: flex;flex-direction: column;gap: 8px;}vscode-button {width: 100%;}### Collapsible Sections

Use vscode-panels for collapsible sections:

&lt;vscode-panels&gt;&lt;vscode-panel-tab id=“settings-tab”&gt;SETTINGS&lt;/vscode-panel-tab&gt;&lt;vscode-panel-tab id=“advanced-tab”&gt;ADVANCED&lt;/vscode-panel-tab&gt;&amp;lt;vscode-panel-view id=“settings-view”&amp;gt;&amp;lt;vscode-checkbox&amp;gt;Auto-update&amp;lt;/vscode-checkbox&amp;gt;&amp;lt;vscode-checkbox&amp;gt;Show notifications&amp;lt;/vscode-checkbox&amp;gt;&amp;lt;/vscode-panel-view&amp;gt;

&amp;lt;vscode-panel-view id=“advanced-view”&amp;gt;&amp;lt;vscode-text-field&amp;gt;Custom path&amp;lt;/vscode-text-field&amp;gt;&amp;lt;vscode-dropdown&amp;gt;&amp;lt;vscode-option&amp;gt;Debug&amp;lt;/vscode-option&amp;gt;&amp;lt;vscode-option&amp;gt;Release&amp;lt;/vscode-option&amp;gt;&amp;lt;/vscode-dropdown&amp;gt;&amp;lt;/vscode-panel-view&amp;gt;&lt;/vscode-panels&gt;

## Theming

All toolkit components automatically adapt to the active VS Code theme. Do not hardcode colors. Use CSS variables for custom styling:

:root {–vscode-font-family: var(–vscode-font-family);–vscode-font-size: var(–vscode-font-size);}.custom-element {background-color: var(–vscode-editor-background);color: var(–vscode-editor-foreground);border: 1px solid var(–vscode-panel-border);}Common theme variables:

–vscode-editor-background–vscode-editor-foreground–vscode-panel-border–vscode-button-background–vscode-button-foreground–vscode-input-background–vscode-input-foreground## Icons

Use Codicons for icons. Load the Codicon font:

&lt;link rel=“stylesheet” href=“https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.32/dist/codicon.css”&amp;gt;

Add icons to buttons or labels:

&lt;vscode-button appearance=“icon”&gt;&lt;span class=“codicon codicon-add”&gt;&lt;/span&gt;&lt;/vscode-button&gt;&lt;vscode-button&gt;&lt;span class=“codicon codicon-refresh”&gt;&lt;/span&gt;Refresh&lt;/vscode-button&gt;## Accessibility

All toolkit components include proper ARIA attributes and keyboard navigation. Ensure you:

Always provide labels for form elementsUse semantic HTML structureTest keyboard navigation (Tab, Enter, Arrow keys)Verify screen reader compatibility&lt;!-- Good: Label provided –&gt;&lt;vscode-text-field&gt;Username&lt;/vscode-text-field&gt;&lt;!-- Good: Descriptive button text –&gt;&lt;vscode-button&gt;Submit Form&lt;/vscode-button&gt;&lt;!-- Good: Radio group with label –&gt;&lt;vscode-radio-group&gt;&lt;label slot=“label”&gt;Choose deployment target&lt;/label&gt;&lt;vscode-radio&gt;Production&lt;/vscode-radio&gt;&lt;vscode-radio&gt;Staging&lt;/vscode-radio&gt;&lt;/vscode-radio-group&gt;## Event Handling

Listen to standard DOM events. Components emit native events:

document.querySelector(‘vscode-button’).addEventListener(‘click’, () =&gt; {vscode.postMessage({ command: ‘buttonClicked’ });});document.querySelector(‘vscode-text-field’).addEventListener(‘input’, (e) =&gt; {console.log(‘Value:’, e.target.value);});document.querySelector(‘vscode-dropdown’).addEventListener(‘change’, (e) =&gt; {console.log(‘Selected:’, e.target.value);});document.querySelector(‘vscode-checkbox’).addEventListener(‘change’, (e) =&gt; {console.log(‘Checked:’, e.target.checked);});## Communication with Extension

Use acquireVsCodeApi() to communicate with the extension:

const vscode = acquireVsCodeApi();

// Send message to extensiondocument.querySelector(‘#saveButton’).addEventListener(‘click’, () =&gt; {vscode.postMessage({command: ‘save’,data: { name: ‘example’ }});});// Receive messages from extensionwindow.addEventListener(‘message’, event =&gt; {const message = event.data;switch (message.command) {case ‘updateData’:document.querySelector(‘#dataField’).value = message.data;break;}});## Complete Example

Here is a complete sidebar webview using the toolkit:

&lt;!DOCTYPE html&gt;&lt;html lang=“en”&gt;&lt;head&gt;&lt;meta charset=“UTF-8”&gt;&lt;meta name=“viewport” content=“width=device-width, initial-scale=1.0”&gt;&lt;title&gt;Extension Sidebar&lt;/title&gt;&lt;link rel=“stylesheet” href=“https://cdn.jsdelivr.net/npm/@vscode/codicons@0.0.32/dist/codicon.css”&amp;gt;&lt;script type=“module” src=“@vscode/webview-ui-toolkit/dist/toolkit.js”&gt;&lt;/script&gt;&lt;style&gt;body {padding: 16px;font-family: var(–vscode-font-family);font-size: var(–vscode-font-size);} .section {margin-bottom: 24px;}

.form-row {
    margin-bottom: 12px;
}

.button-group {
    display: flex;
    gap: 8px;
    margin-top: 16px;
}

vscode-button {
    width: 100%;
}
&amp;lt;/style&amp;gt;&lt;/head&gt;&lt;body&gt;&lt;div class=“section”&gt;&lt;h2&gt;Configuration&lt;/h2&gt; &amp;lt;div class=“form-row”&amp;gt;&amp;lt;vscode-text-field id=“nameField” placeholder=“Enter name”&amp;gt;Project Name&amp;lt;/vscode-text-field&amp;gt;&amp;lt;/div&amp;gt;

&amp;amp;lt;div class="form-row"&amp;amp;gt;
    &amp;amp;lt;vscode-dropdown id="typeDropdown"&amp;amp;gt;
        &amp;amp;lt;vscode-option&amp;amp;gt;Web Application&amp;amp;lt;/vscode-option&amp;amp;gt;
        &amp;amp;lt;vscode-option&amp;amp;gt;API Service&amp;amp;lt;/vscode-option&amp;amp;gt;
        &amp;amp;lt;vscode-option&amp;amp;gt;Library&amp;amp;lt;/vscode-option&amp;amp;gt;
    &amp;amp;lt;/vscode-dropdown&amp;amp;gt;
&amp;amp;lt;/div&amp;amp;gt;

&amp;amp;lt;div class="form-row"&amp;amp;gt;
    &amp;amp;lt;vscode-text-area id="descriptionArea" rows="4" placeholder="Describe your project"&amp;amp;gt;Description&amp;amp;lt;/vscode-text-area&amp;amp;gt;
&amp;amp;lt;/div&amp;amp;gt;

&amp;amp;lt;div class="form-row"&amp;amp;gt;
    &amp;amp;lt;vscode-checkbox id="privateCheck"&amp;amp;gt;Make private&amp;amp;lt;/vscode-checkbox&amp;amp;gt;
&amp;amp;lt;/div&amp;amp;gt;

&amp;amp;lt;div class="button-group"&amp;amp;gt;
    &amp;amp;lt;vscode-button id="createButton"&amp;amp;gt;
        &amp;amp;lt;span class="codicon codicon-add"&amp;amp;gt;&amp;amp;lt;/span&amp;amp;gt;
        Create
    &amp;amp;lt;/vscode-button&amp;amp;gt;
    &amp;amp;lt;vscode-button id="cancelButton" appearance="secondary"&amp;amp;gt;Cancel&amp;amp;lt;/vscode-button&amp;amp;gt;
&amp;amp;lt;/div&amp;amp;gt;
&amp;lt;/div&amp;gt;

&amp;lt;vscode-divider&amp;gt;&amp;lt;/vscode-divider&amp;gt;

&amp;lt;div class=“section”&amp;gt;&amp;lt;h2&amp;gt;Recent Projects&amp;lt;/h2&amp;gt;&amp;lt;vscode-button appearance=“secondary”&amp;gt;&amp;lt;span class=“codicon codicon-folder”&amp;gt;&amp;lt;/span&amp;gt;Open Project&amp;lt;/vscode-button&amp;gt;&amp;lt;/div&amp;gt;

&amp;lt;script&amp;gt;const vscode = acquireVsCodeApi();

document.getElementById('createButton').addEventListener('click', () =&amp;amp;gt; {
    const data = {
        name: document.getElementById('nameField').value,
        type: document.getElementById('typeDropdown').value,
        description: document.getElementById('descriptionArea').value,
        isPrivate: document.getElementById('privateCheck').checked
    };

    vscode.postMessage({
        command: 'createProject',
        data: data
    });
});

document.getElementById('cancelButton').addEventListener('click', () =&amp;amp;gt; {
    vscode.postMessage({ command: 'cancel' });
});
&amp;lt;/script&amp;gt;&lt;/body&gt;&lt;/html&gt;


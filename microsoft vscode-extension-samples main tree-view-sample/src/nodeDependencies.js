"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dependency = exports.DepNodeProvider = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
class DepNodeProvider {
    constructor(context, workspaceRoot) {
        this.context = context;
        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    }
    refresh() {
        this._onDidChangeTreeData.fire();
    }
    getTreeItem(element) {
        return element;
    }
    getChildren(element) {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No dependency in empty workspace');
            return Promise.resolve([]);
        }
        if (element) {
            return Promise.resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')));
        }
        else {
            const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
            if (this.pathExists(packageJsonPath)) {
                return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
            }
            else {
                vscode.window.showInformationMessage('Workspace has no package.json');
                return Promise.resolve([]);
            }
        }
    }
    /**
     * Given the path to package.json, read all its dependencies and devDependencies.
     */
    getDepsInPackageJson(packageJsonPath) {
        const workspaceRoot = this.workspaceRoot;
        if (this.pathExists(packageJsonPath) && workspaceRoot) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            const toDep = (moduleName, version) => {
                if (this.pathExists(path.join(workspaceRoot, 'node_modules', moduleName))) {
                    return new Dependency(this.context.extensionUri, moduleName, version, vscode.TreeItemCollapsibleState.Collapsed);
                }
                else {
                    return new Dependency(this.context.extensionUri, moduleName, version, vscode.TreeItemCollapsibleState.None, {
                        command: 'extension.openPackageOnNpm',
                        title: '',
                        arguments: [moduleName]
                    });
                }
            };
            const deps = packageJson.dependencies
                ? Object.keys(packageJson.dependencies).map(dep => toDep(dep, packageJson.dependencies[dep]))
                : [];
            const devDeps = packageJson.devDependencies
                ? Object.keys(packageJson.devDependencies).map(dep => toDep(dep, packageJson.devDependencies[dep]))
                : [];
            return deps.concat(devDeps);
        }
        else {
            return [];
        }
    }
    pathExists(p) {
        try {
            fs.accessSync(p);
        }
        catch {
            return false;
        }
        return true;
    }
}
exports.DepNodeProvider = DepNodeProvider;
class Dependency extends vscode.TreeItem {
    constructor(extensionRoot, label, version, collapsibleState, command) {
        super(label, collapsibleState);
        this.label = label;
        this.version = version;
        this.collapsibleState = collapsibleState;
        this.command = command;
        this.contextValue = 'dependency';
        this.tooltip = `${this.label}-${this.version}`;
        this.description = this.version;
        this.iconPath = {
            light: vscode.Uri.joinPath(extensionRoot, 'resources', 'light', 'dependency.svg'),
            dark: vscode.Uri.joinPath(extensionRoot, 'resources', 'dark', 'dependency.svg')
        };
    }
}
exports.Dependency = Dependency;
//# sourceMappingURL=nodeDependencies.js.map
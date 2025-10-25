Visual Studio Code

Icons:

When I pin the item, make the view actions menu show then pinned icon called "pinned" and if I change the item I am clicked on, that icon changes to the "pin" or "unpinned" icon based on the status of the item being pinned or not. 

pin	      pin	Icon for the pin timeline action.
pinned	  pinned	Icon for the unpin timeline action.


Links: https://github.com/microsoft/vscode-extension-samples/blob/main/tree-view-sample/README.md
Links: https://code.visualstudio.com/api/ux-guidelines/sidebars
Links: https://code.visualstudio.com/api/references/vscode-api
Links: https://www.codingwiththomas.com/blog/typescript-vs-code-api-lets-create-a-tree-view-part-1

Docs
Updates
Blog
API
Extensions
MCP
FAQ
Switch to the dark theme
Search Docs
Ctrl+Shift+P
Download
Version 1.105 is now available! Read about the new features and fixes from September.

Dismiss this update
Overview
Get Started
Extension Capabilities
Extension Guides
Overview
AI
Command
Color Theme
File Icon Theme
Product Icon Theme
Tree View
Webview
Notebook
Custom Editors
Virtual Documents
Virtual Workspaces
Web Extensions
Workspace Trust
Task Provider
Source Control
Debugger Extension
Markdown Extension
Test Extension
Custom Data Extension
Telemetry
UX Guidelines
Language Extensions
Testing and Publishing
Advanced Topics
References
Tree View API
The Tree View API allows extensions to show content in the sidebar in Visual Studio Code. This content is structured as a tree and conforms to the style of the built-in views of VS Code.

For example, the built-in References Search View extension shows reference search results as a separate view.

References Search View

The Find All References results are displayed in a References: Results Tree View, which is in the References View Container.

This guide teaches you how to write an extension that contributes Tree Views and View Containers to Visual Studio Code.

Tree View API Basics
To explain the Tree View API, we are going to build a sample extension called Node Dependencies. This extension will use a treeview to display all Node.js dependencies in the current folder. The steps for adding a treeview are to contribute the treeview in your package.json, create a TreeDataProvider, and register the TreeDataProvider. You can find the complete source code of this sample extension in the tree-view-sample in the vscode-extension-samples GitHub repository.

package.json Contribution
First you have to let VS Code know that you are contributing a view, using the contributes.views Contribution Point in package.json.

Here's the package.json for the first version of our extension:

JSON

{
  "name": "custom-view-samples",
  "displayName": "Custom view Samples",
  "description": "Samples for VS Code's view API",
  "version": "0.0.1",
  "publisher": "alexr00",
  "engines": {
    "vscode": "^1.74.0"
  },
  "activationEvents": [],
  "main": "./out/extension.js",
  "contributes": {
    "views": {
      "explorer": [
        {
          "id": "nodeDependencies",
          "name": "Node Dependencies"
        }
      ]
    }
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./"
  },
  "devDependencies": {
    "@types/node": "^10.12.21",
    "@types/vscode": "^1.42.0",
    "typescript": "^3.5.1",
    "tslint": "^5.12.1"
  }
}
Note: If your extension targets a VS Code version prior to 1.74, you must explicitly list onView:nodeDependencies in activationEvents.

You must specify an identifier and name for the view, and you can contribute to following locations:

explorer: Explorer view in the Side Bar
debug: Run and Debug view in the Side Bar
scm: Source Control view in the Side Bar
test: Test explorer view in the Side Bar
Custom View Containers
Tree Data Provider
The second step is to provide data to the view you registered so that VS Code can display the data in the view. To do so, you should first implement the TreeDataProvider. Our TreeDataProvider will provide node dependencies data, but you can have a data provider that provides other types of data.

There are two necessary methods in this API that you need to implement:

getChildren(element?: T): ProviderResult<T[]> - Implement this to return the children for the given element or root (if no element is passed).
getTreeItem(element: T): TreeItem | Thenable<TreeItem> - Implement this to return the UI representation (TreeItem) of the element that gets displayed in the view.
When the user opens the Tree View, the getChildren method will be called without an element. From there, your TreeDataProvider should return your top-level tree items. In our example, the collapsibleState of the top-level tree items is TreeItemCollapsibleState.Collapsed, meaning that the top-level tree items will show as collapsed. Setting the collapsibleState to TreeItemCollapsibleState.Expanded will cause tree items to show as expanded. Leaving the collapsibleState as its default of TreeItemCollapsibleState.None indicates that the tree item has no children. getChildren will not be called for tree items with a collapsibleState of TreeItemCollapsibleState.None.

Here is an example of a TreeDataProvider implementation that provides node dependencies data:

TypeScript

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export class NodeDependenciesProvider implements vscode.TreeDataProvider<Dependency> {
  constructor(private workspaceRoot: string) {}

  getTreeItem(element: Dependency): vscode.TreeItem {
    return element;
  }

  getChildren(element?: Dependency): Thenable<Dependency[]> {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No dependency in empty workspace');
      return Promise.resolve([]);
    }

    if (element) {
      return Promise.resolve(
        this.getDepsInPackageJson(
          path.join(this.workspaceRoot, 'node_modules', element.label, 'package.json')
        )
      );
    } else {
      const packageJsonPath = path.join(this.workspaceRoot, 'package.json');
      if (this.pathExists(packageJsonPath)) {
        return Promise.resolve(this.getDepsInPackageJson(packageJsonPath));
      } else {
        vscode.window.showInformationMessage('Workspace has no package.json');
        return Promise.resolve([]);
      }
    }
  }

  /**
   * Given the path to package.json, read all its dependencies and devDependencies.
   */
  private getDepsInPackageJson(packageJsonPath: string): Dependency[] {
    if (this.pathExists(packageJsonPath)) {
      const toDep = (moduleName: string, version: string): Dependency => {
        if (this.pathExists(path.join(this.workspaceRoot, 'node_modules', moduleName))) {
          return new Dependency(
            moduleName,
            version,
            vscode.TreeItemCollapsibleState.Collapsed
          );
        } else {
          return new Dependency(moduleName, version, vscode.TreeItemCollapsibleState.None);
        }
      };

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      const deps = packageJson.dependencies
        ? Object.keys(packageJson.dependencies).map(dep =>
            toDep(dep, packageJson.dependencies[dep])
          )
        : [];
      const devDeps = packageJson.devDependencies
        ? Object.keys(packageJson.devDependencies).map(dep =>
            toDep(dep, packageJson.devDependencies[dep])
          )
        : [];
      return deps.concat(devDeps);
    } else {
      return [];
    }
  }

  private pathExists(p: string): boolean {
    try {
      fs.accessSync(p);
    } catch (err) {
      return false;
    }
    return true;
  }
}

class Dependency extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
  }

  iconPath = {
    light: path.join(__filename, '..', '..', 'resources', 'light', 'dependency.svg'),
    dark: path.join(__filename, '..', '..', 'resources', 'dark', 'dependency.svg')
  };
}
Registering the TreeDataProvider
The third step is to register the above data provider to your view.

This can be done in the following two ways:

vscode.window.registerTreeDataProvider - Register the tree data provider by providing the registered view ID and above data provider.

TypeScript

const rootPath =
  vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
    ? vscode.workspace.workspaceFolders[0].uri.fsPath
    : undefined;
vscode.window.registerTreeDataProvider(
  'nodeDependencies',
  new NodeDependenciesProvider(rootPath)
);
vscode.window.createTreeView - Create the Tree View by providing the registered view ID and above data provider. This will give access to the TreeView, which you can use for performing other view operations. Use createTreeView, if you need the TreeView API.

TypeScript

vscode.window.createTreeView('nodeDependencies', {
  treeDataProvider: new NodeDependenciesProvider(rootPath)
});
Here's the extension in action:

View

Updating Tree View content
Our node dependencies view is simple, and once the data is shown, it isn't updated. However, it would be useful to have a refresh button in the view and update the node dependencies view with the current contents of the package.json. To do this, we can use the onDidChangeTreeData event.

onDidChangeTreeData?: Event<T | undefined | null | void> - Implement this if your tree data can change and you want to update the treeview.
Add the following to your NodeDependenciesProvider.

TypeScript

  private _onDidChangeTreeData: vscode.EventEmitter<Dependency | undefined | null | void> = new vscode.EventEmitter<Dependency | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<Dependency | undefined | null | void> = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }
Now we have a refresh method, but no one is calling it. We can add a command to call refresh.

In the contributes section of your package.json, add:

JSON

    "commands": [
            {
                "command": "nodeDependencies.refreshEntry",
                "title": "Refresh",
                "icon": {
                    "light": "resources/light/refresh.svg",
                    "dark": "resources/dark/refresh.svg"
                }
            },
    ]
And register the command in your extension activation:

TypeScript

import * as vscode from 'vscode';
import { NodeDependenciesProvider } from './nodeDependencies';

export function activate(context: vscode.ExtensionContext) {
  const rootPath =
    vscode.workspace.workspaceFolders && vscode.workspace.workspaceFolders.length > 0
      ? vscode.workspace.workspaceFolders[0].uri.fsPath
      : undefined;
  const nodeDependenciesProvider = new NodeDependenciesProvider(rootPath);
  vscode.window.registerTreeDataProvider('nodeDependencies', nodeDependenciesProvider);
  vscode.commands.registerCommand('nodeDependencies.refreshEntry', () =>
    nodeDependenciesProvider.refresh()
  );
}
Now we have a command that will refresh the node dependencies view, but a button on the view would be even better. We already added an icon to the command, so it will show up with that icon when we add it to the view.

In the contributes section of your package.json, add:

JSON

"menus": {
    "view/title": [
        {
            "command": "nodeDependencies.refreshEntry",
            "when": "view == nodeDependencies",
            "group": "navigation"
        },
    ]
}
Activation
It is important that your extension is activated only when user needs the functionality that your extension provides. In this case, you should consider activating your extension only when the user starts using the view. VS Code automatically does this for you when your extension declares a view contribution. VS Code emits an activationEvent onView:${viewId} (onView:nodeDependencies for the example above) when the user opens the view.

Note: For VS Code versions prior to 1.74.0, you must explicitly register this activation event in package.json for VS Code to activate your extension on this view:

JSON

"activationEvents": [
       "onView:nodeDependencies",
],
View Container
A View Container contains a list of views that are displayed in the Activity Bar or Panel along with the built-in View Containers. Examples of built-in View Containers are Source Control and Explorer.

View Container

To contribute a View Container, you should first register it using contributes.viewsContainers Contribution Point in package.json.

You have to specify the following required fields:

id - The ID of the new view container you're creating.
title - The name that will show up at the top of the view container.
icon - An image that will be displayed for the view container when in the Activity Bar.
JSON

"contributes": {
  "viewsContainers": {
    "activitybar": [
      {
        "id": "package-explorer",
        "title": "Package Explorer",
        "icon": "media/dep.svg"
      }
    ]
  }
}
Alternatively, you could contribute this view to the panel by placing it under the panel node.

JSON

"contributes": {
  "viewsContainers": {
    "panel": [
      {
        "id": "package-explorer",
        "title": "Package Explorer",
        "icon": "media/dep.svg"
      }
    ]
  }
}
Contributing views to View Containers
Once you've created a View Container, you can use the contributes.views Contribution Point in package.json.

JSON

"contributes": {
  "views": {
    "package-explorer": [
      {
        "id": "nodeDependencies",
        "name": "Node Dependencies",
        "icon": "media/dep.svg",
        "contextualTitle": "Package Explorer"
      }
    ]
  }
}
A view can also have an optional visibility property which can be set to visible, collapsed, or hidden. This property is only respected by VS Code the first time a workspace is opened with this view. After that, the visibility is set to whatever the user has chosen. If you have a view container with many views, or if your view will not be useful to every user of your extension, consider setting the view the collapsed or hidden. A hidden view will appear in the view containers "Views" menu:

Views Menu

View Actions
Actions are available as inline icons on your individual tree items, in tree item context menus, and at the top of your view in the view title. Actions are commands that you set to show up in these locations by adding contributions to your package.json.

To contribute to these three places, you can use the following menu contribution points in your package.json:

view/title - Location to show actions in the view title. Primary or inline actions use "group": "navigation" and rest are secondary actions, which are in ... menu.
view/item/context - Location to show actions for the tree item. Inline actions use "group": "inline" and rest are secondary actions, which are in ... menu.
You can control the visibility of these actions using a when clause.

View Actions

Examples:

JSON

"contributes": {
  "commands": [
    {
      "command": "nodeDependencies.refreshEntry",
      "title": "Refresh",
      "icon": {
        "light": "resources/light/refresh.svg",
        "dark": "resources/dark/refresh.svg"
      }
    },
    {
      "command": "nodeDependencies.addEntry",
      "title": "Add"
    },
    {
      "command": "nodeDependencies.editEntry",
      "title": "Edit",
      "icon": {
        "light": "resources/light/edit.svg",
        "dark": "resources/dark/edit.svg"
      }
    },
    {
      "command": "nodeDependencies.deleteEntry",
      "title": "Delete"
    }
  ],
  "menus": {
    "view/title": [
      {
        "command": "nodeDependencies.refreshEntry",
        "when": "view == nodeDependencies",
        "group": "navigation"
      },
      {
        "command": "nodeDependencies.addEntry",
        "when": "view == nodeDependencies"
      }
    ],
    "view/item/context": [
      {
        "command": "nodeDependencies.editEntry",
        "when": "view == nodeDependencies && viewItem == dependency",
        "group": "inline"
      },
      {
        "command": "nodeDependencies.deleteEntry",
        "when": "view == nodeDependencies && viewItem == dependency"
      }
    ]
  }
}
By default, actions are ordered alphabetically. To specify a different ordering, add @ followed by the order you want to the group. For example, navigation@3 will cause the action to show up 3rd in the navigation group.

You can further separate items in the ... menu by creating different groups. These group names are arbitrary and are ordered alphabetically by group name.

Note: If you want to show an action for specific tree items, you can do so by defining the context of a tree item using TreeItem.contextValue and you can specify the context value for key viewItem in when expression.

Examples:

JSON

"contributes": {
  "menus": {
    "view/item/context": [
      {
        "command": "nodeDependencies.deleteEntry",
        "when": "view == nodeDependencies && viewItem == dependency"
      }
    ]
  }
}
Welcome content
If your view can be empty, or if you want to add Welcome content to another extension's empty view, you can contribute viewsWelcome content. An empty view is a view that has no TreeView.message and an empty tree.

JSON

"contributes": {
  "viewsWelcome": [
    {
      "view": "nodeDependencies",
      "contents": "No node dependencies found [learn more](https://www.npmjs.com/).\n[Add Dependency](command:nodeDependencies.addEntry)"
    }
  ]
}
Welcome Content

Links are supported in Welcome content. By convention, a link on a line by itself is a button. Each Welcome content can also contain a when clause. For more examples, see the built-in Git extension.

TreeDataProvider
Extension writers should register a TreeDataProvider programmatically to populate data in the view.

TypeScript

vscode.window.registerTreeDataProvider('nodeDependencies', new DepNodeProvider());
See nodeDependencies.ts in the tree-view-sample for the implementation.

TreeView
If you would like to perform some UI operations on the view programmatically, you can use window.createTreeView instead of window.registerTreeDataProvider. This will give access to the view, which you can use for performing view operations.

TypeScript

vscode.window.createTreeView('ftpExplorer', {
  treeDataProvider: new FtpTreeDataProvider()
});
See ftpExplorer.ts in the tree-view-sample for the implementation.

Was this documentation helpful?
Yes, this page was helpfulNo, this page was not helpful
10/09/2025


Tree Views
Tree Views are a powerful and flexible format to display content in a View. Extensions can add everything from simple flat lists to deeply nested trees.

Use descriptive labels to give context to items (if applicable)
Use product icons to distinguish between item types (if applicable)
❌ Don't

Use Tree View Items as buttons to fire Commands
Avoid deep nesting unless necessary. A few levels of folders/items is a good balance for most situations.
Add more than three actions to an item
Example of a Tree View


Views
Views are containers of content that can appear in the Sidebar or Panel. Views can contain Tree Views, Welcome Views, or Webview Views and can also display View Actions. Views can also be rearranged by the user or moved to another View Container (for example, from the Primary Sidebar to the Secondary Sidebar). Limit the number of Views created as other extensions can contribute in the same View Container.

✔️ Do

Use existing icons when possible
Use file icons for language files
Use a Tree View for displaying data
Add an icon to every View (in case it is moved to the Activity Bar or Secondary Sidebar—both of which use icons to represent the View)
Keep the number of Views to a minimum
Keep the length of names to a minimum
Limit the use of custom Webview Views
❌ Don't

Repeat existing functionality
Use tree items as single action items (for example, firing a Command on click)
Use custom Webview Views if not necessary
Use a Activity Bar Item (View Container) to open a Webview in the Editor
Views example

This example uses a Tree View to display a flat list of Tree View Items.

View Locations
Views can be placed in existing View Containers, such as the File Explorer, Source Control (SCM) and Debug View Containers. They can also be added to a custom View Container via the Activity Bar. In addition, Views can be added to any View Container in the Panel. They can also be dragged to the Secondary Sidebar.

View locations

View Containers
View Containers, as the name implies, are the "parent" container in which Views are rendered. Extensions can contribute custom View Containers to the Activity Bar/Primary Sidebar or to the Panel. Users can drag an entire View Container from the Activity Bar to the Panel (or vice versa) and can also move individual Views.

Example of a View Container

This is an example of a View Container placed in the Activity Bar/Primary Sidebar

Example of a View Container in a Panel

This is an example of a View Container placed in the Panel

contributes.views
Contribute a view to VS Code. You must specify an identifier and name for the view. You can contribute to following view containers:

explorer: Explorer view container in the Activity Bar
scm: Source Control Management (SCM) view container in the Activity Bar
debug: Run and Debug view container in the Activity Bar
test: Test view container in the Activity Bar
Custom view containers contributed by Extensions.
When the user opens the view, VS Code will then emit an activationEvent onView:${viewId} (onView:nodeDependencies for the example below). You can also control the visibility of the view by providing the when context value. The icon specified will be used when the title cannot be shown (e.g. when the view is dragged to the Activity Bar). The contextualTitle is used when the view is moved out of its default view container and needs additional context.

JSON

{
  "contributes": {
    "views": {
      "explorer": [
        {
          "id": "nodeDependencies",
          "name": "Node Dependencies",
          "when": "workspaceHasPackageJSON",
          "icon": "media/dep.svg",
          "contextualTitle": "Package Explorer"
        }
      ]
    }
  }
}
views extension point example

The content of a view can be populated in two ways:

With a TreeView by providing a data provider through createTreeView API or register the data provider directly through registerTreeDataProvider API to populate data. TreeViews are ideal for showing hierarchical data and lists. Refer to the tree-view-sample.
With a WebviewView by registering a provider with registerWebviewViewProvider. Webview views allow rendering arbitrary HTML in the view. See the webview view sample extension for more details.
contributes.viewsContainers
Contribute a view container into which Custom views can be contributed. You must specify an identifier, title, and an icon for the view container. At present, you can contribute them to the Activity Bar (activitybar) and Panel (panel). Below example shows how the Package Explorer view container is contributed to the Activity Bar and how views are contributed to it.

JSON

{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "package-explorer",
          "title": "Package Explorer",
          "icon": "resources/package-explorer.svg"
        }
      ]
    },
    "views": {
      "package-explorer": [
        {
          "id": "package-dependencies",
          "name": "Dependencies"
        },
        {
          "id": "package-outline",
          "name": "Outline"
        }
      ]
    }
  }
}
Custom views container

Icon specifications
Size: Icons should be 24x24 and centered.

Color: Icons should use a single color.

Format: It is recommended that icons be in SVG, though any image file type is accepted.

States: All icons inherit the following state styles:

Expand table
State	Opacity
Default	60%
Hover	100%
Active	100%
contributes.viewsWelcome
Contribute welcome content to Custom views. Welcome content only applies to empty tree views. A view is considered empty if the tree has no children and no TreeView.message. By convention, any command links that are on a line by themselves are displayed as a button. You can specify the view that the welcome content should apply to with the view property. Visibility of the welcome content can be controlled with the when context value. The text to be displayed as the welcome content is set with the contents property.

JSON

{
  "contributes": {
    "viewsWelcome": [
      {
        "view": "scm",
        "contents": "In order to use git features, you can open a folder containing a git repository or clone from a URL.\n[Open Folder](command:vscode.openFolder)\n[Clone Repository](command:git.clone)\nTo learn more about how to use git and source control in VS Code [read our docs](https://aka.ms/vscode-scm).",
        "when": "config.git.enabled && git.state == initialized && workbenchState == empty"
      }
    ]
  }
}
Welcome content example

Multiple welcome content items can be contributed to one view. When this happens, the content that come from VS Code core comes first, followed by content from built-in extensions, followed by content from all other extensions.

44

Here's a straightforward implementation:



import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  vscode.window.registerTreeDataProvider('exampleView', new TreeDataProvider());
}

class TreeDataProvider implements vscode.TreeDataProvider<TreeItem> {
  onDidChangeTreeData?: vscode.Event<TreeItem|null|undefined>|undefined;

  data: TreeItem[];

  constructor() {
    this.data = [new TreeItem('cars', [
      new TreeItem(
          'Ford', [new TreeItem('Fiesta'), new TreeItem('Focus'), new TreeItem('Mustang')]),
      new TreeItem(
          'BMW', [new TreeItem('320'), new TreeItem('X3'), new TreeItem('X5')])
    ])];
  }

  getTreeItem(element: TreeItem): vscode.TreeItem|Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: TreeItem|undefined): vscode.ProviderResult<TreeItem[]> {
    if (element === undefined) {
      return this.data;
    }
    return element.children;
  }
}

class TreeItem extends vscode.TreeItem {
  children: TreeItem[]|undefined;

  constructor(label: string, children?: TreeItem[]) {
    super(
        label,
        children === undefined ? vscode.TreeItemCollapsibleState.None :
                                 vscode.TreeItemCollapsibleState.Expanded);
    this.children = children;
  }
}
And in package.json:

{
    [...]
    "contributes": {
        "views": {
            "explorer": [
                {
                    "id": "exampleView",
                    "name": "exampleView"
                }
            ]
        }
    }
}
You might want to have a way of creating the data dynamically from your JSON data, but to keep the example as simple as possible I just create it statically in the constructor.

3

I'm looking for this also. Besides source code this is also useful for navigation in medium to large Markdown documents.

According to this issue https://github.com/Microsoft/vscode/issues/5605 this feature is not available yet, vote it to get it in the pipeline faster.

Ctrl+Shift+O is currently available which gives a flat list of symbols in the current file. It is useful for small source files but a tree would be much easier to work with for larger files.

Another issue with Ctrl+Shift+O is that when you filter the results are not ordered by their position in the source file, IMHO this behavior is ok when you search the whole workspace but when searching in the currently opened file I would like the results sorted by their position in the file.

EDIT 2023-11-13

There is the Outline view, https://code.visualstudio.com/docs/getstarted/userinterface#_outline-view, which shows a tree with symbols from the current file ... can be combined with "Follow Cursor" and Ctrl+Shift+O filtering

You can find the project here on GitHub, I added a tag part-1 for this article.

My favorite editor to use is Visual Studio Code. It offers lots of extensions we're about to create our own tree view extendsion.

In my last article Start Using Cucumber I introduced the Cucumber Framework to enable behavior tests in your C++ project. For Visual Studio Code there are already extensions to enable syntax highlighting and auto completion. In this article we'll create a tree view to display all our tests in our project in a vs code sidebar menu: INSERT IMAGE!


This is the result of this article, we parse all *.feature files in our directory and diesplay Features and Scenarios in our own navigation menu

Let's Get Started
First of all, you need npm installed on your machine and (obviously) VS Code. Once you have it, you can install the VS Code Extension Generator and create a TypeScript project. The Generator asks some initial setup questions, see the snippet below.

You can start with the offical getting started guide on: Your First Extension or find a lot of examples on Microsofts GitHub repository.

$ npm install -g yo generator-code

$ yo code

     _-----_     ╭──────────────────────────╮
    |       |    │   Welcome to the Visual  │
    |--(o)--|    │   Studio Code Extension  │
   `---------´   │        generator!        │
    ( _´U`_ )    ╰──────────────────────────╯
    /___A___\   /
     |  ~  |
   __'.___.'__
 ´   `  |° ´ Y `

? What type of extension do you want to create? New Extension (TypeScript)
? What's the name of your extension? cwt-cucumber-support
? What's the identifier of your extension? cwt-cucumber-support
? What's the description of your extension?
? Initialize a git repository? Yes
? Bundle the source code with webpack? No
? Which package manager to use? npm
Our project is now ready and in ./src/extension.ts you have the entry point of this extension with some example code. To debug our extension, we just need to press F5 (with the example we just created, it's a hello world example).

Adding The View To The Navigation Bar
First of all we create a file ./src/tree_view.ts in which we'll implement the tree view. Second, we need two classes here:

tree_item -> represents a item in our tree view
tree_view -> holds all items and represents the tree

import * as vscode from 'vscode'

// lets put all in a cwt namespace
export namespace cwt
{
    // this represents an item and it's children (like nested items)
    // we implement the item later
    class tree_item extends vscode.TreeItem
    {
        children: tree_item[] | undefined;
    }

    // tree_view will created in our entry point
    export class tree_view implements vscode.TreeDataProvider<tree_item>
    {
        // will hold our tree view data
        m_data : tree_item [] = [];


        // in the constructor we register a refresh and item clicked function
        constructor()
        {
            vscode.commands.registerCommand('cwt_cucumber_view.item_clicked', r => this.item_clicked(r));
            vscode.commands.registerCommand('cwt_cucumber_view.refresh', () => this.refresh());
        }

        item_clicked(item: tree_item)
        {
            // this will be executed when we click an item
        }

        refresh()
        {
            // this will be clicked when we refresh the view
        }

        getTreeItem(element: tree_item): vscode.TreeItem|Thenable<vscode.TreeItem>
        {
            // we need to provide getTreeItem
        }

        getChildren(element : tree_item | undefined): vscode.ProviderResult<tree_item[]>
        {
            // same for getChildren
        }
    }
}
Now we can create and register our tree view

import * as vscode from 'vscode';
// import our namespace where we'll get access to the tree_view
import { cwt } from './tree_view';

export function activate(context: vscode.ExtensionContext)
{
    //create a local tree view and register it in vscode
	let tree = new cwt.tree_view();
	vscode.window.registerTreeDataProvider('cwt-cucumber-view', tree);
}

export function deactivate() {}
And we're almost done, we need to add some properties to the package.json in our root directory. Here we just add a container and a view. I created a logo for the navigation which we can display now.

// for now, we add all activation events
"activationEvents": [
	"*"
],
"contributes": {
        // we add a view container here with the according logo
	"viewsContainers": {
		"activitybar": [
			{
				"id": "cwt-cucumber-view-container",
				"title": "cwt cucumber support",
				"icon": "src/assets/navigation_bar_logo.svg"
			}
		]
	},
	// we create a single view
	"views": {
		"cwt-cucumber-view-container": [
			{
				"id": "cwt_cucumber",
				"name": "cwt cucumber"
			}
		]
	},
	// we add our commands for item clicked and refresh
	"commands": [
		{
			"command": "cwt_cucumber.item_clicked",
			"title": "cwt tree view item"
		},
	        // we add a image to the refresh function which we want to display
		{
			"command": "cwt_cucumber.refresh",
			"title": "refresh",
			"icon": {
				"light": "src/assets/img_light/refresh.svg",
				"dark": "src/assets/img_dark/refresh.svg"
			}
		}
	],
	"menus": {
	        // we link the registered command incl. the image to the view title
	        // we can add more by using navigation@1, etc.
		"view/title": [
			{
				"command": "cwt_cucumber.refresh",
				"when": "view == cwt_cucumber",
				"group": "navigation@0"
			}
		]
	}
}

There we have it, we have our extension in the navigation bar and the refresh button is on the upper right of our tree view.

Let's Implement And Fill The Tree View
As already created, implement the tree items first:

// we need to inherit from vscode.TreeItem
class tree_item extends vscode.TreeItem
{
    // we'll use the file and line later...
    readonly file: string | undefined;
    readonly line: number | undefined;

    // children represent branches, which are also items
    public children: tree_item[] = [];

    // add all members here, file and line we'll need later
    // the label represent the text which is displayed in the tree
    // and is passed to the base class
    constructor(label: string, file: string, line: number) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.file = file;
        this.line = line;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }

    // a public method to add childs, and with additional branches
    // we want to make the item collabsible
    public add_child (child : tree_item) {
        this.collapsibleState = vscode.TreeItemCollapsibleState.Collapsed;
        this.children.push(child);
    }
}
The tree_item was fairly easy and now let's create the tree view class. Let's take a look on the following tree_view. I added all the steps to the comments below.

    // 1. we'll export this class and use it in our extension later
    // 2. we need to implement vscode.TreeDataProvider
    export class tree_view implements vscode.TreeDataProvider<tree_item>
    {
        // m_data holds all tree items
        private m_data : tree_item [] = [];
        // with the vscode.EventEmitter we can refresh our  tree view
        private m_onDidChangeTreeData: vscode.EventEmitter<tree_item | undefined> = new vscode.EventEmitter<tree_item | undefined>();
        // and vscode will access the event by using a readonly onDidChangeTreeData (this member has to be named like here, otherwise vscode doesnt update our treeview.
        readonly onDidChangeTreeData ? : vscode.Event<tree_item | undefined> = this.m_onDidChangeTreeData.event;

        // we register two commands for vscode, item clicked (we'll implement later) and the refresh button.
        public constructor()  {
            vscode.commands.registerCommand('cwt_cucumber.item_clicked', r => this.item_clicked(r));
            vscode.commands.registerCommand('cwt_cucumber.refresh', () => this.refresh());
        }

        // we need to implement getTreeItem to receive items from our tree view
        public getTreeItem(element: tree_item): vscode.TreeItem|Thenable<vscode.TreeItem> {
            const item = new vscode.TreeItem(element.label!, element.collapsibleState);
            return item;
        }

        // and getChildren
        public getChildren(element : tree_item | undefined): vscode.ProviderResult<tree_item[]> {
            if (element === undefined) {
                return this.m_data;
            } else {
                return element.children;
            }
        }

        // this is called when we click an item
        public item_clicked(item: tree_item) {
            // we implement this later
        }

        // this is called whenever we refresh the tree view
        public refresh() {
            if (vscode.workspace.workspaceFolders) {
                this.m_data = [];
                this.read_directory(vscode.workspace.workspaceFolders[0].uri.fsPath);
                this.m_onDidChangeTreeData.fire(undefined);
            }
        }

        // read the directory recursively over all files
        private read_directory(dir: string) {
            fs.readdirSync(dir).forEach(file => {
                let current = path.join(dir,file);
                if (fs.statSync(current).isFile()) {
                    if(current.endsWith('.feature')) {
                        this.parse_feature_file(current);
                    }
                } else {
                    this.read_directory(current)
                }
            });
        }

        // and if we find a *.feature file parse the content
        private parse_feature_file(file: string) {
            const regex_feature = new RegExp("(?<=Feature:).*");
            const regex_scenario = new RegExp("(?<=Scenario:).*");
            let reader = rd.createInterface(fs.createReadStream(file))
            const line_counter = ((i = 0) => () => ++i)();

            // let's loop over every line
            reader.on("line", (line : string, line_number : number = line_counter()) => {
                let is_feature = line.match(regex_feature);
                if (is_feature) {
                    // we found a feature and add this to our tree view data
                    this.m_data.push(new tree_item(is_feature[0], file, line_number));
                }
                let is_scenario = line.match(regex_scenario);
                if (is_scenario) {
                    // every following scenario will be added to the last added feature with add_children from the tree_item
                    this.m_data.at(-1)?.add_child(new tree_item(is_scenario[0], file, line_number));
                }
            });
        }
    }
And finally, as mentionad above, we need to create our tree_view in our extension and register it in vscode. But we call the refresh function now, to fill our tree:

export function activate(context: vscode.ExtensionContext)
{
	let tree = new cwt.tree_view();
	// note: we need to provide the same name here as we added in the package.json file
	vscode.window.registerTreeDataProvider('cwt_cucumber', tree);
	tree.refresh();
}
Let's See Our Tree View
And that's it, I added to the project directory some example files from my article about cucumber and two examples from the cucumber-cpp GitHub repo. Unfortunately if you open in debug this exact same folder, vscode doesn't open it again and jumps to the already opened vscode window. Either copy this examples in another directory or navigate into the examples directory.


And there is our tree view which displays all our features and their scenarios

You can find the project here on GitHub, I added a tag part-2 for this article.

In my last article we started to create a tree view in VS Code. I did a minor refactoring in the tree_item class where I now created a line class to store all line information:

class line {
    readonly text : string;
    readonly row : number;
    readonly length : number;

    constructor (text : string, row : number) {
        this.text = text;
        this.length = text.length;
        this.row = row;
    }
}
class tree_item extends vscode.TreeItem {
    readonly file: string;
    readonly line: line;
    readonly children: tree_item[] = [];

    constructor(label: string, file: string, line: line) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.file = file;
        this.line = line;
        this.collapsibleState = vscode.TreeItemCollapsibleState.None;
    }
}
And this brings (for me) one task to solve in programming: naming.

I don't like to name variables as their type: readonly line: line where I didn't come up with something better yet. However, it feels right to use a tree_item like: item.line.row or item.line.text. If we'd need line more often than just in tree_item I'd consider renaming. So for now we leave it as it is.

Let's Implement on_item_clicked()
When we click on an item, we want to call on_item_clicked(..) and we want to get the item on which we have clicked. In the last article we already provided this function in package.json and registered it in the tree_view constructor.

In the getTreeItem(..) we return the selected item. In vscode.TreeItem we have a member command, which we need to provide to our returned item. And since we already declared and registered cwt_cucumber.on_item_clicked, it is linked to our memberfunction on_item_clicked(..).

export class tree_view implements vscode.TreeDataProvider<tree_item>
{
    // ...
    public constructor()  {
        // let's register the methods we want
        vscode.commands.registerCommand('cwt_cucumber.on_item_clicked', item => this.on_item_clicked(item));
        vscode.commands.registerCommand('cwt_cucumber.refresh', () => this.refresh());
    }

    public getTreeItem(item: tree_item): vscode.TreeItem|Thenable<vscode.TreeItem> {
        let title = item.label ? item.label.toString() : "";
        let result = new vscode.TreeItem(title, item.collapsibleState);
        // here we add our command which executes our memberfunction
        result.command = { command: 'cwt_cucumber.on_item_clicked', title : title, arguments: [item] };
        return result;
    }
    // ...
}
Now we can continue to implement on_item_clicked(..). Everytime we click on a item, we want to open the file and set the cursor to the location of the Feature/Scenario:

public on_item_clicked(item: tree_item) {
    if (item.file === undefined) return;
    // first we open the document
    vscode.workspace.openTextDocument(item.file).then( document => {
        // after opening the document, we set the cursor
        // and here we make use of the line property which makes imo the code easier to read
        vscode.window.showTextDocument(document).then( editor => {
                let pos = new vscode.Position(item.line.row, item.line.length);
                // here we set the cursor
                editor.selection = new vscode.Selection(pos, pos);
                // here we set the focus of the opened editor
                editor.revealRange(new vscode.Range(pos, pos));
            }
        );
    });
}

And that is it. After clicking on an item we open the appropriate file and set the cursor at the end of the line.

Let's Create A Context Menu
Now we'll add a custom context menu. This opens, when we right click on an item. Let's open package.json and add:

New commands in commands
A context menue in menus as view/item/context and link the created commmands
And that's all to pop up a context menu with a right click on an item.

...
"commands": [
...
	{
		"command": "cwt_cucumber.context_menu_command_0",
		"title": "context menu method 0"
	},
	{
		"command": "cwt_cucumber.context_menu_command_1",
		"title": "context menu method 1"
	}
],
"menus": {
...
	"view/item/context": [
		{
			"command": "cwt_cucumber.context_menu_command_0",
			"when": "view == cwt_cucumber",
			"group": "cwt_cucumber@0"
		},
		{
			"command": "cwt_cucumber.context_menu_command_1",
			"when": "view == cwt_cucumber",
			"group": "cwt_cucumber@1"
		}
	]
...
}

And this is our created context menu

Let us add functions, which are execured when we select an entrie on our context menu. We'll use the vscode.commands.registerCommand(..) in the tree_view constructor like we did with on_item_clicked and refresh function:

export class tree_view implements vscode.TreeDataProvider<tree_item>
{
// ...
    public constructor()  {
        vscode.commands.registerCommand('cwt_cucumber.on_item_clicked', item => this.on_item_clicked(item));
        vscode.commands.registerCommand('cwt_cucumber.refresh', () => this.refresh());
        // first link our memberfunctions to the vscode command
        vscode.commands.registerCommand('cwt_cucumber.context_menu_command_0', item => this.command_0(item));
        vscode.commands.registerCommand('cwt_cucumber.context_menu_command_1', item => this.command_1(item));
    }

    // and second implement them
    public command_0(item: tree_item) {
        console.log("context menu command 0 clickd with: ", item.label);
    }
    public command_1(item: tree_item) {
        console.log("context menu command 1 clickd with: ", item.label);
    }
//...
}
And for this demonstration I'll just add logs, that we can see the method is called and the right item is passed to our function:


After clicking some items, we can see command0 or command_1  is called with the appropriate item.

1

I managed to get something working by defining an URI on my tree items:

class MyTreeItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    private version: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
    this.tooltip = `${this.label}-${this.version}`;
    this.description = this.version;
    this.resourceUri = vscode.Uri.parse('hammerbot:service/service-api', true) // <- this line
  }
}
Then, I create a decoration provider:

class MyFileDecorationProvider implements vscode.FileDecorationProvider {
  provideFileDecoration(uri: vscode.Uri, token: vscode.CancellationToken) {
    console.log('asking for some decoration', uri)
    // Check if the file comes from my scheme defined in my tree item resourceUri
    if (uri.scheme === 'hammerbot') {
      // Return the decoration for that tree item
      // Check the docs for more details
      return {
          badge: 'JS',
          tooltip: 'JavaScript File',
          color: new vscode.ThemeColor('editorForeground'),
          propagate: false // don't propagate to children elements
      };
    }
    // I don't add any decoration for the rest of the files
    return undefined;
  }
}
And finally, I register everything in the activate function:

const provider = new MyFileDecorationProvider();
const disposable = vscode.window.registerFileDecorationProvider(provider);
Share
Improve this answer
Follow
answered May 13, 2024 at 21:00
Hammerbot's user avatar
Hammerbot
16.4k1313 gold badges6767 silver badges109109 bronze badges
Sign up to request clarification or add additional context in comments.

2 Comments


Mike Lischke
Over a year ago
Also this answer is about decorations in the file tree, not any arbitrary tree in VS Code.

Hammerbot
Over a year ago
hmm I don't know what you mean by "arbitrary tree" but this answer was literally targeting a tree that isn't the workspace file tree but a tree I created. The only thing is that I define a specific URI for the tree items, even if it does not target a real file, to be able to define a decoration provider on it
0

If I understand correctly from reading this, you can use FileDecorationProvider and implement provideFileDecoration(uri: Uri, token: CancellationToken): ProviderResult<FileDecoration> to provide decorations for TreeItems based on their resourceUri properties. For example, you can take a look at how the builtin Git extension does it for repositories in VS Code 1.80.

Share
Improve this answer
Follow
answered Jul 12, 2023 at 0:54
starball's user avatar
starball♦
58.9k5252 gold badges307307 silver badges1k1k bronze badges
1 Comment


Jaredo Mills
Over a year ago
This answer is on the right track; ie, the needed feature is "Decoration"; However it seems that "FileDecorations" apply only to files; the question is about arbitrary TreeItems - How to decorate those?
-1

This can be done through the use of inline view actions. Tree View View Actions VSCode Docs Link

An example of how to do this:

package.json

{
  ...,
  commands: {
    {
      "command": "myCommand",
      "title": "Command title",
      "icon": "images/some-icon.svg" // this is in the root of your extension project
    }
  },
  menus: {
    "view/item/context": [
      {
        "command": "myCommand",
        "when": "viewItem == myTreeItemContextValue", // Make sure to sync this value on each TreeItem to fulfill the "when" check
        "group": "inline"
      }
    ]
  }
}
Your TreeItem definition

export class MyTreeItem extends TreeItem {
  constructor(
    public readonly name: string,
    public readonly collapsibleState: TreeItemCollapsibleState,
    public readonly contextValue: string = 'myTreeItemContextValue'
  ) {
    super(name, collapsibleState);
  }
}

1

See the demo at https://stackoverflow.com/a/73039858/836330 of filtering in a TreeView. It is not part of the extension-available api though. You could trigger it in an extension with

await vscode.commands.executeCommand('workbench.files.action.focusFilesExplorer');
await vscode.commands.executeCommand('list.find');
but looking at the commit for this functionality I don't think there is any way to populate that find input from an extension - I don't think the command list.find takes any arguments. I tried a couple of ways like

await vscode.commands.executeCommand('list.find', {text: 'findMe'});
await vscode.commands.executeCommand('list.find', {query: 'findMe'});
Other find functionality in vscode can take arguments, but this filtering a treeView is brand new and will probably need a feature request if you want to populate the find input programmatically.

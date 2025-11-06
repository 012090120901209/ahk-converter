import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { insertIncludeLine, previewIncludeInsertion } from './includeLineInserter';
import { PackageSearchService, PackageSearchResult, SearchFilters } from './packageSearchService';

/**
 * Represents a package or library item in the package manager
 */
export class PackageItem extends vscode.TreeItem {
  constructor(
    public readonly packageName: string,
    public readonly version: string,
    public readonly packagePath: string,
    public readonly packageType: 'installed' | 'available' | 'updates',
    public readonly description?: string,
    public readonly metadata?: {
      author?: string;
      stars?: number;
      category?: string;
      repositoryUrl?: string;
    },
    public readonly collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.None
  ) {
    super(packageName, collapsibleState);

    // Set the label with version
    this.label = packageName;
    
    // For available packages from search, show stars in description
    if (packageType === 'available' && metadata?.stars !== undefined) {
      this.description = `⭐ ${metadata.stars} • ${version}`;
    } else {
      this.description = version;
    }

    // Enhanced tooltip with metadata
    let tooltipText = `${packageName} v${version}\n${description || 'No description available'}`;
    if (metadata?.author) {
      tooltipText += `\nAuthor: ${metadata.author}`;
    }
    if (metadata?.category) {
      tooltipText += `\nCategory: ${metadata.category}`;
    }
    if (metadata?.stars !== undefined) {
      tooltipText += `\n⭐ Stars: ${metadata.stars}`;
    }
    if (metadata?.repositoryUrl) {
      tooltipText += `\nRepository: ${metadata.repositoryUrl}`;
    } else {
      tooltipText += `\nPath: ${packagePath}`;
    }
    this.tooltip = tooltipText;

    // Set appropriate icon based on package type
    switch (packageType) {
      case 'installed':
        this.iconPath = new vscode.ThemeIcon('package');
        this.contextValue = 'installedPackage';
        break;
      case 'available':
        this.iconPath = new vscode.ThemeIcon('cloud-download');
        this.contextValue = 'availablePackage';
        break;
      case 'updates':
        this.iconPath = new vscode.ThemeIcon('sync');
        this.contextValue = 'updatablePackage';
        break;
    }

    // Make packages clickable to view details
    if (packageType === 'installed') {
      this.command = {
        command: 'ahkPackageManager.showPackageDetails',
        title: 'Show Package Details',
        arguments: [this]
      };
    } else if (packageType === 'available' && metadata?.repositoryUrl) {
      // For search results, clicking opens the repository
      this.command = {
        command: 'ahkPackageManager.openRepository',
        title: 'Open Repository',
        arguments: [this]
      };
    }
  }
}

/**
 * Category item for grouping packages
 */
export class CategoryItem extends vscode.TreeItem {
  constructor(
    public readonly categoryName: string,
    public readonly itemCount: number = 0,
    public readonly categoryType: 'installed' | 'available' | 'updates'
  ) {
    // Auto-expand if 5 or fewer items, collapse if more
    const collapsibleState = itemCount === 0
      ? vscode.TreeItemCollapsibleState.None
      : itemCount <= 5
        ? vscode.TreeItemCollapsibleState.Expanded
        : vscode.TreeItemCollapsibleState.Collapsed;

    super(categoryName, collapsibleState);

    // Add count to description
    if (itemCount > 0) {
      this.description = `(${itemCount})`;
    }

    // Set category icons
    switch (categoryType) {
      case 'installed':
        this.iconPath = new vscode.ThemeIcon('library');
        break;
      case 'available':
        this.iconPath = new vscode.ThemeIcon('globe');
        break;
      case 'updates':
        this.iconPath = new vscode.ThemeIcon('bell-dot');
        break;
    }

    this.contextValue = 'category';
  }
}

/**
 * Package information interface
 */
interface PackageInfo {
  name: string;
  version: string;
  author?: string;
  description?: string;
  dependencies?: string[];
  path: string;
  lastModified?: Date;
  stars?: number;
  category?: string;
  repositoryUrl?: string;
}

/**
 * Provides package management functionality for AHK libraries
 */
export class PackageManagerProvider implements vscode.TreeDataProvider<PackageItem | CategoryItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<PackageItem | CategoryItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private workspaceRoot: string | null = null;
  private installedPackages: PackageInfo[] = [];
  private availablePackages: PackageInfo[] = [];
  private packagesWithUpdates: PackageInfo[] = [];
  private searchService: PackageSearchService;
  private lastSearchQuery: string = '';
  private isShowingSearchResults: boolean = false;

  constructor(private context: vscode.ExtensionContext) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      this.workspaceRoot = workspaceFolders[0].uri.fsPath;
    }

    // Initialize search service
    this.searchService = PackageSearchService.getInstance();

    // Initialize by scanning for packages
    this.scanForPackages();
  }

  refresh(): void {
    this.scanForPackages();
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: PackageItem | CategoryItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: PackageItem | CategoryItem): Promise<(PackageItem | CategoryItem)[]> {
    if (!element) {
      // Root level - show categories
      return this.getCategories();
    } else if (element instanceof CategoryItem) {
      // Show packages in this category
      return this.getPackagesForCategory(element.categoryType);
    }
    // PackageItem has no children
    return [];
  }

  private async getCategories(): Promise<CategoryItem[]> {
    const categories: CategoryItem[] = [];

    // Always show these categories
    categories.push(
      new CategoryItem('Installed Libraries', this.installedPackages.length, 'installed'),
      new CategoryItem('Available Libraries', this.availablePackages.length, 'available')
    );

    // Only show updates if there are any
    if (this.packagesWithUpdates.length > 0) {
      categories.push(
        new CategoryItem('Updates Available', this.packagesWithUpdates.length, 'updates')
      );
    }

    return categories;
  }

  private async getPackagesForCategory(categoryType: 'installed' | 'available' | 'updates'): Promise<PackageItem[]> {
    let packages: PackageInfo[] = [];

    switch (categoryType) {
      case 'installed':
        packages = this.installedPackages;
        break;
      case 'available':
        packages = this.availablePackages;
        break;
      case 'updates':
        packages = this.packagesWithUpdates;
        break;
    }

    return packages.map(pkg => new PackageItem(
      pkg.name,
      pkg.version,
      pkg.path,
      categoryType,
      pkg.description,
      {
        author: pkg.author,
        stars: pkg.stars,
        category: pkg.category,
        repositoryUrl: pkg.repositoryUrl
      }
    ));
  }

  /**
   * Scan workspace for installed packages and available packages
   */
  private async scanForPackages(): Promise<void> {
    if (!this.workspaceRoot) {
      return;
    }

    this.installedPackages = [];
    this.availablePackages = [];
    this.packagesWithUpdates = [];

    try {
      // Scan Lib folder for installed packages
      const libPath = path.join(this.workspaceRoot, 'Lib');
      await this.scanLibraryFolder(libPath);

      // Scan vendor folder if it exists
      const vendorPath = path.join(this.workspaceRoot, 'vendor');
      await this.scanVendorFolder(vendorPath);

      // Check for available packages from a registry (mock data for now)
      this.loadAvailablePackages();

      // Check for updates (mock data for now)
      this.checkForUpdates();
    } catch (error) {
      console.error('Error scanning for packages:', error);
    }
  }

  /**
   * Scan the Lib folder for installed libraries
   */
  private async scanLibraryFolder(libPath: string): Promise<void> {
    try {
      const files = await fs.readdir(libPath);

      for (const file of files) {
        if (file.endsWith('.ahk')) {
          const filePath = path.join(libPath, file);
          const stats = await fs.stat(filePath);

          // Try to extract package info from the file
          const packageInfo = await this.extractPackageInfo(filePath);

          this.installedPackages.push({
            name: path.basename(file, '.ahk'),
            version: packageInfo?.version || '1.0.0',
            description: packageInfo?.description || 'AHK Library',
            path: filePath,
            lastModified: stats.mtime
          });
        }
      }
    } catch (error) {
      // Lib folder doesn't exist or can't be read
      console.log('Lib folder not found or inaccessible');
    }
  }

  /**
   * Scan vendor folder for third-party packages
   */
  private async scanVendorFolder(vendorPath: string): Promise<void> {
    try {
      const entries = await fs.readdir(vendorPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const packagePath = path.join(vendorPath, entry.name);

          // Look for package.json or similar manifest
          const manifestPath = path.join(packagePath, 'package.json');
          let packageInfo: any = { name: entry.name, version: '1.0.0' };

          try {
            const manifestContent = await fs.readFile(manifestPath, 'utf-8');
            const manifest = JSON.parse(manifestContent);
            packageInfo = {
              name: manifest.name || entry.name,
              version: manifest.version || '1.0.0',
              description: manifest.description,
              author: manifest.author
            };
          } catch {
            // No manifest file, use directory name
          }

          this.installedPackages.push({
            ...packageInfo,
            path: packagePath
          });
        }
      }
    } catch (error) {
      // Vendor folder doesn't exist
      console.log('Vendor folder not found');
    }
  }

  /**
   * Extract package information from AHK file header comments
   */
  private async extractPackageInfo(filePath: string): Promise<Partial<PackageInfo> | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').slice(0, 20); // Check first 20 lines

      const info: Partial<PackageInfo> = {};

      for (const line of lines) {
        // Look for version comments
        const versionMatch = line.match(/;\s*@?version\s*[:=]?\s*([\d.]+)/i);
        if (versionMatch) {
          info.version = versionMatch[1];
        }

        // Look for description
        const descMatch = line.match(/;\s*@?description\s*[:=]?\s*(.+)/i);
        if (descMatch) {
          info.description = descMatch[1].trim();
        }

        // Look for author
        const authorMatch = line.match(/;\s*@?author\s*[:=]?\s*(.+)/i);
        if (authorMatch) {
          info.author = authorMatch[1].trim();
        }
      }

      return Object.keys(info).length > 0 ? info : null;
    } catch {
      return null;
    }
  }

  /**
   * Load available packages from a registry (mock implementation)
   */
  private loadAvailablePackages(): void {
    // Mock data - in reality, this would fetch from a package registry
    this.availablePackages = [
      {
        name: 'JSON',
        version: '2.0.0',
        description: 'JSON parsing and stringification for AHK v2',
        path: 'https://github.com/ahk-community/JSON.ahk',
        author: 'AHK Community'
      },
      {
        name: 'WinClip',
        version: '1.5.0',
        description: 'Advanced clipboard manipulation library',
        path: 'https://github.com/ahk-community/WinClip',
        author: 'AHK Community'
      },
      {
        name: 'Socket',
        version: '2.1.0',
        description: 'TCP/UDP socket communication library',
        path: 'https://github.com/ahk-community/Socket.ahk',
        author: 'AHK Community'
      }
    ];
  }

  /**
   * Check for package updates (mock implementation)
   */
  private checkForUpdates(): void {
    // Mock data - check if any installed packages have updates
    for (const installed of this.installedPackages) {
      const available = this.availablePackages.find(pkg => pkg.name === installed.name);
      if (available && this.isNewerVersion(available.version, installed.version)) {
        this.packagesWithUpdates.push({
          ...installed,
          version: `${installed.version} → ${available.version}`
        });
      }
    }
  }

  /**
   * Compare version strings
   */
  private isNewerVersion(newVersion: string, currentVersion: string): boolean {
    const newParts = newVersion.split('.').map(Number);
    const currentParts = currentVersion.split('.').map(Number);

    for (let i = 0; i < Math.max(newParts.length, currentParts.length); i++) {
      const newPart = newParts[i] || 0;
      const currentPart = currentParts[i] || 0;

      if (newPart > currentPart) return true;
      if (newPart < currentPart) return false;
    }

    return false;
  }

  /**
   * Install a package
   */
  async installPackage(packageItem: PackageItem): Promise<void> {
    vscode.window.showInformationMessage(`Installing ${packageItem.packageName}...`);

    // TODO: Implement actual package installation
    // This would download the package and place it in the Lib folder

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate installation

    // Determine where the package was installed
    let installedPath = packageItem.packagePath;

    // If this is a new installation (from available packages), it would be in Lib/
    if (this.workspaceRoot && packageItem.packageType === 'available') {
      installedPath = path.join(this.workspaceRoot, 'Lib', `${packageItem.packageName}.ahk`);
    }

    // Show success notification with "Open" and "Add #Include" buttons
    const action = await vscode.window.showInformationMessage(
      `${packageItem.packageName} installed successfully!`,
      'Add #Include',
      'Open',
      'Dismiss'
    );

    // Handle user action
    if (action === 'Add #Include') {
      await this.addIncludeToActiveFile(packageItem.packageName);
    } else if (action === 'Open') {
      try {
        // Check if file exists, if not try to find it in installed packages
        let fileToOpen = installedPath;

        // For mock installations, try to find an existing file with the same name
        const existingPackage = this.installedPackages.find(
          pkg => pkg.name === packageItem.packageName
        );

        if (existingPackage) {
          fileToOpen = existingPackage.path;
        }

        // Try to open the file
        if (fileToOpen.endsWith('.ahk')) {
          const doc = await vscode.workspace.openTextDocument(fileToOpen);
          await vscode.window.showTextDocument(doc);
        } else {
          // If path is a URL or directory, show info
          vscode.window.showInformationMessage(
            `Package location: ${fileToOpen}`
          );
        }
      } catch (error) {
        vscode.window.showWarningMessage(
          `Could not open ${packageItem.packageName}. File may not exist yet.`
        );
      }
    }

    this.refresh();
  }

  /**
   * Uninstall a package
   */
  async uninstallPackage(packageItem: PackageItem): Promise<void> {
    const answer = await vscode.window.showWarningMessage(
      `Are you sure you want to uninstall ${packageItem.packageName}?`,
      'Yes',
      'No'
    );

    if (answer === 'Yes') {
      // TODO: Implement actual package removal
      vscode.window.showInformationMessage(`${packageItem.packageName} uninstalled.`);
      this.refresh();
    }
  }

  /**
   * Update a package
   */
  async updatePackage(packageItem: PackageItem): Promise<void> {
    vscode.window.showInformationMessage(`Updating ${packageItem.packageName}...`);

    // TODO: Implement actual package update

    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate update

    // Show success notification with "Open" button
    const action = await vscode.window.showInformationMessage(
      `${packageItem.packageName} updated successfully!`,
      'Open',
      'Dismiss'
    );

    // If user clicks "Open", open the updated file
    if (action === 'Open') {
      try {
        // Try to find the installed package
        const installedPackage = this.installedPackages.find(
          pkg => pkg.name === packageItem.packageName
        );

        if (installedPackage && installedPackage.path.endsWith('.ahk')) {
          const doc = await vscode.workspace.openTextDocument(installedPackage.path);
          await vscode.window.showTextDocument(doc);
        } else if (packageItem.packagePath.endsWith('.ahk')) {
          const doc = await vscode.workspace.openTextDocument(packageItem.packagePath);
          await vscode.window.showTextDocument(doc);
        } else {
          vscode.window.showInformationMessage(
            `Package location: ${packageItem.packagePath}`
          );
        }
      } catch (error) {
        vscode.window.showWarningMessage(
          `Could not open ${packageItem.packageName}. File may not exist yet.`
        );
      }
    }

    this.refresh();
  }

  /**
   * Add #Include line to active file or prompt user to select a file
   */
  private async addIncludeToActiveFile(packageName: string): Promise<void> {
    try {
      // Try to get the active text editor
      let targetDocument = vscode.window.activeTextEditor?.document;

      // Check if active document is an AHK file
      if (targetDocument && !this.isAhkFile(targetDocument)) {
        targetDocument = undefined;
      }

      // If no active AHK file, prompt user to select one
      if (!targetDocument) {
        const ahkFiles = await this.findWorkspaceAhkFiles();

        if (ahkFiles.length === 0) {
          vscode.window.showWarningMessage('No .ahk files found in workspace');
          return;
        }

        // Prompt user to select a file
        const selected = await vscode.window.showQuickPick(
          ahkFiles.map(uri => ({
            label: path.basename(uri.fsPath),
            description: vscode.workspace.asRelativePath(uri),
            uri
          })),
          {
            placeHolder: `Select an .ahk file to add #Include for ${packageName}`
          }
        );

        if (!selected) {
          return; // User cancelled
        }

        targetDocument = await vscode.workspace.openTextDocument(selected.uri);
      }

      // Now insert the #Include line
      const result = await insertIncludeLine(targetDocument, {
        packageName
      });

      // Show result to user
      switch (result.status) {
        case 'inserted':
          vscode.window.showInformationMessage(
            `✓ Added #Include for ${packageName} at line ${result.lineNumber}`
          );
          break;
        case 'headers_added':
          vscode.window.showInformationMessage(
            `✓ Added headers and #Include for ${packageName}`
          );
          break;
        case 'already_included':
          vscode.window.showInformationMessage(
            `${packageName} is already included in this file (line ${result.lineNumber})`
          );
          break;
        case 'error':
          vscode.window.showErrorMessage(
            `Failed to add #Include: ${result.message}`
          );
          break;
      }
    } catch (error) {
      vscode.window.showErrorMessage(
        `Error adding #Include: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Check if a document is an AutoHotkey file
   */
  private isAhkFile(document: vscode.TextDocument): boolean {
    return document.languageId === 'ahk' ||
           document.languageId === 'ahk2' ||
           document.fileName.endsWith('.ahk') ||
           document.fileName.endsWith('.ahk2');
  }

  /**
   * Find all .ahk files in the workspace
   */
  private async findWorkspaceAhkFiles(): Promise<vscode.Uri[]> {
    // Search for .ahk and .ahk2 files in workspace
    const ahkFiles = await vscode.workspace.findFiles('**/*.ahk', '**/node_modules/**');
    const ahk2Files = await vscode.workspace.findFiles('**/*.ahk2', '**/node_modules/**');

    // Combine and filter out files in Lib/ and vendor/ folders (the libraries themselves)
    const allFiles = [...ahkFiles, ...ahk2Files];

    return allFiles.filter(uri => {
      const relativePath = vscode.workspace.asRelativePath(uri);
      return !relativePath.startsWith('Lib/') && !relativePath.startsWith('vendor/');
    });
  }

  /**
   * Show package details
   */
  async showPackageDetails(packageItem: PackageItem): Promise<void> {
    // Open the package file or show details in a webview
    if (packageItem.packagePath.endsWith('.ahk')) {
      const doc = await vscode.workspace.openTextDocument(packageItem.packagePath);
      await vscode.window.showTextDocument(doc);
    }
  }

  /**
   * Search for packages from various sources
   */
  async searchPackages(): Promise<void> {
    try {
      // Show input box with search options
      const searchQuery = await vscode.window.showInputBox({
        prompt: 'Search for AHK v2 packages',
        placeHolder: 'Enter package name, keyword, or leave empty for popular packages...',
        value: this.lastSearchQuery
      });

      // User cancelled
      if (searchQuery === undefined) {
        return;
      }

      // Show progress indicator
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: 'Searching for packages...',
          cancellable: false
        },
        async (progress) => {
          try {
            // Store the query for next time
            this.lastSearchQuery = searchQuery;

            // Optionally ask for filters
            const sortOptions = await vscode.window.showQuickPick(
              [
                { label: 'Most Popular (Stars)', value: 'stars' },
                { label: 'Recently Updated', value: 'updated' },
                { label: 'Alphabetical', value: 'name' }
              ],
              {
                placeHolder: 'Sort results by...',
                ignoreFocusOut: true
              }
            );

            const filters: SearchFilters = {
              sortBy: (sortOptions?.value as 'stars' | 'updated' | 'name') || 'stars',
              sortOrder: 'desc'
            };

            // Optionally filter by category
            const categories = this.searchService.getCategories();
            const categoryOption = await vscode.window.showQuickPick(
              categories.map(cat => ({ label: cat, value: cat })),
              {
                placeHolder: 'Filter by category (optional)',
                ignoreFocusOut: true
              }
            );

            if (categoryOption && categoryOption.value !== 'All') {
              filters.category = categoryOption.value;
            }

            progress.report({ increment: 30, message: 'Fetching results from GitHub...' });

            // Perform the search
            const results = await this.searchService.searchPackages(
              searchQuery,
              filters,
              30 // Max results
            );

            progress.report({ increment: 60, message: 'Processing results...' });

            // Convert search results to available packages
            this.availablePackages = results.map(result => ({
              name: result.name,
              version: result.version,
              description: result.description,
              author: result.author,
              path: result.rawUrl || result.downloadUrl || result.repositoryUrl,
              lastModified: result.lastUpdated,
              stars: result.stars,
              category: result.category,
              repositoryUrl: result.repositoryUrl
            }));

            // Mark that we're showing search results
            this.isShowingSearchResults = true;

            // Refresh the tree view
            this._onDidChangeTreeData.fire();

            // Show result count
            vscode.window.showInformationMessage(
              `Found ${results.length} package${results.length !== 1 ? 's' : ''} for "${searchQuery || 'popular packages'}"`
            );

            progress.report({ increment: 100, message: 'Complete!' });
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            vscode.window.showErrorMessage(`Search failed: ${errorMessage}`);
            
            // If rate limited, provide helpful message
            if (errorMessage.includes('rate limit')) {
              vscode.window.showWarningMessage(
                'GitHub API rate limit exceeded. Consider adding a GitHub token in settings for higher limits.',
                'Open Settings'
              ).then(selection => {
                if (selection === 'Open Settings') {
                  vscode.commands.executeCommand('workbench.action.openSettings', 'ahkv2Toolbox.githubToken');
                }
              });
            }
          }
        }
      );
    } catch (error) {
      console.error('Search packages error:', error);
      vscode.window.showErrorMessage('Failed to search packages');
    }
  }

  /**
   * Clear search results and return to default view
   */
  clearSearch(): void {
    this.isShowingSearchResults = false;
    this.lastSearchQuery = '';
    this.loadAvailablePackages();
    this._onDidChangeTreeData.fire();
    vscode.window.showInformationMessage('Search results cleared');
  }

  /**
   * Open repository URL in browser
   */
  async openRepository(packageItem: PackageItem): Promise<void> {
    const repoUrl = packageItem.metadata?.repositoryUrl;
    if (repoUrl) {
      vscode.env.openExternal(vscode.Uri.parse(repoUrl));
    } else {
      vscode.window.showWarningMessage(`No repository URL available for ${packageItem.packageName}`);
    }
  }
}
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversionProfileManager = exports.PREDEFINED_PROFILES = void 0;
const fs = require("fs");
const path = require("path");
// Predefined profiles
exports.PREDEFINED_PROFILES = [
    {
        name: 'conservative',
        description: 'Conservative conversion - preserves most v1 syntax, minimal changes',
        rules: [
            {
                id: 'msgbox-basic',
                name: 'Basic MsgBox conversion',
                description: 'Convert only basic MsgBox syntax',
                enabled: true,
                priority: 1,
                category: 'commands',
                pattern: 'MsgBox,\\s*(.+)',
                replacement: 'MsgBox($1)'
            },
            {
                id: 'if-basic',
                name: 'Basic If statement conversion',
                description: 'Convert only simple If statements',
                enabled: true,
                priority: 2,
                category: 'syntax',
                pattern: 'If\\s+([^=<>!]+)\\s*$',
                replacement: 'If ($1)'
            }
        ],
        preserveSyntax: [
            '#NoEnv',
            'SendMode',
            'SetWorkingDir',
            'old-style function calls'
        ],
        selectiveConversion: {
            enabled: false,
            constructs: {
                functions: true,
                variables: true,
                commands: true,
                directives: false,
                hotkeys: true,
                hotstrings: true
            },
            excludePatterns: [
                ';.*@preserve.*',
                '.*#pragma.*'
            ],
            includePatterns: []
        },
        performance: {
            streamingEnabled: false,
            chunkSize: 1000,
            maxMemoryUsage: 100,
            enableProgressTracking: true,
            enableCancellation: true
        },
        validation: {
            level: 'strict',
            enableSyntaxCheck: true,
            enableSemanticCheck: true,
            enablePerformanceCheck: false,
            customRules: []
        }
    },
    {
        name: 'aggressive',
        description: 'Aggressive conversion - maximizes v2 syntax adoption',
        rules: [
            {
                id: 'msgbox-full',
                name: 'Full MsgBox conversion',
                description: 'Convert all MsgBox syntax variants',
                enabled: true,
                priority: 1,
                category: 'commands',
                pattern: 'MsgBox,\\s*(.+)',
                replacement: 'MsgBox($1)'
            },
            {
                id: 'if-full',
                name: 'Full If statement conversion',
                description: 'Convert all If statement variants',
                enabled: true,
                priority: 2,
                category: 'syntax',
                pattern: 'If\\s+(.+)',
                replacement: 'If ($1)'
            },
            {
                id: 'variables-full',
                name: 'Full variable conversion',
                description: 'Convert all variable syntax',
                enabled: true,
                priority: 3,
                category: 'variables',
                pattern: '%(\\w+)%',
                replacement: '%$1%'
            }
        ],
        preserveSyntax: [],
        selectiveConversion: {
            enabled: false,
            constructs: {
                functions: true,
                variables: true,
                commands: true,
                directives: true,
                hotkeys: true,
                hotstrings: true
            },
            excludePatterns: [],
            includePatterns: []
        },
        performance: {
            streamingEnabled: true,
            chunkSize: 500,
            maxMemoryUsage: 200,
            enableProgressTracking: true,
            enableCancellation: true
        },
        validation: {
            level: 'normal',
            enableSyntaxCheck: true,
            enableSemanticCheck: true,
            enablePerformanceCheck: true,
            customRules: []
        }
    },
    {
        name: 'custom',
        description: 'Custom profile - user-defined rules and settings',
        rules: [],
        preserveSyntax: [],
        selectiveConversion: {
            enabled: false,
            constructs: {
                functions: true,
                variables: true,
                commands: true,
                directives: true,
                hotkeys: true,
                hotstrings: true
            },
            excludePatterns: [],
            includePatterns: []
        },
        performance: {
            streamingEnabled: true,
            chunkSize: 750,
            maxMemoryUsage: 150,
            enableProgressTracking: true,
            enableCancellation: true
        },
        validation: {
            level: 'normal',
            enableSyntaxCheck: true,
            enableSemanticCheck: true,
            enablePerformanceCheck: false,
            customRules: []
        }
    }
];
class ConversionProfileManager {
    constructor(context) {
        this.profiles = new Map();
        this.customProfilesPath = path.join(context.globalStorageUri.fsPath, 'customProfiles.json');
        this.loadProfiles();
    }
    static getInstance(context) {
        if (!ConversionProfileManager.instance) {
            if (!context) {
                throw new Error('Extension context required for first initialization');
            }
            ConversionProfileManager.instance = new ConversionProfileManager(context);
        }
        return ConversionProfileManager.instance;
    }
    loadProfiles() {
        // Load predefined profiles
        exports.PREDEFINED_PROFILES.forEach(profile => {
            this.profiles.set(profile.name, profile);
        });
        // Load custom profiles
        try {
            if (fs.existsSync(this.customProfilesPath)) {
                const customProfilesData = fs.readFileSync(this.customProfilesPath, 'utf8');
                const customProfiles = JSON.parse(customProfilesData);
                customProfiles.forEach(profile => {
                    this.profiles.set(profile.name, profile);
                });
            }
        }
        catch (error) {
            console.error('Failed to load custom profiles:', error);
        }
    }
    saveCustomProfiles() {
        try {
            const customProfiles = Array.from(this.profiles.values())
                .filter(profile => !exports.PREDEFINED_PROFILES.some(p => p.name === profile.name));
            const dir = path.dirname(this.customProfilesPath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.customProfilesPath, JSON.stringify(customProfiles, null, 2));
        }
        catch (error) {
            console.error('Failed to save custom profiles:', error);
        }
    }
    getProfile(name) {
        return this.profiles.get(name);
    }
    getAllProfiles() {
        return Array.from(this.profiles.values());
    }
    getPredefinedProfiles() {
        return exports.PREDEFINED_PROFILES;
    }
    getCustomProfiles() {
        return Array.from(this.profiles.values())
            .filter(profile => !exports.PREDEFINED_PROFILES.some(p => p.name === profile.name));
    }
    saveProfile(profile) {
        this.profiles.set(profile.name, profile);
        this.saveCustomProfiles();
    }
    deleteProfile(name) {
        if (exports.PREDEFINED_PROFILES.some(p => p.name === name)) {
            return false; // Cannot delete predefined profiles
        }
        const deleted = this.profiles.delete(name);
        if (deleted) {
            this.saveCustomProfiles();
        }
        return deleted;
    }
    exportProfile(name, filePath) {
        const profile = this.profiles.get(name);
        if (!profile) {
            return false;
        }
        try {
            fs.writeFileSync(filePath, JSON.stringify(profile, null, 2));
            return true;
        }
        catch (error) {
            console.error('Failed to export profile:', error);
            return false;
        }
    }
    importProfile(filePath) {
        try {
            const profileData = fs.readFileSync(filePath, 'utf8');
            const profile = JSON.parse(profileData);
            // Validate profile structure
            if (!this.validateProfile(profile)) {
                throw new Error('Invalid profile structure');
            }
            // Ensure unique name
            let uniqueName = profile.name;
            let counter = 1;
            while (this.profiles.has(uniqueName)) {
                uniqueName = `${profile.name}_${counter}`;
                counter++;
            }
            profile.name = uniqueName;
            this.saveProfile(profile);
            return profile;
        }
        catch (error) {
            console.error('Failed to import profile:', error);
            return null;
        }
    }
    validateProfile(profile) {
        return (typeof profile === 'object' &&
            typeof profile.name === 'string' &&
            typeof profile.description === 'string' &&
            Array.isArray(profile.rules) &&
            typeof profile.preserveSyntax === 'object' &&
            Array.isArray(profile.preserveSyntax) &&
            typeof profile.selectiveConversion === 'object' &&
            typeof profile.performance === 'object' &&
            typeof profile.validation === 'object');
    }
    createCustomProfile(name, baseProfile) {
        const base = baseProfile ? this.profiles.get(baseProfile) : exports.PREDEFINED_PROFILES[2]; // default to custom profile
        if (!base) {
            throw new Error(`Base profile '${baseProfile}' not found`);
        }
        const newProfile = {
            ...base,
            name,
            description: `Custom profile based on ${base.name}`,
            rules: [...base.rules]
        };
        this.saveProfile(newProfile);
        return newProfile;
    }
    updateProfileRule(profileName, rule) {
        const profile = this.profiles.get(profileName);
        if (!profile) {
            return false;
        }
        const existingIndex = profile.rules.findIndex(r => r.id === rule.id);
        if (existingIndex >= 0) {
            profile.rules[existingIndex] = rule;
        }
        else {
            profile.rules.push(rule);
        }
        this.saveProfile(profile);
        return true;
    }
    removeProfileRule(profileName, ruleId) {
        const profile = this.profiles.get(profileName);
        if (!profile) {
            return false;
        }
        const initialLength = profile.rules.length;
        profile.rules = profile.rules.filter(r => r.id !== ruleId);
        if (profile.rules.length < initialLength) {
            this.saveProfile(profile);
            return true;
        }
        return false;
    }
}
exports.ConversionProfileManager = ConversionProfileManager;
//# sourceMappingURL=conversionProfiles.js.map
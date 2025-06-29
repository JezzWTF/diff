#!/usr/bin/env node

/**
 * Changelog Setup Script
 * 
 * This script can be used in any repository to set up a properly formatted CHANGELOG.md file.
 * It will:
 * 1. Check for existing changelog files
 * 2. Validate the format if one exists
 * 3. Prompt for basic information if needed
 * 4. Create a new CHANGELOG.md file following Keep a Changelog standards
 * 
 * Usage: node setup-changelog.cjs
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Common changelog file names to check for
const CHANGELOG_VARIANTS = [
  'CHANGELOG.md',
  'changelog.md',
  'CHANGELOG',
  'CHANGELOG.txt',
  'HISTORY.md',
  'history.md',
  'HISTORY',
  'NEWS.md',
  'news.md',
  'NEWS',
  'RELEASES.md',
  'releases.md',
  'RELEASES'
];

class ChangelogSetup {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async setup() {
    console.log('🔍 Changelog Setup Tool');
    console.log('========================\n');

    try {
      // Check for existing changelog files
      const existingFile = this.findExistingChangelog();
      
      if (existingFile) {
        console.log(`📝 Found existing changelog: ${existingFile}`);
        const shouldReplace = await this.question('Do you want to replace it with a properly formatted version? (y/N): ');
        
        if (shouldReplace.toLowerCase() !== 'y' && shouldReplace.toLowerCase() !== 'yes') {
          console.log('✅ Keeping existing changelog. Run with --force to override.');
          this.close();
          return;
        }

        // Backup existing file
        const backupName = `${existingFile}.backup.${Date.now()}`;
        fs.copyFileSync(existingFile, backupName);
        console.log(`📋 Backed up existing file to: ${backupName}`);
      }

      // Gather project information
      const projectInfo = await this.gatherProjectInfo();
      
      // Create the changelog
      const changelog = this.generateChangelog(projectInfo);
      
      // Write the file
      fs.writeFileSync('CHANGELOG.md', changelog);
      
      console.log('\n✅ CHANGELOG.md created successfully!');
      console.log('\n📚 Next steps:');
      console.log('   1. Review and adjust the initial entries');
      console.log('   2. Update the repository URLs if needed');
      console.log('   3. Add the changelog update script if you want automated entries');
      console.log('\n💡 Tip: Use semantic versioning and follow the Keep a Changelog format');
      
    } catch (error) {
      console.error('❌ Error setting up changelog:', error.message);
    } finally {
      this.close();
    }
  }

  findExistingChangelog() {
    for (const variant of CHANGELOG_VARIANTS) {
      if (fs.existsSync(variant)) {
        return variant;
      }
    }
    return null;
  }

  async gatherProjectInfo() {
    console.log('📋 Please provide some basic information:\n');

    // Try to get project name from package.json
    let defaultProjectName = 'Your Project';
    let defaultVersion = '0.1.0';
    let defaultRepo = '';

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      defaultProjectName = packageJson.name || defaultProjectName;
      defaultVersion = packageJson.version || defaultVersion;
      
      if (packageJson.repository) {
        if (typeof packageJson.repository === 'string') {
          defaultRepo = packageJson.repository;
        } else if (packageJson.repository.url) {
          defaultRepo = packageJson.repository.url.replace(/^git\+/, '').replace(/\.git$/, '');
        }
      }
    } catch (e) {
      // No package.json or invalid JSON, use defaults
    }

    const projectName = await this.question(`Project name (${defaultProjectName}): `) || defaultProjectName;
    const currentVersion = await this.question(`Current version (${defaultVersion}): `) || defaultVersion;
    const repoUrl = await this.question(`Repository URL (${defaultRepo}): `) || defaultRepo;
    
    console.log('\n🎯 What type of project is this?');
    console.log('1. Web application/website');
    console.log('2. Library/package');
    console.log('3. CLI tool');
    console.log('4. API/service');
    console.log('5. Other');
    
    const projectType = await this.question('Select type (1-5, default: 5): ') || '5';
    
    // Get initial features
    console.log('\n📝 Describe the main features of the current version:');
    console.log('(Enter features one per line, press Enter twice when done)');
    
    const features = [];
    let feature;
    while (true) {
      feature = await this.question('Feature: ');
      if (!feature.trim()) break;
      features.push(feature.trim());
    }

    return {
      projectName,
      currentVersion,
      repoUrl,
      projectType: parseInt(projectType),
      features: features.length > 0 ? features : this.getDefaultFeatures(parseInt(projectType))
    };
  }

  getDefaultFeatures(projectType) {
    const defaults = {
      1: [ // Web application
        'Initial release of the web application',
        'User interface with responsive design',
        'Core functionality implementation',
        'Cross-browser compatibility'
      ],
      2: [ // Library/package
        'Initial library release',
        'Core API implementation',
        'Documentation and examples',
        'Package distribution setup'
      ],
      3: [ // CLI tool
        'Initial CLI tool release',
        'Command-line interface implementation',
        'Help and usage documentation',
        'Cross-platform compatibility'
      ],
      4: [ // API/service
        'Initial API release',
        'RESTful endpoints implementation',
        'Authentication and authorization',
        'API documentation'
      ],
      5: [ // Other
        'Initial project release',
        'Core functionality implementation',
        'Basic documentation',
        'Project setup and configuration'
      ]
    };

    return defaults[projectType] || defaults[5];
  }

  generateChangelog(info) {
    const today = new Date().toISOString().split('T')[0];
    const repoUrlClean = info.repoUrl.replace(/^https?:\/\/github\.com\//, '');
    
    let changelog = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [${info.currentVersion}] - ${today}

### Added
`;

    // Add features
    info.features.forEach(feature => {
      changelog += `- ${feature}\n`;
    });

    // Add version links if we have a repo URL
    if (info.repoUrl && repoUrlClean) {
      changelog += `
[Unreleased]: https://github.com/${repoUrlClean}/compare/v${info.currentVersion}...HEAD
[${info.currentVersion}]: https://github.com/${repoUrlClean}/releases/tag/v${info.currentVersion}`;
    } else {
      changelog += `
[Unreleased]: #
[${info.currentVersion}]: #`;
    }

    return changelog;
  }

  close() {
    this.rl.close();
  }
}

// Handle command line execution
if (require.main === module) {
  const setup = new ChangelogSetup();
  setup.setup().catch(console.error);
}

module.exports = ChangelogSetup; 
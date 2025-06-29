#!/usr/bin/env node

/**
 * Complete Changelog Setup Solution
 * 
 * This script sets up a complete changelog system in any repository:
 * 1. Creates a properly formatted CHANGELOG.md file
 * 2. Creates the changelog update script (scripts/update-changelog.cjs)
 * 3. Adds npm script to package.json for easy usage
 * 
 * Features:
 * - No external dependencies required
 * - Detects existing changelog files
 * - Auto-reads package.json for defaults
 * - Interactive prompts for project info
 * - Creates Keep a Changelog formatted file
 * - Backs up existing files
 * - One-stop solution for changelog management
 * 
 * Usage: 
 *   node changelog-setup-standalone.cjs
 * 
 * Or add to package.json scripts:
 *   "changelog:setup": "node changelog-setup-standalone.cjs"
 * 
 * After setup, use: npm run changelog:add [type] [description]
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Version and info
const SCRIPT_VERSION = '1.0.0';
const CHANGELOG_VARIANTS = [
  'CHANGELOG.md', 'changelog.md', 'CHANGELOG', 'CHANGELOG.txt',
  'HISTORY.md', 'history.md', 'HISTORY',
  'NEWS.md', 'news.md', 'NEWS',
  'RELEASES.md', 'releases.md', 'RELEASES'
];

class StandaloneChangelogSetup {
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

  async run() {
    this.printHeader();

    try {
      const existingFile = this.findExistingChangelog();
      
      if (existingFile) {
        const shouldProceed = await this.handleExistingFile(existingFile);
        if (!shouldProceed) {
          this.close();
          return;
        }
      }

      const projectInfo = await this.gatherProjectInfo();
      const changelog = this.generateChangelog(projectInfo);
      
      fs.writeFileSync('CHANGELOG.md', changelog);
      
      // Also create the changelog update script
      await this.createUpdateScript();
      
      this.printSuccess();
      
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    } finally {
      this.close();
    }
  }

  printHeader() {
    console.log('🚀 Changelog Setup Tool v' + SCRIPT_VERSION);
    console.log('=====================================');
    console.log('Creates a Keep a Changelog formatted CHANGELOG.md file\n');
  }

  findExistingChangelog() {
    return CHANGELOG_VARIANTS.find(file => fs.existsSync(file)) || null;
  }

  async handleExistingFile(existingFile) {
    console.log(`📝 Found existing changelog: ${existingFile}`);
    
    const action = await this.question(
      'What would you like to do?\n' +
      '  1. Replace with new formatted version (backup original)\n' +
      '  2. Keep existing file and exit\n' +
      'Choose (1/2): '
    );

    if (action === '1') {
      const timestamp = Date.now();
      const backupName = `${existingFile}.backup.${timestamp}`;
      fs.copyFileSync(existingFile, backupName);
      console.log(`📋 Original backed up as: ${backupName}\n`);
      return true;
    }

    console.log('✅ Keeping existing changelog file.');
    return false;
  }

  async gatherProjectInfo() {
    console.log('📋 Project Information');
    console.log('======================\n');

    const defaults = this.getPackageDefaults();
    
    const projectName = await this.question(`Project name (${defaults.name}): `) || defaults.name;
    const version = await this.question(`Current version (${defaults.version}): `) || defaults.version;
    const repoUrl = await this.question(`Repository URL (${defaults.repo}): `) || defaults.repo;
    
    const projectType = await this.getProjectType();
    const features = await this.getInitialFeatures(projectType);

    return { projectName, version, repoUrl, projectType, features };
  }

  getPackageDefaults() {
    const defaults = { name: 'Your Project', version: '0.1.0', repo: '' };

    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      defaults.name = pkg.name || defaults.name;
      defaults.version = pkg.version || defaults.version;
      
      if (pkg.repository) {
        if (typeof pkg.repository === 'string') {
          defaults.repo = pkg.repository;
        } else if (pkg.repository.url) {
          defaults.repo = pkg.repository.url
            .replace(/^git\+/, '')
            .replace(/\.git$/, '')
            .replace(/^git:/, 'https:');
        }
      }
    } catch (e) {
      // No package.json, use defaults
    }

    return defaults;
  }

  async getProjectType() {
    console.log('\n🎯 Project Type');
    console.log('1. Web Application/Website');
    console.log('2. Library/Package/Module');
    console.log('3. CLI Tool/Command Line App');
    console.log('4. API/Web Service/Backend');
    console.log('5. Desktop Application');
    console.log('6. Mobile Application');
    console.log('7. Other');
    
    const choice = await this.question('Select project type (1-7, default: 7): ') || '7';
    return parseInt(choice);
  }

  async getInitialFeatures(projectType) {
    console.log('\n📝 Initial Features');
    console.log('Enter the main features/changes for the current version:');
    console.log('(One per line, press Enter twice when done)\n');
    
    const features = [];
    let input;
    
    while (true) {
      input = await this.question('Feature: ');
      if (!input.trim()) break;
      features.push(input.trim());
    }

    return features.length > 0 ? features : this.getDefaultFeatures(projectType);
  }

  getDefaultFeatures(type) {
    const defaults = {
      1: ['Initial web application release', 'Responsive user interface', 'Core functionality', 'Cross-browser support'],
      2: ['Initial library release', 'Core API implementation', 'Documentation', 'Package distribution'],
      3: ['Initial CLI release', 'Command-line interface', 'Help documentation', 'Cross-platform support'],
      4: ['Initial API release', 'RESTful endpoints', 'Authentication system', 'API documentation'],
      5: ['Initial desktop app release', 'Native user interface', 'Core features', 'Cross-platform compatibility'],
      6: ['Initial mobile app release', 'Native mobile interface', 'Core functionality', 'Platform optimization'],
      7: ['Initial project release', 'Core functionality', 'Basic documentation', 'Project setup']
    };

    return defaults[type] || defaults[7];
  }

  generateChangelog({ projectName, version, repoUrl, features }) {
    const today = new Date().toISOString().split('T')[0];
    const githubPath = this.extractGithubPath(repoUrl);
    
    let content = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [${version}] - ${today}

### Added
`;

    features.forEach(feature => {
      content += `- ${feature}\n`;
    });

    // Add version links
    if (githubPath) {
      content += `
[Unreleased]: https://github.com/${githubPath}/compare/v${version}...HEAD
[${version}]: https://github.com/${githubPath}/releases/tag/v${version}`;
    } else {
      content += `
[Unreleased]: # 
[${version}]: #`;
    }

    return content;
  }

  extractGithubPath(url) {
    if (!url) return '';
    
    const githubMatch = url.match(/github\.com[/:]([\w.-]+\/[\w.-]+)/);
    return githubMatch ? githubMatch[1].replace(/\.git$/, '') : '';
  }

  async createUpdateScript() {
    const shouldCreate = await this.question('\n📝 Create changelog update script? (Y/n): ');
    
    if (shouldCreate.toLowerCase() === 'n' || shouldCreate.toLowerCase() === 'no') {
      console.log('⏭️  Skipping update script creation.');
      return;
    }

    // Create scripts directory if it doesn't exist
    if (!fs.existsSync('scripts')) {
      fs.mkdirSync('scripts');
    }

    const updateScriptContent = this.generateUpdateScript();
    fs.writeFileSync('scripts/update-changelog.cjs', updateScriptContent);
    
    console.log('✅ Created scripts/update-changelog.cjs');

    // Try to add to package.json
    await this.addScriptToPackageJson();
  }

  async addScriptToPackageJson() {
    try {
      if (!fs.existsSync('package.json')) {
        console.log('💡 Add this to your package.json scripts:');
        console.log('   "changelog:add": "node scripts/update-changelog.cjs"');
        return;
      }

      const shouldAddScript = await this.question('Add changelog:add script to package.json? (Y/n): ');
      
      if (shouldAddScript.toLowerCase() === 'n' || shouldAddScript.toLowerCase() === 'no') {
        console.log('💡 You can manually add: "changelog:add": "node scripts/update-changelog.cjs"');
        return;
      }

      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      if (!pkg.scripts) {
        pkg.scripts = {};
      }

      pkg.scripts['changelog:add'] = 'node scripts/update-changelog.cjs';
      
      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
      console.log('✅ Added changelog:add script to package.json');
      
    } catch (error) {
      console.log('⚠️  Could not update package.json:', error.message);
      console.log('💡 Manually add: "changelog:add": "node scripts/update-changelog.cjs"');
    }
  }

  generateUpdateScript() {
    return `#!/usr/bin/env node

/**
 * Changelog Update Helper
 * Usage: node scripts/update-changelog.cjs [type] [description]
 * Types: added, changed, deprecated, removed, fixed, security
 */

const fs = require('fs');
const path = require('path');

const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');

function updateChangelog(type, description) {
  if (!type || !description) {
    console.log('Usage: node scripts/update-changelog.cjs [type] [description]');
    console.log('Types: added, changed, deprecated, removed, fixed, security');
    console.log('Example: node scripts/update-changelog.cjs added "New feature for user profiles"');
    return;
  }

  const validTypes = ['added', 'changed', 'deprecated', 'removed', 'fixed', 'security'];
  const normalizedType = type.toLowerCase();
  
  if (!validTypes.includes(normalizedType)) {
    console.error(\`Invalid type: \${type}. Must be one of: \${validTypes.join(', ')}\`);
    return;
  }

  try {
    let changelog = fs.readFileSync(CHANGELOG_PATH, 'utf8');
    
    // Find the Unreleased section
    const unreleasedIndex = changelog.indexOf('## [Unreleased]');
    if (unreleasedIndex === -1) {
      console.error('Could not find [Unreleased] section in changelog');
      return;
    }

    // Find the next section after Unreleased
    const nextSectionIndex = changelog.indexOf('## [', unreleasedIndex + 1);
    const unreleasedSection = nextSectionIndex === -1 
      ? changelog.substring(unreleasedIndex)
      : changelog.substring(unreleasedIndex, nextSectionIndex);

    // Capitalize type for section header
    const capitalizedType = normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1);
    const sectionHeader = \`### \${capitalizedType}\`;
    
    let newEntry = \`- \${description}\`;
    
    // Check if the section already exists
    const sectionIndex = unreleasedSection.indexOf(sectionHeader);
    
    if (sectionIndex !== -1) {
      // Section exists, add to it
      const sectionStart = unreleasedIndex + sectionIndex;
      const nextSectionInUnreleased = unreleasedSection.indexOf('### ', sectionIndex + 1);
      
      let insertPoint;
      if (nextSectionInUnreleased !== -1) {
        // There's another section after this one
        insertPoint = unreleasedIndex + nextSectionInUnreleased - 1;
      } else {
        // This is the last section in Unreleased
        const endOfUnreleased = nextSectionIndex === -1 
          ? changelog.length
          : nextSectionIndex;
        insertPoint = endOfUnreleased - 1;
      }
      
      // Find the last line of the current section
      const beforeInsert = changelog.substring(0, insertPoint).trimEnd();
      const afterInsert = changelog.substring(insertPoint);
      
      changelog = beforeInsert + '\\n' + newEntry + '\\n' + afterInsert;
      
    } else {
      // Section doesn't exist, create it
      // Find where to insert the new section (maintain order)
      const sectionOrder = ['### Added', '### Changed', '### Deprecated', '### Removed', '### Fixed', '### Security'];
      const currentSectionIndex = sectionOrder.indexOf(sectionHeader);
      
      let insertAfterSection = null;
      for (let i = currentSectionIndex - 1; i >= 0; i--) {
        if (unreleasedSection.includes(sectionOrder[i])) {
          insertAfterSection = sectionOrder[i];
          break;
        }
      }
      
      let insertPoint;
      if (insertAfterSection) {
        // Insert after the previous section
        const prevSectionIndex = unreleasedSection.indexOf(insertAfterSection);
        const nextSectionAfterPrev = unreleasedSection.indexOf('### ', prevSectionIndex + 1);
        if (nextSectionAfterPrev !== -1) {
          insertPoint = unreleasedIndex + nextSectionAfterPrev;
        } else {
          insertPoint = nextSectionIndex === -1 ? changelog.length : nextSectionIndex;
        }
      } else {
        // Insert at the beginning of Unreleased section
        const firstSectionIndex = unreleasedSection.indexOf('### ');
        if (firstSectionIndex !== -1) {
          insertPoint = unreleasedIndex + firstSectionIndex;
        } else {
          // No sections exist yet
          insertPoint = nextSectionIndex === -1 ? changelog.length : nextSectionIndex;
        }
      }
      
      const beforeInsert = changelog.substring(0, insertPoint).trimEnd();
      const afterInsert = changelog.substring(insertPoint);
      
      changelog = beforeInsert + '\\n\\n' + sectionHeader + '\\n' + newEntry + '\\n' + afterInsert;
    }
    
    fs.writeFileSync(CHANGELOG_PATH, changelog);
    console.log(\`✅ Added to changelog under "\${capitalizedType}": \${description}\`);
    
  } catch (error) {
    console.error('Error updating changelog:', error.message);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.length >= 2) {
  const type = args[0];
  const description = args.slice(1).join(' ');
  updateChangelog(type, description);
} else {
  updateChangelog();
}`;
  }

  printSuccess() {
    console.log('\n✅ Changelog setup completed successfully!');
    console.log('\n📚 What you now have:');
    console.log('   ✓ CHANGELOG.md - Properly formatted changelog');
    console.log('   ✓ scripts/update-changelog.cjs - Script to add entries');
    console.log('   ✓ package.json script (if added) - npm run changelog:add');
    console.log('\n🚀 How to use:');
    console.log('   npm run changelog:add added "New feature description"');
    console.log('   npm run changelog:add fixed "Bug fix description"');
    console.log('   npm run changelog:add changed "Change description"');
    console.log('\n📝 Next steps:');
    console.log('   • Review and customize the initial changelog entries');
    console.log('   • Update repository URLs if needed');
    console.log('   • Follow semantic versioning for future releases');
    console.log('\n🔗 Resources:');
    console.log('   • Keep a Changelog: https://keepachangelog.com');
    console.log('   • Semantic Versioning: https://semver.org');
    console.log('\n💡 Pro tip: Keep the [Unreleased] section updated between releases!');
  }

  close() {
    this.rl.close();
  }
}

// Execute if run directly
if (require.main === module) {
  const setup = new StandaloneChangelogSetup();
  setup.run().catch(console.error);
}

// Export for use as module
module.exports = StandaloneChangelogSetup; 
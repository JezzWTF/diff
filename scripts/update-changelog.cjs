#!/usr/bin/env node

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
    console.error(`Invalid type: ${type}. Must be one of: ${validTypes.join(', ')}`);
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
    const sectionHeader = `### ${capitalizedType}`;
    
    let newEntry = `- ${description}`;
    
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
      
      changelog = beforeInsert + '\n' + newEntry + '\n' + afterInsert;
      
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
      
      changelog = beforeInsert + '\n\n' + sectionHeader + '\n' + newEntry + '\n' + afterInsert;
    }
    
    fs.writeFileSync(CHANGELOG_PATH, changelog);
    console.log(`✅ Added to changelog under "${capitalizedType}": ${description}`);
    
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
}
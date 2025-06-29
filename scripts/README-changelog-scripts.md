# Changelog Scripts

This directory contains scripts to help manage changelogs following the [Keep a Changelog](https://keepachangelog.com) standard.

## Scripts Overview

### 1. `setup-changelog.cjs`
**Purpose**: Set up a new CHANGELOG.md file in the current repository  
**Usage**: `npm run changelog:setup` or `node scripts/setup-changelog.cjs`

**Features**:
- Detects existing changelog files (various naming conventions)
- Reads `package.json` for project defaults
- Interactive prompts for project information
- Creates properly formatted CHANGELOG.md
- Backs up existing files before replacing

### 2. `update-changelog.cjs`
**Purpose**: Add new entries to an existing CHANGELOG.md  
**Usage**: `npm run changelog:add [type] [description]`

**Examples**:
```bash
npm run changelog:add added "New user dashboard feature"
npm run changelog:add fixed "Fixed login redirect issue"
npm run changelog:add changed "Updated API endpoints for v2"
npm run changelog:add security "Patched XSS vulnerability"
```

**Valid Types**: `added`, `changed`, `deprecated`, `removed`, `fixed`, `security`

### 3. `changelog-setup-standalone.cjs`
**Purpose**: Complete standalone changelog solution for any repository  
**Usage**: Copy this file to any project and run `node changelog-setup-standalone.cjs`

**Features**:
- No external dependencies required
- Self-contained single file
- Creates CHANGELOG.md file
- **Also creates the update script** (`scripts/update-changelog.cjs`)
- **Automatically adds npm scripts** to package.json
- Perfect for setting up changelogs in new repositories
- Interactive setup with smart defaults

## Usage Workflow

### Initial Setup (Current Project)
1. Run `npm run changelog:setup` in this project
2. Answer the interactive prompts
3. Review and customize the generated CHANGELOG.md

### Initial Setup (New Repository)
1. Copy `changelog-setup-standalone.cjs` to the new repository
2. Run `node changelog-setup-standalone.cjs`
3. Choose to create the update script (recommended: Y)
4. Choose to add npm scripts (recommended: Y)
5. **You now have a complete changelog system!**

**What gets created:**
- `CHANGELOG.md` - Your formatted changelog file
- `scripts/update-changelog.cjs` - Script to add entries
- Updated `package.json` with `changelog:add` script

### Adding Entries
1. Use `npm run changelog:add [type] [description]` to add entries
2. Entries are automatically added to the `[Unreleased]` section
3. Follow semantic versioning when releasing

### Best Practices
- Keep the `[Unreleased]` section updated between releases
- Use clear, user-focused descriptions
- Group related changes together
- Follow semantic versioning (major.minor.patch)
- Link to issues/PRs when relevant

## Package.json Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "changelog:setup": "node scripts/setup-changelog.cjs",
    "changelog:add": "node scripts/update-changelog.cjs"
  }
}
```

## Keep a Changelog Format

The generated changelogs follow this structure:

```markdown
# Changelog

## [Unreleased]
### Added
- New features

### Changed
- Changes in existing functionality

### Fixed
- Bug fixes

## [1.0.0] - 2024-01-15
### Added
- Initial release features
```

## Resources

- [Keep a Changelog](https://keepachangelog.com) - Changelog format standard
- [Semantic Versioning](https://semver.org) - Version numbering standard
- [Conventional Commits](https://conventionalcommits.org) - Commit message standard 
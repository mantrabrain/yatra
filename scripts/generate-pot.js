#!/usr/bin/env node

/**
 * WordPress-style .pot generator for Yatra
 * Combines PHP and JavaScript translations into a single .pot file
 * Following WooCommerce and WordPress standards
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pluginDir = path.dirname(__dirname);

// Output file
const potFile = path.join(pluginDir, 'languages/yatra.pot');
const tempPhpPotFile = path.join(pluginDir, 'languages/yatra-php-temp.pot');

// Directories to scan for JavaScript (built files)
const jsSourceDirs = [
    path.join(pluginDir, 'assets/admin/dist'),
    path.join(pluginDir, 'assets/dist')
];

// Regex patterns to find translation strings
const patterns = [
    // __("string", "default")
    /__\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\)/g,
    // __("string")
    /__\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
    // _x("string", "context", "default")
    /_x\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\)/g,
    // _x("string", "context")
    /_x\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*\)/g,
    // _n("single", "plural", count)
    /_n\(\s*['"`]([^'"`]+)['"`]\s*,\s*['"`]([^'"`]+)['"`]\s*,\s*[^)]+\s*\)/g
];

/**
 * Extract PHP translations using WP-CLI
 */
function extractPhpTranslations() {
    console.log('🔍 Extracting PHP translations using WP-CLI...\n');
    
    try {
        // Ensure languages directory exists
        const languagesDir = path.join(pluginDir, 'languages');
        if (!fs.existsSync(languagesDir)) {
            fs.mkdirSync(languagesDir, { recursive: true });
        }
        
        // Extract PHP translations
        const command = `wp --allow-root i18n make-pot . "${tempPhpPotFile}" --include="app,includes,templates" --exclude="node_modules,vendor,assets/dist" --domain=yatra --location`;
        console.log(`📝 Running: ${command}`);
        
        try {
            execSync(command, { cwd: pluginDir, stdio: 'inherit' });
            console.log('✅ PHP translations extracted successfully');
            return true;
        } catch (error) {
            console.log('⚠️  PHP extraction failed, continuing with JavaScript only');
            return false;
        }
    } catch (error) {
        console.log('⚠️  Could not extract PHP translations');
        return false;
    }
}

/**
 * Recursively get all files in a directory
 */
function getAllFiles(dir, extensions = ['.js', '.jsx']) {
    const files = [];
    
    if (!fs.existsSync(dir)) {
        return files;
    }
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            files.push(...getAllFiles(fullPath, extensions));
        } else if (extensions.some(ext => item.endsWith(ext))) {
            files.push(fullPath);
        }
    }
    
    return files;
}

/**
 * Extract translations from a single file
 */
function extractTranslationsFromFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const translations = new Map();
    const locations = new Map();
    
    for (const pattern of patterns) {
        let match;
        while ((match = pattern.exec(content)) !== null) {
            const key = match[1];
            const defaultValue = match[2] || match[3] || key;
            
            // Skip if key looks like a variable or property access
            if (key.includes('.') || key.includes('[') || key.includes('$') || key.includes('`')) {
                continue;
            }
            
            // Clean up the key and default value
            const cleanKey = key.replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
            const cleanDefault = defaultValue.replace(/\\'/g, "'").replace(/\\"/g, '"').trim();
            
            if (cleanKey && !translations.has(cleanKey)) {
                translations.set(cleanKey, cleanDefault);
                
                // Calculate line number
                const beforeMatch = content.substring(0, match.index);
                const lineNumber = beforeMatch.split('\n').length;
                
                // Store location information
                if (!locations.has(cleanKey)) {
                    locations.set(cleanKey, []);
                }
                locations.get(cleanKey).push({
                    file: path.relative(pluginDir, filePath),
                    line: lineNumber
                });
            }
        }
    }
    
    return { translations, locations };
}

/**
 * Extract JavaScript translations
 */
function extractJSTranslations() {
    console.log('🔍 Extracting JavaScript translations...\n');
    
    const allTranslations = new Map();
    const allLocations = new Map();
    let totalFiles = 0;
    let totalTranslations = 0;
    
    // Scan all source directories
    for (const dir of jsSourceDirs) {
        if (!fs.existsSync(dir)) {
            console.log(`⚠️  Directory not found: ${dir}`);
            continue;
        }
        
        console.log(`📁 Scanning: ${dir}`);
        const files = getAllFiles(dir);
        
        for (const file of files) {
            const { translations, locations } = extractTranslationsFromFile(file);
            
            for (const [key, defaultValue] of translations) {
                if (!allTranslations.has(key)) {
                    allTranslations.set(key, defaultValue);
                }
                
                // Merge locations
                if (locations.has(key)) {
                    if (!allLocations.has(key)) {
                        allLocations.set(key, []);
                    }
                    allLocations.get(key).push(...locations.get(key));
                }
            }
            
            if (translations.size > 0) {
                console.log(`   📄 ${path.relative(pluginDir, file)}: ${translations.size} translations`);
                totalTranslations += translations.size;
            }
            
            totalFiles++;
        }
    }
    
    console.log(`\n✅ JavaScript extraction complete!`);
    console.log(`   📊 Total files scanned: ${totalFiles}`);
    console.log(`   🌍 Total translations found: ${totalTranslations}`);
    
    return { translations: allTranslations, locations: allLocations };
}

/**
 * Parse PHP .pot file and extract entries
 */
function parsePhpPotFile(filePath) {
    if (!fs.existsSync(filePath)) {
        return new Map();
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const entries = new Map();
    const lines = content.split('\n');
    
    let currentMsgid = '';
    let currentReferences = [];
    let currentComments = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('#:')) {
            // Reference line - add to current references
            const reference = line.substring(2).trim();
            currentReferences.push(reference);
        } else if (line.startsWith('#.')) {
            // Comment line
            const comment = line.substring(2).trim();
            currentComments.push(comment);
        } else if (line.startsWith('msgid ')) {
            // Process previous entry before starting new one
            if (currentMsgid && currentMsgid !== '""') {
                const cleanMsgid = currentMsgid.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"');
                entries.set(cleanMsgid, {
                    references: [...currentReferences], // Copy array
                    comments: [...currentComments] // Copy array
                });
            }
            
            // Start new entry
            currentMsgid = line.substring(6).trim();
            // Don't clear references yet - they belong to this msgid
        } else if (line.startsWith('msgstr')) {
            // End of current entry - process it
            if (currentMsgid && currentMsgid !== '""') {
                const cleanMsgid = currentMsgid.replace(/^"(.*)"$/, '$1').replace(/\\"/g, '"');
                entries.set(cleanMsgid, {
                    references: [...currentReferences], // Copy array
                    comments: [...currentComments] // Copy array
                });
            }
            
            // Reset for next entry
            currentMsgid = '';
            currentReferences = [];
            currentComments = [];
        } else if (line.startsWith('"') && currentMsgid) {
            // Continuation of msgid
            currentMsgid += line.trim();
        }
    }
    
    return entries;
}

/**
 * Generate .pot file content
 */
function generatePotContent(jsTranslations, jsLocations, phpEntries) {
    let potContent = `# Copyright (C) 2026 Yatra Development Team
# This file is distributed under the GPL v2 or later.
msgid ""
msgstr ""
"Project-Id-Version: Yatra - Travel Booking & Management 3.0.0\\n"
"Report-Msgid-Bugs-To: https://wordpress.org/support/plugin/yatra\\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"
"Language-Team: LANGUAGE <LL@li.org>\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"POT-Creation-Date: ${new Date().toISOString().split('T')[0]}T${new Date().toTimeString().split(' ')[0]}+00:00\\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"
"X-Generator: Yatra Translation Extractor\\n"
"X-Domain: yatra\\n"

`;
    
    // Add PHP entries first
    for (const [key, entry] of phpEntries) {
        // Skip empty keys
        if (!key || key === '') continue;
        
        // Add comments
        for (const comment of entry.comments) {
            potContent += `#. ${comment}\n`;
        }
        
        // Add references
        for (const ref of entry.references) {
            potContent += `#: ${ref}\n`;
        }
        
        // Add msgid and msgstr
        potContent += `msgid "${key}"\n`;
        potContent += `msgstr ""\n\n`;
    }
    
    // Add JavaScript translations
    for (const [key, defaultValue] of jsTranslations) {
        // Skip if already in PHP entries
        if (phpEntries.has(key)) continue;
        
        // Add comment
        potContent += `#. Translation from JavaScript: ${defaultValue}\n`;
        
        // Add references
        if (jsLocations.has(key)) {
            for (const loc of jsLocations.get(key)) {
                potContent += `#: ${loc.file}:${loc.line}\n`;
            }
        }
        
        // Add msgid and msgstr
        potContent += `msgid "${key}"\n`;
        potContent += `msgstr ""\n\n`;
    }
    
    return potContent;
}

/**
 * Main function
 */
function generatePotFile() {
    console.log('🔀 Generating WordPress-style .pot file for Yatra...\n');
    
    // Ensure languages directory exists
    const languagesDir = path.join(pluginDir, 'languages');
    if (!fs.existsSync(languagesDir)) {
        fs.mkdirSync(languagesDir, { recursive: true });
    }
    
    // Extract PHP translations
    const phpSuccess = extractPhpTranslations();
    let phpEntries = new Map();
    
    if (phpSuccess && fs.existsSync(tempPhpPotFile)) {
        phpEntries = parsePhpPotFile(tempPhpPotFile);
        console.log(`📊 PHP translations: ${phpEntries.size}`);
        
        // Clean up temp file
        fs.unlinkSync(tempPhpPotFile);
    } else {
        console.log('⚠️  No PHP translations found');
    }
    
    // Extract JavaScript translations
    const { translations: jsTranslations, locations: jsLocations } = extractJSTranslations();
    
    // Generate .pot content
    const potContent = generatePotContent(jsTranslations, jsLocations, phpEntries);
    
    // Write .pot file
    fs.writeFileSync(potFile, potContent, 'utf8');
    
    console.log(`\n✅ .pot file generated successfully!`);
    console.log(`   📊 PHP translations: ${phpEntries.size}`);
    console.log(`   📊 JavaScript translations: ${jsTranslations.size}`);
    console.log(`   💾 Saved to: ${path.relative(pluginDir, potFile)}`);
    
    return phpEntries.size + jsTranslations.size;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    generatePotFile();
}

export { generatePotFile };

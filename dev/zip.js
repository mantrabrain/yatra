const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// Get the absolute path of the current working directory
const packageDir = process.cwd();
const zipFileName = `${path.basename(packageDir)}.zip`;
const zipFilePath = path.join(packageDir, zipFileName);

// Remove existing zip file if it exists
if (fs.existsSync(zipFilePath)) {
  fs.unlinkSync(zipFilePath);
  console.log(`Removed existing zip file: ${zipFilePath}`);
}

const output = fs.createWriteStream(zipFilePath);

const archive = archiver('zip', {
  zlib: { level: 9 } // Compression level
});

output.on('close', function() {
  console.log(archive.pointer() + ' total bytes');
  console.log('Archiver has been finalized and the output file descriptor has closed.');
});

archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn(err);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  throw err;
});

archive.pipe(output);

// Read and parse the .gitattributes file to ignore specified files and directories
let gitattributes = [];
try {
  gitattributes = fs.readFileSync(path.join(packageDir, '.gitattributes'), 'utf-8')
    .split('\n')
    .filter(line => line.includes('export-ignore'))
    .map(line => line.split(' ')[0].replace(/^\//, '')); // Remove leading slash for matching
} catch (err) {
  console.warn('.gitattributes file not found or could not be read.');
}

// Function to check if a file should be ignored
const shouldIgnore = (filePath) => {
  const relativePath = path.relative(packageDir, filePath);
  return gitattributes.some(pattern => {
    return new RegExp(pattern.replace('*', '.*')).test(relativePath);
  });
};

// Recursively add files and directories to the archive, excluding those in .gitattributes
const addFilesAndDirectories = (dir, basePath = '') => {
  if (!fs.existsSync(dir)) {
    console.error(`Directory not found: ${dir}`);
    return;
  }

  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const relativePath = path.join(basePath, file);

    if (shouldIgnore(fullPath)) {
      console.log(`Ignoring ${relativePath}`);
      return;
    }

    if (fs.statSync(fullPath).isDirectory()) {
      archive.directory(fullPath, relativePath);
      addFilesAndDirectories(fullPath, relativePath);
    } else {
      archive.file(fullPath, { name: relativePath });
    }
  });
};

addFilesAndDirectories(packageDir);

archive.finalize();
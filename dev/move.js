const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');

// Load package.json
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const destinationDir = packageJson.build && packageJson.build.destinationDir;

if (!destinationDir) {
  console.error('Destination directory not specified in package.json');
  process.exit(1);
}

// Resolve the destination directory relative to the package.json directory
const resolvedDestinationDir = path.resolve(path.dirname(packageJsonPath), destinationDir);

const zipFileName = `${path.basename(process.cwd())}.zip`;
const zipFilePath = path.join(process.cwd(), zipFileName);

// Directory where the zip file will be extracted
const extractionDir = path.join(resolvedDestinationDir, path.basename(zipFileName, '.zip'));

// Function to delete a folder if it exists
const deleteFolderIfExists = (folderPath) => {
  if (fs.existsSync(folderPath)) {
    fs.rmSync(folderPath, { recursive: true, force: true });
    console.log(`Deleted existing folder: ${folderPath}`);
  }
};

// Function to extract the zip file to a new directory
const extractZipFile = () => {
  if (!fs.existsSync(zipFilePath)) {
    console.error(`Zip file not found: ${zipFilePath}`);
    process.exit(1);
  }

  // Ensure the destination directory exists
  if (!fs.existsSync(resolvedDestinationDir)) {
    console.log(`Creating destination directory: ${resolvedDestinationDir}`);
    fs.mkdirSync(resolvedDestinationDir, { recursive: true });
  }

  // Delete the extraction directory if it already exists
  deleteFolderIfExists(extractionDir);

  // Create the extraction directory
  fs.mkdirSync(extractionDir);
  console.log(`Created extraction directory: ${extractionDir}`);

  // Extract the zip file into the new directory
  fs.createReadStream(zipFilePath)
    .pipe(unzipper.Extract({ path: extractionDir }))
    .on('close', () => {
      console.log(`Extracted zip file to: ${extractionDir}`);
    })
    .on('error', (err) => {
      console.error(`Error extracting zip file: ${err}`);
      process.exit(1);
    });
};

// Execute the extraction
extractZipFile();
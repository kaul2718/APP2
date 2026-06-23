const fs = require('fs');
const path = require('path');

const directoryToScan = path.join(__dirname, '..', 'src');

function getFiles(dir, files = []) {
  const fileList = fs.readdirSync(dir);
  for (const file of fileList) {
    const name = path.join(dir, file);
    if (fs.statSync(name).isDirectory()) {
      getFiles(name, files);
    } else if (name.endsWith('.tsx') || name.endsWith('.ts') || name.endsWith('.jsx') || name.endsWith('.js')) {
      files.push(name);
    }
  }
  return files;
}

const files = getFiles(directoryToScan);
console.log(`Scanning ${files.length} files...`);

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  if (!content.includes('<button')) continue;

  // Simple regex to match buttons
  // Note: this is a simple parser, might have false positives or negatives, but it's very helpful.
  const buttonRegex = /<button([^>]*?)>([\s\S]*?)<\/button>/g;
  let match;
  while ((match = buttonRegex.exec(content)) !== null) {
    const attributes = match[1];
    const innerHtml = match[2].trim();

    // Check if it has text or aria-label or aria-labelledby or title
    const hasAriaLabel = attributes.includes('aria-label') || attributes.includes('aria-labelledby');
    const hasTitle = attributes.includes('title');
    
    // Check if innerHtml has actual text (not just tags/whitespace/curly brackets)
    // Strip HTML tags and template expressions
    const plainText = innerHtml.replace(/<[^>]+>/g, '').replace(/\{[^}]+\}/g, '').trim();

    if (!hasAriaLabel && !hasTitle && plainText.length === 0) {
      // Find line number
      const index = match.index;
      const linesUpToMatch = content.substring(0, index).split('\n');
      const lineNumber = linesUpToMatch.length;
      console.log(`Empty button found in ${path.relative(directoryToScan, file)} at line ${lineNumber}`);
      console.log(`Code: <button${attributes}>${innerHtml.substring(0, 100)}</button>\n`);
    }
  }
}

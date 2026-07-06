const fs = require("fs");
const path = require("path");

function checkDir(dir) {
  let issues = [];
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    const fullPath = path.join(dir, f.name);
    if (f.isDirectory()) {
      issues = issues.concat(checkDir(fullPath));
    } else if (f.name.match(/\.(jsx?|tsx?)$/)) {
      const content = fs.readFileSync(fullPath, "utf8");
      const importRegex = /import\s+.*?from\s+[\x27\x22](\.[^\x27\x22]+)[\x27\x22]/g;
      let match;
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        let targetPath = path.resolve(dir, importPath);
        
        const exts = ["", ".js", ".jsx", ".ts", ".tsx", "/index.js", "/index.jsx"];
        for (const ext of exts) {
          if (fs.existsSync(targetPath + ext)) {
            const parsedTarget = path.parse(targetPath + ext);
            try {
              const actualFiles = fs.readdirSync(parsedTarget.dir);
              if (!actualFiles.includes(parsedTarget.base)) {
                 const actual = actualFiles.find(af => af.toLowerCase() === parsedTarget.base.toLowerCase());
                 if (actual) {
                   issues.push({
                     file: fullPath,
                     importStr: importPath,
                     expected: parsedTarget.base,
                     actual: actual
                   });
                 }
              }
            } catch(e) {}
          }
        }
      }
    }
  }
  return issues;
}

const res = checkDir("./src");
console.log(JSON.stringify(res, null, 2));

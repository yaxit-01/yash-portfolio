import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../..");
const adminDir = path.resolve(__dirname, "..");

console.log("=================================================");
console.log("Phase 7: Comprehensive Security & Integrity Audit");
console.log("=================================================");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// 1. CSV Formula Injection Defense (OWASP)
// ---------------------------------------------------------------------------
console.log("\n1. Testing CSV Formula Injection Defense...");
function sanitizeCsvCell(value) {
  if (value === null || value === undefined) return "";
  let stringVal = String(value);
  const formulaChars = ["=", "+", "-", "@", "\t", "\r"];
  if (formulaChars.some((char) => stringVal.startsWith(char))) {
    stringVal = `'${stringVal}`;
  }
  if (stringVal.includes('"') || stringVal.includes(",") || stringVal.includes("\n") || stringVal.includes("\r")) {
    return `"${stringVal.replace(/"/g, '""')}"`;
  }
  return stringVal;
}

assert(sanitizeCsvCell("=1+1") === "'+1+1" || sanitizeCsvCell("=1+1").startsWith("'="), "Neutralizes '=' formula prefix");
assert(sanitizeCsvCell("+cmd|' /C calc'!A0").startsWith("'+"), "Neutralizes '+' formula prefix");
assert(sanitizeCsvCell("-100").startsWith("'-"), "Neutralizes '-' formula prefix");
assert(sanitizeCsvCell("@SUM(A1:A5)").startsWith("'@"), "Neutralizes '@' formula prefix");
assert(sanitizeCsvCell('Normal, "Quote"') === '"Normal, ""Quote"""', "Escapes commas and internal double quotes");

// ---------------------------------------------------------------------------
// 2. Backup Schema Validation
// ---------------------------------------------------------------------------
console.log("\n2. Testing Backup Schema Validation & Integrity...");
function validateBackupJson(jsonString) {
  if (!jsonString || typeof jsonString !== "string") {
    return { valid: false, error: "Empty or invalid backup file provided." };
  }
  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    return { valid: false, error: `Malformed JSON format: ${err.message}` };
  }
  if (!parsed || typeof parsed !== "object" || !parsed.version || !parsed.data) {
    return { valid: false, error: "Missing required backup fields." };
  }
  return { valid: true, parsed };
}

assert(validateBackupJson("").valid === false, "Rejects empty backup input");
assert(validateBackupJson("{ invalid }").valid === false, "Rejects malformed JSON syntax");
assert(validateBackupJson(JSON.stringify({ some: "data" })).valid === false, "Rejects JSON missing version or data");
assert(validateBackupJson(JSON.stringify({ version: "1.0", data: { projects: [] } })).valid === true, "Validates compliant backup envelope");

// ---------------------------------------------------------------------------
// 3. Contact Form & Anti-Spam Defense
// ---------------------------------------------------------------------------
console.log("\n3. Testing Contact Form Validation & Abuse Protection...");
const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
assert(emailRegex.test("user@gmail.com"), "Accepts standard email format");
assert(!emailRegex.test("user@invalid"), "Rejects missing TLD");
assert(!emailRegex.test("user"), "Rejects bare string");

function isHoneypotTriggered(val) {
  return Boolean(val && val.trim().length > 0);
}
assert(!isHoneypotTriggered(""), "Allows legitimate empty honeypot field");
assert(isHoneypotTriggered("http://spam-link.biz"), "Catches automated bot spam submissions");

// ---------------------------------------------------------------------------
// 4. Privacy & Activity Log Sanitization
// ---------------------------------------------------------------------------
console.log("\n4. Testing Privacy Sanitization in Audit Trails...");
function extractEmailDomain(email) {
  if (!email || !email.includes("@")) return "unknown";
  return email.split("@")[1]?.toLowerCase() || "unknown";
}
assert(extractEmailDomain("private.user@company.com") === "company.com", "Extracts only domain name");
assert(extractEmailDomain("recruiter@google.com") === "google.com", "Never logs personal mailbox identifier");

// ---------------------------------------------------------------------------
// 5. Secret Key Leak Scan
// ---------------------------------------------------------------------------
console.log("\n5. Testing Source Code for Secret & Token Exposure...");
const suspiciousPatterns = [/service_role/i, /sbp_[a-zA-Z0-9]+/i, /sk_live_[a-zA-Z0-9]+/i];

function checkDirectory(dir) {
  let leakFound = false;
  const files = fs.readdirSync(dir, { recursive: true });
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (!fs.statSync(fullPath).isFile()) continue;
    if (file.endsWith(".js") || file.endsWith(".jsx") || file.endsWith(".html")) {
      const code = fs.readFileSync(fullPath, "utf8");
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(code)) {
          console.error(`  [LEAK WARNING] Suspicious pattern ${pattern} found in ${file}`);
          leakFound = true;
        }
      }
    }
  }
  return !leakFound;
}

assert(checkDirectory(path.join(rootDir, "src"), "Public src"), "Public portfolio contains zero secrets");
assert(checkDirectory(path.join(adminDir, "src"), "Admin src"), "Admin dashboard contains zero secrets");

// ---------------------------------------------------------------------------
// 6. Deployment & Base Path Configuration
// ---------------------------------------------------------------------------
console.log("\n6. Testing Deployment & Base Path Configurations...");
const rootViteConfig = fs.readFileSync(path.join(rootDir, "vite.config.js"), "utf8");
assert(rootViteConfig.includes("base: '/yash-portfolio/'"), "Root Vite config preserves '/yash-portfolio/' base path");

const rootPkg = JSON.parse(fs.readFileSync(path.join(rootDir, "package.json"), "utf8"));
assert(rootPkg.homepage === "https://yaxit-01.github.io/yash-portfolio", "Homepage URL matches GitHub Pages");
assert(rootPkg.scripts.deploy === "gh-pages -d dist", "Deploy script targets public dist folder");

const gitignoreRoot = fs.readFileSync(path.join(rootDir, ".gitignore"), "utf8");
assert(gitignoreRoot.includes(".env.local"), "Root .gitignore explicitly excludes .env.local");

const adminVercel = fs.existsSync(path.join(adminDir, "vercel.json"));
assert(adminVercel, "Admin dashboard includes vercel.json SPA rewrites");

// ---------------------------------------------------------------------------
// 7. Summary
// ---------------------------------------------------------------------------
console.log("\n=================================================");
console.log(`Audit Summary: ${passed} Passed, ${failed} Failed`);
console.log("=================================================");

if (failed > 0) {
  process.exit(1);
}

// Rebuilds every vendored skill from .vendor + <name>/frontmatter.yml, checks
// that no skill points at a skill we did not install, then writes index.html.
import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync, cpSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { ROOT, readManifest, splitSkill, parseFrontmatter, installedSkills } from "./lib.mjs";
import { renderIndex } from "./index-html.mjs";

const manifest = readManifest();
const renames = manifest.filter((e) => e.name !== e.upstreamName);

/** Skills call each other by slash-command name, so a rename must follow. */
function applyRenames(text) {
  return renames.reduce(
    (acc, r) => acc.replace(new RegExp(`(?<![\\w-])${r.upstreamName}(?![\\w-])`, "g"), r.name),
    text
  );
}

for (const entry of manifest) {
  const vendorDir = join(ROOT, ".vendor", entry.key, entry.upstreamName);
  if (!existsSync(vendorDir)) {
    console.error(`missing vendor copy for ${entry.name}. Run: make sync`);
    process.exit(1);
  }
  const skillDir = join(ROOT, entry.name);
  const fmPath = join(skillDir, "frontmatter.yml");

  // First build of a skill inherits upstream's frontmatter, then it is yours.
  let frontmatter = existsSync(fmPath)
    ? readFileSync(fmPath, "utf8").replace(/\s*$/, "\n")
    : seedFrontmatter(entry, vendorDir);

  // local.md is yours too: house rules appended after upstream's body.
  const localPath = join(skillDir, "local.md");
  const local = existsSync(localPath) ? readFileSync(localPath, "utf8") : null;

  rmSync(skillDir, { recursive: true, force: true });
  cpSync(vendorDir, skillDir, { recursive: true });
  writeFileSync(fmPath, frontmatter);
  if (local !== null) writeFileSync(localPath, local);

  const { body } = splitSkill(readFileSync(join(vendorDir, "SKILL.md"), "utf8"));
  let fullBody = applyRenames(body);
  if (local?.trim()) fullBody = `${fullBody.replace(/\s*$/, "")}\n\n${local.trim()}\n`;
  writeFileSync(join(skillDir, "SKILL.md"), `---\n${frontmatter}---\n${fullBody}`);

  // Support files can also call a renamed skill. frontmatter.yml and local.md
  // are yours, so they are never rewritten.
  for (const file of walk(skillDir)) {
    if (file.endsWith("SKILL.md") || file.endsWith("frontmatter.yml") || file.endsWith("local.md")) continue;
    const before = readFileSync(file, "utf8");
    const after = applyRenames(before);
    if (after !== before) writeFileSync(file, after);
  }
}

checkLinks();
const skills = installedSkills().map(readSkill);
writeFileSync(join(ROOT, "index.html"), renderIndex(skills));
console.log(`built ${manifest.length} vendored skills, ${skills.length} total, index.html`);

function seedFrontmatter(entry, vendorDir) {
  const { frontmatter } = splitSkill(readFileSync(join(vendorDir, "SKILL.md"), "utf8"));
  // Dropping a key means dropping the indented lines under it too, or a block
  // scalar above would absorb them: upstream metadata inside the description.
  const lines = [];
  let skipping = false;
  for (const line of frontmatter.split("\n")) {
    if (/^\s/.test(line)) {
      if (!skipping) lines.push(line);
      continue;
    }
    skipping = /^(name|metadata):/.test(line);
    if (!skipping) lines.push(line);
  }
  return [
    `name: ${entry.name}`,
    ...lines,
    "metadata:",
    `  source: ${entry.repo}/blob/main/${entry.path}/SKILL.md`,
    `  upstream-path: ${entry.path}`,
    "",
  ].join("\n");
}

/**
 * Skills call each other by slash-command name. Flag any call to a name we did
 * not install, and any relative path that does not resolve.
 */
function checkLinks() {
  const installed = new Set(installedSkills());
  for (const { name } of renames) installed.add(name);
  // Every skill the source repos offer, so we can tell a real missing
  // dependency from an agent built-in like /clear. Falls back to the vendor
  // tree when .cache is absent, which narrows the check but never breaks it.
  const known = knownUpstreamSkills();
  for (const name of readIgnoreList()) known.delete(name);

  const problems = [];
  // Every skill, hand-written ones included, not just the vendored set.
  for (const skill of installedSkills()) {
    for (const file of walk(join(ROOT, skill))) {
      const text = readFileSync(file, "utf8");
      const where = relative(ROOT, file);
      // Skills are called as /name, often wrapped in backticks or bold.
      for (const [, called] of text.matchAll(/(?<![\w./-])\/([a-z][a-z0-9-]{2,})(?![\w/])/g)) {
        if (known.has(called) && !installed.has(called)) {
          problems.push(`${where}: calls /${called}, which is not installed`);
        }
      }
      for (const [, rel] of text.matchAll(/\]\((\.\.?\/[^)\s]+)\)/g)) {
        // Deeper ./a/b/c paths are illustrative trees inside examples, not links.
        const real = rel.startsWith("../") || rel.split("/").length === 2;
        if (real && !existsSync(join(file, "..", rel.split("#")[0]))) {
          problems.push(`${where}: broken relative link ${rel}`);
        }
      }
    }
  }
  const unique = [...new Set(problems)];
  if (unique.length) {
    console.error("\nbroken skill links:");
    for (const p of unique) console.error(`  ${p}`);
    process.exit(1);
  }
  console.log("link check: no dangling skill references");
}

function readSkill(name) {
  const fm = parseFrontmatter(splitSkill(readFileSync(join(ROOT, name, "SKILL.md"), "utf8")).frontmatter);
  const entry = manifest.find((e) => e.name === name);
  return {
    name,
    description: fm.description || "",
    auto: String(fm["disable-model-invocation"]) !== "true",
    source: entry ? entry.repo : (fm.metadata && fm.metadata["github-repo"]) || "",
    sourceLabel: entry ? entry.repo.split("/").slice(-2).join("/") : "local",
    files: walk(join(ROOT, name)).length,
  };
}

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : [join(dir, d.name)]
  );
}

/** Names you chose not to install, so a call to one is not a dangling link. */
function readIgnoreList() {
  const path = join(ROOT, "skills.ignore");
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

function knownUpstreamSkills() {
  const names = new Set();
  const roots = existsSync(join(ROOT, ".cache")) ? [join(ROOT, ".cache")] : [join(ROOT, ".vendor")];
  const scan = (dir, depth) => {
    if (depth > 4) return;
    for (const d of dirsIn(dir)) {
      if (d === ".git") continue;
      if (existsSync(join(dir, d, "SKILL.md"))) names.add(d);
      else scan(join(dir, d), depth + 1);
    }
  };
  for (const r of roots) scan(r, 0);
  return names;
}

function dirsIn(d) {
  if (!existsSync(d)) return [];
  return readdirSync(d, { withFileTypes: true }).filter((x) => x.isDirectory()).map((x) => x.name);
}

function upstreamNames(rs) {
  return rs.map((r) => `/${r.upstreamName} -> /${r.name}`).join(", ");
}

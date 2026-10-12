import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

export const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

/** Manifest rows: local name, source repo, path to the skill inside that repo. */
export function readManifest() {
  return readFileSync(join(ROOT, "skills.manifest"), "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      const [name, repo, path] = l.split("\t");
      return { name, repo, path, upstreamName: path.split("/").pop(), key: repoKey(repo) };
    });
}

export const repoKey = (url) => url.replace(/\/$/, "").split("/").slice(-2).join("-");

/** Split a SKILL.md into its raw frontmatter text and body. */
export function splitSkill(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { frontmatter: "", body: text };
  return { frontmatter: m[1], body: text.slice(m[0].length) };
}

/**
 * Enough YAML for skill frontmatter: scalars, `>-`/`|` block scalars, and one
 * level of nesting. Deliberately not a general parser.
 */
export function parseFrontmatter(raw) {
  const out = {};
  const lines = raw.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!m) continue;
    const [, key, rest] = m;
    if (rest === ">" || rest === ">-" || rest === "|" || rest === "|-") {
      const block = [];
      while (i + 1 < lines.length && (lines[i + 1].trim() === "" || /^\s+/.test(lines[i + 1]))) {
        block.push(lines[++i].trim());
      }
      out[key] = rest.startsWith(">") ? block.join(" ").trim() : block.join("\n").trim();
    } else if (rest === "") {
      const nested = {};
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) {
        const n = lines[++i].trim().match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
        if (n) nested[n[1]] = unquote(n[2]);
      }
      out[key] = Object.keys(nested).length ? nested : "";
    } else {
      out[key] = unquote(rest);
    }
  }
  return out;
}

const unquote = (s) => s.replace(/^["'](.*)["']$/, "$1").trim();

/** Every directory at the repo root that holds a SKILL.md. */
export function installedSkills() {
  return readdirSync(ROOT, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "scripts")
    .map((d) => d.name)
    .filter((n) => existsSync(join(ROOT, n, "SKILL.md")))
    .sort();
}

// Contract test: api/openapi/openapi.yaml must match the implemented route handlers.
// Every documented path has a route.ts exporting exactly the documented methods,
// and every implemented /api route is documented. Static file checks only.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const apiDir = join(webRoot, "src", "app", "api");
const specPath = join(webRoot, "..", "api", "openapi", "openapi.yaml");

const HTTP_METHODS = ["get", "post", "put", "patch", "delete", "head", "options"] as const;

// Legacy placeholder from the original template (returns "Hello, world!"). Not part
// of the public contract; candidate for removal.
const UNDOCUMENTED_ALLOWED = new Set(["/api"]);

type Spec = {
  openapi: string;
  paths: Record<string, Partial<Record<(typeof HTTP_METHODS)[number], { security?: unknown[] }>>>;
};

const spec = parse(readFileSync(specPath, "utf8")) as Spec;

function routeFileFor(path: string): string {
  const segments = path
    .replace(/^\/api/, "")
    .split("/")
    .filter(Boolean)
    .map((s) => s.replace(/^\{(.+)\}$/, "[$1]"));
  return join(apiDir, ...segments, "route.ts");
}

function exportedMethods(file: string): string[] {
  const source = readFileSync(file, "utf8");
  const found = new Set<string>();
  for (const m of source.matchAll(/export\s+(?:const|async\s+function|function)\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/g)) {
    found.add(m[1].toLowerCase());
  }
  return [...found].sort();
}

function implementedPaths(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...implementedPaths(full));
    else if (entry.name === "route.ts") {
      const rel = relative(apiDir, dirname(full)).split(sep).filter(Boolean);
      out.push("/api" + rel.map((s) => "/" + s.replace(/^\[(.+)\]$/, "{$1}")).join(""));
    }
  }
  return out.sort();
}

describe("OpenAPI contract (static)", () => {
  it("is an OpenAPI 3.1 document with paths", () => {
    expect(spec.openapi).toMatch(/^3\.1\./);
    expect(Object.keys(spec.paths).length).toBeGreaterThan(0);
  });

  it.each(Object.keys(spec.paths))("documented %s has a route.ts exporting exactly its methods", (path) => {
    const file = routeFileFor(path);
    expect(existsSync(file), `missing ${relative(webRoot, file)}`).toBe(true);
    const documented = HTTP_METHODS.filter((m) => spec.paths[path][m]).sort();
    expect(exportedMethods(file)).toEqual(documented);
  });

  it("every implemented /api route is documented", () => {
    const undocumented = implementedPaths(apiDir).filter(
      (p) => !(p in spec.paths) && !UNDOCUMENTED_ALLOWED.has(p)
    );
    expect(undocumented).toEqual([]);
  });

  it("public directory operations declare no security; private ones require it", () => {
    for (const [path, ops] of Object.entries(spec.paths)) {
      for (const method of HTTP_METHODS) {
        const op = ops[method];
        if (!op) continue;
        const isPublic = /^\/api\/(facilities|practitioners)\b/.test(path);
        if (isPublic) expect(op.security, `${method} ${path}`).toEqual([]);
        else expect(op.security, `${method} ${path}`).toBeUndefined(); // inherits global security
      }
    }
  });
});

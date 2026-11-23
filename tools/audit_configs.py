"""Read-only syntax and namespace triage; namespace absence is not proof of an invalid ID."""
from collections import Counter, defaultdict
import json
from pathlib import Path
import re
import tomllib

ROOT = Path(__file__).resolve().parents[1]
report = json.loads((ROOT / "docs/audit/mods-audit.json").read_text(encoding="utf-8"))
namespaces = {m["mod_id"] for a in report["archives"] for m in a["mods"]}
namespaces |= {"minecraft", "forge", "c", "fabric", "kubejs"}
roots = [ROOT / name for name in ["config", "defaultconfigs", "datapacks", "moonlight-global-datapacks", "data", "kubejs"]]
for root in roots:
    if root.exists():
        for data in root.rglob("data"):
            if data.is_dir():
                namespaces.update(p.name for p in data.iterdir() if p.is_dir())
counts, failures, unparsed = Counter(), [], Counter()
unknown = defaultdict(lambda: {"count": 0, "examples": []})
identifier = re.compile(r"^#?([a-z0-9_.-]+):([a-z0-9_/.*-]+)$")


def inspect(value, file):
    if isinstance(value, dict):
        for child in value.values():
            inspect(child, file)
    elif isinstance(value, list):
        for child in value:
            inspect(child, file)
    elif isinstance(value, str):
        match = identifier.fullmatch(value)
        if match and match[1] not in namespaces:
            entry = unknown[match[1]]
            entry["count"] += 1
            if len(entry["examples"]) < 12:
                entry["examples"].append({"file": file, "id": value})


for root in roots:
    if not root.exists():
        continue
    for file in root.rglob("*"):
        if not file.is_file():
            continue
        suffix = file.suffix.lower()
        if suffix not in {".json", ".toml", ".json5", ".snbt", ".js", ".zs", ".mcfunction"}:
            continue
        counts[suffix] += 1
        relative = file.relative_to(ROOT).as_posix()
        if suffix not in {".json", ".toml"}:
            unparsed[suffix] += 1
            continue
        try:
            text = file.read_text(encoding="utf-8-sig")
            data = json.loads(text) if suffix == ".json" else tomllib.loads(text)
            inspect(data, relative)
        except Exception as exc:
            failures.append({"file": relative, "error": str(exc),
                             "strict_datapack_json": suffix == ".json" and "/data/" in relative})
output = {"file_counts": dict(counts), "parse_findings": failures,
          "not_parsed_formats": dict(unparsed), "unknown_namespace_candidates": dict(sorted(unknown.items())),
          "limitations": "No content registry validation, JSON5/SNBT/schema validation, script execution or world simulation. Custom namespaces and optional tags can be valid without a matching mod ID."}
(ROOT / "docs/audit/configs-audit.json").write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
print(json.dumps({"file_counts": dict(counts), "parse_findings": len(failures), "unknown_namespaces": list(sorted(unknown))}))

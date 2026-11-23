"""Inventory installed archives, including bundled modules (Python 3.11+).

This is a static candidate inventory, not Forge's resolved runtime mod list.
Bundled versions may be deduplicated by JarJar. No archive is changed/deleted.
"""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
import re
import tomllib
import zipfile
from collections import defaultdict

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "audit"
FIELDS = "mod_id mod_name mod_version mod_file mod_url display_url issue_tracker_url".split()


def manifest(raw):
    result, key = {}, None
    for line in raw.decode("utf-8", errors="replace").splitlines():
        if line.startswith(" ") and key:
            result[key] += line[1:]
        elif ": " in line:
            key, value = line.split(": ", 1)
            result[key] = value
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write-inventory", action="store_true")
    parser.add_argument("--reuse-scan", action="store_true", help="Reuse byte-identical archives from last report")
    parser.add_argument("--baseline", type=Path, help="Compare with a saved inventory instead of current modlist.txt")
    args = parser.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    rows, archives, failures, generators = [], [], [], []

    def scan(blob, source, top, depth=0):
        if depth > 12:
            raise ValueError("Archive nesting exceeds 12")
        try:
            with zipfile.ZipFile(io.BytesIO(blob)) as jar:
                names = set(jar.namelist())
                bad = jar.testzip()
                if bad:
                    raise ValueError("Bad CRC: " + bad)
                mf = manifest(jar.read("META-INF/MANIFEST.MF")) if "META-INF/MANIFEST.MF" in names else {}
                record = dict(source=source, top=top, depth=depth, sha256=hashlib.sha256(blob).hexdigest(),
                              manifest=mf, mods=[], dependencies={}, fabric=None)
                archives.append(record)
                forge = "META-INF/mods.toml"
                if forge not in names and "META-INF/neoforge.mods.toml" in names:
                    forge = "META-INF/neoforge.mods.toml"
                if forge in names:
                    data = tomllib.loads(jar.read(forge).decode("utf-8-sig"))
                    record.update(loader=data.get("modLoader"), loader_range=data.get("loaderVersion"),
                                  dependencies=data.get("dependencies", {}), metadata=forge)
                    for mod in data.get("mods", []):
                        version = str(mod.get("version", ""))
                        version = version.replace("${file.jarVersion}", mf.get("Implementation-Version", "${file.jarVersion}"))
                        item = dict(mod_id=mod["modId"], mod_name=mod.get("displayName", mod["modId"]),
                                    mod_version=version, mod_file=source, mod_url="",
                                    display_url=mod.get("displayURL", ""), issue_tracker_url=data.get("issueTrackerURL", ""))
                        rows.append(item)
                        record["mods"].append(item)
                elif "fabric.mod.json" in names:
                    data = json.loads(jar.read("fabric.mod.json"))
                    record["fabric"] = data
                    item = dict(mod_id=data["id"], mod_name=data.get("name", data["id"]),
                                mod_version=str(data["version"]), mod_file=source, mod_url="",
                                display_url=data.get("contact", {}).get("homepage", ""),
                                issue_tracker_url=data.get("contact", {}).get("issues", ""))
                    rows.append(item)
                    record["mods"].append(item)
                # Forge metadata is authoritative for dual-loader archives.
                nested = set()
                if mf.get("Embedded-Dependencies-Mod"):
                    nested.add(mf["Embedded-Dependencies-Mod"])
                if "META-INF/jarjar/metadata.json" in names:
                    metadata = json.loads(jar.read("META-INF/jarjar/metadata.json"))
                    record["jarjar"] = metadata
                    nested.update(item["path"] for item in metadata.get("jars", []))
                if "fabric.mod.json" in names:
                    fabric = json.loads(jar.read("fabric.mod.json"))
                    nested.update(item["file"] for item in fabric.get("jars", []))
                for path in sorted(nested):
                    if path not in names:
                        failures.append(dict(source=source, error="Missing embedded archive " + path))
                    else:
                        scan(jar.read(path), source + "!/" + path, top, depth + 1)
                # Search likely exporter implementations, not every texture/model.
                for name in names:
                    if name.endswith(".class") and re.search(r"modlist|export|inventory", name, re.I):
                        contents = jar.read(name)
                        if b"modlist.txt" in contents or b"mod_id,mod_name" in contents:
                            generators.append(dict(source=source, class_name=name))
        except Exception as exc:
            failures.append(dict(source=source, error=repr(exc)))

    cached = {}
    cached_exporters = []
    if args.reuse_scan and (OUT / "mods-audit.json").exists():
        previous = json.loads((OUT / "mods-audit.json").read_text(encoding="utf-8"))
        for archive in previous["archives"]:
            cached.setdefault(archive["top"], []).append(archive)
        cached_exporters = previous.get("exporter_candidates", [])
    files = sorted((ROOT / "mods").glob("*.jar"), key=lambda p: p.name.casefold())
    for file in files:
        blob = file.read_bytes()
        group = cached.get(file.name, [])
        top = next((a for a in group if a["depth"] == 0), None)
        if top and top["sha256"] == hashlib.sha256(blob).hexdigest() and file.name != "Connector-1.0.0-beta.49+1.20.1.jar":
            archives.extend(group)
            rows.extend(row for archive in group for row in archive["mods"])
            generators.extend(g for g in cached_exporters if g["source"].split("!/")[0] == file.name)
        else:
            scan(blob, file.name, file.name)
    rows.sort(key=lambda row: (row["mod_id"], row["mod_file"], row["mod_version"]))
    old = list(csv.DictReader((args.baseline or ROOT / "modlist.txt").open(encoding="utf-8-sig", newline="")))
    by_id = defaultdict(list)
    for row in rows:
        by_id[row["mod_id"]].append(row)
    old_ids = {r["mod_id"] for r in old}
    top_names = {p.name for p in files}
    archive_sources = {a["source"] for a in archives}
    nested_basenames = {a["source"].split("!/")[-1].split("/")[-1] for a in archives if a["depth"]}
    missing_files, changed = [], []
    for item in old:
        if item["mod_file"] not in archive_sources and item["mod_file"] not in top_names and item["mod_file"] not in nested_basenames:
            missing_files.append(item)
        current = by_id.get(item["mod_id"], [])
        if current and not any(r["mod_version"] == item["mod_version"] for r in current):
            changed.append(dict(previous=item, current=current))
    report = dict(top_level_jars=len(files), archives_scanned=len(archives), module_candidates=len(rows),
                  malformed_old_csv_rows=[r for r in old if None in r],
                  failures=failures, exporter_candidates=generators,
                  old_inventory_rows=len(old), old_file_not_found=missing_files, version_changes=changed,
                  new_mod_ids=[r for r in rows if r["mod_id"] not in old_ids],
                  no_longer_declared=[r for r in old if r["mod_id"] not in by_id],
                  duplicate_top_level_ids={key: [r for r in value if "!/" not in r["mod_file"]]
                                           for key, value in by_id.items()
                                           if sum("!/" not in r["mod_file"] for r in value) > 1},
                  bundled_candidate_duplicates={key: value for key, value in by_id.items() if len(value) > 1},
                  archives=archives)
    (OUT / "mods-audit.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    with (OUT / "jars-installed.csv").open("w", encoding="utf-8", newline="") as stream:
        writer = csv.DictWriter(stream, fieldnames=["jar", "bytes", "sha256", "declared_mod_ids", "fml_mod_type"])
        writer.writeheader()
        for file in files:
            top = next(a for a in archives if a["source"] == file.name)
            writer.writerow(dict(jar=file.name, bytes=file.stat().st_size, sha256=top["sha256"],
                                 declared_mod_ids=";".join(m["mod_id"] for m in top["mods"]),
                                 fml_mod_type=top["manifest"].get("FMLModType", "")))
    for filename, entries in [("mods-installed.csv", rows), ("inventory-missing-files.csv", missing_files)]:
        with (OUT / filename).open("w", encoding="utf-8", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=FIELDS, extrasaction="ignore")
            writer.writeheader()
            writer.writerows(entries)
    if args.write_inventory:
        if failures:
            raise SystemExit("Refusing inventory replacement: archive/metadata errors must be reviewed")
        backup = ROOT / "custom_mods/awakening-compat/build/audit/modlist-before-refresh.txt"
        backup.parent.mkdir(parents=True, exist_ok=True)
        if not backup.exists():
            backup.write_bytes((ROOT / "modlist.txt").read_bytes())
        (ROOT / "modlist.txt").write_bytes((OUT / "mods-installed.csv").read_bytes())
        width = max(len(p.name) for p in files) + 2
        physical = [f"{'Name':<{width}}Length", f"{'----':<{width}}------"]
        physical.extend(f"{p.name:<{width}}{p.stat().st_size}" for p in files)
        (ROOT / "mods-instalados.txt").write_text("\n".join(physical) + "\n", encoding="utf-8")
    print(json.dumps({key: len(value) if isinstance(value, (list, dict)) else value for key, value in report.items() if key != "archives"}, indent=2))


if __name__ == "__main__":
    main()

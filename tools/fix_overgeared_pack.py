"""Fix three confirmed typos without changing recipe progression or other ZIP entries."""
import json
from pathlib import Path
import shutil
import zipfile

ROOT = Path(__file__).resolve().parents[1]
pack = ROOT / "config/paxi/datapacks/OvergearedRecipes_v1.2.3_mc1.20.1.zip"
backup = ROOT / "custom_mods/awakening-compat/build/runtime-fixes/OvergearedRecipes-before-typos.zip"
backup.parent.mkdir(parents=True, exist_ok=True)
registry = json.loads((ROOT / "kubejs/awakening_item_registry.json").read_text(encoding="utf-8-sig"))
items = {item["id"] for item in registry["items"]}
changes = {}
with zipfile.ZipFile(pack) as jar:
    for name in ["copper_spear", "copper_halberd"]:
        path = f"data/spartanweaponry/recipes/{name}.json"
        data = json.loads(jar.read(path))
        ingredient = data["key"]["h"]
        assert ingredient.get("rag", ingredient.get("tag")) == "spartanweaponry:poles"
        ingredient["tag"] = ingredient.pop("rag", "spartanweaponry:poles")
        if name == "copper_halberd":
            assert data["result"]["item"] in {"spartanweaponry:copper_halber", "spartanweaponry:copper_halberd"}
            data["result"]["item"] = "spartanweaponry:copper_halberd"
        assert data["result"]["item"] in items
        assert data["key"]["i"]["item"] in items
        changes[path] = (json.dumps(data, indent=2) + "\n").encode()
if not backup.exists():
    shutil.copy2(pack, backup)
temporary = pack.with_suffix(".zip.tmp")
with zipfile.ZipFile(pack) as source, zipfile.ZipFile(temporary, "w") as target:
    target.comment = source.comment
    for info in source.infolist():
        target.writestr(info, changes.get(info.filename, source.read(info.filename)))
with zipfile.ZipFile(backup) as before, zipfile.ZipFile(temporary) as after:
    assert before.namelist() == after.namelist()
    assert after.testzip() is None
    for path in before.namelist():
        old, new = before.read(path), after.read(path)
        if path not in changes:
            assert old == new, path
            continue
        a, b = json.loads(old), json.loads(new)
        a["key"]["h"]["tag"] = a["key"]["h"].pop("rag", "spartanweaponry:poles")
        if path.endswith("copper_halberd.json"):
            a["result"]["item"] = "spartanweaponry:copper_halberd"
        assert a == b, "Unexpected recipe change: " + path
temporary.replace(pack)
print("PASS: spear/halberd ingredient typos and halberd output fixed; all other JSON fields and ZIP entries unchanged; CRCs valid.")

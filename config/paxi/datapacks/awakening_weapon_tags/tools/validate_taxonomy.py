#!/usr/bin/env python3
import argparse, json, pathlib, sys
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parents[1]
TAGS = ROOT / "data" / "awakening" / "tags" / "items" / "weapon"

def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)

def tag_id_from_path(path):
    rel = path.relative_to(TAGS).with_suffix("")
    return "awakening:weapon/" + rel.as_posix()

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--registry", help="Optional awakening_item_registry.json for concrete-ID validation")
    args = ap.parse_args()
    errors = []

    def require(cond, msg):
        if not cond:
            errors.append(msg)

    files = sorted(TAGS.rglob("*.json"))
    tags = {}
    for p in files:
        data = load_json(p)
        require(data.get("replace") is False, f"{p}: replace must be false")
        require(isinstance(data.get("values"), list), f"{p}: values must be a list")
        tags[tag_id_from_path(p)] = data.get("values", [])

    for tag_id, values in tags.items():
        for v in values:
            if isinstance(v, str) and v.startswith("#awakening:"):
                require(v[1:] in tags, f"{tag_id}: missing internal reference {v[1:]}")

    resolving, resolved = set(), {}
    def resolve(tag_id):
        if tag_id in resolved:
            return resolved[tag_id]
        if tag_id in resolving:
            raise RuntimeError(f"cycle detected at {tag_id}")
        resolving.add(tag_id)
        out = set()
        for value in tags[tag_id]:
            if value.startswith("#"):
                out |= resolve(value[1:])
            else:
                out.add(value)
        resolving.remove(tag_id)
        resolved[tag_id] = out
        return out

    try:
        for tag_id in tags:
            resolve(tag_id)
    except RuntimeError as e:
        errors.append(str(e))

    type_tags = sorted(t for t in tags if t.startswith("awakening:weapon/type/"))
    family_tags = sorted(t for t in tags if t.startswith("awakening:weapon/family/"))
    category_tags = sorted(t for t in tags if t.startswith("awakening:weapon/category/"))
    trait_tags = sorted(t for t in tags if t.startswith("awakening:weapon/trait/"))

    require(len(type_tags) == 86, f"type tags={len(type_tags)} expected=86")
    require(len(family_tags) == 18, f"family tags={len(family_tags)} expected=18")
    require(set(category_tags) == {"awakening:weapon/category/melee", "awakening:weapon/category/ranged"},
            f"unexpected category tags={category_tags}")
    require(set(trait_tags) == {"awakening:weapon/trait/throwable"},
            f"unexpected trait tags={trait_tags}")

    type_membership = Counter()
    for tag in type_tags:
        require(not any(v.startswith("#") for v in tags[tag]), f"{tag} is not a concrete leaf")
        for iid in tags[tag]:
            type_membership[iid] += 1

    duplicate_type_items = sorted(i for i, n in type_membership.items() if n != 1)
    require(not duplicate_type_items,
            f"items with primary-type count != 1: {duplicate_type_items[:20]}")

    concrete_weapon_ids = set(type_membership)
    require(len(concrete_weapon_ids) == 1502,
            f"concrete typed weapons={len(concrete_weapon_ids)} expected=1502")

    type_ref_counts = Counter()
    for fam in family_tags:
        for value in tags[fam]:
            require(value.startswith("#awakening:weapon/type/"), f"{fam}: non-type family member {value}")
            if value.startswith("#awakening:weapon/type/"):
                type_ref_counts[value[1:]] += 1
    bad_family_refs = sorted(t for t in type_tags if type_ref_counts[t] != 1)
    require(not bad_family_refs, f"types referenced by family != 1 time: {bad_family_refs}")

    all_tag = "awakening:weapon/all"
    require(all_tag in tags, "missing awakening:weapon/all")
    if all_tag in tags:
        require(all(v.startswith("#awakening:weapon/family/") for v in tags[all_tag]),
                "weapon/all must compose family tags only")
        all_ids = resolve(all_tag)
        require(all_ids == concrete_weapon_ids,
                f"weapon/all mismatch actual={len(all_ids)} typed={len(concrete_weapon_ids)}")

    melee = resolve("awakening:weapon/category/melee")
    ranged = resolve("awakening:weapon/category/ranged")
    require(melee | ranged == concrete_weapon_ids,
            f"category coverage={len(melee | ranged)} expected={len(concrete_weapon_ids)}")
    require(melee <= concrete_weapon_ids and ranged <= concrete_weapon_ids,
            "category contains non-weapon item")
    require(len(melee) == 1127, f"melee={len(melee)} expected=1127")
    require(len(ranged) == 523, f"ranged={len(ranged)} expected=523")

    throwable = resolve("awakening:weapon/trait/throwable")
    require(throwable <= concrete_weapon_ids, "throwable contains non-weapon item")
    require(len(throwable) == 192, f"throwable={len(throwable)} expected=192")

    if args.registry:
        registry = load_json(pathlib.Path(args.registry))
        registry_ids = {x["id"] for x in registry["items"]}
        require(len(registry["items"]) == 18452, f"registry items={len(registry['items'])}")
        missing = sorted(concrete_weapon_ids - registry_ids)
        require(not missing, f"tag IDs absent from registry: {missing}")

    print("PASS" if not errors else "FAIL")
    print(f"tag_files={len(files)}")
    print(f"types={len(type_tags)}")
    print(f"families={len(family_tags)}")
    print(f"typed_weapons={len(concrete_weapon_ids)}")
    print(f"weapon_all={len(resolve(all_tag)) if all_tag in tags else 0}")
    print(f"melee={len(melee)}")
    print(f"ranged={len(ranged)}")
    print(f"hybrid={len(melee & ranged)}")
    print(f"throwable={len(throwable)}")
    for e in errors:
        print("ERROR:", e)
    raise SystemExit(2 if errors else 0)

if __name__ == "__main__":
    main()

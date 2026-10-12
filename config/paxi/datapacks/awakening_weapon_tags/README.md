# Awakening Weapon Taxonomy

Canonical, data-driven weapon classification API for the Awakening modpack.

- Minecraft: Forge 1.20.1
- Namespace: `awakening`
- Static coverage: 18,452 registry items audited; 1,502 confirmed weapons; 44 weapon-producing namespaces
- Static status: complete; runtime reload/restart verification is still required

## Public API

- `#awakening:weapon/all`
- `#awakening:weapon/type/*`
- `#awakening:weapon/family/*`
- `#awakening:weapon/category/*`
- `#awakening:weapon/trait/*`

## Architecture and invariants

Canonical DAG:

```text
concrete item
    ↓
weapon/type/*
    ↓
weapon/family/*
    ↓
weapon/all
```

`category/*` and `trait/*` are parallel dimensions. They may compose `type/*`
when the whole type shares that property, or list concrete item IDs for exceptions.
They never point back into `family/*` or `all`.

Every confirmed weapon has exactly one primary `type`, exactly one primary
`family`, and at least one category. Traits are optional and are only published
when safely evidenced. Material, element, rarity, proper names and skins are not
types. All tag files use `"replace": false`. No external mod tags are required by
this API.

## Categories

- `#awakening:weapon/category/melee`: 1,127 members
- `#awakening:weapon/category/ranged`: 523 members
- 148 weapons are hybrid and therefore occur in both tags

## Traits

Initial published safe trait:

- `#awakening:weapon/trait/throwable`: 192 members

`one_handed`, `two_handed`, `slashing`, `piercing`, and `bludgeoning` are
intentionally not published yet. Missing evidence is represented by absence,
not inference.

## Families

| Family | Types | Weapons | Canonical types |
| --- | ---: | ---: | --- |
| `axe` | 3 | 133 | `axe`, `battleaxe`, `tomahawk` |
| `blunt` | 6 | 135 | `anchor`, `battle_hammer`, `flanged_mace`, `hammer`, `mace`, `war_hammer` |
| `bow` | 5 | 129 | `bow`, `flat_bow`, `longbow`, `recurve_bow`, `short_bow` |
| `club` | 2 | 10 | `club`, `macuahuitl` |
| `crossbow` | 6 | 134 | `arbalest`, `crossbow`, `double_crossbow`, `heavy_crossbow`, `pistol_crossbow`, `tech_crossbow` |
| `device` | 3 | 4 | `deployable_device`, `detonator`, `shredder` |
| `explosive` | 4 | 12 | `bomb`, `dynamite`, `molotov`, `rocket` |
| `firearm` | 8 | 10 | `blaster`, `cannon`, `gatling_gun`, `gun`, `hand_cannon`, `ray_gun`, `shoulder_cannon`, `sprayer` |
| `fist` | 3 | 17 | `cestus`, `claw`, `gauntlet` |
| `flexible` | 3 | 3 | `flail`, `hook`, `whip` |
| `knife` | 8 | 185 | `dagger`, `fillet_knife`, `improvised_melee`, `knife`, `machete`, `parrying_dagger`, `stake`, `throwing_knife` |
| `launcher` | 2 | 3 | `blowgun`, `slingshot` |
| `magic` | 6 | 17 | `crucifix`, `magic_bottle`, `magic_focus`, `magic_instrument`, `scepter`, `wand` |
| `polearm` | 9 | 316 | `bardiche`, `glaive`, `halberd`, `javelin`, `lance`, `pike`, `scythe`, `spear`, `trident` |
| `shield` | 1 | 1 | `shield` |
| `staff` | 3 | 51 | `battle_staff`, `quarterstaff`, `staff` |
| `sword` | 7 | 287 | `greatsword`, `katana`, `khopesh`, `long_sword`, `rapier`, `saber`, `sword` |
| `thrown` | 7 | 55 | `boomerang`, `chakram`, `throwable_bottle`, `throwable_charge`, `throwable_swarm`, `throwing_dust`, `throwing_feathers` |

## Complete type catalog

86 primary types are currently published:

```text
anchor
arbalest
axe
bardiche
battle_hammer
battle_staff
battleaxe
blaster
blowgun
bomb
boomerang
bow
cannon
cestus
chakram
claw
club
crossbow
crucifix
dagger
deployable_device
detonator
double_crossbow
dynamite
fillet_knife
flail
flanged_mace
flat_bow
gatling_gun
gauntlet
glaive
greatsword
gun
halberd
hammer
hand_cannon
heavy_crossbow
hook
improvised_melee
javelin
katana
khopesh
knife
lance
long_sword
longbow
mace
machete
macuahuitl
magic_bottle
magic_focus
magic_instrument
molotov
parrying_dagger
pike
pistol_crossbow
quarterstaff
rapier
ray_gun
recurve_bow
rocket
saber
scepter
scythe
shield
short_bow
shoulder_cannon
shredder
slingshot
spear
sprayer
staff
stake
sword
tech_crossbow
throwable_bottle
throwable_charge
throwable_swarm
throwing_dust
throwing_feathers
throwing_knife
tomahawk
trident
wand
war_hammer
whip
```

The standalone `type_catalog_phase2.csv` project artifact contains definitions,
family, count, and singleton status for every type.

## Important boundary decisions

- Ammunition is excluded: arrows, bolts, bullets, ammunition-only darts and cannon ammunition.
- Ordinary shields are excluded. `cataclysm:bulwark_of_the_flame` is the deliberate offensive shield exception.
- Ordinary tools are excluded. `swem:axe_amethyst` is the deliberate tool+weapon exception.
- `minecraft:fire_charge` and `amendments:dragon_charge` are included because the installed Amendments configuration makes them throwable/offensive.
- Pure casting instruments from Iron's Spellbooks and related addons are not automatically weapons.
- Spartan crafting components such as `*_blade`, `*_head`, and `*_tip` are excluded.
- `mowziesmobs:sculptor_staff` is included because of its offensive Rock Sling ability.
- `relics:shadow_glaive` is the only Relics item classified as a weapon.
- Small Ships mounted cannons and cannon ammunition remain outside this held-player-weapon taxonomy.

## Adding a weapon or type

1. Confirm the item is a weapon under the boundary rules.
2. Add its concrete ID to exactly one `data/awakening/tags/items/weapon/type/<type>.json`.
3. If the type is new, create the `type/*` leaf and add that type tag to exactly one `family/*`.
4. Add the item to `category/melee`, `category/ranged`, or both. Compose through the type tag only when every item of that type shares the category.
5. Add traits only when evidence is safe.
6. Update the external complete taxonomy matrix and the relevant audit counts/catalogs.
7. Run the validator.

Never assign the same weapon to multiple primary types.

## Validation

From this datapack directory:

```bash
python tools/validate_taxonomy.py
```

For registry-ID validation as well:

```bash
python tools/validate_taxonomy.py --registry /path/to/awakening_item_registry.json
```

The validator checks JSON structure, internal references, cycles, concrete type
leaves, one-type exclusivity, one-family composition, exact `weapon/all`
membership, complete category coverage, and the `throwable` trait. With
`--registry`, it also checks that all concrete weapon IDs exist in the instance dump.

## Consumer backlog

No current consumer is migrated by this task. A future-migration candidate exists
under `config/paxi/datapacks/rpg_classes/data/kubejs/weapon_attributes/`; this
taxonomy does not modify it.

## Audit files in the datapack

- `audit/namespace_counts.csv`
- `audit/validation.json`

The complete 1,502-row taxonomy matrix and standalone type/family catalogs are
maintained as separate project deliverables. Audit files are not consumed by Minecraft.

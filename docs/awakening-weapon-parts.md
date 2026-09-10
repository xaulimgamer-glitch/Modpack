# Awakening: Spartan weapon parts

Status: **IMPLEMENTED / STATIC-OBSERVED**. **LIVE-VERIFIED: pending**.

Base: `development` at `3e2784c5b7c6ed951212147a867e60dea1ac50e2`
(`Removed Dragon era`), immediately after silver unification `2cc0123`.

## Scope and installation

216 weapon parts (24 per material), plus nine smithing fragments. Items use the
`awakening:` namespace and KubeJS basic items. All 216 finished weapons remain
their original mod registry entries, with the original recipe result/count/NBT.
Arch Bows is outside this change.

Install the complete `kubejs/awakening/weapon_parts.json` manifest and both
`awakening_weapon_parts.js` scripts from this commit. Restart Minecraft and any
dedicated server completely; `/reload` cannot register new items. The manifest
must be present on both client and server.

| Material | Confirmed ingredient tag | Original weapon namespace |
| --- | --- | --- |
| Cloggrum | `forge:ingots/cloggrum` | `spartanundergarden` |
| Froststeel | `forge:ingots/froststeel` | `spartanundergarden` |
| Ironwood | `forge:ingots/ironwood` | `spartantwilight` |
| Fiery | `forge:ingots/fiery` | `spartantwilight` |
| Ancient Metal | `spartancataclysm:ancient_metal_ingots` | `spartancataclysm` |
| Witherite | `spartancataclysm:witherite_ingots` | `spartancataclysm` |
| Fire Dragonsteel | `forge:ingots/fire_dragonsteel` | `spartanfire` |
| Ice Dragonsteel | `forge:ingots/ice_dragonsteel` | `spartanfire` |
| Lightning Dragonsteel | `forge:ingots/lightning_dragonsteel` | `spartanfire` |

Spartan Cataclysm's tags explicitly contain `cataclysm:ancient_metal_ingot` and
`cataclysm:witherite_ingot`. SpartanFire's tags explicitly contain
`iceandfire:dragonsteel_fire_ingot`, `iceandfire:dragonsteel_ice_ingot`, and
`iceandfire:dragonsteel_lightning_ingot`. Heating enumerates the actual members
of each confirmed tag and creates a separate same-item recipe for each; it does
not guess item IDs or convert one mod's ingot into another's.

## Crafting route

1. One cold ingot plus a smithing hammer produces nine smithing fragments. The
   hammer is retained with one durability consumed. Fragments have no reverse
   recipe and are not added to generic nugget tags.
2. Blast-furnace heating uses `overgeared:nbt_add_blasting`, 100 ticks, zero XP,
   the same input/output item and count 1, adding `Heated: true`. Both ingots and
   fragments can be heated. Cut the ingot before heating: Overgeared assembly
   rejects a heated ingredient.
3. Parts use the actual Overgeared Spartan iron forging patterns, hammering,
   anvil tier, blueprint, quality, polishing and quenching settings. `X` costs
   one heated ingot; `x` costs one heated fragment (1/9 ingot). `requires_heated`
   makes the native forging matcher reject cold inputs. Original costs were
   taken from the part recipes, not inferred from the direct weapon crafts.
4. Quench/polish melee parts as required by Overgeared before assembly. Its
   generic NBT handling and `overgeared:crafting_shapeless` transfer quality;
   the output is still the original weapon. Ironwood enchantment NBT is copied
   intact from the original recipe.
5. Melee assembly preserves every original non-metal component and its count:
   pikes retain two poles, Fiery retains blaze rods/poles, and Dragonsteel
   retains witherbone handles/poles.
6. Longbows, heavy crossbows and boomerangs use Overgeared Spartan's shaped
   assembly templates. Bows preserve their original grip in one stick slot;
   the remaining sticks/string/planks/hook follow the Overgeared template.
   Longbows use `longbow_limb`; heavy crossbows use `heavy_crossbow_limb`.

Weapon recipes are removed by output before replacements are added, including
Fiery vial alternatives. This intentionally closes alternate weapon crafting
routes that would avoid the new part. Loot, weapon classes, stats, traits,
textures, repair materials and registry entries are not modified.

The only new material conversions are ingot -> 9 fragments, 1 -> 1 heating,
consumptive forging, and part -> original weapon assembly. There is no new
weapon dismantling, part recycling or material-return loop. Forge costs can
differ from old direct crafts because they follow Overgeared's part patterns.

## Assets

KubeJS generates `minecraft:item/generated` item models from `.texture(...)`.
Each weapon part references the corresponding **existing iron part texture**
inside Overgeared Spartan 0.67. `.color(0, ...)` applies a per-material tint to
those existing pixels. Shapes and alpha are preserved. This is an initial
programmatic recolor, not an AI image or a newly drawn asset; refined palettes
or baked recolored PNGs can replace it later. Fragments tint the vanilla iron
nugget texture. No external resource pack is required.

The reference prefix for gold is `golden`, not `gold`. `battleaxe_head` has no
underscore between battle and axe, while its iron forging recipe path is
`iron/parts/battle_axe`. All 24 suffixes and texture paths were extracted, rather
than inferred. Stone has no longbow/heavy-crossbow limb models in this version.

## Evidence and limits

Primary evidence from the pinned Modpack GitHub tree:

| Installed file | Git blob SHA | Use |
| --- | --- | --- |
| `overgearedspartan-0.67.jar` | `f469644d4f9f30cefb4da163fd1e919c52c82fbc` | Actual part/assembly recipes, all six model families, textures and tags |
| `spartanundergarden-1.20.1-1.1.0.jar` | `6aa1b4bffcc84f844c13b19dc2c76458a862cee5` | 48 original recipes |
| `spartantwilight-1.20.1-3.1.1.jar` | `176d87a30687bef0759bdd0fc06caffb52a34109` | 48 originals, Ironwood NBT and Fiery alternatives |
| `spartancataclysm-1.1.2+1.20.1+forge.jar` | `6a73076c4fa5e7317596c75f8b78c4e6b10aa1c4` | 48 originals and material tags |

The installed KubeJS version is `2001.6.5-build.26` (Forge 1.20.1), with Rhino
`2001.2.3-build.10`. Existing startup scripts also use `StartupEvents.registry`.
The connector returned no contents for the larger KubeJS, Overgeared and
SpartanFire binary files, and direct network download was unavailable. Their
public upstream sources were used for API/Dragonsteel evidence instead:

- [Overgeared source at 0186548](https://github.com/phuccom000/Overgeared/tree/0186548ac0e9ee8e0220b0e4eddce7ed84c9e774):
  `gradle.properties` declares exactly `1.20.1-1.6.33`, matching the installed
  filename. `ForgingRecipe`, `NBTBlastingRecipe`, `ModRecipes`,
  `AbstractSmithingAnvilBlockEntity`, `ModItemInteractEvents`, and
  `OvergearedShapelessRecipe` accept ordinary ItemStacks and generic NBT.
- [SpartanFire source at f11f9f4](https://github.com/KreloX/SpartanFire/tree/f11f9f47b9b4c82d2c04c159170332ac85c6b821):
  declares version `2.1.0`, matching the installed filename; supplies all 72
  Dragonsteel recipes and the three actual ingredient tags. This is matching
  version source evidence, not a binary identity assertion.
- [KubeJS 2001 source](https://github.com/kube-mods/kubejs/tree/ba142541dcc1d230383f4a55e38dd92ff10d1029):
  `RegistryEventJS.create`, `BasicItemJS.Builder`, `ItemBuilder.texture/color`,
  `JsonIO.readString`, and `IngredientKJS.getItemIds` support this implementation.

The repository's OvergearedRecipes datapack was also inspected. Existing
early-game progression and silver unification scripts remain unchanged.

## Static checks

Run `node tools/validate_weapon_parts.cjs` from any directory. It first tests
the six-part Cloggrum subset, then the full matrix with mocked KubeJS events.
Checks cover 216 parts / 225 registrations, 216 original-weapon assemblies,
original output NBT/counts, component multiplicities, heated-only forging,
fragment/heat conservation, removal of alternate outputs, repeated reload,
and abort-before-removal when a material tag is absent. All 24 referenced
texture files were separately resolved inside the installed addon jar.

The mock fixture produces 648 recipes when each material tag has one ingot
member. Runtime heating recipe count depends on actual tag membership.
These checks do **not** execute Forge, Rhino, JEI or Minecraft serializers.

## In-game acceptance checklist (pending)

- Restart with the full files; inspect `logs/kubejs/startup.log` and
  `logs/kubejs/server.log` for errors and the `[Awakening/Parts]` summary.
- Inspect parts in JEI: recognizable silhouettes, intended tint, no missing
  textures, and one assembly route per targeted weapon after `/reload`.
- Start with cold Cloggrum: cut fragments, heat both ingredients, forge dagger
  and pike parts; confirm cold stacks do not forge, then quench and polish.
- Craft dagger, two-pole pike, quarterstaff, boomerang, longbow and heavy
  crossbow. Confirm handles/grips, consumption and original output IDs.
- Repeat with Ironwood to check original enchantments, Fiery for blaze
  components and no vial bypass, and each Dragonsteel for witherbone grips.
- Test quality enabled/disabled, crafting remainder durability, shift-click,
  heating/quenching, and relevant existing salvage routes for material balance.
- Only after these Minecraft checks may the implementation be marked
  **LIVE-VERIFIED**. This commit does not claim that status.

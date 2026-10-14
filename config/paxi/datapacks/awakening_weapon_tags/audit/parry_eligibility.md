# Parry eligibility policy

Canonical runtime weapon tag: `#awakening:combat/parry_eligible`.

Parry authorization is intentionally split into two independent policies:

1. **Weapon eligibility** — the player's main-hand item must be explicitly present in `#awakening:combat/parry_eligible`.
2. **Class access** — the selected origin in the `rpgclasses:class` layer must be explicitly allowed by Awakening Compat.

The complete runtime contract is fail-closed:

```text
weaponEligible(stack) = stack != null
                     && !stack.isEmpty()
                     && stack.is(#awakening:combat/parry_eligible)

classAllowed(player) = selectedClass(player, rpgclasses:class)
                       is in ALLOWED_CLASSES

canParry(player) = weaponEligible(player.mainHand)
                && classAllowed(player)
```

Missing Origins capability, an unselected class, an unknown class, a class not present in the allow-list, an empty stack, an unclassified item, or an ineligible weapon all deny parry.

## Current class policy

Current allow-list:

- `rpgclasses:warrior` — ALLOW

Every other class is currently DENY, including `rpgclasses:wizard`, `rpgclasses:barbarian`, `rpgclasses:cleric`, `rpgclasses:rogue`, `rpgclasses:paladin`, and `rpgclasses:ranger`.

The allow-list is centralized in `ParryClassPolicy`. Future class or specialization rules must extend that policy instead of adding class checks to the Block Parry Dodge mixins or to the weapon taxonomy.

## Weapon policy

Static type matrix: 86/86 classified, 37 ALLOW, 49 DENY, 0 UNRESOLVED. There are no concrete-item exceptions. The generic `staff` type is denied because it is predominantly ranged/magic in this pack; `kubejs:crude_graybeard_staff` is therefore also ineligible for parry.

Hybrid status does not automatically deny parry. `anchor`, `javelin`, `throwing_knife`, `tomahawk`, and `trident` have canonical melee use and remain weapon-eligible while held. Fist weapons, shields, flexible weapons, devices, purely ranged weapons, explosives, thrown-only weapons, magic weapons, and generic staffs are denied. Shield is intentionally excluded because its defensive behavior belongs to the normal block/shield path rather than the weapon-parry path.

## Block Parry Dodge integration

The Block Parry Dodge integration calls the complete `canParry(player)` policy both when the parry key action is processed and when `LivingAttackEvent` reaches the mod's parry-resolution handler.

Consequences:

- Warrior + eligible main-hand weapon: parry may proceed to Block Parry Dodge's normal logic.
- Warrior + empty/ineligible main hand: denied.
- Non-Warrior + eligible weapon: denied.
- Missing/unselected class + eligible weapon: denied.
- Warrior starts a parry and changes to an ineligible weapon before impact: the resolution gate denies protection.
- Warrior starts a parry and changes away from the allowed class before impact: the resolution gate denies protection.

The Block Parry Dodge owner retains its own timing window, cooldown, refund, animation, sound, knockback, state variables, and damage cancellation behavior. Awakening Compat only supplies the authorization gate.

## Distributed keybind

The mod's parry mapping is `key.block_parry_dodge.parry_key`. Awakening distributes it as `Mouse 5` through Default Options. `G` remains reserved for Origins Primary Active and `H` remains reserved for Origins Secondary Active. `Mouse 5` has no other distributed binding in the current key map and keeps the parry action on a low-latency input without competing with movement or spell controls.

Default Options applies this to new/default profiles without intentionally replacing a player's existing custom remap.

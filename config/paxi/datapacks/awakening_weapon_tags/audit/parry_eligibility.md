# Parry eligibility policy

Canonical runtime tag: `#awakening:combat/parry_eligible`.

The policy is fail-closed: an empty stack, an unclassified item, or a weapon type not explicitly present in the tag is not eligible to parry.

Static type matrix: 86/86 classified, 37 ALLOW, 49 DENY, 0 UNRESOLVED. There are no concrete-item exceptions. The generic `staff` type is denied because it is predominantly ranged/magic in this pack; `kubejs:crude_graybeard_staff` is therefore also ineligible for parry.

Hybrid status does not automatically deny parry. `anchor`, `javelin`, `throwing_knife`, `tomahawk`, and `trident` have canonical melee use and remain eligible while held. Fist weapons, shields, flexible weapons, devices, purely ranged weapons, explosives, thrown-only weapons, magic weapons, and generic staffs are denied. Shield is intentionally excluded because its defensive behavior belongs to the normal block/shield path rather than the weapon-parry path.

Runtime contract:

```text
eligible(stack) = !stack.isEmpty() && stack.is(#awakening:combat/parry_eligible)
```

The Block Parry Dodge integration enforces this contract both when the parry key action is processed and when `LivingAttackEvent` reaches the mod's parry-resolution handler. This prevents empty/invalid activation and prevents a valid weapon from granting protection after the player changes to an ineligible main-hand item before impact.

The Block Parry Dodge owner retains its own timing window, cooldown, refund, animation, sound, knockback, state variables, and damage cancellation behavior. Awakening Compat only supplies the eligibility gate.

## Distributed keybind

The mod's parry mapping is `key.block_parry_dodge.parry_key`. Awakening distributes it as `Mouse 5` through Default Options. `G` remains reserved for Origins Primary Active and `H` remains reserved for Origins Secondary Active. `Mouse 5` has no other distributed binding in the current key map and keeps the parry action on a low-latency input without competing with movement or spell controls.

Default Options applies this to new/default profiles without intentionally replacing a player's existing custom remap.

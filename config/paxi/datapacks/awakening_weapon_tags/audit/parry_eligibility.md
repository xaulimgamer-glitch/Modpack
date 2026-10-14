# Parry eligibility policy

Canonical runtime tag: `#awakening:combat/parry_eligible`.

The policy is fail-closed: an empty stack, an unclassified item, or a weapon type not explicitly present in the tag is not eligible to parry.

Static type matrix: 86/86 classified, 37 ALLOW, 49 DENY, 0 UNRESOLVED. The tag also contains one deliberate concrete-item exception: `kubejs:crude_graybeard_staff`. The generic `staff` type is denied because it is predominantly ranged/magic in this pack, while the crude Graybeard staff is explicitly classified as melee.

Hybrid status does not automatically deny parry. `anchor`, `javelin`, `throwing_knife`, `tomahawk`, and `trident` have canonical melee use and remain eligible while held. Fist weapons, shields, flexible weapons, devices, purely ranged weapons, explosives, thrown-only weapons, and magic weapons are denied. Shield is intentionally excluded because its defensive behavior belongs to the normal block/shield path rather than the weapon-parry path.

Runtime contract:

```text
eligible(stack) = !stack.isEmpty() && stack.is(#awakening:combat/parry_eligible)
```

The Block Parry Dodge integration enforces this contract both when the parry key action is processed and when `LivingAttackEvent` reaches the mod's parry-resolution handler. This prevents empty/invalid activation and prevents a valid weapon from granting protection after the player changes to an ineligible main-hand item before impact.

The Block Parry Dodge owner retains its own timing window, cooldown, refund, animation, sound, knockback, state variables, and damage cancellation behavior. Awakening Compat only supplies the eligibility gate.

# Awakening weapon parts: Cloggrum pilot

Status: **IMPLEMENTED / STATIC-OBSERVED**. **LIVE-VERIFIED: pending Minecraft test**.

Base development HEAD: `3e2784c5b7c6ed951212147a867e60dea1ac50e2`.

Six parts: dagger, pike, quarterstaff, boomerang, longbow and heavy crossbow.
Includes one Cloggrum smithing fragment (1/9 ingot), native Overgeared NBT
heating and forging, original weapon assemblies, and KubeJS-generated models
with per-material tint on real Overgeared Spartan iron textures.

All external part suffixes and recipes were extracted from installed
Overgeared Spartan 0.67 and Spartan Undergarden 1.1.0. Uses the confirmed
`forge:ingots/cloggrum` tag. The pike retains two poles. No new weapon registry
entry or material-return conversion is introduced.

Run `node tools/validate_weapon_parts.cjs --prototype` for mocked static checks.
Observed: six parts, seven registrations, 18 recipes with one ingot tag member.
The fixture checks original output/NBT, components, cold-input guard, alternate
recipe removal, reload and missing-tag preflight. This does not run Minecraft.

Install the manifest and BOTH scripts on client/server and restart fully.
Verify heating -> forging -> quenching/polishing -> assembly in-game, JEI
recipe uniqueness, tints, input counts and original weapon behavior.

The next atomic commit expands the same pattern to the complete verified
nine-material matrix and records detailed provenance and acceptance steps.

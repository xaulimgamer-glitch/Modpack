#!/usr/bin/env node
'use strict'

const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')

const root = path.resolve(__dirname, '..')
const rel = p => path.join(root, p)
const errors = []
const fail = (file, message) => errors.push(`${file}: ${message}`)
const read = file => fs.readFileSync(rel(file), 'utf8')
const exists = file => fs.existsSync(rel(file))
const parseJson = file => {
  try {
    return JSON.parse(read(file))
  } catch (error) {
    fail(file, `invalid JSON (${error.message})`)
    return null
  }
}
const resourceId = value => typeof value === 'string' && /^[a-z0-9_.-]+:[a-z0-9_./-]+$/.test(value)
const allUnique = (values, file, label) => {
  const seen = new Set()
  for (const value of values) {
    if (seen.has(value)) fail(file, `duplicate ${label}: ${value}`)
    seen.add(value)
  }
}
function topLevelObjectKeys(raw, property, file) {
  const marker = `"${property}"`
  const at = raw.indexOf(marker)
  if (at < 0) { fail(file, `missing raw object ${property}`); return [] }
  let i = raw.indexOf('{', at + marker.length)
  if (i < 0) { fail(file, `${property} is not an object`); return [] }
  const keys = []
  let depth = 1, inString = false, escape = false
  for (i += 1; i < raw.length && depth > 0; i++) {
    const ch = raw[i]
    if (inString) {
      if (escape) escape = false
      else if (ch === '\\') escape = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') {
      if (depth === 1) {
        let j = i + 1, key = '', escaped = false
        for (; j < raw.length; j++) {
          const c = raw[j]
          if (escaped) { key += c; escaped = false; continue }
          if (c === '\\') { escaped = true; continue }
          if (c === '"') break
          key += c
        }
        let k = j + 1
        while (/\s/.test(raw[k] || '')) k++
        if (raw[k] === ':') keys.push(key)
      }
      inString = true
      continue
    }
    if (ch === '{' || ch === '[') depth++
    else if (ch === '}' || ch === ']') depth--
  }
  return keys
}
function walkStrings(value, out = []) {
  if (typeof value === 'string') out.push(value)
  else if (Array.isArray(value)) value.forEach(v => walkStrings(v, out))
  else if (value && typeof value === 'object') Object.values(value).forEach(v => walkStrings(v, out))
  return out
}
function modelFile(id) {
  const [namespace, item] = id.split(':', 2)
  return `kubejs/assets/${namespace}/models/${item}.json`
}

const manifestFile = 'kubejs/awakening/crossbow_variants.json'
const rawManifest = exists(manifestFile) ? read(manifestFile) : ''
const data = exists(manifestFile) ? parseJson(manifestFile) : null
if (!data) {
  console.error(errors.join('\n'))
  process.exit(1)
}
if (data.schema !== 5) fail(manifestFile, `expected schema 5, found ${data.schema}`)
if (!data.families || typeof data.families !== 'object' || Array.isArray(data.families)) fail(manifestFile, 'families must be an object')
if (!Array.isArray(data.materials)) fail(manifestFile, 'materials must be an array')
const requiredFamilies = ['pistol_crossbow', 'heavy_crossbow', 'arbalest']
const familyKeys = Object.keys(data.families || {})
for (const id of requiredFamilies) if (!familyKeys.includes(id)) fail(manifestFile, `missing family ${id}`)
for (const id of familyKeys) if (!requiredFamilies.includes(id)) fail(manifestFile, `unexpected family ${id}`)
const rawFamilyKeys = topLevelObjectKeys(rawManifest, 'families', manifestFile)
allUnique(rawFamilyKeys, manifestFile, 'family key')
if (rawFamilyKeys.length !== familyKeys.length) fail(manifestFile, 'raw family keys do not match parsed family keys (possible duplicate JSON key)')
for (const id of requiredFamilies) {
  const f = data.families[id]
  if (!f) continue
  for (const key of ['suffix', 'name', 'role', 'charge_ticks', 'projectile_damage', 'projectile_velocity']) if (f[key] == null) fail(manifestFile, `${id}: missing ${key}`)
  if (!Number.isFinite(f.charge_ticks) || f.charge_ticks <= 0) fail(manifestFile, `${id}: invalid charge_ticks`)
  if (!Number.isFinite(f.projectile_damage) || f.projectile_damage <= 0) fail(manifestFile, `${id}: invalid projectile_damage`)
  if (!Number.isFinite(f.projectile_velocity) || f.projectile_velocity <= 0) fail(manifestFile, `${id}: invalid projectile_velocity`)
}
if (!data.families.heavy_crossbow?.source_charged_texture) fail(manifestFile, 'heavy_crossbow: missing source_charged_texture')
const materialIds = data.materials.map(m => m && m.id)
allUnique(materialIds, manifestFile, 'material id')
const materialById = new Map(data.materials.map(m => [m.id, m]))
for (const m of data.materials) {
  if (!m || !m.id || !m.name || !resourceId(m.heavy_output)) { fail(manifestFile, `${m?.id || '<unknown>'}: missing id/name/valid heavy_output`); continue }
  if (m.id === 'wood') {
    if (m.crafting_material || m.recipe) fail(manifestFile, 'wood: base material must not define an upgrade recipe')
  } else if (Number(Boolean(m.crafting_material)) + Number(Boolean(m.recipe)) !== 1) fail(manifestFile, `${m.id}: define exactly one of crafting_material or recipe`)
  if (m.recipe?.base_material && !materialById.has(m.recipe.base_material)) fail(manifestFile, `${m.id}: unknown recipe base ${m.recipe.base_material}`)
  if (m.unbreakable !== true && (!Number.isInteger(m.durability) || m.durability <= 0)) fail(manifestFile, `${m.id}: missing positive durability or unbreakable=true`)
  if (!Number.isInteger(m.enchantability) || m.enchantability < 0) fail(manifestFile, `${m.id}: invalid enchantability`)
}
allUnique(data.materials.map(m => m.heavy_output), manifestFile, 'heavy output id')
const outputFor = (material, familyId) => familyId === 'heavy_crossbow' ? material.heavy_output : `awakening:${material.id === 'wood' ? 'wooden' : material.id}_${data.families[familyId].suffix}`
const allOutputs = []
for (const familyId of requiredFamilies) {
  const outputs = data.materials.map(m => outputFor(m, familyId)); allUnique(outputs, manifestFile, `${familyId} output id`); allOutputs.push(...outputs)
}
allUnique(allOutputs, manifestFile, 'crossbow output id')
const serverScript = 'kubejs/server_scripts/awakening_crossbow_variants.js'
const recipes = new Map(), removals = []
if (!exists(serverScript)) fail(serverScript, 'missing server recipe script')
else {
  const context = {
    console: { info() {}, warn(message) { fail(serverScript, `preflight skipped content in static validator: ${message}`) } },
    JsonIO: { readString(file) { if (file !== manifestFile) throw new Error(`unexpected manifest read: ${file}`); return rawManifest } },
    Ingredient: { of(value) { return { itemIds: { size() { return value == null ? 0 : 1 } } } } },
    ServerEvents: { recipes(callback) { callback({
      remove(filter) { removals.push(filter) },
      shaped(output, pattern, key) { return { id(id) { if (recipes.has(id)) fail(serverScript, `duplicate recipe id ${id}`); recipes.set(id, { type: 'shaped', output, pattern, key }) } } },
      shapeless(output, ingredients) { return { id(id) { if (recipes.has(id)) fail(serverScript, `duplicate recipe id ${id}`); recipes.set(id, { type: 'shapeless', output, ingredients }) } } }
    }) } }
  }
  try { vm.createContext(context); vm.runInContext(read(serverScript), context, { filename: rel(serverScript) }) } catch (error) { fail(serverScript, `execution failed: ${error.stack || error}`) }
}
const wood = materialById.get('wood')
for (const familyId of requiredFamilies) {
  const family = data.families[familyId], baseOutput = outputFor(wood, familyId)
  if (!recipes.has(`awakening:crossbows/wood/${family.suffix}`)) fail(serverScript, `${familyId}/wood: missing base recipe`)
  for (const material of data.materials) {
    if (material.id === 'wood') continue
    const id = `awakening:crossbows/${material.id}/${family.suffix}`, recipe = recipes.get(id)
    if (!recipe) { fail(serverScript, `${familyId}/${material.id}: missing generated recipe ${id}`); continue }
    if (recipe.output !== outputFor(material, familyId)) fail(serverScript, `${familyId}/${material.id}: wrong output`)
    if (material.recipe) {
      const expected = [outputFor(materialById.get(material.recipe.base_material), familyId), material.recipe.catalyst]
      if (recipe.type !== 'shapeless' || JSON.stringify(recipe.ingredients) !== JSON.stringify(expected)) fail(serverScript, `${familyId}/${material.id}: override must be base crossbow + catalyst`)
    } else if (recipe.type !== 'shaped' || JSON.stringify(recipe.pattern) !== JSON.stringify(['M','B','M']) || recipe.key?.B !== baseOutput || recipe.key?.M !== material.crafting_material) fail(serverScript, `${familyId}/${material.id}: invalid normal upgrade`)
    for (const value of walkStrings(recipe)) {
      if (/bolt/i.test(value)) fail(serverScript, `${familyId}/${material.id}: bolt dependency (${value})`)
      if (/crossbow.*limb|heavy_crossbow_limb/i.test(value)) fail(serverScript, `${familyId}/${material.id}: limb dependency (${value})`)
      if (/heated|fragment/i.test(value)) fail(serverScript, `${familyId}/${material.id}: old intermediate (${value})`)
    }
  }
}
const expectedRecipeCount = requiredFamilies.length * data.materials.length
if (recipes.size !== expectedRecipeCount) fail(serverScript, `expected ${expectedRecipeCount} recipes, found ${recipes.size}`)
const startupScript = 'kubejs/startup_scripts/awakening_crossbow_variants.js'
if (!exists(startupScript)) fail(startupScript, 'missing startup registration script')
else {
  const startup = read(startupScript)
  if (!/instanceof\s+\$ArrowItem/.test(startup) || !startup.includes('.ammo(isArrow)') || !startup.includes('.ammoHeld(isArrow)')) fail(startupScript, 'custom crossbows must use ArrowItem for both ammo predicates')
  if (!startup.includes("var customFamilies = ['pistol_crossbow', 'arbalest']")) fail(startupScript, 'Heavy Crossbow must remain native')
  for (const token of ['_pulling_0','_pulling_1','_pulling_2',"_arrow'"]) if (!startup.includes(token)) fail(startupScript, `state machine reference missing: ${token}`)
}
for (const familyId of ['pistol_crossbow','arbalest']) for (const state of ['pulling_0','pulling_1','pulling_2','arrow']) {
  const file = `kubejs/assets/awakening/models/item/crossbows/${familyId}_${state}.json`; if (!exists(file)) fail(file, 'missing runtime state model'); else parseJson(file)
}
for (const texture of ['pistol_crossbow','iron_pistol_crossbow','pistol_crossbow_pulling_0','pistol_crossbow_pulling_1','pistol_crossbow_pulling_2','arbalest','iron_arbalest','arbalest_pulling_0','arbalest_pulling_1','arbalest_pulling_2']) {
  const file = `kubejs/assets/awakening/textures/item/crossbows/${texture}.png`; if (!exists(file)) fail(file, 'missing runtime texture')
}
const heavyArrow = 'kubejs/assets/awakening/textures/item/crossbows/heavy_crossbow_arrow_overlay.png'
if (!exists(heavyArrow)) fail(heavyArrow, 'missing Heavy Crossbow arrow overlay')
if (data.families.heavy_crossbow?.source_charged_texture && !exists(data.families.heavy_crossbow.source_charged_texture)) fail(data.families.heavy_crossbow.source_charged_texture, 'Heavy source art is missing')
const commonHeavyModels = { loaded:'awakening:item/crossbows/heavy_crossbow_loaded_arrow', firing:'awakening:item/crossbows/heavy_crossbow_firing_arrow' }
for (const [state,id] of Object.entries(commonHeavyModels)) {
  const file=modelFile(id), json=exists(file)?parseJson(file):null
  if (!exists(file)) fail(file, `missing shared Heavy ${state} model`)
  if (json && (json.parent !== `spartanweaponry:item/base/heavy_crossbow_${state}` || json.textures?.layer1 !== 'awakening:item/crossbows/heavy_crossbow_arrow_overlay')) fail(file, `invalid shared Heavy ${state} model`)
}
for (const material of data.materials) {
  const [namespace,item]=material.heavy_output.split(':',2)
  for (const state of ['loaded','firing']) {
    const file=`kubejs/assets/${namespace}/models/item/${item}_${state}.json`, json=exists(file)?parseJson(file):null
    if (!exists(file)) { fail(file, `${material.id}: missing Heavy ${state} override`); continue }
    if (json && (json.parent !== commonHeavyModels[state] || json.textures?.layer0 !== `${namespace}:item/${item}_pulling_2`)) fail(file, `${material.id}: invalid Heavy ${state} override`)
  }
}
const heavyMixin='custom_mods/awakening-compat/src/main/java/dev/xaulim/awakeningicaruscompat/mixin/HeavyCrossbowArrowMixin.java'
if (!exists(heavyMixin)) fail(heavyMixin,'missing Heavy Crossbow mixin')
else {
  const java=read(heavyMixin)
  for (const token of ['@Mixin(HeavyCrossbowItem.class)','instanceof ArrowItem','getAllSupportedProjectiles','getSupportedHeldProjectiles','releaseUsing','createArrow','NBT_CHARGED','NBT_PROJECTILE','Enchantments.MULTISHOT','Enchantments.PIERCING','HEAVY_PROJECTILE_VELOCITY = 4.5F','arrowItem.isInfinite(storedArrow, crossbow, player)']) if (!java.includes(token)) fail(heavyMixin, `missing integration token: ${token}`)
}
const mixinConfig='custom_mods/awakening-compat/src/main/resources/awakening_compat.mixins.json'
if (!exists(mixinConfig)) fail(mixinConfig,'missing mixin config')
else { const cfg=parseJson(mixinConfig), all=[...(cfg?.mixins||[]),...(cfg?.client||[]),...(cfg?.server||[])]; if (!all.includes('HeavyCrossbowArrowMixin')) fail(mixinConfig,'Heavy mixin not registered') }
for (const file of ['kubejs/awakening/weapon_parts.json','kubejs/awakening/twilight_weapon_parts.json','kubejs/startup_scripts/awakening_weapon_parts.js','kubejs/server_scripts/awakening_weapon_parts.js']) {
  if (!exists(file)) { fail(file,'missing progression file'); continue }
  if (/heavy_crossbow_limb|crossbow_limb/i.test(read(file))) fail(file,'crossbow limb residue remains')
}
const weaponParts=parseJson('kubejs/awakening/weapon_parts.json')
if (weaponParts?.templates?.heavy_crossbow) fail('kubejs/awakening/weapon_parts.json','legacy Heavy template remains')
if (weaponParts?.materials?.some(m=>m.weapons?.some(w=>w.type==='heavy_crossbow'))) fail('kubejs/awakening/weapon_parts.json','legacy Heavy material entry remains')
const twilight=parseJson('kubejs/awakening/twilight_weapon_parts.json')
if (twilight?.weapon_types?.includes('heavy_crossbow')) fail('kubejs/awakening/twilight_weapon_parts.json','heavy_crossbow remains in legacy matrix')
if (errors.length) { console.error(`[validate_crossbows] ${errors.length} error(s):`); for (const error of errors) console.error(`- ${error}`); process.exit(1) }
console.log(`[validate_crossbows] OK: ${data.materials.length} canonical materials x ${requiredFamilies.length} families; ${recipes.size} recipes; arrow ammo, Heavy compatibility, visuals and bolt/limb exclusions validated.`)

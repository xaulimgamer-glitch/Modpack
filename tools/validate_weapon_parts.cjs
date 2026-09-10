// Static contract checks with mocked KubeJS events, NOT a Minecraft runtime test.
const fs = require('node:fs')
const vm = require('node:vm')
const assert = require('node:assert/strict')
const path = require('node:path')
const root = path.resolve(__dirname, '..')
const clone = value => JSON.parse(JSON.stringify(value))
const full = JSON.parse(fs.readFileSync(path.join(root, 'kubejs/awakening/weapon_parts.json')))
const prototypeTypes = ['dagger', 'pike', 'quarterstaff', 'boomerang', 'longbow', 'heavy_crossbow']
const prototype = clone(full)
prototype.materials = prototype.materials.filter(m => m.id === 'cloggrum')
prototype.materials[0].weapons = prototype.materials[0].weapons.filter(w => prototypeTypes.includes(w.type))

function run(data, missing) {
  const items = new Map()
  const tags = new Map()
  const callbacks = {}
  const recipes = new Map()
  const removed = []
  const queue = []
  function addTag(tag, item) {
    if (!tags.has(tag)) tags.set(tag, new Set())
    tags.get(tag).add(item)
  }
  // Fixture IDs are deliberately test-only. Runtime resolves actual tag members.
  data.materials.forEach(m => {
    addTag(m.ingredient_tag, 'test:' + m.id + '_ingot')
    m.weapons.forEach(w => {
      items.set(w.original.result.item, {})
      Object.values(w.original.key).forEach(v => {
        if (v.item) items.set(v.item, {})
        if (v.tag && !tags.has(v.tag)) addTag(v.tag, 'test:ingredient')
      })
      recipes.set(w.source_recipe, clone(w.original))
      recipes.set('test:alternate/' + w.original.result.item.replace(':', '/'), clone(w.original))
    })
  })
  items.set('minecraft:stick', {})
  items.set('minecraft:tripwire_hook', {})
  addTag('minecraft:planks', 'test:plank')
  addTag('forge:string', 'test:string')
  addTag('overgeared:smithing_hammers', 'test:hammer')
  if (missing) tags.delete(data.materials[0].ingredient_tag)
  const registered = []
  const context = {
    console: { info() {} },
    JsonIO: { readString: () => JSON.stringify(data) },
    StartupEvents: { registry(type, callback) {
      assert.equal(type, 'item')
      callback({ create(id) {
        assert.ok(!items.has(id), 'Never recreate an original weapon: ' + id)
        assert.match(id, /^awakening:/)
        const value = { id }
        items.set(id, value)
        registered.push(value)
        const builder = {}
        for (const method of ['displayName', 'texture', 'color', 'tooltip']) {
          builder[method] = (...args) => { value[method] = args; return builder }
        }
        return builder
      } })
    } },
    ServerEvents: {
      tags(type, callback) { callbacks.tags = callback },
      recipes(callback) { callbacks.recipes = callback }
    },
    Ingredient: { of(value) {
      const v = typeof value === 'string' ? { tag: value.substring(1) } : value
      const ids = v.tag ? [...(tags.get(v.tag) || [])] : items.has(v.item) ? [v.item] : []
      return { itemIds: { size: () => ids.length, forEach: f => ids.forEach(f) } }
    } }
  }
  vm.createContext(context)
  for (const phase of ['startup', 'server']) {
    const filename = path.join(root, 'kubejs', phase + '_scripts/awakening_weapon_parts.js')
    vm.runInContext(fs.readFileSync(filename, 'utf8'), context, { filename })
  }
  callbacks.tags({ add: addTag })
  const event = {
    remove(filter) {
      removed.push(filter.output)
      for (const [id, recipe] of recipes) if (recipe.result?.item === filter.output) recipes.delete(id)
    },
    custom(json) { return { id(id) {
      assert.ok(!queue.includes(id), 'Duplicate generated ID: ' + id)
      queue.push(id)
      recipes.set(id, clone(json))
    } } }
  }
  if (missing) {
    assert.throws(() => callbacks.recipes(event), /Missing ingredient/)
    assert.equal(removed.length, 0, 'Preflight failure must not remove crafts')
    return
  }
  callbacks.recipes(event)
  const weapons = data.materials.flatMap(m => m.weapons)
  assert.equal(registered.length, weapons.length + data.materials.length)
  assert.equal(removed.length, weapons.length)
  for (const m of data.materials) {
    const prefix = 'awakening:weapon_parts/' + m.id + '/'
    const cut = recipes.get(prefix + 'fragments')
    assert.equal(cut.result.count, 9)
    assert.equal(cut.ingredients[0].tag, m.ingredient_tag)
    assert.equal(cut.ingredients[1].remainder, true)
    assert.equal(cut.ingredients[1].durability_decrease, 1)
    for (const w of m.weapons) {
      const t = data.templates[w.type]
      const forge = recipes.get(prefix + 'forge/' + w.type)
      assert.deepEqual(forge.pattern, t.forging.pattern)
      assert.equal(forge.result.item, w.part)
      assert.equal(forge.result.count || 1, 1)
      for (const ing of Object.values(forge.key)) assert.equal(ing.requires_heated, true)
      const pattern = forge.pattern.join('')
      const materialUnits = [...pattern].reduce((sum, c) => sum + (c === 'X' ? 9 : c === 'x' ? 1 : 0), 0)
      assert.ok(materialUnits > 0)
      assert.equal(materialUnits, [...t.forging.pattern.join('')].reduce((sum, c) => sum + (c === 'X' ? 9 : c === 'x' ? 1 : 0), 0))
      const assembly = recipes.get(prefix + 'assemble/' + w.type)
      assert.deepEqual(assembly.result, w.original.result, 'Preserve output, count and enchantment NBT')
      assert.equal(assembly.result.count || 1, 1, 'One consumed part must not multiply weapons')
      assert.deepEqual(assembly.conditions, w.original.conditions || [])
      assert.equal([...recipes.values()].filter(r => r.result?.item === w.original.result.item).length, 1)
      const inputs = assembly.ingredients || assembly.pattern.join('').split('').filter(c => c !== ' ').map(c => assembly.key[c])
      assert.equal(inputs.filter(i => i.item === w.part).length, 1)
      assert.ok(inputs.every(i => i.tag !== m.ingredient_tag))
      if (assembly.ingredients) {
        const expected = w.original.pattern.join('').split('').filter(c => c !== ' ' && c !== w.material_key).map(c => w.original.key[c])
        assert.deepEqual(inputs.slice(1), expected, 'Preserve original melee handle/pole multiplicity')
      }
      if (w.type === 'pike') assert.equal(inputs.length, 3, 'Pike must retain both poles')
      if (w.type === 'longbow' || w.type === 'heavy_crossbow') {
        assert.deepEqual(assembly.key.h, w.original.key['|'])
        assert.ok(inputs.some(i => i.tag === 'forge:string'))
      }
      const item = items.get(w.part)
      assert.deepEqual(item.texture, [t.texture])
      assert.deepEqual(item.color, [0, parseInt(m.color, 16)])
      assert.ok(tags.get('overgeared:tool_parts').has(w.part))
    }
  }
  const heats = [...recipes.values()].filter(r => r.type === 'overgeared:nbt_add_blasting')
  for (const r of heats) {
    assert.equal(r.result.item, r.ingredient.item)
    assert.equal(r.result.count, 1)
    assert.equal(r.experience, 0)
    assert.equal(r.nbt.Heated, true)
  }
  // Replaying a resource reload must not create parallel original/new assemblies.
  queue.length = 0
  callbacks.recipes(event)
  for (const w of weapons) assert.equal([...recipes.values()].filter(r => r.result?.item === w.original.result.item).length, 1)
  console.log(`STATIC-OBSERVED: ${weapons.length} parts, ${registered.length} registrations, ${queue.length} recipes; NBT, components, heating, removals and reload checked.`)
}

run(prototype)
if (!process.argv.includes('--prototype')) run(full)
run(prototype, true)
console.log('Missing-tag preflight checked. LIVE-VERIFIED: pending Minecraft test.')

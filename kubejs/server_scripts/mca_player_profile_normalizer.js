// Awakening / MCA hidden player profile normalizer
// v0.4 — Rhino try/const fix — P0 RETEST

const MCA_NEUTRAL_GENES = [
  'gene_size',
  'gene_width',
  'gene_breast',
  'gene_melanin',
  'gene_hemoglobin',
  'gene_eumelanin',
  'gene_pheomelanin',
  'gene_skin',
  'gene_face',
  'gene_voice',
  'gene_voice_tone'
]

PlayerEvents.loggedIn(event => {
  const player = event.player

  try {
    var $MCAPlayerSaveData = Java.loadClass(
      'forge.net.mca.server.world.data.PlayerSaveData'
    )

    var $CompoundTag = Java.loadClass(
      'net.minecraft.nbt.CompoundTag'
    )

    var data = $MCAPlayerSaveData.get(player)
    var entityData = data.getEntityData().copy()

    MCA_NEUTRAL_GENES.forEach(key => {
      entityData.putFloat(key, 0.5)
    })

    entityData.put('traits', new $CompoundTag())

    data.setEntityData(entityData)
    data.setEntityDataSet(true)

    try {
      data.setDirty()
    } catch (dirtyError) {
      try {
        data.markDirty()
      } catch (ignored) {
        console.warn(
          `[Awakening/MCA] Profile normalized in memory but dirty marker method was not found: ${dirtyError}`
        )
      }
    }

    console.info(
      `[Awakening/MCA] Normalized hidden MCA profile for ${player.name.string}`
    )
  } catch (error) {
    console.error(
      `[Awakening/MCA] MCA normalization failed: ${error}`
    )
  }
})
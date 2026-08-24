StartupEvents.registry('item', event => {

    event.create('crude_short_bow', 'bow')
        .displayName('Crude Short Bow')
        .maxDamage(64)
        .bow(bow => {
            bow.modifyBow(attributes => {
                attributes
                    .fullChargeTick(12)
                    .baseDamage(1.0)
            })
        })

})
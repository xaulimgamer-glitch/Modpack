ServerEvents.recipes(event => {

    event.remove({
    output: 'magistuarmory:steel_ingot'
    })

    const epicSteel = 'magistuarmory:steel_ingot'
    const overgearedSteel = 'overgeared:steel_ingot'

    event.remove({
        output: epicSteel
    })

    event.replaceInput(
        { input: epicSteel },
        epicSteel,
        overgearedSteel
    )

})
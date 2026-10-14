ServerEvents.loaded(event => {
    let items = []
    let namespaces = {}

    Ingredient.all.itemIds.forEach(rawId => {
        let id = rawId.toString()
        let namespace = id.split(':')[0]

        if (namespaces[namespace] == null) {
            namespaces[namespace] = 0
        }

        namespaces[namespace]++

        let tags = []
        let itemClass = ""

        try {
            let stack = Item.of(id)

            try {
                stack.tags.forEach(tag => {
                    tags.push(tag.toString())
                })
            } catch (ignored) {
            }

            try {
                itemClass = stack.item.getClass().getName()
            } catch (ignored) {
            }

        } catch (ignored) {
        }

        items.push({
            id: id,
            namespace: namespace,
            class: itemClass,
            tags: tags
        })
    })

    items.sort((a, b) => {
        if (a.id < b.id) return -1
        if (a.id > b.id) return 1
        return 0
    })

    JsonIO.write('kubejs/awakening_item_registry.json', {
        minecraft: '1.20.1',
        total_items: items.length,
        namespaces: namespaces,
        items: items
    })

    console.info('[Awakening Registry Dump] Exportados ' + items.length + ' itens.')
})

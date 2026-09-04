PlayerEvents.loggedIn(event => {
    const data = event.player.persistentData

    if (!data.seenWelcomeMessage) {
        data.seenWelcomeMessage = true

        event.player.tell(Text.darkGray('--------------------------------'))
        event.player.tell(Text.gold('✦ Your Awakening awaits. ✦'))
        event.player.tell(
            Text.gray('Press ')
                .append(Text.yellow('[L]'))
                .append(Text.gray(' to begin your journey.'))
        )
        event.player.tell(Text.darkGray('--------------------------------'))
    }
})
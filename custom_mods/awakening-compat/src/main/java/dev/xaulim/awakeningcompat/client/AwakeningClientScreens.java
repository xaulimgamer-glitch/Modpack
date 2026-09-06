package dev.xaulim.awakeningcompat.client;

import net.minecraft.client.Minecraft;

public final class AwakeningClientScreens {

    private AwakeningClientScreens() {}

    /**
     * Closes the screen currently open on the client.
     *
     * The Awakening commands send this packet specifically while the player is
     * claiming an FTB Quests reward. Trying to identify QuestScreen through FTB
     * Library's wrappers proved brittle across versions, so the transition now
     * behaves like pressing Escape: close whatever screen is currently open.
     *
     * For race/class transitions the server sends this close request before it
     * executes the Origins GUI command, so the selection screen is opened after
     * the quest book has been dismissed.
     */
    public static void closeQuestBook() {
        Minecraft minecraft = Minecraft.getInstance();
        if (minecraft.screen != null) {
            minecraft.setScreen(null);
        }
    }
}

package dev.xaulim.awakeningcompat.client;

import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.screens.Screen;

public final class AwakeningClientScreens {

    private static final String FTB_QUESTS_GUI_PREFIX =
            "dev.ftb.mods.ftbquests.client.gui.quests.";

    private AwakeningClientScreens() {}

    /**
     * Closes only the FTB Quests book. This is intentionally narrower than
     * Minecraft#setScreen(null): if an Origins selection packet reaches the
     * client first, we must not immediately close that newly-opened screen.
     */
    public static void closeQuestBook() {
        Minecraft minecraft = Minecraft.getInstance();
        Screen screen = minecraft.screen;
        if (screen == null) return;

        Class<?> type = screen.getClass();
        while (type != null) {
            if (type.getName().startsWith(FTB_QUESTS_GUI_PREFIX)) {
                minecraft.setScreen(null);
                return;
            }
            type = type.getSuperclass();
        }
    }
}

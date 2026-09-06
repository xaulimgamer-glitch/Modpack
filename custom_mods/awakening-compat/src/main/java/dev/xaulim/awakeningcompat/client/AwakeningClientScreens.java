package dev.xaulim.awakeningcompat.client;

import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.screens.Screen;

import java.lang.reflect.Method;

public final class AwakeningClientScreens {

    private static final String FTB_QUESTS_GUI_PREFIX =
            "dev.ftb.mods.ftbquests.client.gui.";

    private static final String FTB_LIBRARY_WRAPPER_PREFIX =
            "dev.ftb.mods.ftblibrary.client.gui.";

    private AwakeningClientScreens() {}

    /**
     * Closes only the FTB Quests book.
     *
     * FTB Library does not expose QuestScreen directly as Minecraft.screen.
     * QuestScreen extends FTB Library's BaseScreen, and BaseScreen is presented to
     * Minecraft through ScreenWrapper. Therefore checking minecraft.screen's class
     * for the ftbquests package will never match in normal use.
     *
     * We intentionally avoid a compile-time FTB Library dependency here. Instead,
     * when the current vanilla Screen is an FTB Library wrapper, we use its public
     * getGui() method reflectively and verify that the wrapped BaseScreen belongs to
     * FTB Quests before closing it.
     */
    public static void closeQuestBook() {
        Minecraft minecraft = Minecraft.getInstance();
        Screen screen = minecraft.screen;
        if (screen == null) return;

        if (isFtbQuestsType(screen.getClass())) {
            minecraft.setScreen(null);
            return;
        }

        if (!screen.getClass().getName().startsWith(FTB_LIBRARY_WRAPPER_PREFIX)) {
            return;
        }

        try {
            Method getGui = screen.getClass().getMethod("getGui");
            Object wrappedGui = getGui.invoke(screen);

            if (wrappedGui != null && isFtbQuestsType(wrappedGui.getClass())) {
                minecraft.setScreen(null);
            }
        } catch (ReflectiveOperationException ignored) {
            // If FTB Library changes its wrapper API, fail safely and leave an
            // unrelated screen open rather than closing arbitrary client GUIs.
        }
    }

    private static boolean isFtbQuestsType(Class<?> type) {
        Class<?> current = type;
        while (current != null) {
            if (current.getName().startsWith(FTB_QUESTS_GUI_PREFIX)) {
                return true;
            }
            current = current.getSuperclass();
        }
        return false;
    }
}

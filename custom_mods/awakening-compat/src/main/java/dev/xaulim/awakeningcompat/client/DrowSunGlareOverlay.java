package dev.xaulim.awakeningcompat.client;

import com.mojang.blaze3d.systems.RenderSystem;
import com.mojang.blaze3d.vertex.BufferBuilder;
import com.mojang.blaze3d.vertex.DefaultVertexFormat;
import com.mojang.blaze3d.vertex.Tesselator;
import com.mojang.blaze3d.vertex.VertexFormat;
import dev.xaulim.awakeningcompat.AwakeningCompat;
import io.github.edwinmindcraft.apoli.api.ApoliAPI;
import io.github.edwinmindcraft.apoli.api.component.IPowerContainer;
import io.github.edwinmindcraft.apoli.api.power.configuration.ConfiguredPower;
import io.github.edwinmindcraft.apoli.common.condition.entity.SimpleEntityCondition;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.renderer.GameRenderer;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.util.Mth;
import net.minecraft.world.entity.player.Player;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.client.event.RegisterGuiOverlaysEvent;
import net.minecraftforge.client.gui.overlay.ForgeGui;
import net.minecraftforge.client.gui.overlay.IGuiOverlay;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

import java.util.OptionalInt;

/**
 * Renders the Drow's direct-sun glare from the synchronized dark-adaptation
 * resource. Mechanics remain datapack-driven; this class only interpolates the
 * visual opacity between resource updates.
 */
@Mod.EventBusSubscriber(
        modid = AwakeningCompat.MOD_ID,
        bus = Mod.EventBusSubscriber.Bus.MOD,
        value = Dist.CLIENT
)
public final class DrowSunGlareOverlay implements IGuiOverlay {

    private static final DrowSunGlareOverlay INSTANCE = new DrowSunGlareOverlay();

    private static final ResourceLocation DARK_ADAPTATION = new ResourceLocation(
            "rpgraces",
            "elf/drow/sun_sensitivity_dark_adaptation"
    );
    private static final ResourceLocation GLARE_TEXTURE = new ResourceLocation(
            "rpgraces",
            "textures/gui/sun_glare.png"
    );

    private static final float BASE_GLARE = 0.15F;
    private static final float ADAPTATION_GLARE = 0.40F;
    private static final float RECOVERY_SMOOTHING_SECONDS = 0.18F;
    private static final float MAX_FRAME_DELTA_SECONDS = 0.10F;

    private float displayedAlpha;
    private boolean wasExposedToSun;
    private long lastFrameNanos;

    private DrowSunGlareOverlay() {}

    @SubscribeEvent
    public static void registerOverlays(RegisterGuiOverlaysEvent event) {
        event.registerBelowAll("drow_sun_glare", INSTANCE);
    }

    @Override
    public void render(
            ForgeGui gui,
            GuiGraphics graphics,
            float partialTick,
            int screenWidth,
            int screenHeight
    ) {
        Minecraft minecraft = Minecraft.getInstance();
        Player player = minecraft.player;
        long now = System.nanoTime();

        if (player == null || !minecraft.options.getCameraType().isFirstPerson()) {
            reset(now);
            return;
        }

        OptionalInt adaptation = getDarkAdaptation(player);
        if (adaptation.isEmpty() || !SimpleEntityCondition.isExposedToSun(player)) {
            reset(now);
            return;
        }

        float normalizedAdaptation = Mth.clamp(adaptation.getAsInt() / 100.0F, 0.0F, 1.0F);
        float targetAlpha = BASE_GLARE + ADAPTATION_GLARE * normalizedAdaptation;

        if (!wasExposedToSun || lastFrameNanos == 0L || targetAlpha >= displayedAlpha) {
            // Entering sunlight, or becoming more dark-adapted, must feel immediate.
            displayedAlpha = targetAlpha;
        } else {
            float deltaSeconds = Mth.clamp(
                    (now - lastFrameNanos) / 1_000_000_000.0F,
                    0.0F,
                    MAX_FRAME_DELTA_SECONDS
            );
            float blend = 1.0F - (float) Math.exp(-deltaSeconds / RECOVERY_SMOOTHING_SECONDS);
            displayedAlpha = Mth.lerp(blend, displayedAlpha, targetAlpha);

            if (Math.abs(displayedAlpha - targetAlpha) < 0.0005F) {
                displayedAlpha = targetAlpha;
            }
        }

        wasExposedToSun = true;
        lastFrameNanos = now;

        renderGlare(screenWidth, screenHeight, displayedAlpha);
    }

    private static OptionalInt getDarkAdaptation(Player player) {
        return IPowerContainer.get(player).resolve()
                .map(container -> {
                    if (!container.hasPower(DARK_ADAPTATION)) {
                        return OptionalInt.empty();
                    }

                    ConfiguredPower<?, ?> power = ApoliAPI.getPowers().get(DARK_ADAPTATION);
                    return power == null ? OptionalInt.empty() : power.getValue(player);
                })
                .orElseGet(OptionalInt::empty);
    }

    private void reset(long now) {
        displayedAlpha = 0.0F;
        wasExposedToSun = false;
        lastFrameNanos = now;
    }

    private static void renderGlare(int screenWidth, int screenHeight, float alpha) {
        RenderSystem.disableDepthTest();
        RenderSystem.depthMask(false);
        RenderSystem.enableBlend();
        RenderSystem.defaultBlendFunc();
        RenderSystem.setShaderColor(1.0F, 1.0F, 1.0F, alpha);
        RenderSystem.setShader(GameRenderer::getPositionTexShader);
        RenderSystem.setShaderTexture(0, GLARE_TEXTURE);

        Tesselator tesselator = Tesselator.getInstance();
        BufferBuilder buffer = tesselator.getBuilder();
        buffer.begin(VertexFormat.Mode.QUADS, DefaultVertexFormat.POSITION_TEX);
        buffer.vertex(0.0D, screenHeight, -90.0D).uv(0.0F, 1.0F).endVertex();
        buffer.vertex(screenWidth, screenHeight, -90.0D).uv(1.0F, 1.0F).endVertex();
        buffer.vertex(screenWidth, 0.0D, -90.0D).uv(1.0F, 0.0F).endVertex();
        buffer.vertex(0.0D, 0.0D, -90.0D).uv(0.0F, 0.0F).endVertex();
        tesselator.end();

        RenderSystem.setShaderColor(1.0F, 1.0F, 1.0F, 1.0F);
        RenderSystem.defaultBlendFunc();
        RenderSystem.disableBlend();
        RenderSystem.depthMask(true);
        RenderSystem.enableDepthTest();
    }
}

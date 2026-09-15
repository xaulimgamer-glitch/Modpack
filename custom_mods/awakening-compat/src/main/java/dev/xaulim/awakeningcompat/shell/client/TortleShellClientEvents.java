package dev.xaulim.awakeningcompat.shell.client;

import com.mojang.blaze3d.vertex.PoseStack;
import com.mojang.blaze3d.vertex.VertexConsumer;
import com.mojang.math.Axis;
import dev.xaulim.awakeningcompat.AwakeningCompat;
import dev.xaulim.awakeningcompat.shell.TortleShellAction;
import dev.xaulim.awakeningcompat.shell.TortleShellRegistries;
import net.minecraft.client.CameraType;
import net.minecraft.client.Minecraft;
import net.minecraft.client.gui.GuiGraphics;
import net.minecraft.client.renderer.RenderType;
import net.minecraft.client.renderer.texture.OverlayTexture;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.player.Player;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.client.event.InputEvent;
import net.minecraftforge.client.event.MovementInputUpdateEvent;
import net.minecraftforge.client.event.RenderHandEvent;
import net.minecraftforge.client.event.RenderPlayerEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

@Mod.EventBusSubscriber(modid = AwakeningCompat.MOD_ID, value = Dist.CLIENT)
public final class TortleShellClientEvents {

    private static final ResourceLocation SHELL_TEXTURE = new ResourceLocation(
            AwakeningCompat.MOD_ID,
            "textures/misc/shell_crack_none.png"
    );

    private static final int VISION_BLACKOUT_COLOR = 0xFF000000;
    private static final int GUARD_SEGMENTS = 16;
    private static final int GUARD_SEGMENT_WIDTH = 4;
    private static final int GUARD_SEGMENT_HEIGHT = 5;
    private static final int GUARD_SEGMENT_GAP = 1;
    private static final int GUARD_BACKGROUND_COLOR = 0xCC101010;
    private static final int GUARD_EMPTY_COLOR = 0xFF3A3A3A;
    private static final int GUARD_FILL_COLOR = 0xFF55AA55;

    private static TortleShellModel model;
    private static float shellGuard;

    private TortleShellClientEvents() {}

    public static boolean hasNaturalShell(Player player) {
        return player.getItemBySlot(EquipmentSlot.CHEST).is(TortleShellRegistries.TORTLE_SHELL_ITEM.get());
    }

    public static boolean isShelled(Player player) {
        return hasNaturalShell(player) && player.hasEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
    }

    public static void setShellGuard(float amount) {
        shellGuard = Math.max(0.0F, Math.min(TortleShellAction.MAX_SHELL_GUARD, amount));
    }

    private static TortleShellModel getModel() {
        if (model == null) {
            model = new TortleShellModel(
                    Minecraft.getInstance().getEntityModels().bakeLayer(TortleShellModel.LAYER_LOCATION)
            );
        }
        return model;
    }

    /**
     * Other players still see the closed shell model in world space. For the local
     * first-person player we intentionally do not render the 3D shell around the
     * camera because the near clipping plane intersects that geometry.
     */
    @SubscribeEvent
    public static void onPlayerRenderPre(RenderPlayerEvent.Pre event) {
        Player player = event.getEntity();
        if (!isShelled(player)) return;

        Minecraft minecraft = Minecraft.getInstance();
        if (player == minecraft.player && minecraft.options.getCameraType() == CameraType.FIRST_PERSON) {
            return;
        }

        event.setCanceled(true);
        PoseStack poseStack = event.getPoseStack();
        poseStack.pushPose();
        poseStack.mulPose(Axis.YP.rotationDegrees(180.0F));
        poseStack.translate(0.0F, -1.5F, 0.0F);

        VertexConsumer vertexConsumer = event.getMultiBufferSource().getBuffer(
                RenderType.entityCutoutNoCull(SHELL_TEXTURE)
        );
        getModel().render(
                poseStack,
                vertexConsumer,
                event.getPackedLight(),
                OverlayTexture.NO_OVERLAY
        );
        poseStack.popPose();
    }

    /**
     * A withdrawn Tortle cannot see the world at all. The overlay is independent
     * of camera mode, so first-person and both third-person views remain fully
     * black while the normal HUD can still be rendered above it.
     */
    public static void renderShellVision(GuiGraphics graphics, int screenWidth, int screenHeight) {
        Player player = Minecraft.getInstance().player;
        if (player == null || !isShelled(player)) return;
        graphics.fill(0, 0, screenWidth, screenHeight, VISION_BLACKOUT_COLOR);
    }

    /**
     * Shows the synchronized shell integrity as sixteen two-point segments. The
     * overlay is rendered after the normal HUD so it remains readable on top of
     * the blackout without replacing vanilla health, armor or hotbar elements.
     */
    public static void renderShellGuard(GuiGraphics graphics, int screenWidth, int screenHeight) {
        Player player = Minecraft.getInstance().player;
        if (player == null || !isShelled(player) || shellGuard <= 0.0F) return;

        int totalWidth = GUARD_SEGMENTS * GUARD_SEGMENT_WIDTH
                + (GUARD_SEGMENTS - 1) * GUARD_SEGMENT_GAP;
        int startX = (screenWidth - totalWidth) / 2;
        int startY = screenHeight - 50;

        graphics.fill(
                startX - 2,
                startY - 2,
                startX + totalWidth + 2,
                startY + GUARD_SEGMENT_HEIGHT + 2,
                GUARD_BACKGROUND_COLOR
        );

        float pointsPerSegment = TortleShellAction.MAX_SHELL_GUARD / GUARD_SEGMENTS;
        for (int segment = 0; segment < GUARD_SEGMENTS; segment++) {
            int x = startX + segment * (GUARD_SEGMENT_WIDTH + GUARD_SEGMENT_GAP);
            graphics.fill(
                    x,
                    startY,
                    x + GUARD_SEGMENT_WIDTH,
                    startY + GUARD_SEGMENT_HEIGHT,
                    GUARD_EMPTY_COLOR
            );

            float segmentRemaining = shellGuard - segment * pointsPerSegment;
            float fillFraction = Math.max(0.0F, Math.min(1.0F, segmentRemaining / pointsPerSegment));
            if (fillFraction <= 0.0F) continue;

            int fillWidth = Math.max(1, Math.round(GUARD_SEGMENT_WIDTH * fillFraction));
            graphics.fill(
                    x,
                    startY,
                    x + fillWidth,
                    startY + GUARD_SEGMENT_HEIGHT,
                    GUARD_FILL_COLOR
            );
        }
    }

    @SubscribeEvent
    public static void onMovementInputUpdate(MovementInputUpdateEvent event) {
        Player player = Minecraft.getInstance().player;
        if (player == null || !isShelled(player)) return;

        event.getInput().leftImpulse = 0.0F;
        event.getInput().forwardImpulse = 0.0F;
        event.getInput().up = false;
        event.getInput().down = false;
        event.getInput().left = false;
        event.getInput().right = false;
        event.getInput().jumping = false;
    }

    @SubscribeEvent
    public static void onInteractionKey(InputEvent.InteractionKeyMappingTriggered event) {
        Player player = Minecraft.getInstance().player;
        if (player == null || !isShelled(player)) return;

        if (event.isAttack() || event.isUseItem()) {
            event.setSwingHand(false);
            event.setCanceled(true);
        }
    }

    @SubscribeEvent
    public static void onRenderHand(RenderHandEvent event) {
        Player player = Minecraft.getInstance().player;
        if (player != null && isShelled(player)) {
            event.setCanceled(true);
        }
    }
}

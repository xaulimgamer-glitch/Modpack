package dev.xaulim.awakeningcompat.shell.client;

import com.mojang.blaze3d.vertex.PoseStack;
import com.mojang.blaze3d.vertex.VertexConsumer;
import com.mojang.math.Axis;
import dev.xaulim.awakeningcompat.AwakeningCompat;
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
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

@Mod.EventBusSubscriber(modid = AwakeningCompat.MOD_ID, value = Dist.CLIENT)
public final class TortleShellClientEvents {

    private static final ResourceLocation SHELL_TEXTURE = new ResourceLocation(
            AwakeningCompat.MOD_ID,
            "textures/misc/shell_crack_none.png"
    );

    private static final int VISION_MASK_COLOR = 0xFF100B07;
    private static final int VISION_RIM_COLOR = 0xFF382618;
    private static final float VISION_OPENING_RADIUS = 0.30F;
    private static final float VISION_RIM_THICKNESS = 0.045F;

    private static TortleShellModel model;
    private static CameraType previousCameraType;

    private TortleShellClientEvents() {}

    public static boolean hasNaturalShell(Player player) {
        return player.getItemBySlot(EquipmentSlot.CHEST).is(TortleShellRegistries.TORTLE_SHELL_ITEM.get());
    }

    public static boolean isShelled(Player player) {
        return hasNaturalShell(player) && player.hasEffect(TortleShellRegistries.TORTLE_SHELL_EFFECT.get());
    }

    private static TortleShellModel getModel() {
        if (model == null) {
            model = new TortleShellModel(
                    Minecraft.getInstance().getEntityModels().bakeLayer(TortleShellModel.LAYER_LOCATION)
            );
        }
        return model;
    }

    @SubscribeEvent
    public static void onClientTick(TickEvent.ClientTickEvent event) {
        if (event.phase != TickEvent.Phase.END) return;

        Minecraft minecraft = Minecraft.getInstance();
        Player player = minecraft.player;

        if (player != null && isShelled(player)) {
            if (previousCameraType == null) {
                previousCameraType = minecraft.options.getCameraType();
            }
            if (minecraft.options.getCameraType() != CameraType.FIRST_PERSON) {
                minecraft.options.setCameraType(CameraType.FIRST_PERSON);
            }
        } else if (previousCameraType != null) {
            minecraft.options.setCameraType(previousCameraType);
            previousCameraType = null;
        }
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
     * Procedural first-person shell vision. Nothing is sampled from a texture:
     * opaque scanline rectangles cover everything except a circular opening in
     * the middle of the screen. A brown annulus around the opening suggests the
     * inner lip of the shell while keeping the center completely unobstructed.
     */
    public static void renderShellVision(GuiGraphics graphics, int screenWidth, int screenHeight) {
        Minecraft minecraft = Minecraft.getInstance();
        Player player = minecraft.player;
        if (player == null || !isShelled(player)) return;
        if (minecraft.options.getCameraType() != CameraType.FIRST_PERSON) return;

        int centerX = screenWidth / 2;
        int centerY = screenHeight / 2;
        float basis = Math.min(screenWidth, screenHeight);
        float innerRadius = Math.max(18.0F, basis * VISION_OPENING_RADIUS);
        float outerRadius = innerRadius + Math.max(4.0F, basis * VISION_RIM_THICKNESS);

        // Two GUI pixels per band keeps the circle smooth enough at normal GUI
        // scales while avoiding hundreds of unnecessary individual draw calls.
        final int bandHeight = 2;
        for (int y = 0; y < screenHeight; y += bandHeight) {
            int yEnd = Math.min(y + bandHeight, screenHeight);
            float sampleY = y + (yEnd - y) * 0.5F;
            float dy = sampleY - centerY;
            float absDy = Math.abs(dy);

            if (absDy >= outerRadius) {
                graphics.fill(0, y, screenWidth, yEnd, VISION_MASK_COLOR);
                continue;
            }

            int outerDx = (int) Math.ceil(Math.sqrt(outerRadius * outerRadius - dy * dy));
            int outerLeft = Math.max(0, centerX - outerDx);
            int outerRight = Math.min(screenWidth, centerX + outerDx);

            if (outerLeft > 0) {
                graphics.fill(0, y, outerLeft, yEnd, VISION_MASK_COLOR);
            }
            if (outerRight < screenWidth) {
                graphics.fill(outerRight, y, screenWidth, yEnd, VISION_MASK_COLOR);
            }

            if (absDy >= innerRadius) {
                graphics.fill(outerLeft, y, outerRight, yEnd, VISION_RIM_COLOR);
                continue;
            }

            int innerDx = (int) Math.floor(Math.sqrt(innerRadius * innerRadius - dy * dy));
            int innerLeft = Math.max(outerLeft, centerX - innerDx);
            int innerRight = Math.min(outerRight, centerX + innerDx);

            if (innerLeft > outerLeft) {
                graphics.fill(outerLeft, y, innerLeft, yEnd, VISION_RIM_COLOR);
            }
            if (innerRight < outerRight) {
                graphics.fill(innerRight, y, outerRight, yEnd, VISION_RIM_COLOR);
            }
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

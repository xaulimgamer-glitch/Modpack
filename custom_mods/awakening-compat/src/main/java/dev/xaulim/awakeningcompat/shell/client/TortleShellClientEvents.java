package dev.xaulim.awakeningcompat.shell.client;

import com.mojang.blaze3d.systems.RenderSystem;
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

    private static final ResourceLocation SHELL_VISION_TEXTURE = new ResourceLocation(
            AwakeningCompat.MOD_ID,
            "textures/gui/tortle_shell_vision.png"
    );

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
     * first-person player we intentionally do NOT render the 3D shell around the
     * camera; doing so lets the near clipping plane intersect the model and creates
     * the large black planes seen during testing. First-person uses a dedicated
     * HUD mask instead, like vanilla's carved-pumpkin view.
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
     * Dedicated first-person shell vision. The texture is square and is rendered
     * using the larger screen dimension so the transparent opening remains truly
     * circular instead of stretching into an ellipse on widescreen displays.
     */
    public static void renderShellVision(GuiGraphics graphics, int screenWidth, int screenHeight) {
        Minecraft minecraft = Minecraft.getInstance();
        Player player = minecraft.player;
        if (player == null || !isShelled(player)) return;
        if (minecraft.options.getCameraType() != CameraType.FIRST_PERSON) return;

        int side = Math.max(screenWidth, screenHeight);
        int x = (screenWidth - side) / 2;
        int y = (screenHeight - side) / 2;

        RenderSystem.disableDepthTest();
        RenderSystem.depthMask(false);
        RenderSystem.enableBlend();
        RenderSystem.defaultBlendFunc();
        graphics.setColor(1.0F, 1.0F, 1.0F, 1.0F);
        graphics.blit(
                SHELL_VISION_TEXTURE,
                x,
                y,
                0,
                0.0F,
                0.0F,
                side,
                side,
                256,
                256
        );
        graphics.setColor(1.0F, 1.0F, 1.0F, 1.0F);
        RenderSystem.depthMask(true);
        RenderSystem.enableDepthTest();
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

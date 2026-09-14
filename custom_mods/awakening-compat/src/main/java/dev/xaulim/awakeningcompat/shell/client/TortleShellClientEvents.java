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
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

@Mod.EventBusSubscriber(modid = AwakeningCompat.MOD_ID, value = Dist.CLIENT)
public final class TortleShellClientEvents {

    private static final ResourceLocation SHELL_TEXTURE = new ResourceLocation(
            AwakeningCompat.MOD_ID,
            "textures/misc/shell_crack_none.png"
    );

    private static final int VISION_BLACKOUT_COLOR = 0xFF000000;

    private static TortleShellModel model;

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

package dev.xaulim.awakeningcompat.shell.client;

import com.mojang.blaze3d.vertex.PoseStack;
import com.mojang.blaze3d.vertex.VertexConsumer;
import com.mojang.math.Axis;
import dev.xaulim.awakeningcompat.AwakeningCompat;
import dev.xaulim.awakeningcompat.shell.TortleShellRegistries;
import net.minecraft.client.Minecraft;
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

    private static final ResourceLocation SHELL_TEXTURE =
            new ResourceLocation(AwakeningCompat.MOD_ID, "textures/entity/tortle_shell.png");
    private static TortleShellModel model;

    private TortleShellClientEvents() {}

    private static boolean hasNaturalShell(Player player) {
        return player.getItemBySlot(EquipmentSlot.CHEST).is(TortleShellRegistries.TORTLE_SHELL_ITEM.get());
    }

    private static boolean isShelled(Player player) {
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
    public static void onPlayerRenderPre(RenderPlayerEvent.Pre event) {
        if (!isShelled(event.getEntity())) return;

        event.setCanceled(true);
        PoseStack poseStack = event.getPoseStack();
        poseStack.pushPose();
        poseStack.mulPose(Axis.YP.rotationDegrees(180.0F));
        poseStack.translate(0.0F, -1.5F, 0.0F);
        renderShell(event, poseStack);
        poseStack.popPose();
    }

    @SubscribeEvent
    public static void onPlayerRenderPost(RenderPlayerEvent.Post event) {
        Player player = event.getEntity();
        if (!hasNaturalShell(player) || isShelled(player)) return;

        PoseStack poseStack = event.getPoseStack();
        poseStack.pushPose();

        if (player.isCrouching()) {
            poseStack.translate(0.0F, 0.10F, 0.08F);
            poseStack.mulPose(Axis.XP.rotationDegrees(18.0F));
        }

        poseStack.mulPose(Axis.YP.rotationDegrees(180.0F));
        poseStack.translate(0.0F, -1.25F, -0.30F);
        poseStack.scale(0.55F, 0.68F, 0.18F);
        renderShell(event, poseStack);
        poseStack.popPose();
    }

    private static void renderShell(RenderPlayerEvent event, PoseStack poseStack) {
        VertexConsumer vertexConsumer = event.getMultiBufferSource().getBuffer(
                RenderType.entityCutoutNoCull(SHELL_TEXTURE)
        );
        getModel().render(poseStack, vertexConsumer, event.getPackedLight(), OverlayTexture.NO_OVERLAY);
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
        if (player != null && isShelled(player)) event.setCanceled(true);
    }
}

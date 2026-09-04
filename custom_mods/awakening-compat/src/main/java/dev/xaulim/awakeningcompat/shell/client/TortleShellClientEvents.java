package dev.xaulim.awakeningcompat.shell.client;

import com.mojang.blaze3d.vertex.PoseStack;
import com.mojang.blaze3d.vertex.VertexConsumer;
import com.mojang.math.Axis;
import dev.xaulim.awakeningcompat.AwakeningCompat;
import dev.xaulim.awakeningcompat.shell.TortleShellRegistries;
import net.minecraft.client.CameraType;
import net.minecraft.client.Minecraft;
import net.minecraft.client.renderer.MultiBufferSource;
import net.minecraft.client.renderer.RenderType;
import net.minecraft.client.renderer.texture.OverlayTexture;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.util.Mth;
import net.minecraft.world.entity.EquipmentSlot;
import net.minecraft.world.entity.Pose;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.phys.Vec3;
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.client.event.InputEvent;
import net.minecraftforge.client.event.MovementInputUpdateEvent;
import net.minecraftforge.client.event.RenderHandEvent;
import net.minecraftforge.client.event.RenderLevelStageEvent;
import net.minecraftforge.client.event.RenderPlayerEvent;
import net.minecraftforge.client.event.ViewportEvent;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

@Mod.EventBusSubscriber(modid = AwakeningCompat.MOD_ID, value = Dist.CLIENT)
public final class TortleShellClientEvents {

    private static final ResourceLocation SHELL_TEXTURE = new ResourceLocation(
            AwakeningCompat.MOD_ID,
            "textures/misc/shell_crack_none.png"
    );

    private static final TortleShellAnimator ANIMATOR = new TortleShellAnimator();
    private static TortleShellModel model;
    private static CameraType previousCameraType;

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

    /**
     * GritShell forces first person while the player is withdrawn. We keep that
     * behavior, but deliberately avoid mutating Camera internals: several camera
     * mods (notably Shoulder Surfing) also mix into Camera/RenderType during early
     * client bootstrap, so protected-method accessors are too fragile for this
     * modpack.
     */
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
     * Third-person/world representation for other players. The local player is
     * rendered by the camera-relative shell pass while in first person.
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
     * Reproduces GritShell's vertical camera relationship without modifying the
     * actual Minecraft Camera. The original lowers the camera from eye height to
     * about playerY + 0.2 while withdrawing. Here we calculate that same virtual
     * camera Y only for positioning the shell model. This keeps the shell out of
     * the near plane while remaining compatible with Shoulder Surfing and other
     * camera/render mixins in the pack.
     */
    private static double getVirtualCameraY(
            Player player,
            Vec3 actualCameraPosition,
            float partialTick,
            boolean hiding
    ) {
        float progress = ANIMATOR.calcProgress();

        if (hiding) {
            if (!ANIMATOR.hasLockedY()) {
                ANIMATOR.lockY((float) (actualCameraPosition.y - player.getY()));
            }

            return TortleShellVisualMath.cameraY(
                    player.yo,
                    player.getY(),
                    partialTick,
                    ANIMATOR.getLockedY(),
                    TortleShellVisualMath.smoothProgress(progress)
            );
        }

        if (ANIMATOR.isUnhiding()) {
            return TortleShellVisualMath.unhideCameraY(
                    player.yo,
                    player.getY(),
                    partialTick,
                    progress,
                    player.getEyeHeight(Pose.STANDING)
            );
        }

        return actualCameraPosition.y;
    }

    /**
     * Camera-relative first-person shell pass. The shell starts above the player
     * and folds down around the virtual camera position, matching the spatial
     * relationship used by GritShell without touching Camera#setPosition.
     */
    @SubscribeEvent
    public static void onRenderLevelStage(RenderLevelStageEvent event) {
        if (event.getStage() != RenderLevelStageEvent.Stage.AFTER_ENTITIES) return;

        Minecraft minecraft = Minecraft.getInstance();
        Player player = minecraft.player;
        if (player == null || minecraft.options.getCameraType() != CameraType.FIRST_PERSON) return;
        if (minecraft.getCameraEntity() != player || !hasNaturalShell(player)) return;

        boolean hiding = isShelled(player);
        ANIMATOR.updateState(hiding, player.getYRot());
        if (!hiding && !ANIMATOR.isUnhiding()) return;

        float partialTick = event.getPartialTick();
        Vec3 cameraPosition = event.getCamera().getPosition();
        double virtualCameraY = getVirtualCameraY(player, cameraPosition, partialTick, hiding);
        double playerX = Mth.lerp(partialTick, player.xo, player.getX());
        double playerY = Mth.lerp(partialTick, player.yo, player.getY());
        double playerZ = Mth.lerp(partialTick, player.zo, player.getZ());

        PoseStack poseStack = event.getPoseStack();
        poseStack.pushPose();
        poseStack.translate(
                playerX - cameraPosition.x,
                playerY - virtualCameraY,
                playerZ - cameraPosition.z
        );
        poseStack.mulPose(Axis.YP.rotationDegrees(-ANIMATOR.getStartYaw()));

        float progress = ANIMATOR.calcProgress();
        float transition = TortleShellVisualMath.shellTransition(progress, ANIMATOR.isUnhiding());
        poseStack.translate(
                0.0F,
                TortleShellVisualMath.shellY(transition),
                TortleShellVisualMath.shellZ(transition)
        );
        poseStack.mulPose(Axis.XP.rotationDegrees(TortleShellVisualMath.shellPitch(transition)));
        poseStack.mulPose(Axis.ZP.rotationDegrees(180.0F));

        RenderType renderType = RenderType.entityCutoutNoCull(SHELL_TEXTURE);
        MultiBufferSource.BufferSource buffers = minecraft.renderBuffers().bufferSource();
        VertexConsumer vertexConsumer = buffers.getBuffer(renderType);
        getModel().render(
                poseStack,
                vertexConsumer,
                0x00F000F0,
                OverlayTexture.NO_OVERLAY
        );
        buffers.endBatch(renderType);
        poseStack.popPose();
    }

    /**
     * Preserve GritShell-like pitch/roll and yaw-lock during the transition using
     * Forge's supported viewport event only. No Camera accessor/mixin is needed.
     */
    @SubscribeEvent
    public static void onComputeCameraAngles(ViewportEvent.ComputeCameraAngles event) {
        Minecraft minecraft = Minecraft.getInstance();
        Player player = minecraft.player;
        if (player == null || !hasNaturalShell(player)) return;

        boolean hiding = isShelled(player);
        ANIMATOR.updateState(hiding, player.getYRot());
        boolean lockYaw = false;

        if (ANIMATOR.isWasHiding()) {
            float progress = ANIMATOR.calcProgress();
            float smooth = TortleShellVisualMath.smoothProgress(progress);

            if (progress < 1.0F) {
                lockYaw = true;
            }

            event.setRoll(TortleShellVisualMath.cameraRoll(progress, smooth, event.getRoll()));
            float pitch = TortleShellVisualMath.smootherstepPitch(progress);
            event.setPitch(pitch);
            player.setXRot(pitch);
        } else if (ANIMATOR.isUnhiding()) {
            float progress = ANIMATOR.calcProgress();
            float pitch = TortleShellVisualMath.smootherstepPitch(progress);
            event.setPitch(pitch);

            if (progress >= 1.0F) {
                ANIMATOR.finishUnhiding();
                lockYaw = true;
            }
        }

        if (lockYaw) {
            float yaw = Mth.rotLerp(0.02F, player.getYRot(), ANIMATOR.getTargetYaw());
            player.setYRot(yaw);
            player.setYHeadRot(yaw);
            event.setYaw(yaw);
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
        if (player != null && (isShelled(player) || ANIMATOR.isUnhiding())) {
            event.setCanceled(true);
        }
    }
}

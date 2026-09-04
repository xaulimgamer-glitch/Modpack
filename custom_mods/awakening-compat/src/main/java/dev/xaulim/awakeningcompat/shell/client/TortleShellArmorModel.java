package dev.xaulim.awakeningcompat.shell.client;

import dev.xaulim.awakeningcompat.AwakeningCompat;
import net.minecraft.client.model.HumanoidModel;
import net.minecraft.client.model.geom.ModelLayerLocation;
import net.minecraft.client.model.geom.ModelPart;
import net.minecraft.client.model.geom.PartPose;
import net.minecraft.client.model.geom.builders.CubeDeformation;
import net.minecraft.client.model.geom.builders.CubeListBuilder;
import net.minecraft.client.model.geom.builders.LayerDefinition;
import net.minecraft.client.model.geom.builders.MeshDefinition;
import net.minecraft.client.model.geom.builders.PartDefinition;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.entity.LivingEntity;

/**
 * Chest armor model adapted from GritShell / Dirty Monster 1.20.1-1.2 (MIT).
 * It is rendered through Forge's normal humanoid armor layer so the shell follows
 * the player's body and arm transforms exactly like an equipped chestplate.
 */
public final class TortleShellArmorModel extends HumanoidModel<LivingEntity> {

    public static final ModelLayerLocation LAYER_LOCATION = new ModelLayerLocation(
            new ResourceLocation(AwakeningCompat.MOD_ID, "tortle_shell_armor"),
            "main"
    );

    public TortleShellArmorModel(ModelPart root) {
        super(root);
    }

    public static LayerDefinition createBodyLayer() {
        MeshDefinition mesh = HumanoidModel.createMesh(new CubeDeformation(0.0F), 0.0F);
        PartDefinition root = mesh.getRoot();

        root.addOrReplaceChild(
                "body",
                CubeListBuilder.create()
                        .texOffs(0, 20)
                        .addBox(-4.0F, 0.0F, -2.0F, 8.0F, 12.0F, 4.0F, new CubeDeformation(0.75F))
                        .texOffs(0, 0)
                        .addBox(-5.0F, -1.0F, 2.8F, 10.0F, 13.0F, 7.0F, new CubeDeformation(0.0F)),
                PartPose.ZERO
        );

        root.addOrReplaceChild(
                "left_arm",
                CubeListBuilder.create()
                        .texOffs(24, 20)
                        .addBox(-1.0F, -2.0F, -2.0F, 4.0F, 12.0F, 4.0F, new CubeDeformation(0.75F)),
                PartPose.offset(5.0F, 2.0F, 0.0F)
        );

        root.addOrReplaceChild(
                "right_arm",
                CubeListBuilder.create()
                        .texOffs(34, 0)
                        .addBox(-3.0F, -2.0F, -2.0F, 4.0F, 12.0F, 4.0F, new CubeDeformation(0.75F)),
                PartPose.offset(-5.0F, 2.0F, 0.0F)
        );

        return LayerDefinition.create(mesh, 64, 64);
    }
}

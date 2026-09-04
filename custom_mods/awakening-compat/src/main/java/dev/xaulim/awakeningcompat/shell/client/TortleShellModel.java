package dev.xaulim.awakeningcompat.shell.client;

import com.mojang.blaze3d.vertex.PoseStack;
import com.mojang.blaze3d.vertex.VertexConsumer;
import net.minecraft.client.model.geom.ModelPart;
import net.minecraft.client.model.geom.PartPose;
import net.minecraft.client.model.geom.builders.CubeDeformation;
import net.minecraft.client.model.geom.builders.CubeListBuilder;
import net.minecraft.client.model.geom.builders.LayerDefinition;
import net.minecraft.client.model.geom.builders.MeshDefinition;
import net.minecraft.client.model.geom.builders.PartDefinition;

/**
 * Shell geometry adapted from GritShell / Dirty Monster 1.20.1-1.2 (MIT).
 * See THIRD_PARTY_NOTICES.md in the awakening-compat project.
 */
public final class TortleShellModel {

    private final ModelPart root;

    public TortleShellModel() {
        this.root = createLayer().bakeRoot();
    }

    public void render(
            PoseStack poseStack,
            VertexConsumer vertexConsumer,
            int packedLight,
            int packedOverlay
    ) {
        root.render(
                poseStack,
                vertexConsumer,
                packedLight,
                packedOverlay,
                1.0F,
                1.0F,
                1.0F,
                1.0F
        );
    }

    private static LayerDefinition createLayer() {
        MeshDefinition mesh = new MeshDefinition();
        PartDefinition meshRoot = mesh.getRoot();

        PartDefinition root = meshRoot.addOrReplaceChild(
                "root",
                CubeListBuilder.create(),
                PartPose.offset(0.0F, 24.0F, 0.0F)
        );

        root.addOrReplaceChild(
                "shell",
                CubeListBuilder.create()
                        .texOffs(40, 88)
                        .addBox(-22.0F, -32.0F, 15.0F, 16.0F, 14.0F, 4.0F, new CubeDeformation(0.0F))
                        .texOffs(0, 37)
                        .addBox(-26.0F, -37.0F, 15.0F, 4.0F, 19.0F, 32.0F, new CubeDeformation(0.0F))
                        .texOffs(72, 37)
                        .addBox(-6.0F, -37.0F, 15.0F, 4.0F, 19.0F, 32.0F, new CubeDeformation(0.0F))
                        .texOffs(0, 0)
                        .addBox(-22.0F, -37.0F, 15.0F, 16.0F, 5.0F, 32.0F, new CubeDeformation(0.0F))
                        .texOffs(0, 88)
                        .addBox(-22.0F, -32.0F, 43.0F, 16.0F, 14.0F, 4.0F, new CubeDeformation(0.0F)),
                PartPose.offset(14.0F, 18.0F, -31.0F)
        );

        return LayerDefinition.create(mesh, 256, 256);
    }
}

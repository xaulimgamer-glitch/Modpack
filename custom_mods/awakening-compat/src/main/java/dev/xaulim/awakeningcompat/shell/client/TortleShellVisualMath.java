package dev.xaulim.awakeningcompat.shell.client;

import net.minecraft.util.Mth;

/**
 * Visual transition equations ported from Dirty Monster / GritShell's ShellMath.
 */
public final class TortleShellVisualMath {

    private TortleShellVisualMath() {}

    public static float smoothProgress(float progress) {
        return progress * progress * (3.0F - 2.0F * progress);
    }

    public static float smootherstepPitch(float progress) {
        float t;
        if (progress < 0.5F) {
            t = progress * 2.0F;
        } else {
            t = (1.0F - progress) * 2.0F;
        }

        t = Mth.clamp(t, 0.0F, 1.0F);
        float smoother = t * t * t * (t * (t * 6.0F - 15.0F) + 10.0F);
        return smoother * 90.0F;
    }

    public static float cameraRoll(float progress, float smooth, float currentRoll) {
        return currentRoll + 12.0F * Mth.sin(progress * Mth.PI) * smooth;
    }

    public static double cameraY(
            double previousY,
            double currentY,
            float partialTick,
            float lockedY,
            float smooth
    ) {
        double baseY = Mth.lerp(partialTick, previousY, currentY);
        return Mth.lerp(smooth, baseY + lockedY, baseY + 0.2D);
    }

    public static double unhideCameraY(
            double previousY,
            double currentY,
            float partialTick,
            float progress,
            float standingEyeHeight
    ) {
        double baseY = Mth.lerp(partialTick, previousY, currentY);
        float eased;

        if (progress < 0.5F) {
            eased = 4.0F * progress * progress * progress;
        } else {
            float p = -2.0F * progress + 2.0F;
            eased = 1.0F - (p * p * p) / 2.0F;
        }

        float exponential = 1.0F - (float) Math.exp(-6.0F * eased);
        float blend = Mth.lerp(eased, eased, exponential);
        return Mth.lerp(blend, baseY + 0.2D, baseY + standingEyeHeight);
    }

    public static float shellAnimationT(float progress) {
        return progress >= 0.66F ? (progress - 0.66F) / 0.34F : 0.0F;
    }

    public static float shellTransition(float progress, boolean unhiding) {
        if (unhiding) {
            return 1.0F - progress;
        }

        float t = shellAnimationT(progress);
        return 1.0F - (float) Math.exp(-3.5F * t)
                * Math.abs((float) Math.cos(t * Math.PI * 2.5D));
    }

    public static float shellPitch(float transition) {
        return Mth.lerp(transition, 85.0F, 0.0F);
    }

    public static float shellY(float transition) {
        return Mth.lerp(transition, 7.0F, 1.5F);
    }

    public static float shellZ(float transition) {
        return Mth.lerp(transition, 0.6F, -0.2F);
    }
}

package dev.xaulim.awakeningcompat.shell.client;

import net.minecraft.util.Mth;

/**
 * Transition state adapted from Dirty Monster / GritShell's ShellAnimator.
 * The original mod uses a 2.2 s withdraw animation and a 1.2 s emerge animation.
 */
public final class TortleShellAnimator {

    private static final long HIDE_DURATION_MS = 2200L;
    private static final long UNHIDE_DURATION_MS = 1200L;

    private boolean initialized;
    private boolean wasHiding;
    private boolean unhiding;
    private long transitionStart;
    private float lockedY;
    private float startYaw;
    private float targetYaw;
    private boolean hasLockedY;

    public void updateState(boolean hiding, float yaw) {
        if (!initialized) {
            initialized = true;
            wasHiding = hiding;
            startYaw = yaw;
            targetYaw = yaw;
            transitionStart = System.currentTimeMillis();
            unhiding = false;
            hasLockedY = false;
            return;
        }

        if (hiding != wasHiding) {
            transitionStart = System.currentTimeMillis();

            if (hiding) {
                startYaw = yaw;
                targetYaw = yaw;
                unhiding = false;
                hasLockedY = false;
            } else {
                unhiding = true;
                hasLockedY = false;
            }

            wasHiding = hiding;
        }
    }

    public float calcProgress() {
        long duration = unhiding ? UNHIDE_DURATION_MS : HIDE_DURATION_MS;
        return Mth.clamp((System.currentTimeMillis() - transitionStart) / (float) duration, 0.0F, 1.0F);
    }

    public boolean isWasHiding() {
        return wasHiding;
    }

    public boolean isUnhiding() {
        return unhiding;
    }

    public void finishUnhiding() {
        unhiding = false;
        hasLockedY = false;
    }

    public float getLockedY() {
        return lockedY;
    }

    public void lockY(float lockedY) {
        this.lockedY = lockedY;
        this.hasLockedY = true;
    }

    public boolean hasLockedY() {
        return hasLockedY;
    }

    public float getStartYaw() {
        return startYaw;
    }

    public float getTargetYaw() {
        return targetYaw;
    }
}

'use strict';

class Camera {
    constructor(options) {
        this.pos = options.pos;
        this.refUp = new Vec3(0, 1, 0);
        this.up = null;
        this.left = null;
        this.viewMatrix = null;

        if (options.dir != null) {
            this.dir = options.dir.normalize();
        }
        else if (options.target != null) {
            this.dir = this.pos.subtract(options.target).normalize();
        }

        this.left = this.refUp.cross(this.dir).normalize();
        this.up = this.dir.cross(this.left);

        this.updateViewMatrix();
    }

    reset(options) {
        this.pos = options.pos;

        if (options.dir != null) {
            this.dir = options.dir.normalize();
        }
        else if (options.target != null) {
            this.dir = this.pos.subtract(options.target).normalize();
        }

        this.left = this.refUp.cross(this.dir).normalize();
        this.up = this.dir.cross(this.left);
        this.updateViewMatrix();
    }

    zoom(offset) {
        this.pos = this.pos.add(this.dir.mulf(offset));

        //  left and up vector unchanged
        this.updateViewMatrix();
    }

    pan(offset) {
        this.dir = this.dir.add(this.left.mulf(-offset.x));
        this.dir = this.dir.add(this.up.mulf(offset.y));
        this.dir = this.dir.normalize();

        this.left = this.refUp.cross(this.dir).normalize();
        this.up = this.dir.cross(this.left);

        this.updateViewMatrix();
    }

    orbitX(angle, pivot) {
        this.pos = this.pos.rotateX(angle);
        this.dir = this.pos.subtract(pivot).normalize();
        this.left = this.refUp.cross(this.dir).normalize();
        this.up = this.dir.cross(this.left);

        //  left and up vector unchanged
        this.updateViewMatrix();
    }

    orbitY(angle, pivot) {
        this.pos = this.pos.rotateY(angle);
        this.dir = this.pos.subtract(pivot).normalize();
        this.left = this.refUp.cross(this.dir).normalize();
        this.up = this.dir.cross(this.left);

        //  left and up vector unchanged
        this.updateViewMatrix();
    }

    updateViewMatrix() {
        this.viewMatrix = new Matrix4x4([this.left.x, this.up.x, this.dir.x, 0.0], 
                                        [this.left.y, this.up.y, this.dir.y, 0.0],
                                        [this.left.z, this.up.z, this.dir.z, 0.0],
                                        [-this.left.x * this.pos.x - this.left.y * this.pos.y - this.left.z * this.pos.z, 
                                            this.up.x * this.pos.x - this.up.y * this.pos.y - this.up.z * this.pos.z,
                                            this.dir.x * this.pos.x - this.dir.y * this.pos.y - this.dir.z * this.pos.z,
                                            1.0]);

    }
}
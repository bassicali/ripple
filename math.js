'use strict';

class Vec2 {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    subtract(other) {
        return new Vec2(this.x - other.x, this.y - other.y);
    }

    mul(vec) {
        return new Vec2(this.x * vec.x, this.y * vec.y);
    }

    mulf(scale) {
        return new Vec2(this.x * scale, this.y * scale);
    }
}

class Vec3 {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    add(other) {
        return new Vec3(this.x + other.x, this.y + other.y, this.z + other.z);
    }

    subtract(other) {
        return new Vec3(this.x - other.x, this.y - other.y, this.z - other.z);
    }

    mulf(scale) {
        return new Vec3(this.x * scale, this.y * scale, this.z * scale);
    }

    divf(divisor) {
        return new Vec3(this.x / divisor, this.y / divisor, this.z / divisor);
    }

    mulv(vec) {
        return new Vec3(this.x * vec.x, this.y * vec.y, this.z * vec.z);
    }

    cross(other) {
        let x = this.y * other.z - other.y * this.z;
        let y = this.z * other.x - other.z * this.x;
        let z = this.x * other.y - other.x * this.y;
        return new Vec3(x, y, z);
    }

    dot(other) {
        let prod = this.mulv(other);
        return prod.x + prod.y + prod.z;
    }

    normalize() {
        let len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z)
        return new Vec3(this.x / len, this.y / len, this.z / len);
    }

    rotateX(angle) {
        let cos = Math.cos(angle * (Math.PI / 180));
        let sin = Math.sin(angle * (Math.PI / 180));
        let y = this.y * cos - this.z * sin;
        let z = this.y * sin + this.z * cos;
        return new Vec3(this.x, y, z);
    }

    rotateY(angle) {
        let cos = Math.cos(angle * (Math.PI / 180));
        let sin = Math.sin(angle * (Math.PI / 180));
        let x = this.x * cos + this.z * sin;
        let z = -this.x * sin + this.z * cos;
        return new Vec3(x, this.y, z);
    }

    clamp(min, max) {
        function clampf(f, minf, maxf) {
            if (f < minf) {
                return minf;
            } 
            else if (f > maxf) {
                return maxf;
            }

            return f;
        }

        return new Vec3(clampf(this.x, min.x, max.x), clampf(this.y, min.y, max.y), clampf(this.z, min.z, max.z));
    }

    toString() {
        return `${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)}`;
    }
}

class Vec4 {
    constructor(x, y, z, w) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    divf(divisor) {
        return new Vec4(this.x / divisor, this.y / divisor, this.z / divisor, this.w / divisor);
    }

    toString() {
        return `${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)}, ${this.w.toFixed(2)}`;
    }
}

class Matrix4x4 {
    constructor(col0, col1, col2, col3) {
        this.col0 = col0;
        this.col1 = col1;
        this.col2 = col2; 
        this.col3 = col3;
        this.array = this.toArray();
    }

    mulv(vec) {
        let result = new Vec4();
        result.x = vec.x*this.col0[0] + vec.y*this.col1[0] + vec.z*this.col2[0] + vec.w*this.col3[0];
        result.y = vec.x*this.col0[1] + vec.y*this.col1[1] + vec.z*this.col2[1] + vec.w*this.col3[1];
        result.z = vec.x*this.col0[2] + vec.y*this.col1[2] + vec.z*this.col2[2] + vec.w*this.col3[2];
        result.w = vec.x*this.col0[3] + vec.y*this.col1[3] + vec.z*this.col2[3] + vec.w*this.col3[3];
        return result;
    }

    // this = right matrix, mat = left matrix
    mulm(mat) {
        let col0 = [0, 0, 0, 0];
        let col1 = [0, 0, 0, 0];
        let col2 = [0, 0, 0, 0];
        let col3 = [0, 0, 0, 0];

        col0[0] = mat.col0[0]*this.col0[0] + mat.col0[1]*this.col1[0] + mat.col0[2]*this.col2[0] + mat.col0[3]*this.col3[0];
        col0[1] = mat.col0[0]*this.col0[1] + mat.col0[1]*this.col1[1] + mat.col0[2]*this.col2[1] + mat.col0[3]*this.col3[1];
        col0[2] = mat.col0[0]*this.col0[2] + mat.col0[1]*this.col1[2] + mat.col0[2]*this.col2[2] + mat.col0[3]*this.col3[2];
        col0[3] = mat.col0[0]*this.col0[3] + mat.col0[1]*this.col1[3] + mat.col0[2]*this.col2[3] + mat.col0[3]*this.col3[3];

        col1[0] = mat.col1[0]*this.col0[0] + mat.col1[1]*this.col1[0] + mat.col1[2]*this.col2[0] + mat.col1[3]*this.col3[0];
        col1[1] = mat.col1[0]*this.col0[1] + mat.col1[1]*this.col1[1] + mat.col1[2]*this.col2[1] + mat.col1[3]*this.col3[1];
        col1[2] = mat.col1[0]*this.col0[2] + mat.col1[1]*this.col1[2] + mat.col1[2]*this.col2[2] + mat.col1[3]*this.col3[2];
        col1[3] = mat.col1[0]*this.col0[3] + mat.col1[1]*this.col1[3] + mat.col1[2]*this.col2[3] + mat.col1[3]*this.col3[3];

        col2[0] = mat.col2[0]*this.col0[0] + mat.col2[1]*this.col1[0] + mat.col2[2]*this.col2[0] + mat.col2[3]*this.col3[0];
        col2[1] = mat.col2[0]*this.col0[1] + mat.col2[1]*this.col1[1] + mat.col2[2]*this.col2[1] + mat.col2[3]*this.col3[1];
        col2[2] = mat.col2[0]*this.col0[2] + mat.col2[1]*this.col1[2] + mat.col2[2]*this.col2[2] + mat.col2[3]*this.col3[2];
        col2[3] = mat.col2[0]*this.col0[3] + mat.col2[1]*this.col1[3] + mat.col2[2]*this.col2[3] + mat.col2[3]*this.col3[3];

        col3[0] = mat.col3[0]*this.col0[0] + mat.col3[1]*this.col1[0] + mat.col3[2]*this.col2[0] + mat.col3[3]*this.col3[0];
        col3[1] = mat.col3[0]*this.col0[1] + mat.col3[1]*this.col1[1] + mat.col3[2]*this.col2[1] + mat.col3[3]*this.col3[1];
        col3[2] = mat.col3[0]*this.col0[2] + mat.col3[1]*this.col1[2] + mat.col3[2]*this.col2[2] + mat.col3[3]*this.col3[2];
        col3[3] = mat.col3[0]*this.col0[3] + mat.col3[1]*this.col1[3] + mat.col3[2]*this.col2[3] + mat.col3[3]*this.col3[3];

        return new Matrix4x4(col0, col1, col2, col3);
    }

    inverse() {
        let minors0 = [0, 0, 0, 0];
        let minors1 = [0, 0, 0, 0];
        let minors2 = [0, 0, 0, 0];
        let minors3 = [0, 0, 0, 0];

        minors0[0] = this.determinant3x3([this.col1[1], this.col1[2], this.col1[3]],
                                     [this.col2[1], this.col2[2], this.col2[3]],
                                     [this.col3[1], this.col3[2], this.col3[3]]);

        minors0[1] = this.determinant3x3([this.col1[0], this.col1[2], this.col1[3]],
                                    [this.col2[0], this.col2[2], this.col2[3]],
                                    [this.col3[0], this.col3[2], this.col3[3]]);

        minors0[2] = this.determinant3x3([this.col1[0], this.col1[1], this.col1[3]],
                                     [this.col2[0], this.col2[1], this.col2[3]],
                                     [this.col3[0], this.col3[1], this.col3[3]]);

        minors0[3] = this.determinant3x3([this.col1[0], this.col1[1], this.col1[2]],
                                     [this.col2[0], this.col2[1], this.col2[2]],
                                     [this.col3[0], this.col3[1], this.col3[2]]);

        minors1[0] = this.determinant3x3([this.col0[1], this.col0[2], this.col0[3]],
                                     [this.col2[1], this.col2[2], this.col2[3]],
                                     [this.col3[1], this.col3[2], this.col3[3]]);

        minors1[1] = this.determinant3x3([this.col0[0], this.col0[2], this.col0[3]],
                                     [this.col2[0], this.col2[2], this.col2[3]],
                                     [this.col3[0], this.col3[2], this.col3[3]]);

        minors1[2] = this.determinant3x3([this.col0[0], this.col0[1], this.col0[3]],
                                     [this.col2[0], this.col2[1], this.col2[3]],
                                     [this.col3[0], this.col3[1], this.col3[3]]);

        minors1[3] = this.determinant3x3([this.col0[0], this.col0[1], this.col0[2]],
                                     [this.col2[0], this.col2[1], this.col2[2]],
                                     [this.col3[0], this.col3[1], this.col3[2]]);

        minors2[0] = this.determinant3x3([this.col0[1], this.col0[2], this.col0[3]],
                                     [this.col1[1], this.col1[2], this.col1[3]],
                                     [this.col3[1], this.col3[2], this.col3[3]]);

        minors2[1] = this.determinant3x3([this.col0[0], this.col0[2], this.col0[3]],
                                     [this.col1[0], this.col1[2], this.col1[3]],
                                     [this.col3[0], this.col3[2], this.col3[3]]);

        minors2[2] = this.determinant3x3([this.col0[0], this.col0[1], this.col0[3]],
                                     [this.col1[0], this.col1[1], this.col1[3]],
                                     [this.col3[0], this.col3[1], this.col3[3]]);

        minors2[3] = this.determinant3x3([this.col0[0], this.col0[1], this.col0[2]],
                                     [this.col1[0], this.col1[1], this.col1[2]],
                                     [this.col3[0], this.col3[1], this.col3[2]]);

        minors3[0] = this.determinant3x3([this.col0[1], this.col0[2], this.col0[3]],
                                     [this.col1[1], this.col1[2], this.col1[3]],
                                     [this.col2[1], this.col2[2], this.col2[3]]);    
                                    
        minors3[1] = this.determinant3x3([this.col0[0], this.col0[2], this.col0[3]],
                                     [this.col1[0], this.col1[2], this.col1[3]],
                                     [this.col2[0], this.col2[2], this.col2[3]]);    

        minors3[2] = this.determinant3x3([this.col0[0], this.col0[1], this.col0[3]],
                                     [this.col1[0], this.col1[1], this.col1[3]],
                                     [this.col2[0], this.col2[1], this.col2[3]]);

        minors3[3] = this.determinant3x3([this.col0[0], this.col0[1], this.col0[2]],
                                     [this.col1[0], this.col1[1], this.col1[2]],
                                     [this.col2[0], this.col2[1], this.col2[2]]);

        let det = (this.col0[0]*minors0[0]) - (this.col1[0]*minors1[0]) + (this.col2[0]*minors2[0]) - (this.col3[0]*minors3[0]);
        let a = this.calcAdjugate(minors0, minors1, minors2, minors3);
        
        return new Matrix4x4(
            a.adj0.map(n => n / det),
            a.adj1.map(n => n / det),
            a.adj2.map(n => n / det),
            a.adj3.map(n => n / det)
        );
    }

    determinant3x3(col0, col1, col2) {
        return col0[0]*(col1[1]*col2[2] - col2[1]*col1[2])
                - col1[0]*(col0[1]*col2[2] - col2[1]*col0[2])
                + col2[0]*(col0[1]*col1[2] - col1[1]*col0[2]);
    }

    calcAdjugate(minors0, minors1, minors2, minors3) {
        let col0 = [minors0[0], -minors0[1], minors0[2], -minors0[3]];
        let col1 = [-minors1[0], minors1[1], -minors1[2], minors1[3]];
        let col2 = [minors2[0], -minors2[1], minors2[2], -minors2[3]];
        let col3 = [-minors3[0], minors3[1], -minors3[2], minors3[3]];

        return {
            adj0: [col0[0], col1[0], col2[0], col3[0]],
            adj1: [col0[1], col1[1], col2[1], col3[1]],
            adj2: [col0[2], col1[2], col2[2], col3[2]],
            adj3: [col0[3], col1[3], col2[3], col3[3]]
        };
    }

    setPos(vec) {
        this.col3[0] = vec.x;
        this.col3[1] = vec.y;
        this.col3[2] = vec.z;
        this.array = this.toArray();
    }

    setScale(sc) {
        this.col0[0] = sc;
        this.col1[1] = sc;
        this.col2[2] = sc;
        this.array = this.toArray();
    }

    static createProjection(fov, aspectRatio, znear, zfar)
    {
        let fovRad = fov * (Math.PI/180);
        let a = Math.tan(fovRad / 2);
        
        let col0 = [0, 0, 0, 0];
        let col1 = [0, 0, 0, 0];
        let col2 = [0, 0, 0, 0];
        let col3 = [0, 0, 0, 0];

        col0[0] = 1 / (a * aspectRatio);
        col1[1] = 1 / a;
        col2[2] = -(zfar + znear) / (zfar - znear);
        col2[3] = -1;
        col3[2] = -(2 * zfar * znear) / (zfar - znear);

        return new Matrix4x4(col0, col1, col2, col3);
    }

    toArray() {
        return new Float32Array(this.col0.concat(this.col1).concat(this.col2).concat(this.col3));
    }
}
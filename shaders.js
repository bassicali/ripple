'use strict';

class ShaderProgram {
    constructor(vert, frag) {
        this.vert = vert;
        this.frag = frag;
        this.program = gl.createProgram();
        gl.attachShader(this.program, this.vert.shader);
        gl.attachShader(this.program, this.frag.shader);
        gl.linkProgram(this.program);

        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
            let err = gl.getProgramInfoLog(this.program);
            throw `An error occured while linking a shader program: ${err}`;
        }
    }

    use() {
        gl.useProgram(this.program);
    }

    getUniformLocation(name) {
        let loc = gl.getUniformLocation(this.program, name);
        // if (loc == null) {
        //     let count = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        //     for (let i = 0; i < count; i++) {
        //        let uname = gl.getActiveUniform(this.program, i).name;
        //        console.log('Uniform: ' + uname);
        //     }

        //     throw `Uniform not found: ${name}`;
        // }
        return loc;
    }

    setFloat(name, value) {
        gl.uniform1f(this.getUniformLocation(name), value);
    }

    setInt(name, value) {
        gl.uniform1i(this.getUniformLocation(name), value);
    }

    setTexture(name, texture, unit) {
        this.setInt(name, unit);
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
    }

    setVec2(name, x, y) {
        gl.uniform2f(this.getUniformLocation(name), x, y);
    }

    setVec2(name, vec) {
        gl.uniform2f(this.getUniformLocation(name), vec.x, vec.y);
    }

    setVec3(name, vec) {
        gl.uniform3f(this.getUniformLocation(name), vec.x, vec.y, vec.z);
    }

    setVec4(name, vec) {
        gl.uniform4f(this.getUniformLocation(name), vec.x, vec.y, vec.z, vec.w);
    }

    setMatrix4x4(name, mat) {
        gl.uniformMatrix4fv(this.getUniformLocation(name), false, mat.array);
    }
}

class Shader {
    constructor(type, source) {
        this.shader = gl.createShader(type);
        gl.shaderSource(this.shader, source);
        gl.compileShader(this.shader);

        if (!gl.getShaderParameter(this.shader, gl.COMPILE_STATUS)) {
            let error = gl.getShaderInfoLog(this.shader);
            gl.deleteShader(this.shader);
            throw `An error occurred compiling a shader: ${error}`;
        }
    }
}
'use strict';

class FBO {
    constructor(width, height) {
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, env.filtering);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, env.filtering);
        // HACK: find a better way to handle firefox
        //let format = env.isFirefox ? gl.RGBA : gl.RGB;
        let format = gl.RGBA;
        gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, env.textureType, null);

        this.buffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.texture, 0);

        let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status != gl.FRAMEBUFFER_COMPLETE) {
            throw `Could not create FBO, status: ${status}`;
        }

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    }

    clear() {
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.buffer);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
}

class SwapFBO {
    constructor(width, height) {
        this.front = new FBO(width, height);
        this.back = new FBO(width, height);
    }

    swap() {
        let temp = this.front;
        this.front = this.back;
        this.back = temp;
    }

    clear() {
        this.front.clear();
        this.back.clear();
    }
}

class VertexList {
    constructor(vertices, indices) {
        if (vertices.length % 3 != 0) {
            throw 'Invalid number of elements in vertices array'
        }

        this.vbo = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
        this.numVertices = vertices.length / 3;

        if (indices != null) {
            this.ebo = gl.createBuffer();
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
            this.numIndices = indices.length;
        }
        else {
            this.ebo = null;
            this.numIndices = 0;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
    }

    bind() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);

        if ((this.vbo === gl.getParameter(gl.ARRAY_BUFFER_BINDING)) == false) {
            console.error('array buffer didnt bind properly');
        }
        
        if (this.ebo != null) {
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ebo);
        }
    }
}
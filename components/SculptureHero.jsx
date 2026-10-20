'use client';
import { useEffect, useRef } from 'react';
import {
  QUAD_VS,
  FLOW_FS,
  SIM_FS,
  PART_VS,
  PART_FS,
  IMAGE_FS,
} from './SculptureShaders';
function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  return s;
}
function link(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  return p;
}
function makeFBO(gl, w, h, fmt, type, filter) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, fmt, w, h, 0, gl.RGBA, type, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fb = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fb);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return { tex, fb };
}
function uni(gl, p, name) {
  return gl.getUniformLocation(p, name);
}
export default function SculptureHero({ children }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      premultipliedAlpha: true,
      alpha: true,
    });
    if (!gl) return;
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const flowProg = link(gl, QUAD_VS, FLOW_FS);
    const simProg = link(gl, QUAD_VS, SIM_FS);
    const partProg = link(gl, PART_VS, PART_FS);
    const imgProg = link(gl, QUAD_VS, IMAGE_FS);
    const quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const cornerBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW
    );
    const FLOW_W = 256;
    const FLOW_H = 256;
    let flowA = makeFBO(gl, FLOW_W, FLOW_H, gl.RGBA8, gl.UNSIGNED_BYTE, gl.LINEAR);
    let flowB = makeFBO(gl, FLOW_W, FLOW_H, gl.RGBA8, gl.UNSIGNED_BYTE, gl.LINEAR);
    const state = { mouse: [0, 0], vel: [0, 0], lastMouse: [0, 0], presence: 0, time: 0 };
    let W = 0, H = 0, dpr = 1;
    let homeTexture = null;
    let colTexture = null;
    let stateA = null;
    let stateB = null;
    let texW = 0, texH = 0, N = 0;
    let introVis = 0;
    let animId = null;
    let imgLoaded = false;
    let imgTex = null;
    let imgRect = [0, 0, 0, 0];
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = container.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
    }
    function buildParticlesFromImage(img) {
      const offCanvas = document.createElement('canvas');
      const maxSide = Math.min(Math.max(W, H) * dpr, 1200);
      const scale = maxSide / Math.max(img.naturalWidth, img.naturalHeight);
      offCanvas.width = Math.round(img.naturalWidth * scale);
      offCanvas.height = Math.round(img.naturalHeight * scale);
      const ctx2d = offCanvas.getContext('2d');
      ctx2d.drawImage(img, 0, 0, offCanvas.width, offCanvas.height);
      const pixels = ctx2d.getImageData(0, 0, offCanvas.width, offCanvas.height);
      const pts = [];
      const step = 3;
      for (let y = 0; y < offCanvas.height; y += step) {
        for (let x = 0; x < offCanvas.width; x += step) {
          const i = (y * offCanvas.width + x) * 4;
          const r = pixels.data[i] / 255;
          const g = pixels.data[i + 1] / 255;
          const b = pixels.data[i + 2] / 255;
          const a = pixels.data[i + 3] / 255;
          if (a < 0.08) continue;
          const bright = 0.299 * r + 0.587 * g + 0.114 * b;
          const sd = 0.4 + bright * 0.6;
          pts.push({
            nx: x / offCanvas.width,
            ny: y / offCanvas.height,
            r, g, b, a, sd,
          });
        }
      }
      N = pts.length;
      texW = Math.ceil(Math.sqrt(N));
      texH = Math.ceil(N / texW);
      const homeData = new Float32Array(texW * texH * 4);
      const colData = new Uint8Array(texW * texH * 4);
      const stateData = new Float32Array(texW * texH * 4);
      pts.forEach((p, i) => {
        const base = i * 4;
        homeData[base] = p.nx;
        homeData[base + 1] = p.ny;
        homeData[base + 2] = p.sd;
        homeData[base + 3] = p.a;
        colData[base] = Math.round(p.r * 255);
        colData[base + 1] = Math.round(p.g * 255);
        colData[base + 2] = Math.round(p.b * 255);
        colData[base + 3] = 255;
        stateData[base] = (Math.random() - 0.5) * 60;
        stateData[base + 1] = (Math.random() - 0.5) * 60;
        stateData[base + 2] = 0;
        stateData[base + 3] = 0;
      });
      homeTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, homeTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, texW, texH, 0, gl.RGBA, gl.FLOAT, homeData);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      colTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, colTexture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, texW, texH, 0, gl.RGBA, gl.UNSIGNED_BYTE, colData);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      stateA = makeFBO(gl, texW, texH, gl.RGBA32F, gl.FLOAT, gl.NEAREST);
      gl.bindTexture(gl.TEXTURE_2D, stateA.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, texW, texH, 0, gl.RGBA, gl.FLOAT, stateData);
      stateB = makeFBO(gl, texW, texH, gl.RGBA32F, gl.FLOAT, gl.NEAREST);
      imgTex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, imgTex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, offCanvas.width, offCanvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.generateMipmap(gl.TEXTURE_2D);
      computeImageRect(img);
      imgLoaded = true;
      introVis = 0;
    }
    function computeImageRect(img) {
      const padX = W * 0.04;
      const padY = H * 0.05;
      const maxW = W / 2 - padX;
      const maxH = H - padY * 2;
      const ratio = img.naturalWidth / img.naturalHeight;
      let iw = maxW;
      let ih = iw / ratio;
      if (ih > maxH) { ih = maxH; iw = ih * ratio; }
      const ix = W / 2 + (W / 2 - iw) / 2;
      const iy = (H - ih) / 2;
      imgRect = [ix * dpr, iy * dpr, iw * dpr, ih * dpr];
    }
    function bindQuad() {
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    }
    function drawFlow() {
      gl.viewport(0, 0, FLOW_W, FLOW_H);
      gl.bindFramebuffer(gl.FRAMEBUFFER, flowB.fb);
      gl.useProgram(flowProg);
      bindQuad();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, flowA.tex);
      gl.uniform1i(uni(gl, flowProg, 'uPrev'), 0);
      gl.uniform2f(uni(gl, flowProg, 'uTexel'), 1 / FLOW_W, 1 / FLOW_H);
      gl.uniform2f(uni(gl, flowProg, 'uMouse'), state.mouse[0] / imgRect[2], 1 - state.mouse[1] / imgRect[3]);
      gl.uniform2f(uni(gl, flowProg, 'uVel'), state.vel[0] / (W * dpr), -state.vel[1] / (H * dpr));
      gl.uniform2f(uni(gl, flowProg, 'uSize'), imgRect[2], imgRect[3]);
      gl.uniform1f(uni(gl, flowProg, 'uRadius'), 0.18);
      gl.uniform1f(uni(gl, flowProg, 'uPresence'), state.presence);
      gl.uniform1f(uni(gl, flowProg, 'uDecay'), 0.97);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      const tmp = flowA; flowA = flowB; flowB = tmp;
    }
    function drawSim(dt) {
      gl.viewport(0, 0, texW, texH);
      gl.bindFramebuffer(gl.FRAMEBUFFER, stateB.fb);
      gl.useProgram(simProg);
      bindQuad();
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, stateA.tex); gl.uniform1i(uni(gl, simProg, 'uState'), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, homeTexture); gl.uniform1i(uni(gl, simProg, 'uHome'), 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, flowA.tex); gl.uniform1i(uni(gl, simProg, 'uFlow'), 2);
      gl.uniform2f(uni(gl, simProg, 'uSize'), imgRect[2], imgRect[3]);
      const mx = (state.mouse[0] / imgRect[2]);
      const my = 1 - (state.mouse[1] / imgRect[3]);
      gl.uniform2f(uni(gl, simProg, 'uMouse'), mx * imgRect[2], my * imgRect[3]);
      gl.uniform1f(uni(gl, simProg, 'uRadius'), imgRect[2] * 0.22);
      gl.uniform1f(uni(gl, simProg, 'uPresence'), state.presence);
      gl.uniform1f(uni(gl, simProg, 'uStrength'), 1.2);
      gl.uniform1f(uni(gl, simProg, 'uSpread'), 1.0);
      gl.uniform1f(uni(gl, simProg, 'uTurb'), 0.7);
      gl.uniform1f(uni(gl, simProg, 'uReturn'), 0.4);
      gl.uniform1f(uni(gl, simProg, 'uTime'), state.time);
      gl.uniform1f(uni(gl, simProg, 'uDt'), dt);
      gl.uniform1f(uni(gl, simProg, 'uIntro'), Math.max(0, 1 - introVis));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      const tmp = stateA; stateA = stateB; stateB = tmp;
    }
    function drawParticles() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(partProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, cornerBuf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.vertexAttribDivisor(0, 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, stateA.tex); gl.uniform1i(uni(gl, partProg, 'uState'), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, homeTexture); gl.uniform1i(uni(gl, partProg, 'uHome'), 1);
      gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, colTexture); gl.uniform1i(uni(gl, partProg, 'uCol'), 2);
      gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, flowA.tex); gl.uniform1i(uni(gl, partProg, 'uFlow'), 3);
      gl.uniform1i(uni(gl, partProg, 'uTexW'), texW);
      gl.uniform4f(uni(gl, partProg, 'uRect'), imgRect[0], imgRect[1], imgRect[2], imgRect[3]);
      gl.uniform2f(uni(gl, partProg, 'uRes'), canvas.width, canvas.height);
      const mx = state.mouse[0] + imgRect[0];
      const my = canvas.height - (state.mouse[1] + imgRect[1]);
      gl.uniform2f(uni(gl, partProg, 'uMouse'), mx, my);
      gl.uniform1f(uni(gl, partProg, 'uRadius'), imgRect[2] * 0.22);
      gl.uniform1f(uni(gl, partProg, 'uPresence'), state.presence);
      gl.uniform1f(uni(gl, partProg, 'uDot'), 2.6 * dpr);
      gl.uniform1f(uni(gl, partProg, 'uTime'), state.time);
      gl.uniform1f(uni(gl, partProg, 'uAmbient'), 0.28);
      gl.uniform1f(uni(gl, partProg, 'uStreak'), 0.55);
      gl.uniform1f(uni(gl, partProg, 'uIntroVis'), introVis);
      gl.uniform1f(uni(gl, partProg, 'uRest'), 0.0);
      gl.uniform3f(uni(gl, partProg, 'uTint'), 1, 1, 1);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, N);
    }
    function drawImage() {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.useProgram(imgProg);
      bindQuad();
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, imgTex); gl.uniform1i(uni(gl, imgProg, 'uImg'), 0);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, flowA.tex); gl.uniform1i(uni(gl, imgProg, 'uFlow'), 1);
      gl.uniform2f(uni(gl, imgProg, 'uRes'), canvas.width, canvas.height);
      gl.uniform1f(uni(gl, imgProg, 'uDpr'), dpr);
      gl.uniform4f(uni(gl, imgProg, 'uRect'), imgRect[0], imgRect[1], imgRect[2], imgRect[3]);
      gl.uniform3f(uni(gl, imgProg, 'uBg'), 1, 1, 1);
      gl.uniform3f(uni(gl, imgProg, 'uImgBg'), 1, 1, 1);
      const mx = state.mouse[0] + imgRect[0];
      const my = canvas.height - (state.mouse[1] + imgRect[1]);
      gl.uniform2f(uni(gl, imgProg, 'uMouse'), mx, my);
      gl.uniform1f(uni(gl, imgProg, 'uPresence'), state.presence);
      gl.uniform1f(uni(gl, imgProg, 'uRadius'), imgRect[2] * 0.22);
      gl.uniform1f(uni(gl, imgProg, 'uStrength'), 0.8);
      gl.uniform1f(uni(gl, imgProg, 'uTime'), state.time);
      gl.uniform1f(uni(gl, imgProg, 'uAmbient'), 0.15);
      gl.uniform1f(uni(gl, imgProg, 'uIntroVis'), introVis);
      gl.uniform1f(uni(gl, imgProg, 'uRest'), 0.0);
      gl.uniform1f(uni(gl, imgProg, 'uAlphaMode'), 0.0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    let lastTs = 0;
    function loop(ts) {
      const dt = Math.min((ts - lastTs) / 1000, 0.05);
      lastTs = ts;
      state.time += dt;
      if (imgLoaded) {
        introVis = Math.min(introVis + dt * 0.55, 1);
        drawFlow();
        drawSim(dt * 60);
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        drawImage();
        drawParticles();
      }
      animId = requestAnimationFrame(loop);
    }
    resize();
    animId = requestAnimationFrame(loop);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      buildParticlesFromImage(img);
    };
    img.src = '/landing page.png';
    const onResize = () => {
      resize();
      if (imgLoaded) {
        const tempImg = new Image();
        tempImg.src = img.src;
        tempImg.onload = () => computeImageRect(tempImg);
      }
    };
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const cx = (e.clientX - rect.left - imgRect[0] / dpr) * dpr;
      const cy = (e.clientY - rect.top - imgRect[1] / dpr) * dpr;
      state.vel = [cx - state.mouse[0], cy - state.mouse[1]];
      state.mouse = [cx, cy];
      state.presence = 1;
    };
    const onMouseLeave = () => { state.presence = 0; };
    window.addEventListener('resize', onResize);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    return () => {
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      if (animId) cancelAnimationFrame(animId);
    };
  }, []);
  return (
    <section className="sculpture-hero-section" id="about" ref={containerRef}>
      <canvas ref={canvasRef} className="sculpture-canvas" aria-hidden="true" />
      <div className="sculpture-hero-content">
        {children}
      </div>
    </section>
  );
}

import { useEffect, useRef } from 'react'

// ─── WebGL helpers ────────────────────────────────────────────────────────────

function createShader(gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

function createProgram(gl, vertSrc, fragSrc) {
  const vert = createShader(gl, gl.VERTEX_SHADER, vertSrc)
  const frag = createShader(gl, gl.FRAGMENT_SHADER, fragSrc)
  const prog = gl.createProgram()
  gl.attachShader(prog, vert)
  gl.attachShader(prog, frag)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(prog))
    return null
  }
  return prog
}

function createFBO(gl, w, h) {
  const texture = gl.createTexture()
  gl.bindTexture(gl.TEXTURE_2D, texture)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)

  const fbo = gl.createFramebuffer()
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo)
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)
  gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  return { texture, fbo, width: w, height: h }
}

// ─── GLSL sources ─────────────────────────────────────────────────────────────

const BASE_VERT = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

const SPLAT_FRAG = `
  precision highp float;
  varying vec2 v_uv;
  uniform sampler2D u_texture;
  uniform vec2 u_point;
  uniform vec3 u_color;
  uniform float u_radius;
  uniform float u_aspect;
  void main() {
    vec2 p = v_uv - u_point;
    p.x *= u_aspect;
    float d = 1.0 - min(length(p) / u_radius, 1.0);
    d = d * d * d;
    vec3 base = texture2D(u_texture, v_uv).rgb;
    gl_FragColor = vec4(base + u_color * d, 1.0);
  }
`

const ADVECT_FRAG = `
  precision highp float;
  varying vec2 v_uv;
  uniform sampler2D u_velocity;
  uniform sampler2D u_source;
  uniform vec2 u_texel;
  uniform float u_dt;
  uniform float u_dissipation;
  void main() {
    vec2 vel = texture2D(u_velocity, v_uv).rg;
    vec2 prev = v_uv - vel * u_dt * u_texel;
    gl_FragColor = u_dissipation * texture2D(u_source, prev);
  }
`

const DISPLAY_FRAG = `
  precision highp float;
  varying vec2 v_uv;
  uniform sampler2D u_dye;
  void main() {
    gl_FragColor = texture2D(u_dye, v_uv);
  }
`

// ─── Main component ───────────────────────────────────────────────────────────

/**
 * SplashCursor
 *
 * Props:
 *   COLOR  — hex string for the splash color (default '#021a02' emerald)
 *
 * Renders a fixed full-screen canvas behind everything (z-index: 0, pointer-events: none)
 * so it does not block clicks. Use z-index management on your content to sit above it.
 */
function SplashCursor({ COLOR = '#021a02' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
    if (!gl) return

    // ── Parse hex color ──────────────────────────────────────────────────────
    function hexToRgb(hex) {
      const r = parseInt(hex.slice(1, 3), 16) / 255
      const g = parseInt(hex.slice(3, 5), 16) / 255
      const b = parseInt(hex.slice(5, 7), 16) / 255
      return [r, g, b]
    }
    const baseColor = hexToRgb(COLOR)

    // ── Compile programs ─────────────────────────────────────────────────────
    const splatProg  = createProgram(gl, BASE_VERT, SPLAT_FRAG)
    const advectProg = createProgram(gl, BASE_VERT, ADVECT_FRAG)
    const displayProg = createProgram(gl, BASE_VERT, DISPLAY_FRAG)

    // ── Full-screen quad ─────────────────────────────────────────────────────
    const quadBuf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)

    function bindQuad(prog) {
      const loc = gl.getAttribLocation(prog, 'a_position')
      gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf)
      gl.enableVertexAttribArray(loc)
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)
    }

    let W = window.innerWidth
    let H = window.innerHeight
    canvas.width  = W
    canvas.height = H

    let dyeA  = createFBO(gl, W, H)
    let dyeB  = createFBO(gl, W, H)
    let velA  = createFBO(gl, W, H)
    let velB  = createFBO(gl, W, H)

    // ── Resize ───────────────────────────────────────────────────────────────
    function handleResize() {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width  = W
      canvas.height = H
      dyeA  = createFBO(gl, W, H)
      dyeB  = createFBO(gl, W, H)
      velA  = createFBO(gl, W, H)
      velB  = createFBO(gl, W, H)
    }
    window.addEventListener('resize', handleResize)

    // ── Pointer state ────────────────────────────────────────────────────────
    const pointer = { x: 0.5, y: 0.5, dx: 0, dy: 0, moved: false }

    function onMove(cx, cy) {
      const nx = cx / W
      const ny = 1.0 - cy / H
      pointer.dx = (nx - pointer.x) * 8
      pointer.dy = (ny - pointer.y) * 8
      pointer.x  = nx
      pointer.y  = ny
      pointer.moved = true
    }

    const onMouse = (e) => onMove(e.clientX, e.clientY)
    const onTouch = (e) => {
      const t = e.touches[0]
      if (t) onMove(t.clientX, t.clientY)
    }

    window.addEventListener('mousemove', onMouse)
    window.addEventListener('touchmove', onTouch, { passive: true })

    // ── Splat helper ─────────────────────────────────────────────────────────
    function splat(x, y, dx, dy, fbo, colorOverride) {
      gl.useProgram(splatProg)
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo.fbo)
      gl.viewport(0, 0, fbo.width, fbo.height)
      bindQuad(splatProg)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, fbo.texture)
      gl.uniform1i(gl.getUniformLocation(splatProg, 'u_texture'), 0)
      gl.uniform2f(gl.getUniformLocation(splatProg, 'u_point'), x, y)
      gl.uniform3fv(gl.getUniformLocation(splatProg, 'u_color'), colorOverride || [dx, dy, 0])
      gl.uniform1f(gl.getUniformLocation(splatProg, 'u_radius'), 0.12)
      gl.uniform1f(gl.getUniformLocation(splatProg, 'u_aspect'), W / H)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    // ── Advect helper ─────────────────────────────────────────────────────────
    function advect(vel, source, dest, dissipation, dt) {
      gl.useProgram(advectProg)
      gl.bindFramebuffer(gl.FRAMEBUFFER, dest.fbo)
      gl.viewport(0, 0, dest.width, dest.height)
      bindQuad(advectProg)

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, vel.texture)
      gl.uniform1i(gl.getUniformLocation(advectProg, 'u_velocity'), 0)

      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, source.texture)
      gl.uniform1i(gl.getUniformLocation(advectProg, 'u_source'), 1)

      gl.uniform2f(gl.getUniformLocation(advectProg, 'u_texel'), 1.0 / dest.width, 1.0 / dest.height)
      gl.uniform1f(gl.getUniformLocation(advectProg, 'u_dt'), dt)
      gl.uniform1f(gl.getUniformLocation(advectProg, 'u_dissipation'), dissipation)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    // ── Render loop ───────────────────────────────────────────────────────────
    let last = performance.now()
    let rafId

    function loop(now) {
      rafId = requestAnimationFrame(loop)
      const dt = Math.min((now - last) / 1000, 0.016)
      last = now

      if (pointer.moved) {
        // Update velocity field
        splat(pointer.x, pointer.y, pointer.dx * 30, pointer.dy * 30, velA, null)
        const tmp = velA; velA = velB; velB = tmp

        // Inject dye with slight color variation
        const hue = Math.random() * 60 - 30
        const r = Math.max(0, Math.min(1, baseColor[0] + hue * 0.003))
        const g = Math.max(0, Math.min(1, baseColor[1] + hue * 0.003))
        const b = Math.max(0, Math.min(1, baseColor[2] + hue * 0.003))
        splat(pointer.x, pointer.y, 0, 0, dyeA, [r * 0.8, g * 0.8, b * 0.8])
        const tmp2 = dyeA; dyeA = dyeB; dyeB = tmp2

        pointer.moved = false
      }

      // Advect velocity
      advect(velA, velA, velB, 0.98, dt)
      const tv = velA; velA = velB; velB = tv

      // Advect dye
      advect(velA, dyeA, dyeB, 0.975, dt)
      const td = dyeA; dyeA = dyeB; dyeB = td

      // Render to screen
      gl.useProgram(displayProg)
      gl.bindFramebuffer(gl.FRAMEBUFFER, null)
      gl.viewport(0, 0, W, H)
      bindQuad(displayProg)
      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, dyeA.texture)
      gl.uniform1i(gl.getUniformLocation(displayProg, 'u_dye'), 0)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    rafId = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouse)
      window.removeEventListener('touchmove', onTouch)
      window.removeEventListener('resize', handleResize)
    }
  }, [COLOR])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        opacity: 0.55,
      }}
    />
  )
}

export default SplashCursor

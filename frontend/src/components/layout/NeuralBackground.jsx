/**
 * NeuralBackground
 * ================
 * Animated SVG-canvas neural-network background for the Results page header.
 * 60 slowly drifting nodes connected by faint teal lines when within range.
 *
 * Design intent:
 *   - Communicates "AI intelligence" without being distracting
 *   - Constrained to the dark header panel — not scattered everywhere
 *   - Respects prefers-reduced-motion (freezes instantly if set)
 *   - Zero external dependencies — pure canvas 2D
 *
 * Props:
 *   className  — wrapper div class (use to set width/height)
 *   riskScore  — 0-100, tints the node colour warm-to-red at high risk
 */

import { useEffect, useRef } from 'react'

const NODE_COUNT     = 55
const MAX_DIST       = 130    // px — connection draw threshold
const BASE_SPEED     = 0.28   // px per frame
const NODE_RADIUS    = 1.8
const LINE_OPACITY   = 0.18   // max opacity for connecting lines

// Colour from safe (teal) → risk (coral) based on score
function riskColour(score) {
  if (score === null || score === undefined) return [20, 184, 166]   // teal-400
  if (score > 75) return [248, 113, 113]   // red-400
  if (score > 50) return [251, 146,  60]   // orange-400
  if (score > 25) return [251, 191,  36]   // amber-400
  return               [20,  184, 166]     // teal-400
}

export default function NeuralBackground({ className = '', riskScore = 0 }) {
  const canvasRef  = useRef(null)
  const frameRef   = useRef(null)
  const nodesRef   = useRef([])
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let W = 0, H = 0

    // ── Resize handler ────────────────────────────────────────────────────────
    const resize = () => {
      W = canvas.offsetWidth
      H = canvas.offsetHeight
      canvas.width  = W * window.devicePixelRatio
      canvas.height = H * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resize()

    // ── Seed nodes ────────────────────────────────────────────────────────────
    nodesRef.current = Array.from({ length: NODE_COUNT }, () => ({
      x:   Math.random() * W,
      y:   Math.random() * H,
      vx:  (Math.random() - 0.5) * BASE_SPEED * 2,
      vy:  (Math.random() - 0.5) * BASE_SPEED * 2,
      r:   NODE_RADIUS + Math.random() * 1.2,
      // stagger pulse phase so they don't all pulse together
      phase: Math.random() * Math.PI * 2,
    }))

    // ── Animation loop ────────────────────────────────────────────────────────
    let tick = 0
    const [cr, cg, cb] = riskColour(riskScore)

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      tick++

      const nodes = nodesRef.current

      // Move nodes, bounce off walls
      for (const n of nodes) {
        if (!reducedMotion) {
          n.x += n.vx
          n.y += n.vy
          if (n.x < 0 || n.x > W) n.vx *= -1
          if (n.y < 0 || n.y > H) n.vy *= -1
        }

        // Soft pulse in size
        const pulse = 1 + 0.35 * Math.sin(tick * 0.025 + n.phase)

        // Draw node glow
        const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * pulse * 4)
        grd.addColorStop(0, `rgba(${cr},${cg},${cb},0.55)`)
        grd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * pulse * 4, 0, Math.PI * 2)
        ctx.fillStyle = grd
        ctx.fill()

        // Draw node core
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${cr},${cg},${cb},0.85)`
        ctx.fill()
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx   = nodes[i].x - nodes[j].x
          const dy   = nodes[i].y - nodes[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < MAX_DIST) {
            const alpha = LINE_OPACITY * (1 - dist / MAX_DIST)
            ctx.beginPath()
            ctx.moveTo(nodes[i].x, nodes[i].y)
            ctx.lineTo(nodes[j].x, nodes[j].y)
            ctx.strokeStyle = `rgba(${cr},${cg},${cb},${alpha})`
            ctx.lineWidth   = 0.6
            ctx.stroke()
          }
        }
      }

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(frameRef.current)
      ro.disconnect()
    }
  }, [riskScore, reducedMotion])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{ display: 'block', width: '100%', height: '100%' }}
    />
  )
}

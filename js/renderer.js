// BitSprite Canvas 2D Rendering Engine (Procedural Visualizer)
class BitSpriteRenderer {
  constructor() {
    this.particles = [];
    this.cloudTimer = 0;
    this.glitchTimer = 0;
  }

  draw(canvas, ctx, game) {
    const w = canvas.width;
    const h = canvas.height;
    ctx.save();

    // Calculate camera smooth tracking
    const cameraX = game.player.x - w / 2;
    const cameraY = Math.max(-800, Math.min(200, game.player.y - h / 2 - 100));

    // DRAW PHASE BACKGROUNDS
    this.drawBackground(ctx, w, h, game);

    // Apply Camera offsets
    ctx.translate(-cameraX, -cameraY);

    // Draw Parallax ambient cloud details (Phase 0 and 1)
    if (game.activePhase <= 1) {
      this.drawParallaxClouds(ctx, cameraX, cameraY, game);
    }

    // Draw glowing cache grids (Phase 2 and 3)
    if (game.activePhase >= 2) {
      this.drawSpaceGrid(ctx, w, h, cameraX, cameraY, game);
    }

    // DRAW LEVEL PLATFORMS & SPARK HAZARDS
    this.drawPlatforms(ctx, game);

    // DRAW KEYS & LEVERS
    this.drawCollectibles(ctx, game);

    // DRAW BLOCK STACK MNEMONICS FOR OVERFLOW EXPLOIT
    this.drawInstructionBlocks(ctx, game);

    // DRAW ENEMIES (ALU operators)
    this.drawEnemies(ctx, game);

    // DRAW GCPATROL (Garbage Collector)
    this.drawGCPatrol(ctx, game);

    // DRAW PACKY (Golden Bird CPU Bus)
    this.drawPacky(ctx, game);

    // DRAW PARTICLES
    this.drawParticles(ctx, game);

    // DRAW PLAYER (Triangulum Program Counter)
    this.drawPlayer(ctx, game);

    // DRAW SPECTRE ECHO SONAR WAVE EFFECT
    if (game.isSpectreActive) {
      ctx.save();
      const waveRadius = ((300 - game.spectreTimer) / 300) * 800; // Expands up to 800px
      const p = game.player;
      
      ctx.strokeStyle = `rgba(0, 240, 255, ${game.spectreTimer / 300})`;
      ctx.lineWidth = 4;
      ctx.shadowBlur = 25;
      ctx.shadowColor = "cyan";
      
      ctx.beginPath();
      ctx.arc(p.x + 16, p.y + 16, waveRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Restore state
    ctx.restore();

    // DRAW PHASE HUD EFFECTS OVER THE ENTIRE SCREEN
    this.drawOverlayHUD(ctx, w, h, game);
  }

  drawBackground(ctx, w, h, game) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);

    if (game.activePhase === 0) {
      // Phase 0: Cozy Bright blue HSL skies
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "hsl(200, 100%, 75%)");
      grad.addColorStop(1, "hsl(200, 100%, 90%)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Sun
      ctx.beginPath();
      ctx.arc(w - 150, 120, 45, 0, Math.PI * 2);
      ctx.fillStyle = "hsl(45, 100%, 65%)";
      ctx.shadowBlur = 30;
      ctx.shadowColor = "rgba(255, 230, 0, 0.4)";
      ctx.fill();
      ctx.shadowBlur = 0; // reset
    } else if (game.activePhase === 1) {
      // Phase 1: Grey polluted sky
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, "hsl(200, 20%, 45%)");
      grad.addColorStop(1, "hsl(200, 20%, 60%)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Square sun
      ctx.fillStyle = "hsl(45, 60%, 45%)";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(200, 180, 0, 0.2)";
      ctx.fillRect(w - 180, 90, 70, 70);
      ctx.shadowBlur = 0;
    }
  }

  drawParallaxClouds(ctx, camX, camY, game) {
    // Dynamic rolling green / olive pasture hills
    const hillsColor = game.activePhase === 0 ? "hsl(120, 65%, 45%)" : "hsl(120, 35%, 25%)";
    const bgHillsColor = game.activePhase === 0 ? "hsl(120, 50%, 38%)" : "hsl(120, 25%, 18%)";

    ctx.save();
    
    // Background far hills
    ctx.fillStyle = bgHillsColor;
    ctx.beginPath();
    ctx.moveTo(camX - 100, camY + 800);
    for (let x = camX - 100; x < camX + 1200; x += 100) {
      const y = camY + 380 + Math.sin(x * 0.003) * 60;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(camX + 1200, camY + 800);
    ctx.closePath();
    ctx.fill();

    // Foreground closer hills
    ctx.fillStyle = hillsColor;
    ctx.beginPath();
    ctx.moveTo(camX - 100, camY + 800);
    for (let x = camX - 100; x < camX + 1200; x += 80) {
      const y = camY + 450 + Math.sin(x * 0.005) * 45;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(camX + 1200, camY + 800);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawSpaceGrid(ctx, w, h, camX, camY, game) {
    ctx.save();
    ctx.strokeStyle = game.activePhase === 2 ? "rgba(0, 240, 255, 0.04)" : "rgba(0, 240, 255, 0.08)";
    ctx.lineWidth = 1.2;

    const gridSize = 40;
    const startX = Math.floor(camX / gridSize) * gridSize;
    const endX = startX + w + gridSize * 2;
    const startY = Math.floor(camY / gridSize) * gridSize;
    const endY = startY + h + gridSize * 2;

    // Vertical grid lines
    for (let x = startX; x < endX; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let y = startY; y < endY; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
    }

    // Draw background Pink horizontal signal buses in Phase 3
    if (game.activePhase === 3) {
      ctx.strokeStyle = "rgba(255, 0, 255, 0.12)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(camX, 220);
      ctx.lineTo(camX + w, 220);
      ctx.moveTo(camX, 420);
      ctx.lineTo(camX + w, 420);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawPlatforms(ctx, game) {
    ctx.save();

    game.platforms.forEach(plat => {
      // Disappearing platforms have no physical body when 0% charged
      if (plat.behavior === 'disappearing' && plat.charge <= 0) return;

      // Spectre Platform active check
      if (plat.behavior === 'cache' && !game.isSpectreActive) return;

      if (game.activePhase === 0) {
        // Wooden textured platforms
        ctx.fillStyle = plat.isRowhammerable ? "#b57228" : "#8b5a2b";
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        // Green grass top
        ctx.fillStyle = "#4a9c36";
        ctx.fillRect(plat.x, plat.y, plat.w, 6);
      } else if (game.activePhase === 1) {
        // Corrupted grey dirty platforms
        ctx.fillStyle = plat.isRowhammerable ? "#8e8e8e" : "#5a5a5a";
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        // Cracks visualization
        if (plat.isRowhammerable && plat.hitCounter > 0) {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(plat.x + plat.w / 2, plat.y);
          ctx.lineTo(plat.x + plat.w / 2 - 10, plat.y + 15);
          ctx.lineTo(plat.x + plat.w / 2 + 10, plat.y + 20);
          ctx.stroke();
        }
      } else if (game.activePhase === 2) {
        // Glowing cyan vector frames in Spectre dark phase
        const p = game.player;
        const dist = Math.hypot(p.x + 16 - (plat.x + plat.w/2), p.y + 16 - plat.y);
        
        let alpha = 0;
        
        // Flashlight effect near player (always slightly visible)
        if (dist < 180) {
          alpha = 0.25 * (1 - dist / 180);
        }
        
        // Spectre Echo scan wave revealing platforms dynamically!
        if (game.isSpectreActive) {
          const waveRadius = ((300 - game.spectreTimer) / 300) * 800;
          // If the platform is inside the expanding wave radius, light it up!
          if (dist <= waveRadius + 80 && dist >= waveRadius - 150) {
            alpha = Math.max(alpha, 1.0);
          } else if (dist < waveRadius) {
            // Keep platforms lit after the wave passes over them, fading out slowly
            alpha = Math.max(alpha, game.spectreTimer / 300);
          }
        }
        
        if (alpha > 0) {
          ctx.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
          ctx.lineWidth = 2;
          ctx.shadowBlur = alpha * 12;
          ctx.shadowColor = "cyan";
          ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
          ctx.shadowBlur = 0;
        }
      } else if (game.activePhase >= 3) {
        // Block diagram look
        ctx.fillStyle = "hsl(210, 30%, 15%)";
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);

        ctx.strokeStyle = plat.behavior === 'spikes' ? "red" : "lime";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      }

      // Spikes hazard draw details
      if (plat.behavior === 'spikes') {
        ctx.fillStyle = "rgba(255, 0, 0, 0.4)";
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        
        ctx.strokeStyle = "red";
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let sx = plat.x; sx < plat.x + plat.w; sx += 15) {
          ctx.moveTo(sx, plat.y + plat.h);
          ctx.lineTo(sx + 7, plat.y);
          ctx.lineTo(sx + 15, plat.y + plat.h);
        }
        ctx.stroke();
      }

      // DRAMy Cell charge visualization inside platforms
      if (plat.behavior === 'disappearing') {
        const barW = (plat.charge / 100) * (plat.w - 12);
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(plat.x + 6, plat.y + plat.h - 10, plat.w - 12, 6);

        ctx.fillStyle = plat.charge > 30 ? "cyan" : "red";
        ctx.fillRect(plat.x + 6, plat.y + plat.h - 10, barW, 6);
      }
    });

    ctx.restore();
  }

  drawCollectibles(ctx, game) {
    ctx.save();

    // Keys (golden key)
    game.keys.forEach(key => {
      if (key.collected) return;
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.arc(key.x + 12, key.y + 10, 6, 0, Math.PI * 2);
      ctx.fill();

      // key stick
      ctx.fillRect(key.x + 10, key.y + 12, 4, 12);
      ctx.fillRect(key.x + 14, key.y + 16, 5, 3);
      ctx.fillRect(key.x + 14, key.y + 21, 5, 3);
    });

    // Levers
    game.levers.forEach(lever => {
      ctx.fillStyle = "#8e8e8e";
      ctx.fillRect(lever.x, lever.y + 20, 20, 10); // base

      ctx.strokeStyle = lever.activated ? "lime" : "#d9534f";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(lever.x + 10, lever.y + 20);
      if (lever.activated) {
        ctx.lineTo(lever.x + 25, lever.y + 5);
      } else {
        ctx.lineTo(lever.x - 5, lever.y + 5);
      }
      ctx.stroke();
    });

    // Exit Gate
    if (game.exitGate) {
      const g = game.exitGate;
      ctx.fillStyle = g.isSolid ? "rgba(220, 53, 69, 0.25)" : "rgba(40, 167, 69, 0.25)";
      ctx.fillRect(g.x, g.y, g.w, g.h);

      ctx.strokeStyle = g.isSolid ? "#dc3545" : "#28a745";
      ctx.lineWidth = 3;
      ctx.strokeRect(g.x, g.y, g.w, g.h);

      // Label showing key requirement
      if (g.isSolid) {
        ctx.fillStyle = "#fff";
        ctx.font = "bold 14px Courier New";
        ctx.textAlign = "center";
        ctx.fillText(`${game.keysCount}/${g.requiredKeys}🔑`, g.x + g.w/2, g.y - 12);
      }
    }

    ctx.restore();
  }

  drawInstructionBlocks(ctx, game) {
    ctx.save();
    game.mnemonicBlocks.forEach(block => {
      // Draw neon dynamic block diagrams for Overflow
      ctx.fillStyle = "rgba(255, 0, 255, 0.15)";
      ctx.fillRect(block.x, block.y, block.w, block.h);

      ctx.strokeStyle = "magenta";
      ctx.lineWidth = 2;
      ctx.strokeRect(block.x, block.y, block.w, block.h);

      ctx.fillStyle = "#fff";
      ctx.font = "12px Courier New";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(block.type, block.x + block.w/2, block.y + block.h/2);
    });
    ctx.restore();
  }

  drawEnemies(ctx, game) {
    ctx.save();
    game.enemies.forEach(enemy => {
      if (enemy.type === 'aluPatrol') {
        // Red bouncing ALUPatrol operator shape
        ctx.fillStyle = "#d9534f";
        ctx.beginPath();
        ctx.arc(enemy.x + 16, enemy.y + 16, 16, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "red";
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Inner operator symbol
        ctx.fillStyle = "#fff";
        ctx.font = "bold 18px Courier New";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("+", enemy.x + 16, enemy.y + 16);
      }
    });
    ctx.restore();
  }

  drawGCPatrol(ctx, game) {
    if (!game.gcPatrol) return;
    const gc = game.gcPatrol;

    ctx.save();
    
    // Draw the body (dark-gray futuristic monolit cube)
    ctx.fillStyle = "#1e2022";
    ctx.strokeStyle = "#4a4e5a";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 8;
    ctx.shadowColor = "#000";

    ctx.fillRect(gc.x, gc.y, gc.w, gc.h);
    ctx.strokeRect(gc.x, gc.y, gc.w, gc.h);

    // If paused, draw neon pink/red glowing pause boundaries
    if (gc.pauseTimer > 0) {
      ctx.strokeStyle = "#ff007f";
      ctx.shadowColor = "#ff007f";
      ctx.shadowBlur = 15;
      ctx.strokeRect(gc.x - 4, gc.y - 4, gc.w + 8, gc.h + 8);

      // Print "GC_PAUSED" text in neon pink
      ctx.fillStyle = "#ff007f";
      ctx.font = "bold 11px Courier New";
      ctx.textAlign = "center";
      ctx.fillText("GC_PAUSED", gc.x + gc.w/2, gc.y - 12);
    } else {
      // Normal state: Glowing red scanning eye!
      ctx.fillStyle = "#ff0055";
      ctx.shadowColor = "#ff0055";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      // Eye sweeps/pulses left and right
      const eyeOffset = Math.sin(game.timer * 6) * 8;
      ctx.arc(gc.x + gc.w/2 + eyeOffset, gc.y + gc.h/2, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  drawPacky(ctx, game) {
    ctx.save();
    const p = game.packy;

    // Glowing Golden Bird
    ctx.fillStyle = "gold";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "yellow";

    // Draw simple bird wing oscillations
    ctx.beginPath();
    ctx.arc(p.x + 12, p.y + 12, 10, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.strokeStyle = "gold";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x + 12, p.y + 12);
    const swing = Math.sin(game.timer * 15) * 12;
    ctx.lineTo(p.x + 2, p.y + 12 + swing);
    ctx.moveTo(p.x + 12, p.y + 12);
    ctx.lineTo(p.x + 22, p.y + 12 + swing);
    ctx.stroke();

    ctx.shadowBlur = 0; // reset
    ctx.restore();
  }

  drawParticles(ctx, game) {
    // Generate movement spark dust on walk/jump
    if (Math.random() < 0.15 && game.player.vx !== 0) {
      this.particles.push({
        x: game.player.x + 16,
        y: game.player.y + 32,
        vx: (Math.random() - 0.5) * 50,
        vy: -Math.random() * 40,
        color: game.activePhase >= 2 ? "cyan" : "rgba(255,255,255,0.5)",
        life: 1.0
      });
    }

    ctx.save();
    this.particles.forEach((part, idx) => {
      part.x += part.vx * 0.016;
      part.y += part.vy * 0.016;
      part.life -= 0.03;
      
      if (part.life <= 0) {
        this.particles.splice(idx, 1);
        return;
      }

      ctx.fillStyle = part.color;
      ctx.globalAlpha = part.life;
      ctx.fillRect(part.x, part.y, 4, 4);
    });
    ctx.restore();
  }

  drawPlayer(ctx, game) {
    ctx.save();
    const p = game.player;

    ctx.translate(p.x + 16, p.y + 16);
    ctx.rotate((p.tilt * Math.PI) / 180);

    // Apply squash and stretch dynamically on vy velocity
    let scaleX = 1.0;
    let scaleY = 1.0;
    if (Math.abs(p.vy) > 100) {
      scaleY = Math.min(1.35, 1.0 + Math.abs(p.vy) * 0.0005);
      scaleX = Math.max(0.75, 1.0 - Math.abs(p.vy) * 0.0004);
    }
    ctx.scale(scaleX, scaleY);

    // Dynamic HSL glowing colors
    let playerColor = "hsl(180, 100%, 50%)"; // Cyan standard
    if (game.isHijackActive) playerColor = "hsl(300, 100%, 60%)"; // Pink hijacked flight
    if (p.isShieldActive) playerColor = "hsl(60, 100%, 50%)"; // Yellow shield

    ctx.fillStyle = playerColor;
    ctx.shadowBlur = 20;
    ctx.shadowColor = playerColor;

    // Draw Triangle
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(-16, 16);
    ctx.lineTo(16, 16);
    ctx.closePath();
    ctx.fill();

    // Inner Program Counter light core
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(0, 4, 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw visual neon hammer strike swing arc
    if (p.strikeTimer > 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(0, 240, 255, 0.85)";
      ctx.lineWidth = 4;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "cyan";
      
      const swingAngle = ((8 - p.strikeTimer) / 8) * Math.PI; // swing sweep arc
      ctx.beginPath();
      ctx.arc(0, 0, 36, -Math.PI/2, -Math.PI/2 + swingAngle);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  drawOverlayHUD(ctx, w, h, game) {
    // PHASE 1: Binary Matrix Rain falling down
    if (game.activePhase === 1) {
      ctx.save();
      ctx.fillStyle = "rgba(0, 255, 0, 0.05)";
      ctx.font = "14px Courier New";
      for (let i = 0; i < w; i += 24) {
        const char = Math.random() < 0.5 ? "0" : "1";
        const y = (Math.sin(game.timer + i) * h * 0.5 + h * 0.5) % h;
        ctx.fillText(char, i, y);
      }
      ctx.restore();
    }

    // PHASE 4 & 5: TTY system crash console sweeps and yellow voltage oscilloscope
    if (game.activePhase === 3 || game.activePhase === 4) {
      // Oscilloscope sine wave at bottom
      ctx.save();
      ctx.strokeStyle = "yellow";
      ctx.lineWidth = 3;
      ctx.shadowBlur = 15;
      ctx.shadowColor = "yellow";
      
      ctx.beginPath();
      for (let x = 0; x < w; x += 10) {
        // Synchronized with live game voltage calculations
        const y = h - 80 + Math.sin(x * 0.02 + game.oscilloscopeTime) * 45;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.restore();

      // Setup violation limits guide lines (setup and hold boundaries)
      ctx.save();
      ctx.strokeStyle = "rgba(255, 0, 0, 0.3)";
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      
      // Upper setup limit (2.05V equivalent)
      ctx.beginPath();
      ctx.moveTo(0, h - 80 - 38);
      ctx.lineTo(w, h - 80 - 38);
      ctx.stroke();

      // Lower setup limit (0.35V equivalent)
      ctx.beginPath();
      ctx.moveTo(0, h - 80 + 38);
      ctx.lineTo(w, h - 80 + 38);
      ctx.stroke();
      ctx.restore();

      // Live text readout
      ctx.save();
      const isExtreme = game.oscilloscopeVoltage > 2.05 || game.oscilloscopeVoltage < 0.35;
      ctx.fillStyle = isExtreme ? "#ff3366" : "#ffff00";
      ctx.font = "bold 15px monospace";
      if (isExtreme) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#ff3366";
      }
      ctx.fillText(`⚡ VOLTAGE: ${game.oscilloscopeVoltage.toFixed(2)}V [${isExtreme ? "VIOLATION WINDOW ACTIVE! STRIKE!" : "STABILIZING..."}]`, 30, h - 145);
      ctx.restore();

      // Radar scanline sweep
      ctx.fillStyle = "rgba(255, 0, 100, 0.06)";
      const sweepY = (game.timer * 180) % h;
      ctx.fillRect(0, sweepY, w, 15);
    }
  }
}

// Global active Renderer instance
const Renderer = new BitSpriteRenderer();
window.GameRenderer = Renderer;

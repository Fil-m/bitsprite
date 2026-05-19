// BitSprite Main Game Engine (Core-0 Platformer Kernel)
const PHYSICS = {
  GRAVITY: 2200,
  JUMP_FORCE: 650,
  MAX_SPEED: 450,
  ACCELERATION: 1200,
  GROUND_FRICTION: 0.92,
  AIR_FRICTION: 0.99,
  NORMAL_JUMP_HEIGHT: 96,
  ROWHAMMER_JUMP_HEIGHT: 280
};

class BitSpriteGame {
  constructor() {
    this.activePhase = 0; // Narrative Phase (0 to 4)
    this.levelNumber = 1; // Infinite Arcade Level
    this.keysCount = 0;
    this.score = 0;
    this.timer = 0;
    this.isDead = false;
    this.victoryState = false;

    // Core Entities
    this.player = {
      x: 100,
      y: 350,
      vx: 0,
      vy: 0,
      w: 32,
      h: 32,
      hp: 3,
      isOnGround: false,
      tilt: 0,
      isShieldActive: false,
      strikeTimer: 0
    };

    // Packy CPU Bus (Golden Bird)
    this.packy = {
      x: 400,
      y: 200,
      w: 24,
      h: 24,
      vx: 150,
      vy: 0,
      state: 'normal', // normal, BUS_WAIT
      patrolIndex: 0,
      waypoints: [
        { x: 400, y: 200 },
        { x: 750, y: 150 },
        { x: 500, y: 320 },
        { x: 150, y: 250 }
      ],
      waitTimer: 0
    };
    this.packyFreezeTimer = 0;
    this.carriedBlock = null;

    // Low-Level Metaphor Variables
    this.cpuFrequency = 1.0; // 1.0x standard, 0.5x rowhammer
    this.oscilloscopeVoltage = 1.2; // fluctuates continuously
    this.oscilloscopeTime = 0;

    // Exploit Durations
    this.dramRefreshTimer = 0;
    this.isSpectreActive = false;
    this.spectreTimer = 0;
    this.isHijackActive = false;
    this.hijackTimer = 0;

    // IRQ-9 APIC Jump Counter
    this.irqJumpCounter = 0;
    this.irqFreezeTimer = 0;

    // Map Arrays
    this.platforms = [];
    this.enemies = [];
    this.keys = [];
    this.levers = [];
    this.exitGate = null;
    this.gcPatrol = null;

    // Block stack registers for Overflow exploit
    this.mnemonicBlocks = [
      { x: 1800, y: 460, w: 50, h: 20, type: 'MOV', vx: 0, vy: 0 },
      { x: 1950, y: 460, w: 50, h: 20, type: 'ADD', vx: 0, vy: 0 },
      { x: 2100, y: 460, w: 50, h: 20, type: 'RET', vx: 0, vy: 0 }
    ];

    // Inputs States
    this.keysPressed = {};
    this.touchInputs = { left: false, right: false, jump: false, action: false, block: false };

    // Timing Loop
    this.lastTime = 0;
  }

  init() {
    this.loadPhaseProgress();

    // God Mode check on page reload/init!
    const isGodMode = localStorage.getItem('bitsprite_godmode') === 'true';
    if (window.SlotsEngine) {
      if (isGodMode) {
        // Unlock all exploits instantly for the ultimate God Mode experience!
        window.SlotsEngine.unlock('rowhammer');
        window.SlotsEngine.unlock('spectre');
        window.SlotsEngine.unlock('hijack');
        window.SlotsEngine.unlock('glitch');
        window.SlotsEngine.unlock('overflow');
      } else {
        // Start fresh with zero achievements to prevent God Mode carrying over by default
        window.SlotsEngine.resetProgress();
      }
    }

    this.loadLevelMap();
    this.setupListeners();
    
    // Bind translations
    window.translations = this.activePhase >= 0 ? window.translationsUA : window.translationsEN;

    // Start background synthesizer loop
    if (window.AudioEngine) {
      window.AudioEngine.startAmbient(this.activePhase);
    }
  }

  loadPhaseProgress() {
    try {
      const savedPhase = localStorage.getItem('bitsprite_phase');
      if (savedPhase !== null) {
        this.activePhase = parseInt(savedPhase);
      }
    } catch(e) {}
  }

  setPhase(phaseNum) {
    this.activePhase = Math.max(0, Math.min(4, phaseNum));
    try {
      localStorage.setItem('bitsprite_phase', this.activePhase);
    } catch(e) {}

    // Reset loop audio
    if (window.AudioEngine) {
      window.AudioEngine.play('phase_shift');
      window.AudioEngine.startAmbient(this.activePhase);
    }

    this.loadLevelMap();
    if (window.SlotsEngine) {
      window.SlotsEngine.updateUIPanels();
    }
    
    // Update showroom panels
    const showEl = document.getElementById('phase-select');
    if (showEl) showEl.value = this.activePhase;
  }

  loadLevelMap() {
    this.keysCount = 0;
    this.victoryState = false;
    this.isDead = false;
    this.player.hp = 3;
    this.player.vx = 0;
    this.player.vy = 0;
    this.player.x = 100;
    this.player.y = 350;

    // Procedural level stitch generator
    const map = window.LevelsEngine.generateLevel(this.levelNumber);
    this.platforms = map.platforms;
    this.enemies = map.enemies;
    this.keys = map.keys;
    this.levers = map.levers;
    this.exitGate = map.exitGate;

    // Dynamically build Packy CPU Bus (Golden Bird) waypoints across the entire generated level!
    const packyWaypoints = [{ x: 100, y: 150 }];
    
    // Add waypoints above every 3rd platform to span the entire map length
    for (let i = 2; i < this.platforms.length - 1; i += 3) {
      const plat = this.platforms[i];
      if (plat.behavior !== 'spikes') {
        packyWaypoints.push({ x: plat.x + plat.w/2, y: plat.y - 120 });
      }
    }
    
    // Final waypoint near exit gate
    if (this.exitGate) {
      packyWaypoints.push({ x: this.exitGate.x - 100, y: 150 });
    }
    
    // Loop waypoints in reverse so Packy loops back and forth smoothly!
    const revCount = packyWaypoints.length;
    for (let i = revCount - 2; i >= 0; i--) {
      packyWaypoints.push({ x: packyWaypoints[i].x, y: packyWaypoints[i].y });
    }
    
    this.packy = {
      x: 100,
      y: 150,
      w: 24,
      h: 24,
      vx: 160 + Math.min(100, this.levelNumber * 5), // scales speed slightly with level
      vy: 0,
      state: 'normal',
      patrolIndex: 0,
      waypoints: packyWaypoints,
      waitTimer: 0
    };

    // Initialize GCPatrol (Garbage Collector)
    this.gcPatrol = {
      x: 600,
      y: 440,
      w: 40,
      h: 40,
      dir: 1,
      speed: 1.2,
      pauseTimer: 0
    };

    // Place Instruction stacks for Overflow dynamically on stable platforms across the level
    const stablePlats = this.platforms.filter(p => p.behavior === 'static');
    this.mnemonicBlocks.forEach((block, idx) => {
      if (stablePlats.length > 0) {
        // Distribute blocks evenly across the stable platforms (spread out)
        const sectionSize = Math.floor(stablePlats.length / 3);
        const pIdx = Math.min(stablePlats.length - 1, sectionSize * idx + Math.floor(Math.random() * Math.max(1, sectionSize)));
        const plat = stablePlats[pIdx];
        
        block.x = plat.x + plat.w / 2 - block.w / 2;
        block.y = plat.y - block.h - 10;
        
        // Save safe spawn position for abyss protection recovery
        block.spawnX = block.x;
        block.spawnY = block.y;
      } else {
        block.x = 200 + idx * 250;
        block.y = 100;
        block.spawnX = block.x;
        block.spawnY = block.y;
      }
      block.vx = 0;
      block.vy = 0;
    });

    this.timer = 0;
    this.levelTimer = 0;
    this.coins = map.coins || [];
    this.coinsCollected = 0;
    this.rowhammerGlobalHits = 0;
  }

  setupListeners() {
    // Clean up previous event listeners if setupListeners is called multiple times (e.g. on custom rebind)
    if (this._onKeyDown) {
      window.removeEventListener('keydown', this._onKeyDown);
    }
    if (this._onKeyUp) {
      window.removeEventListener('keyup', this._onKeyUp);
    }

    this._onKeyDown = e => {
      // Get all active bound key codes
      const bindings = window.gameSettings ? window.gameSettings.keyBindings : null;
      if (!bindings) return;

      const allBoundKeys = [
        ...bindings.left,
        ...bindings.right,
        ...bindings.jump,
        ...bindings.down,
        ...bindings.action,
        ...bindings.block
      ];

      // Prevent browser default activation only for currently bound game control keys
      if (allBoundKeys.includes(e.code)) {
        e.preventDefault();
      }

      this.keysPressed[e.code] = true;
      
      // Jump
      const isJumpPressed = bindings.jump.includes(e.code);
      if (isJumpPressed && this.player.isOnGround) {
        this.player.vy = -PHYSICS.JUMP_FORCE;
        if (window.AudioEngine) window.AudioEngine.play('jump');
        
        // APIC Interrupt counter
        this.irqJumpCounter++;
        if (this.irqJumpCounter % 64 === 0) {
          this.irqFreezeTimer = 60; // 1 second screen freeze frame
          if (window.AudioEngine) window.AudioEngine.play('achievement');
        }
      }

      // Action Slot Selection (1, 2, 3, 4, 5 buttons)
      if (e.code === 'Digit1') window.SlotsEngine.selectSlot(0);
      if (e.code === 'Digit2') window.SlotsEngine.selectSlot(1);
      if (e.code === 'Digit3') window.SlotsEngine.selectSlot(2);
      if (e.code === 'Digit4') window.SlotsEngine.selectSlot(3);
      if (e.code === 'Digit5') window.SlotsEngine.selectSlot(4);

      // ACTION Execution (E or Enter, or custom action key)
      const isActionPressed = bindings.action.includes(e.code);
      if (isActionPressed) {
        this.triggerActionButton();
      }
    };

    this._onKeyUp = e => {
      const bindings = window.gameSettings ? window.gameSettings.keyBindings : null;
      if (bindings) {
        const allBoundKeys = [
          ...bindings.left,
          ...bindings.right,
          ...bindings.jump,
          ...bindings.down,
          ...bindings.action,
          ...bindings.block
        ];
        if (allBoundKeys.includes(e.code)) {
          e.preventDefault();
        }
      }
      this.keysPressed[e.code] = false;
    };

    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
  }

  triggerActionButton() {
    if (this.isDead || this.victoryState) return;

    if (this.carriedBlock) {
      // Drop block in front of player
      const bindings = window.gameSettings ? window.gameSettings.keyBindings : null;
      const isLeftPressed = bindings ? bindings.left.some(k => this.keysPressed[k]) : (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']);
      const dir = isLeftPressed ? -1 : 1;
      this.carriedBlock.x = this.player.x + 16 - this.carriedBlock.w/2 + dir * 35;
      this.carriedBlock.y = this.player.y;
      this.carriedBlock.vy = 0;
      this.carriedBlock = null;
      if (window.AudioEngine) window.AudioEngine.play('collect');
      return;
    }

    // Check if near an instruction block to pick it up
    let nearBlock = null;
    this.mnemonicBlocks.forEach(block => {
      const dist = Math.hypot(this.player.x + 16 - (block.x + block.w/2), this.player.y + 16 - (block.y + block.h/2));
      if (dist < 70) {
        nearBlock = block;
      }
    });

    if (nearBlock) {
      this.carriedBlock = nearBlock;
      if (window.AudioEngine) window.AudioEngine.play('achievement');
      return;
    }

    const context = { player: this.player, game: this };
    const exploit = window.SlotsEngine.triggerExploit(context);

    if (exploit === 'hammer') {
      // Default hammer swing
      this.player.strikeTimer = 8;
      if (window.AudioEngine) window.AudioEngine.play('hammer');
      this.checkHammerCollision();
    } else if (exploit === 'rowhammer') {
      // Discretely toggle CPU clock frequency
      this.cpuFrequency = this.cpuFrequency === 1.0 ? 0.5 : 1.0;
      
      // Update HUD slider element
      const slider = document.getElementById('freq-slider');
      if (slider) slider.value = this.cpuFrequency;
    } else if (exploit === 'spectre') {
      this.isSpectreActive = true;
      this.spectreTimer = 300; // 5 seconds (at 60 FPS)
      
      // Activating Spectre in Phase 2 (activePhase === 1) cracks reality and warps us to Phase 3 (activePhase === 2)!
      if (this.activePhase === 1) {
        this.setPhase(2);
      }
    } else if (exploit === 'hijack') {
      this.isHijackActive = true;
      this.hijackTimer = 1200; // 20 seconds
      // Release Packy
      if (this.packy.state === 'BUS_WAIT') {
        this.packy.state = 'normal';
      }
    } else if (exploit === 'glitch') {
      // 1. Destroy all enemies in the level (Glitch blast!)
      let killedAny = false;
      this.enemies.forEach((enemy, idx) => {
        const dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
        if (dist < 600) {
          // Spawn neon glitch particles
          if (window.GameRenderer && window.GameRenderer.particles) {
            for (let i = 0; i < 12; i++) {
              window.GameRenderer.particles.push({
                x: enemy.x + 16,
                y: enemy.y + 16,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                color: Math.random() < 0.5 ? "#ff00ff" : "#00ffff", // Magenta / Cyan neon
                life: 1.0
              });
            }
          }
          this.enemies.splice(idx, 1);
          killedAny = true;
        }
      });
      if (killedAny && window.AudioEngine) {
        window.AudioEngine.play('death');
      }

      // 2. Only crash the system (setPhase(4)) if pressed near the exit gate AND player has the keys!
      if (this.exitGate) {
        const distToGate = Math.hypot(this.player.x - this.exitGate.x, this.player.y - this.exitGate.y);
        const hasKeys = this.keysCount >= this.exitGate.requiredKeys;
        
        if (distToGate < 120 && hasKeys) {
          this.exitGate.isSolid = false;
          if (window.AudioEngine) window.AudioEngine.play('gate_open');
          
          // Force wrap to Phase 4 (Glitch / system crash)
          this.setPhase(4);
        }
      }
    }
  }

  checkHammerCollision() {
    // Voltage Glitch exploit unlock check in Phase 4 (Core)
    if (this.activePhase === 3) {
      const v = this.oscilloscopeVoltage;
      // Oscilloscope fluctuations go from 0.2 to 2.2
      if (v > 2.05 || v < 0.35) {
        window.SlotsEngine.unlock('glitch');
      }
    }

    // 60px radius check for Rowhammer platforms or ALU enemies
    this.platforms.forEach(plat => {
      if (plat.isRowhammerable) {
        const platCenterX = plat.x + plat.w / 2;
        const platCenterY = plat.y + plat.h / 2;
        const dist = Math.hypot(this.player.x - platCenterX, this.player.y - platCenterY);
        
        if (dist < 120) {
          plat.hitCounter++;
          this.rowhammerGlobalHits++;
          
          // Triggers visual cracks and sparks (handled in renderer)
          if (navigator.vibrate) navigator.vibrate(40);

          if (plat.hitCounter === 64 || this.rowhammerGlobalHits === 64) {
            // Unlocks Rowhammer achievement
            window.SlotsEngine.unlock('rowhammer');
          }
          
          if (plat.hitCounter >= 512 || this.rowhammerGlobalHits >= 512) {
            // Exploit Breakout: Crash into Phase 1 (displays as Phase 2 on HUD)!
            this.setPhase(1);
          }
        }
      }
    });

    // Check hit ALU enemies
    this.enemies.forEach((enemy, idx) => {
      const dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
      if (dist < 80) {
        // Destroy ALU operator
        this.enemies.splice(idx, 1);
        if (window.AudioEngine) window.AudioEngine.play('death');
      }
    });
  }

  update(dt) {
    if (this.isDead || this.victoryState) return;

    // Scale dt for Lite Mode (0.75x speed)
    if (window.gameSettings && window.gameSettings.speedMode === 'lite') {
      dt *= 0.75;
    }

    if (this.player.strikeTimer > 0) {
      this.player.strikeTimer--;
    }

    // Check screen freeze (IRQ APIC Interrupt)
    if (this.irqFreezeTimer > 0) {
      this.irqFreezeTimer--;
      return;
    }

    this.timer += dt;
    this.levelTimer += dt;

    // Oscilloscope continuous fluctuation
    this.oscilloscopeTime += dt * 4;
    this.oscilloscopeVoltage = 1.2 + Math.sin(this.oscilloscopeTime) * 1.0;

    // Active exploit counts
    // Active exploit counts & Passive Sonar scan loop for Spectre Phase 3
    const currentExploit = window.SlotsEngine ? window.SlotsEngine.getActiveExploit() : null;
    if (this.activePhase === 2 && currentExploit === 'spectre') {
      // Passively loop the sonar wave! When one finished expanding, start a new one automatically
      if (!this.isSpectreActive) {
        this.isSpectreActive = true;
        this.spectreTimer = 300; // 5 seconds scan wave
        if (window.AudioEngine) window.AudioEngine.play('gate_open'); // nice passive acoustic sweep ping sound
      }
    } else {
      // If we switch away from Spectre, immediately turn off the active sonar scan!
      if (this.activePhase === 2 && this.isSpectreActive) {
        this.isSpectreActive = false;
        this.spectreTimer = 0;
      }
    }

    if (this.isSpectreActive) {
      this.spectreTimer--;
      if (this.spectreTimer <= 0) this.isSpectreActive = false;
    }
    if (this.isHijackActive) {
      this.hijackTimer--;
      if (this.hijackTimer <= 0) {
        this.isHijackActive = false;
        // Gravity restored! Reset CPU frequency back to standard
        this.cpuFrequency = 1.0;
      }
    }

    // Global DRAM Auto-Refresh Cycle (every 8 seconds)
    this.dramRefreshTimer += dt;
    if (this.dramRefreshTimer >= 8.0) {
      this.dramRefreshTimer = 0;
      let refreshed = false;
      this.platforms.forEach(plat => {
        if (plat.behavior === 'disappearing') {
          plat.charge = 100;
          refreshed = true;
          // Spawn green refresh spark particles around the platform
          if (window.GameRenderer && window.GameRenderer.particles) {
            for (let i = 0; i < 6; i++) {
              window.GameRenderer.particles.push({
                x: plat.x + Math.random() * plat.w,
                y: plat.y + Math.random() * plat.h,
                vx: (Math.random() - 0.5) * 50,
                vy: -Math.random() * 40,
                color: "#39ff14", // neon lime
                life: 0.8
              });
            }
          }
        }
      });
      if (refreshed && window.AudioEngine) {
        window.AudioEngine.play('achievement');
      }
    }

    // Shield (BLOCK key)
    const bindings = window.gameSettings ? window.gameSettings.keyBindings : null;
    const isBlockPressed = bindings ? bindings.block.some(k => this.keysPressed[k]) : (this.keysPressed['ShiftLeft'] || this.keysPressed['Escape']);
    this.player.isShieldActive = isBlockPressed || this.touchInputs.block;

    // UPDATE PLAYER PHYSICS
    this.updatePlayerPhysics(dt);

    // UPDATE DATA BUS (PACKY)
    this.updatePacky(dt);

    // UPDATE ENEMIES
    this.updateEnemies(dt);

    // UPDATE MOVABLE INSTR MNEMONICS FOR OVERFLOW
    this.updateInstructionBlocks(dt);

    // DECAY DRAMPlatform CELL CHARGES
    this.updateDRAMy(dt);

    // UPDATE GCPATROL GARBAGE COLLECTOR
    this.updateGCPatrol(dt);

    // CHECK COLLISIONS & TRIGGERS
    this.checkWorldCollisions();
  }

  updateGCPatrol(dt) {
    if (!this.gcPatrol) return;

    // 1. Stop-The-World (STW) Pause Check
    const distToPlayer = Math.hypot(this.player.x + 16 - (this.gcPatrol.x + 20), this.player.y + 16 - (this.gcPatrol.y + 20));
    if (this.player.isShieldActive && distToPlayer < 120) {
      if (this.gcPatrol.pauseTimer <= 0) {
        this.gcPatrol.pauseTimer = 3.0; // 3 seconds freeze
        if (window.AudioEngine) window.AudioEngine.play('bus_wait');
      }
    }

    if (this.gcPatrol.pauseTimer > 0) {
      this.gcPatrol.pauseTimer -= dt;
      return; // Frozen!
    }

    // 2. Horizontal patrol pacing
    this.gcPatrol.x += this.gcPatrol.speed * this.gcPatrol.dir * 60 * dt;
    const minPatrolX = this.levelNumber === 1 ? 400 : 150;
    const maxPatrolX = this.levelNumber === 1 ? 660 : (this.platforms.length > 0 ? this.platforms[this.platforms.length - 1].x + 100 : 2100);

    if (this.gcPatrol.x > maxPatrolX) {
      this.gcPatrol.x = maxPatrolX;
      this.gcPatrol.dir = -1;
    } else if (this.gcPatrol.x < minPatrolX) {
      this.gcPatrol.x = minPatrolX;
      this.gcPatrol.dir = 1;
    }

    // 3. Collision with Player
    if (distToPlayer < 35) {
      this.player.hp--;
      if (window.AudioEngine) window.AudioEngine.play('hurt');
      if (this.player.hp <= 0) {
        this.killPlayer();
      } else {
        // Bounce back
        this.player.vx = -Math.sign(this.player.vx) * 200;
        this.player.vy = -200;
      }
    }

    // 4. Collision with instruction blocks (resets block to starting platform so GC "cleans" them)
    this.mnemonicBlocks.forEach((block, idx) => {
      const distToBlock = Math.hypot(block.x + block.w/2 - (this.gcPatrol.x + 20), block.y + block.h/2 - (this.gcPatrol.y + 20));
      if (distToBlock < 40) {
        // GC sprays and resets the block to its starting stack coordinates!
        block.x = 900 + idx * 80;
        block.y = 320;
        block.vy = 0;
        if (window.AudioEngine) window.AudioEngine.play('death');
        
        // Spawn grey "cleanup" particles around the GC
        if (window.GameRenderer && window.GameRenderer.particles) {
          for (let i = 0; i < 10; i++) {
            window.GameRenderer.particles.push({
              x: this.gcPatrol.x + 20,
              y: this.gcPatrol.y + 20,
              vx: (Math.random() - 0.5) * 100,
              vy: (Math.random() - 0.5) * 100,
              color: "#555555",
              life: 0.8
            });
          }
        }
      }
    });
  }

  updatePlayerPhysics(dt) {
    const bindings = window.gameSettings ? window.gameSettings.keyBindings : null;
    const isLeftPressed = bindings ? bindings.left.some(k => this.keysPressed[k]) : (this.keysPressed['KeyA'] || this.keysPressed['ArrowLeft']);
    const isRightPressed = bindings ? bindings.right.some(k => this.keysPressed[k]) : (this.keysPressed['KeyD'] || this.keysPressed['ArrowRight']);

    // Horizontal Inputs
    let moveDir = 0;
    if (isLeftPressed || this.touchInputs.left) moveDir = -1;
    if (isRightPressed || this.touchInputs.right) moveDir = 1;

    const isGod = localStorage.getItem('bitsprite_godmode') === 'true';

    // Apply movement accelerations
    if (moveDir !== 0) {
      this.player.vx += moveDir * PHYSICS.ACCELERATION * dt;
      // Tilt visually
      this.player.tilt = moveDir * 12;
    } else {
      // Friction apply
      const friction = (isGod && this.activePhase === 1) ? 0.996 : (this.player.isOnGround ? PHYSICS.GROUND_FRICTION : PHYSICS.AIR_FRICTION);
      this.player.vx *= friction;
      this.player.tilt *= 0.8;
    }

    // Phase 4 God Mode Conveyor push
    if (isGod && this.activePhase === 4 && this.player.isOnGround) {
      this.player.x += 160 * dt;
    }

    // Speed bounds
    if (this.player.vx > PHYSICS.MAX_SPEED) this.player.vx = PHYSICS.MAX_SPEED;
    if (this.player.vx < -PHYSICS.MAX_SPEED) this.player.vx = -PHYSICS.MAX_SPEED;

    // Gravity calculation
    if (this.isHijackActive) {
      // Flying non-gravity mode
      this.player.vy = 0;
      const isJumpPressed = bindings ? bindings.jump.some(k => this.keysPressed[k]) : (this.keysPressed['KeyW'] || this.keysPressed['ArrowUp'] || this.touchInputs.jump);
      const isDownPressed = bindings ? bindings.down.some(k => this.keysPressed[k]) : (this.keysPressed['KeyS'] || this.keysPressed['ArrowDown']);
      if (isJumpPressed || this.touchInputs.jump) {
        this.player.vy = -300;
      } else if (isDownPressed) {
        this.player.vy = 300;
      }
    } else {
      // Normal or rowhammer gravity (0.5x)
      const currentGravity = PHYSICS.GRAVITY * (this.cpuFrequency === 0.5 ? 0.5 : 1.0);
      this.player.vy += currentGravity * dt;
    }

    // Update positions
    this.player.x += this.player.vx * dt;
    this.player.y += this.player.vy * dt;

    // Standard screen bottom border check
    if (this.player.y > 650) {
      this.killPlayer();
    }
  }

  updatePacky(dt) {
    if (this.packy.state === 'BUS_WAIT') {
      // Oscillation event: platform dimensions flex
      this.platforms.forEach(plat => {
        if (plat.behavior === 'static') {
          plat.w = plat.originalWidth + Math.sin(this.timer * 8) * 35;
        }
      });
      return; // Packy is paused due to BLOCK halt
    }

    // Patrolling path waypoints
    const target = this.packy.waypoints[this.packy.patrolIndex];
    const dx = target.x - this.packy.x;
    const dy = target.y - this.packy.y;
    const dist = Math.hypot(dx, dy);

    if (dist < 10) {
      this.packy.patrolIndex = (this.packy.patrolIndex + 1) % this.packy.waypoints.length;
    } else {
      this.packy.x += (dx / dist) * this.packy.vx * dt;
      this.packy.y += (dy / dist) * this.packy.vx * dt;
    }
  }

  updateEnemies(dt) {
    this.enemies.forEach(enemy => {
      if (enemy.type === 'aluPatrol') {
        enemy.x += enemy.speed * enemy.dir * 60 * dt;
        if (enemy.x > enemy.endX) {
          enemy.x = enemy.endX;
          enemy.dir = -1;
        } else if (enemy.x < enemy.startX) {
          enemy.x = enemy.startX;
          enemy.dir = 1;
        }
      }
    });
  }

  updateInstructionBlocks(dt) {
    this.mnemonicBlocks.forEach(block => {
      if (this.carriedBlock === block) {
        // Carry block above player's head
        block.x = this.player.x + 16 - block.w/2;
        block.y = this.player.y - block.h - 10;
        block.vy = 0;
        return;
      }

      // Standard gravity
      block.vy += 800 * dt;
      block.y += block.vy * dt;

      // Platform collisions
      this.platforms.forEach(plat => {
        if (plat.behavior !== 'spikes' && (plat.behavior !== 'disappearing' || plat.charge > 0)) {
          if (
            block.x < plat.x + plat.w &&
            block.x + block.w > plat.x &&
            block.y + block.h > plat.y &&
            block.y < plat.y + plat.h
          ) {
            block.y = plat.y - block.h;
            block.vy = 0;
          }
        }
      });

      // Block-to-block collisions
      this.mnemonicBlocks.forEach(other => {
        if (other !== block && other !== this.carriedBlock) {
          if (
            block.x < other.x + other.w &&
            block.x + block.w > other.x &&
            block.y + block.h > other.y &&
            block.y < other.y + other.h
          ) {
            if (block.vy > 0 && block.y + block.h - block.vy * dt <= other.y + 8) {
              block.y = other.y - block.h;
              block.vy = 0;
            }
          }
        }
      });

      // Player pushing blocks
      const dist = Math.hypot(this.player.x - block.x, this.player.y - block.y);
      if (dist < 40) {
        const dx = block.x - this.player.x;
        block.x += Math.sign(dx) * 150 * dt;
      }

      // Abyss Protection: if a block falls off platforms, respawn it on its stable spawn platform!
      if (block.y > 580) {
        block.x = block.spawnX || 200;
        block.y = block.spawnY || 100;
        block.vy = 0;
        if (window.AudioEngine) window.AudioEngine.play('collect');
        
        // Spawn recovery particles
        if (window.GameRenderer && window.GameRenderer.particles) {
          for (let i = 0; i < 8; i++) {
            window.GameRenderer.particles.push({
              x: block.x + block.w/2,
              y: block.y + block.h/2,
              vx: (Math.random() - 0.5) * 100,
              vy: (Math.random() - 0.5) * 100,
              color: "#ff00ff",
              size: 4 + Math.random() * 4,
              life: 25 + Math.random() * 15
            });
          }
        }
      }
    });
  }

  updateDRAMy(dt) {
    this.platforms.forEach(plat => {
      if (plat.behavior === 'disappearing') {
        // Stop decay if player holds BLOCK shield near it
        const dist = Math.hypot(this.player.x - (plat.x + plat.w/2), this.player.y - plat.y);
        const shieldActive = this.player.isShieldActive && dist < 120;

        if (!shieldActive) {
          plat.charge -= plat.decayRate * 100 * dt;
          if (plat.charge < 0) plat.charge = 0;
        }
      }
    });
  }

  checkWorldCollisions() {
    this.player.isOnGround = false;

    const isGod = localStorage.getItem('bitsprite_godmode') === 'true';
    const isFlickerOff = isGod && this.activePhase === 3 && (Math.floor(Date.now() / 1500) % 2 === 0);

    // Platform Collisions (AABB)
    this.platforms.forEach((plat, idx) => {
      // Disappearing platforms have no physical body when 0% charged
      if (plat.behavior === 'disappearing' && plat.charge <= 0) return;

      // Spectre Platform active check
      if (plat.behavior === 'cache' && !this.isSpectreActive) return;

      // Phase 3 Glitchy: skip collision for even platforms in God Mode during "off" cycle
      if (isFlickerOff && idx % 2 === 0) return;

      if (
        this.player.x < plat.x + plat.w &&
        this.player.x + this.player.w > plat.x &&
        this.player.y + this.player.h > plat.y &&
        this.player.y < plat.y + plat.h
      ) {
        // Collision resolved vertically
        if (this.player.vy > 0 && this.player.y + this.player.h - this.player.vy * 0.05 <= plat.y + 8) {
          this.player.y = plat.y - this.player.h;

          if (isGod && this.activePhase === 2) {
            // Phase 2: Trampoline bounce!
            this.player.vy = -PHYSICS.JUMP_FORCE * 1.35;
            if (window.AudioEngine) window.AudioEngine.play('jump');
          } else {
            this.player.vy = 0;
            this.player.isOnGround = true;
          }

          // Stomping on DRAM platform refreshes it
          if (plat.behavior === 'disappearing') {
            plat.charge = 100;
            if (window.AudioEngine) window.AudioEngine.play('collect');
          }

          // Spike hazards
          if (plat.behavior === 'spikes') {
            this.killPlayer();
          }
        } else {
          // Horizontal side block
          this.player.vx = 0;
          this.player.x -= Math.sign(this.player.vx) * 2;
        }
      }
    });

    // Mnemonic Block Collisions (AABB) - allows standing on ADD, MOV, RET blocks
    this.mnemonicBlocks.forEach(block => {
      if (this.carriedBlock === block) return; // Don't collide with the block we are carrying

      if (
        this.player.x < block.x + block.w &&
        this.player.x + this.player.w > block.x &&
        this.player.y + this.player.h > block.y &&
        this.player.y < block.y + block.h
      ) {
        // Resolve vertically so the player can stand on top of blocks!
        if (this.player.vy > 0 && this.player.y + this.player.h - this.player.vy * 0.05 <= block.y + 8) {
          this.player.y = block.y - this.player.h;
          this.player.vy = 0;
          this.player.isOnGround = true;
        }
      }
    });

    // Keys collection
    this.keys.forEach(key => {
      if (!key.collected) {
        if (
          this.player.x < key.x + key.w &&
          this.player.x + this.player.w > key.x &&
          this.player.y < key.y + key.h &&
          this.player.y + this.player.h > key.y
        ) {
          key.collected = true;
          this.keysCount++;
          if (window.AudioEngine) window.AudioEngine.play('collect');
        }
      }
    });

    // Coins collection
    this.coins.forEach(coin => {
      if (!coin.collected) {
        if (
          this.player.x < coin.x + coin.w &&
          this.player.x + this.player.w > coin.x &&
          this.player.y < coin.y + coin.h &&
          this.player.y + this.player.h > coin.y
        ) {
          coin.collected = true;
          this.coinsCollected++;
          if (window.AudioEngine) window.AudioEngine.play('collect');
        }
      }
    });

    // Lever triggers
    this.levers.forEach(lever => {
      if (!lever.activated) {
        const dist = Math.hypot(this.player.x - lever.x, this.player.y - lever.y);
        if (dist < 40 && this.keysPressed['KeyE']) {
          lever.activated = true;
          if (window.AudioEngine) window.AudioEngine.play('gate_open');
          
          // Open exit MUX gates
          if (this.exitGate && this.exitGate.gateId === lever.targetGateId) {
            this.exitGate.isSolid = false;
          }
        }
      }
    });

    // Exit Gate Check
    if (this.exitGate) {
      const g = this.exitGate;
      
      // The exit gate unlocks purely when the keys count is satisfied
      g.isSolid = this.keysCount < g.requiredKeys;

      if (
        this.player.x < g.x + g.w &&
        this.player.x + this.player.w > g.x &&
        this.player.y < g.y + g.h &&
        this.player.y + this.player.h > g.y
      ) {
        if (!g.isSolid) {
          // Level Completed!
          this.victory();
        }
      }
    }

    // GC Patrol vertical lasers
    this.enemies.forEach(enemy => {
      if (enemy.type === 'aluPatrol') {
        const dist = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
        if (dist < 32) {
          if (this.player.vy > 0 && this.player.y + this.player.h <= enemy.y + 12) {
            // Stomp ALU vertical launch (SHL shift)
            this.player.vy = -750;
            if (window.AudioEngine) window.AudioEngine.play('jump');
          } else {
            // Hurt
            this.player.hp--;
            if (window.AudioEngine) window.AudioEngine.play('hurt');
            if (this.player.hp <= 0) {
              this.killPlayer();
            } else {
              // bounce back
              this.player.vx = -Math.sign(this.player.vx) * 200;
              this.player.vy = -200;
            }
          }
        }
      }
    });

    // BLOCK shield near Packy halts it
    const packyDist = Math.hypot(this.player.x - this.packy.x, this.player.y - this.packy.y);
    if (this.player.isShieldActive && packyDist < 120) {
      if (this.packy.state !== 'BUS_WAIT') {
        this.packy.state = 'BUS_WAIT';
        if (window.AudioEngine) window.AudioEngine.play('bus_wait');
        
        // Unlock Bus Hijack exploit!
        if (this.activePhase === 1) {
          window.SlotsEngine.unlock('hijack');
        }
      }
      this.packyFreezeTimer = 90; // Stay frozen for 1.5 seconds (90 frames)
    } else {
      if (this.packyFreezeTimer > 0) {
        this.packyFreezeTimer--;
      } else {
        if (this.packy.state === 'BUS_WAIT' && !this.isHijackActive) {
          this.packy.state = 'normal';
        }
      }
    }



    // Overflow stack sequence check
    if (this.activePhase === 2) {
      // Check if blocks are aligned vertically in correct order ["MOV", "ADD", "RET"]
      const sortedBlocks = [...this.mnemonicBlocks].sort((a, b) => a.y - b.y);
      const types = sortedBlocks.map(b => b.type);
      
      // Close alignment check (x within 20px of each other)
      const xDiff1 = Math.abs(sortedBlocks[0].x - sortedBlocks[1].x);
      const xDiff2 = Math.abs(sortedBlocks[1].x - sortedBlocks[2].x);

      if (xDiff1 < 25 && xDiff2 < 25) {
        const isOverflow = window.CPU.evaluateStack(types);
        if (isOverflow) {
          // Unlock Overflow, warp into Phase 3
          window.SlotsEngine.unlock('overflow');
          this.setPhase(3);
        }
      }
    }

    // Flying extremely high anywhere in the level (y < -200) in Phase 2 unlocks Spectre/Sonar!
    if (this.activePhase === 1 && this.player.y < -200) {
      if (window.SlotsEngine && !window.SlotsEngine.unlockedAchievements.includes('spectre')) {
        window.SlotsEngine.unlock('spectre');
      }
    }
  }

  killPlayer() {
    this.isDead = true;
    if (window.AudioEngine) window.AudioEngine.play('death');
    
    // Death reset rules:
    this.cpuFrequency = 1.0;
    this.isHijackActive = false;
    this.isSpectreActive = false;

    // Instantly restart the level without annoying screens or clicks
    this.loadLevelMap();
  }

  restartLevel() {
    if (document.activeElement) document.activeElement.blur();
    const overlay = document.getElementById('game-over-screen');
    if (overlay) overlay.classList.remove('visible');
    this.loadLevelMap();
  }

  generateLeaderboard() {
    const operatorName = localStorage.getItem('bitsprite_player_name') || 'OPERATOR';
    
    // Ranks from 1 to 10,000,000,000
    const playerRank = Math.floor(Math.random() * 10000000000) + 1;
    
    const scientists = [
      "Elon_Musk_X", "vitalik.eth", "Satoshi_Nakamoto", "Hassabis_Deep",
      "Jensen_Huang_GPU", "Altman_GPT", "Hinton_Neural", "yann_lecun_grad",
      "andrew_ng_ai", "Torvalds_Linux", "Berners_Lee_WWW", "woz_apple",
      "bjarne_cpp", "guido_python", "Knuth_TeX", "Hawking_BlackHole",
      "tesla_lightning", "Curie_Radium", "Feynman_Quantum", "Lovelace_Ada",
      "Turing_Enigma", "FeiFei_Li_Vision", "LeCun_Gradient", "Donald_Knuth",
      "Stroustrup_C", "Gosling_Java", "Rossum_Python", "Kip_Thorne_BH",
      "Penrose_Tiling", "Fabiola_CERN", "Green_String", "Kaku_Hyper",
      "Hossenfelder_Spin", "Lene_Hau_Light", "Vera_Rubin_Dark", "Donna_Laser",
      "Aspect_Quantum", "Zeilinger_Photon", "Clauser_Bell", "Higgs_Boson"
    ];
    
    // Pick 8 unique scientists from the list
    const chosenScientists = [];
    const pool = [...scientists];
    for (let i = 0; i < 8; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      chosenScientists.push(pool.splice(idx, 1)[0]);
    }
    
    // Always include robosapiens8!
    chosenScientists.push("robosapiens8");
    
    // Generate ranks
    // Offset array for the 9 competitors around the player
    const offsets = [-4, -3, -2, -1, 1, 2, 3, 4, 5];
    
    const list = [];
    // Add player
    list.push({
      name: operatorName,
      rank: playerRank,
      isPlayer: true,
      time: this.levelTimer.toFixed(1) + 's',
      coins: `${this.coinsCollected}/${this.coins.length}`
    });
    
    // Add scientists
    chosenScientists.forEach((name, idx) => {
      const offset = offsets[idx];
      let competitorRank = playerRank + offset;
      if (competitorRank < 1) competitorRank = playerRank + Math.abs(offset) + 10;
      
      // Competitor random stats
      const fakeTime = Math.max(8.0, (this.levelTimer * (0.8 + Math.random() * 0.4))).toFixed(1);
      const fakeCoins = Math.floor(Math.random() * (this.coins.length + 1));
      
      list.push({
        name: name,
        rank: competitorRank,
        isPlayer: false,
        time: fakeTime + 's',
        coins: `${fakeCoins}/${this.coins.length}`
      });
    });
    
    // Sort list ascending by rank (lower rank number is better)
    list.sort((a, b) => a.rank - b.rank);
    
    this.leaderboardData = list;
  }

  victory() {
    this.victoryState = true;
    if (window.AudioEngine) window.AudioEngine.play('achievement');

    // Calculate dynamic stars based on time & coins collected
    const levelLength = 1600 + Math.min(10, this.levelNumber) * 400;
    const goldTime = Math.max(12, levelLength / 130);
    const coinRatio = this.coins.length > 0 ? (this.coinsCollected / this.coins.length) : 1;

    let levelStars = 1;
    if (coinRatio >= 0.85 && this.levelTimer <= goldTime) {
      levelStars = 3;
    } else if (coinRatio >= 0.50 || this.levelTimer <= goldTime * 1.5) {
      levelStars = 2;
    }

    this.stars = levelStars;
    this.score += levelStars * 500;

    // Generate fake leaderboard data
    this.generateLeaderboard();

    // Populate the leaderboard UI table rows!
    const tbody = document.getElementById('victory-leaderboard-body');
    if (tbody) {
      tbody.innerHTML = '';
      this.leaderboardData.forEach(entry => {
        const tr = document.createElement('tr');
        
        // Highlight style
        if (entry.isPlayer) {
          tr.style.background = "rgba(0, 240, 255, 0.2)";
          tr.style.color = "var(--neon-cyan)";
          tr.style.fontWeight = "bold";
        } else if (entry.name === "robosapiens8") {
          tr.style.background = "rgba(255, 51, 102, 0.25)";
          tr.style.color = "#ff3366";
          tr.style.fontWeight = "bold";
        } else {
          tr.style.borderBottom = "1px solid rgba(255, 255, 255, 0.1)";
        }
        
        // Render name with dynamic indicator pointer
        let displayName = entry.name;
        if (entry.isPlayer) {
          displayName += " 👈";
        }

        tr.innerHTML = `
          <td style="padding: 6px 4px;">#${entry.rank.toLocaleString()}</td>
          <td style="padding: 6px 4px;">${displayName}</td>
          <td style="padding: 6px 4px; text-align: right;">${entry.time}</td>
          <td style="padding: 6px 4px; text-align: right;">${entry.coins}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    // Show victory card
    const card = document.getElementById('victory-screen');
    if (card) {
      card.classList.add('visible');
      const starStr = '⭐'.repeat(levelStars);
      document.getElementById('victory-stars').innerHTML = starStr;
    }
  }

  nextLevel() {
    if (document.activeElement) document.activeElement.blur();
    const card = document.getElementById('victory-screen');
    if (card) card.classList.remove('visible');
    this.levelNumber++;
    this.loadLevelMap();
  }
}

// Global active Game Kernel instance
const Game = new BitSpriteGame();
window.GameKernel = Game;

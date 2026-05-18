// BitSprite Procedural Room Pattern Generator & Level Sticher
class LevelGenerator {
  constructor() {
    // KeepROOM_PATTERNS structure for legacy safety or specific presets
    this.ROOM_PATTERNS = {
      start: {
        platforms: [{ x: 0, y: 500, w: 200, h: 20, isRowhammerable: false }],
        enemies: [],
        keys: [],
        levers: []
      },
      exit: {
        platforms: [{ x: 0, y: 480, w: 200, h: 20, isRowhammerable: false }],
        enemies: [],
        keys: [],
        levers: [],
        exitGate: { x: 50, y: 380, w: 40, h: 100, gateId: 'gate_exit', isSolidByDefault: true }
      }
    };
  }

  generateLevel(levelNumber) {
    const platforms = [];
    const enemies = [];
    const keys = [];
    const levers = [];
    let exitGate = null;

    // Check unlocked achievements dynamically from SlotsEngine for custom complications
    const hasSpectre = window.SlotsEngine && window.SlotsEngine.unlockedAchievements && window.SlotsEngine.unlockedAchievements.includes('spectre');
    const hasHijack = window.SlotsEngine && window.SlotsEngine.unlockedAchievements && window.SlotsEngine.unlockedAchievements.includes('hijack');
    const hasRowhammer = window.SlotsEngine && window.SlotsEngine.unlockedAchievements && window.SlotsEngine.unlockedAchievements.includes('rowhammer');
    const hasGlitch = window.SlotsEngine && window.SlotsEngine.unlockedAchievements && window.SlotsEngine.unlockedAchievements.includes('glitch');

    // Level length scales dynamically with levelNumber (Level 1: 1800px, Level 10+: 5000px)
    const levelLength = 1600 + Math.min(10, levelNumber) * 400;

    // 1. Starting platform
    platforms.push({
      x: 0,
      y: 500,
      w: 250,
      h: 20,
      isRowhammerable: false,
      behavior: 'static',
      decayRate: 0,
      charge: 100,
      originalWidth: 250,
      hitCounter: 0
    });

    let lastX = 200;
    let lastY = 500;

    // 2. Generate platforms dynamically along the level length (Left-to-Right random walk)
    while (lastX < levelLength - 350) {
      // Rowhammerable platforms always spawn so players can unlock Rowhammer
      const isRowhammerable = Math.random() < 0.25;

      // Platform behavior & decay
      let behavior = 'static';
      let decayRate = 0;
      const randBehavior = Math.random();

      if (levelNumber > 2 && randBehavior < 0.3) {
        behavior = 'disappearing'; // DRAMy capacitor cell
        decayRate = 0.04 + Math.min(0.08, levelNumber * 0.005); // faster decay at high levels
      } else if (hasSpectre && randBehavior < 0.5) {
        // Spectre Invisible Cache Platform complication!
        behavior = 'cache';
      }

      // Constrained Random-Walk coordinates to guarantee traversability
      let gapX = 120 + Math.random() * 90;
      let diffY = (Math.random() - 0.5) * 150;

      // If Hijack is unlocked, spawn massive gravity-defying gaps!
      if (hasHijack && Math.random() < 0.18 && lastX > 500) {
        gapX = 330 + Math.random() * 100; // 330px to 430px gap - physically impossible without low-gravity!
        diffY = (Math.random() - 0.5) * 70; // keep it vertically stable for fair floating
      }

      const nextX = lastX + gapX;
      let nextY = lastY + diffY;

      // Vertical bounds clamp (keep within screen height limits)
      if (nextY < 230) nextY = 230;
      if (nextY > 520) nextY = 520;

      // Narrower platforms on higher levels
      const baseWidth = Math.max(100, 180 - (levelNumber - 1) * 8);
      const w = baseWidth + Math.random() * 60;
      const h = 20;

      platforms.push({
        x: nextX,
        y: nextY,
        w: w,
        h: h,
        isRowhammerable: isRowhammerable,
        behavior: behavior,
        decayRate: decayRate,
        charge: 100,
        originalWidth: w,
        hitCounter: 0
      });

      // Spawn patrolling ALU enemies
      if (behavior === 'static') {
        const spawnEnemyRand = Math.random();
        // If Glitch is unlocked, spawn clumps of enemies that require a Glitch blast, otherwise spawn normally
        if (hasGlitch && spawnEnemyRand < 0.3) {
          // Clump of 2 ALU enemies patrolling close together
          enemies.push({
            type: 'aluPatrol',
            x: nextX + 15,
            y: nextY - 32,
            w: 32,
            h: 32,
            startX: nextX + 5,
            endX: nextX + w/2 - 5,
            speed: 1.2 + (levelNumber - 1) * 0.05,
            dir: 1
          });
          enemies.push({
            type: 'aluPatrol',
            x: nextX + w/2 + 15,
            y: nextY - 32,
            w: 32,
            h: 32,
            startX: nextX + w/2 + 5,
            endX: nextX + w - 37,
            speed: 1.2 + (levelNumber - 1) * 0.05,
            dir: -1
          });
        } else if (spawnEnemyRand < 0.45) {
          // Standard single ALU enemy
          enemies.push({
            type: 'aluPatrol',
            x: nextX + w/2 - 16,
            y: nextY - 32,
            w: 32,
            h: 32,
            startX: nextX + 10,
            endX: nextX + w - 42,
            speed: 1.0 + (levelNumber - 1) * 0.05,
            dir: 1
          });
        }
      }

      lastX = nextX + w;
      lastY = nextY;
    }

    // 3. Final platform with exit gate
    platforms.push({
      x: lastX + 150,
      y: 480,
      w: 300,
      h: 20,
      isRowhammerable: false,
      behavior: 'static',
      decayRate: 0,
      charge: 100,
      originalWidth: 300,
      hitCounter: 0
    });

    exitGate = {
      x: lastX + 320,
      y: 380,
      w: 40,
      h: 100,
      gateId: 'gate_exit',
      isSolid: true,
      requiredKeys: Math.min(3, 1 + Math.floor(levelNumber / 3))
    };

    // 4. Place keys dynamically on random platform coordinates
    const keyCount = exitGate.requiredKeys;
    while (keys.length < keyCount) {
      const pIndex = 1 + Math.floor(Math.random() * (platforms.length - 2));
      const plat = platforms[pIndex];
      if (plat.behavior !== 'spikes') {
        keys.push({
          x: plat.x + plat.w/2 - 12,
          y: plat.y - 40,
          w: 24,
          h: 24,
          collected: false
        });
      }
    }


    // 6. Hazard spikes at the bottom gaps for level > 5
    if (levelNumber > 5) {
      platforms.forEach((plat, idx) => {
        if (idx < platforms.length - 1) {
          const nextPlat = platforms[idx + 1];
          const gap = nextPlat.x - (plat.x + plat.w);
          // If it is a real gap (and not a giant hijack gap), add spikes
          if (gap > 90 && gap < 300) {
            platforms.push({
              x: plat.x + plat.w + 10,
              y: 580,
              w: gap - 20,
              h: 20,
              behavior: 'spikes',
              isRowhammerable: false,
              decayRate: 0,
              charge: 100,
              originalWidth: gap - 20,
              hitCounter: 0
            });
          }
        }
      });
    }

    return {
      platforms,
      enemies,
      keys,
      levers,
      exitGate,
      roomCount: Math.ceil(levelLength / 800)
    };
  }
}

// Global Levels Engine
const Levels = new LevelGenerator();
window.LevelsEngine = Levels;

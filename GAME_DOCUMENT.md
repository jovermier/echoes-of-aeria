# Echoes of Aeria — Game Design Document

_A classic top‑down action‑adventure inspired by 16‑bit era pacing and traversal, built around exploration, clever items, and a light/dark world twist._

## **🎮 CURRENT IMPLEMENTATION STATUS**

**Last Updated:** 2025/08/22
**Current Build Features:** ✅ = Implemented, 🔄 = Partial, ❌ = Not Yet Implemented

### **✅ CORE MECHANICS IMPLEMENTED**

**Movement & Combat System:**
- ✅ 8-directional player movement (WASD/Arrow keys)
- ✅ 8-directional attack system with 45-degree angle support
- ✅ Player and enemy animations for all 8 directions
- ✅ Collision detection and world boundaries
- ✅ Enemy AI with pathfinding and attack patterns
- ✅ Damage system with visual feedback (screen flash, enemy flash)
- ✅ Player invincibility frames after taking damage

**World & Graphics:**
- ✅ Large 80x60 tile world map (2560x1920 pixels)
- ✅ High-fidelity pixel art structures matching the design map
- ✅ Detailed tile rendering (grass, water, trees, mountains, paths, bridges)
- ✅ Advanced structures: houses, castles, temples, keeps with architectural details
- ✅ Stone textures, window details, banners, and realistic building elements
- ✅ Fog of War system with exploration-based reveal
- ✅ Smooth camera following with lerp movement

**Eclipse/Dayrealm System (Unique Core Feature):**
- ✅ Complete dual-world implementation
- ✅ E key toggles between Dayrealm and Eclipse realms
- ✅ Eclipse world transformations:
  - Grass → Marsh areas (traversal challenges)
  - Water → Mystical bridges (new paths)
  - Mountains → Ancient castle walls (hidden structures)
  - Trees → Secret forest paths
  - Buildings → Ancient ruins and temples
  - Northern regions → Snow patches
  - Southern lakes → Desert areas
- ✅ Visual transition effects with color overlays
- ✅ Eclipse-specific tile graphics with darker, mysterious themes
- ✅ Aether Mirror requirement for world toggling

**Enhanced UI System:**
- ✅ Proper heart-shaped health display (full/half/empty hearts)
- ✅ Visual currency icon (green rupee diamond) with count
- ✅ Visual key icon (golden key sprite) with count
- ✅ World state indicator showing current realm
- ✅ Complete control instructions in top-right corner
- ✅ Extended UI bar with better spacing and organization

**Item Collection & Progression:**
- ✅ Multiple item types: hearts, rupees, keys, gems, coins
- ✅ Proper counter incrementation for all collected items
- ✅ Visual feedback and console logging for collections
- ✅ Heart container system for health upgrades
- ✅ High-fidelity rupee graphics with shine effects

**Audio System:**
- ✅ Dynamic background music with Zelda-inspired themes
- ✅ Layered musical composition (melody, harmony, bass lines)
- ✅ Attack sound effects with pitch variation
- ✅ Item collection audio feedback
- ✅ World transition sound effects
- ✅ Music restart functionality (M key)

**Game States & Controls:**
- ✅ Pause system (ESC key)
- ✅ Inventory screen (I key) 
- ✅ Responsive canvas that adapts to window size
- ✅ Full keyboard control support

### **🔄 PARTIALLY IMPLEMENTED**

**NPC System:**
- 🔄 Basic NPC placement in world
- ❌ Interactive dialogue system
- ❌ Quest mechanics
- ❌ NPC schedules and behaviors

**Dungeon System:**
- 🔄 Temple and castle structures placed
- ❌ Dungeon entrance mechanics
- ❌ Interior dungeon areas
- ❌ Puzzle systems

### **❌ NOT YET IMPLEMENTED**

**Advanced Features:**
- ❌ Boss battles and enemy varieties
- ❌ Advanced items (Gale Boots, Storm Disk, etc.)
- ❌ Dungeon progression and Aether Shards
- ❌ Story sequences and cutscenes
- ❌ Save/load system
- ❌ Advanced puzzle mechanics

**Current Playable Demo:** Players can explore the full world, fight enemies, collect items, toggle between Eclipse/Dayrealm, and experience the core movement and combat mechanics. The game showcases the unique dual-world system that forms the core gameplay innovation.

---

## 1) High Concept

- **Premise:** When the ancient **Heart of Aeria** is shattered, the land splits into two overlapping states: the **Dayrealm** (bright, living world) and its echo, the **Eclipse** (a muted, haunted overlay). The hero must recover eight **Aether Shards** from dungeons to restore the Heart and stop the usurper **Maelgrith, the Hollow Sovereign**.
- **Pillars:** Exploration-first level design, item‑gated progression, combat readability, environmental puzzles, secrets in every screen, and a mid‑game world flip (Dayrealm ↔ Eclipse) that remixes routes.
- **Camera/Presentation:** Retro 2D, 16×16 tiles, 1:1 pixel art look, 60 FPS.

---

## 2) World & Regions (based on the provided map)

The overworld is \~**256×192 tiles** (\~16–20 screens wide × 12–15 screens tall), stitched into seamless scrolling zones.

1. **Verdant Lowlands (center‑west)** – Farms, cottages, hedgerows, the tutorial fields.
2. **Riverlands & Waterworks (center/east)** – A snaking river with locks, bridges, and floodgates.
3. **Moonwell Marsh (south‑center)** – Pools, lily isles, poison gas pockets; mirrored portals activate later.
4. **Amber Dunes & Canyon (south‑west)** – Sand squalls, bandit camps, sinkholes to caverns.
5. **Whisperwood (north‑west)** – Deep forest and an ancient spiral bluff.
6. **Frostpeak Tundra (north‑east)** – Snow bridges, ice caverns, and a frozen stronghold.
7. **Obsidian Crater (far east/south‑east)** – Volcanic rim with a sealed circular ruin.
8. **Eldercrown Keep (center‑north)** – The old capital/castle; becomes the late‑game hub of the finale.

**Settlements**

- **Hearthmere (start town)** – Windmill, well, market, small shrine.
- **Rivergate** – Lockmaster’s house; access to Waterworks.
- **Dustfall Outpost** – Traders, fletchers; entry to the desert canyon.
- **Starfall Monastery** – Hermits of the Aether; hints for Eclipse mechanics.

---

## 3) Playable Hero

- **Name:** Default **Arin**/**Lyra** (player can rename; gender‑neutral sprite options).
- **Look:** Cloak with teal trim, leather vest, travel boots; short cape becomes longer after mid‑game. In Eclipse, eyes glow faint cyan.
- **Base Kit:** Shortblade (3‑hit chain), roll/dodge, context interact, charged strike.
- **Growth:** Hearts (HP), stamina for sprint/roll, item capacity upgrades, flask slots.

---

## 4) Allies (Good Guys)

Each ally includes a look description and gameplay purpose.

1. **Keeper Elowen** – _Grey‑green robes, wooden staff wrapped in ivy._ Tutorial mentor; gives **Sunflame Lantern**.
2. **Lockmaster Bramm** – _Stocky, oil‑stained overalls, ring of brass keys._ Opens Rivergate after a side job.
3. **Sister Thalia** – _White hood, star sigil pendant, indigo sash._ Heals once per visit; sells shrine hints.
4. **Rafe the Cartwright** – _Bandana, fingerless gloves, wheeled toolkit._ Builds bridges/rafts when paid.
5. **Myra of the Marsh** – _Mossy cloak, reed flute, water‑lily crown._ Teaches safe routes in Moonwell; trade quest.
6. **Captain Sorrel** – _Leather brigandine, command whistle._ Trains advanced roll and parry timing.
7. **Archivist Peren** – _Round glasses, ink‑stained coat._ Deciphers ancient plaques (Eclipse lore).
8. **Elder Rowan** – _Crimson mantle, oak torque._ Grants **Aether Mirror** ritual once prerequisites met.
9. **Tinker Nila** – _Goggles, spring‑brace gauntlets._ Upgrades gadgets (hook range, bomb capacity).
10. **Child Pip** – _Patchy cap, slingshot._ Provides rumor system; marks secrets on the map.

---

## 5) Antagonists & Factions (Bad Guys)

### Big Bad

- **Maelgrith, the Hollow Sovereign** – _Tall, bone‑filigree armor, empty crown hovering above a shadowed visage; cloak moves like smoke._ Seeks to freeze Aeria in the Eclipse and rule its husk.

### Lieutenants (Mid‑boss repeaters)

1. **Vyre of the Gale** – _Wind‑torn scarf, twin sickles._ Ambusher in open fields/canyon.
2. **Sable Matron** – _Spidery gown of inked veils._ Controls Moonwell illusions.
3. **Thorn‑King Garruk** – _Bark‑plated warlord with stag helm._ Commands Whisperwood beasts.
4. **Warden Halix** – _Ice‑etched tower shield._ Leads Frostpeak garrisons.

### Regional Enemies (with look & behavior)

- **Sprig Stalkers:** _Walking thistles with glowing seeds._ Lunge in straight lines; weak to fire.
- **Mud Whelps:** _Brown amphibians with lantern eyes._ Leap, tongue‑grab; dislike shock.
- **Bandit Scrappers/Archers:** _Ragged hoods, mismatched armor._ Flank and use nets.
- **Sand Wraiths:** _Shimmering silhouettes._ Rise from dunes; vanish on light.
- **Thorn Wolves:** _Vine‑snared canines._ Circle and pounce; burnable brambles on backs.
- **Wisp Clusters:** _Floating frost sparks._ Orbit and explode if not dispersed.
- **Stone Sentinels:** _Runic golems with cracked cores._ Awake near ancient doors; heavy but slow.
- **Bog Serpents:** _Green‑black scales, frill._ Burst from water; weak after charge.
- **Rift Motes (Eclipse‑only):** _Drifting violet orbs._ Phase and shoot arcs; mirror flips their polarity.

---

## 6) Dungeons, Keys, and Item Progression

Eight primary dungeons each grant an item and an **Aether shard**.

1. **Rootway Shrine** (Whisperwood) — _Forest toggles & push‑blocks_

- **Item:** **Gale Boots** (dash, stump‑jump small gaps)
- **Boss:** **Thorn‑King Garruk**
- **Gates Opened:** Break cracked roots; traverse dash gaps.

2. **Old Waterworks** (Riverlands) — _Valves, timed gates, water level puzzles_

- **Item:** **Riverfin Vest** (swim, dive; strong current resistance)
- **Boss:** **Pump‑Warden Nautilus**
- **Gates:** Swim channels, underwater switches, whirlpools.

3. **Mire Grotto** (Moonwell Marsh) — _Illusions, gas vents, mirrored rooms_

- **Item:** **Aether Mirror** (swap Day↔Eclipse nodes; reflect projectiles)
- **Boss:** **Sable Matron**
- **Gates:** Flip world anchors, dispel fake walls.

4. **Cliffspire Monastery** (north‑west bluff) — _Wind bridges, bell puzzles_

- **Item:** **Storm Disk** (boomerang‑like, conducts elements)
- **Boss:** **Vyre of the Gale**
- **Gates:** Hit distant switches, carry flame/frost, stun flyers.

5. **Frostforge Bastion** (tundra keep) — _Ice slides, heater vents_

- **Item:** **Quake Maul** (ground‑slam, break ice/stone)
- **Boss:** **Warden Halix**
- **Gates:** Smash barriers, activate floor plates with weight.

6. **Sunken Aqueduct** (under the river delta) — _Current mazes, rotating bridges_

- **Item:** **Tide Hook** (grapple ring targets; pull blocks/enemies)
- **Boss:** **Leviarch Coil**
- **Gates:** Grapple traversal, retract bridges, yank shields.

7. **Amberglass Caverns** (desert sinkheart) — _Light beams, reflective crystals_

- **Item:** **Sunflame Prism** (lantern mod: concentrate beams)
- **Boss:** **Sandscribe Ophira**
- **Gates:** Prism doors, beam redirection, ignite remote braziers.

8. **Obsidian Crown** (volcanic ring) — _Lava lifts, shadow locks_

- **Item:** **Kingsbane Sigil** (final keyset; buff vs. corrupted)
- **Boss:** **Crown‑Engine Aion** (guardian)
- **Gates:** Final seal at Eldercrown Keep.

**Finale:** **Eldercrown Keep** (castle) — Gauntlet + **Maelgrith** multi‑phase fight.

---

## 7) Story & Acts

**Act I — Fracture**

- Bandits raid **Hearthmere**. Elowen gives Lantern. Track raiders through **Verdant Lowlands** to **Whisperwood**; discover the first shard in **Rootway Shrine**.

**Act II — Currents**

- River is dammed; help **Lockmaster Bramm** to access **Old Waterworks**; obtain **Riverfin Vest**. Rumors lead to **Mire Grotto**; gain **Aether Mirror** and learn to traverse the **Eclipse**.

**Act III — Echoes**

- With **Storm Disk**, **Quake Maul**, **Tide Hook**, and **Sunflame Prism**, the world opens. Recover remaining shards, expose Maelgrith’s siphons embedded in each region. Towns react to Eclipse storms; optional quests unlock advanced gear.

**Act IV — Hollow Crown**

- Assemble shards → **Kingsbane Sigil** awakens. Assault **Obsidian Crown**, then **Eldercrown Keep**. Shard choice order influences final buffs.

**Ending:** Restore the Heart of Aeria; Dayrealm returns, Eclipse becomes a harmonious after‑image. Post‑game doors open to time trials and superboss rematches.

---

## 8) Quest Guide / Golden Path (Concise Walkthrough)

1. **Start in Hearthmere** → Lantern → Clear bandits → meet Rafe.
2. **Whisperwood:** Find Rootway Shrine → get **Gale Boots** → beat Garruk.
3. **Rivergate:** Help Bramm (fetch parts from Dustfall) → **Old Waterworks** → get **Riverfin Vest**.
4. **Moonwell Marsh:** **Mire Grotto** → get **Aether Mirror** (world flip learned).
5. **Cliffspire Monastery:** Solve bell routes → get **Storm Disk**.
6. **Frostforge Bastion:** Acquire heat‑sigil key in town → get **Quake Maul**.
7. **Sunken Aqueduct:** Enter via Eclipse‑only grate → get **Tide Hook**.
8. **Amberglass Caverns:** Prism upgrade → **Sunflame Prism**.
9. **Obsidian Crown:** Claim **Kingsbane Sigil** → unlock **Eldercrown Keep**.
10. **Finale:** Castle gauntlet → **Maelgrith**.

_Optional arcs:_ Myra’s lily crown (poison immunity), Nila’s super‑grapple, Sorrel’s parry trials, Pip’s rumor cards (collection log).

---

## 9) How to Win the Game

- Collect all **8 Aether Shards**, forge **Kingsbane Sigil**, disable three castle pylons in Eldercrown Keep, then defeat **Maelgrith**. True ending requires finishing **at least two** optional ally arcs (Myra + Sorrel or Nila + Peren) to purify the Heart fully.

---

## 10) Boss Designs (Behaviors & Phases)

- **Thorn‑King Garruk:** P1 pounce + root walls; P2 summons wolves; P3 enraged spin creating bramble rings (burn with Lantern or stun with Disk).
- **Pump‑Warden Nautilus:** Rotates valve arms; floods thirds of arena; dive‑pop telegraphs; use Vest to bait.
- **Sable Matron:** Mirrors, fake copies; Mirror to reveal the real one; gas vents ignite with Prism.
- **Vyre of the Gale:** Boomerang duel; parry windows on crosswinds; bells cancel cyclones.
- **Warden Halix:** Shield lines; slam creates ice; Maul to break guard.
- **Leviarch Coil:** Serpentine bridge chase; Hook pulls segments off rails.
- **Sandscribe Ophira:** Glyph lasers via light beams; rotate crystals to backfire.
- **Crown‑Engine Aion:** Clockwork rings, lava pistons; use all traversal to ride safe paths.
- **Maelgrith:** P1 sword geometry; P2 Eclipse clone dance (Mirror counter); P3 arena flips every 10s; heal denial unless Sigil charged.

---

## 11) Items & Gating Table

- **Sunflame Lantern/Prism:** Light dark rooms; ignite/redirect beams → opens prism doors, burns brambles.
- **Gale Boots:** Dash gaps, stump‑jump, break brittle roots.
- **Riverfin Vest:** Swim/dive, resist currents, underwater switches.
- **Aether Mirror:** Flip certain tiles/bridges between Day↔Eclipse; reflect beams/projectiles.
- **Storm Disk:** Return throw, element carrier, stun flyers, hit distant levers.
- **Quake Maul:** Smash ice/stone, ground switches, stagger heavy enemies.
- **Tide Hook:** Grapple targets, yank blocks/enemies, retract bridges.
- **Kingsbane Sigil:** Nullifies Eclipse pylons; damage buff to corrupted.

---

## 12) Systems & Numbers (tuning starting points)

- **Hearts:** Start 3; max 20; +1 from 4 heart‑shard pieces or boss clears.
- **Stamina:** Sprint/roll only; no attack cost. \~2.0s full bar; boots reduce drain while dashing.
- **Invincibility frames:** 0.45s on hit; 0.25s on roll peak.
- **Drops:** 60% currency, 20% ammo/charges, 15% hearts, 5% rare (rumor cards).
- **Enemy HP tiers:** Field trash 2–4; elites 8–12; miniboss 25–40; bosses 120–220.

---

## 13) Economy & Gear

- **Currency:** **Gleam** (crystal chips).
- **Vendors:** Weapon smith (blade length/damage tiers), Nila (gadget mods), apothecary (flask charges/upgrades), Bramm (keys/passes).
- **Crafting:** Simple—combine regionals to upgrade (e.g., wolf fang + iron for bramble guard).

---

## 14) Level Design Rules of Thumb

- Every screen: 1 main path + 1 curiosity path; secrets per region: \~12–18.
- Teach → test → twist pattern for new items; never introduce a lethal combo without a safe preview.
- Eclipse overlays reuse existing screens with 3–5 tile edits to open new micro‑routes.

---

## 15) Quests, Flags & Save Schema (example)

```yaml
flags:
  tutorial_complete: bool
  rivergate_open: bool
  shard_count: int
  eclipse_unlocked: bool
  ally_myra_done: bool
  ally_sorrel_done: bool
  ally_nila_done: bool
  ally_peren_done: bool
  kingsbane_forged: bool
keys:
  waterworks_key: bool
  frost_sigils: int
progress:
  hearts: int
  stamina_upgrades: int
  items:
    lantern: true
    gale_boots: bool
    riverfin_vest: bool
    aether_mirror: bool
    storm_disk: bool
    quake_maul: bool
    tide_hook: bool
    sunflame_prism: bool
    kingsbane_sigil: bool
```

---

## 16) UX & Accessibility

- Remappable controls; hold‑to‑toggle sprint; auto‑read signs.
- **Assist options:** Damage scaling (50–100%), aim assist cone for Disk/Hook, puzzle hints cooldown.
- Color‑blind safe palettes for puzzle lights; screen shake slider.

---

## 17) Content Checklist for Developers

- [ ] Overworld tilesets (grass, forest, river, marsh, desert, snow, volcanic)
- [ ] 8 dungeon tilesets + unique mechanics
- [ ] NPC schedules (Hearthmere market day/night)
- [ ] Enemy state machines (idle, patrol, aggro, retreat, special)
- [ ] Boss arenas & cutscenes
- [ ] Item acquisition rooms and tutorials
- [ ] Fast‑travel shrines (activate with Mirror)
- [ ] Rumor card collectibles (Pip)
- [ ] Map UI (region names, shard indicators, Eclipse overlay toggle)
- [ ] Save/load & quest flags (see schema)

---

## 18) Production Scope (baseline)

- **Core team:** 1 designer, 1 pixel artist, 1 programmer, 1 audio; 12–18 months.
- **Playable prototype:** 1 region + 1 dungeon with Mirror prototype.
- **Vertical slice KPIs:** 30–45 min session includes item tutorial, miniboss, and Eclipse flip reveal.

---

## 19) Quick Visual Guide to Key Characters

_(For artists; one‑line silhouettes)_

- **Arin/Lyra:** Cloak + short cape; light boots; slim sword.
- **Elowen:** Cane‑staff, ivy wrap, layered robe triangles.
- **Maelgrith:** Crown float, negative‑space face, jagged mantle.
- **Vyre:** Scarf streamers, twin crescent blades.
- **Sable Matron:** Teardrop veils, long fingers.
- **Garruk:** Antler helm, asym bramble pauldrons.
- **Halix:** Tower shield square, icicle edges.

---

## 20) Notes for Engineering

- Collision layer groups: terrain, hazards, pushables, projectiles, characters, water, eclipse‑only.
- Deterministic RNG seed per screen for repeatable pots/bushes when reloading.
- Puzzle graph per room (nodes: switches/doors; edges: conditions) to validate solvable states.
- Data‑driven entities in JSON/YAML; mod‑friendly tables for enemy stats and drops.

---

### Appendix A — Full Enemy Catalogue (IDs)

- sprig_stalker, mud_whelp, bandit_scrapper, bandit_archer, sand_wraith, thorn_wolf, wisp_cluster, stone_sentinel, bog_serpent, rift_mote

### Appendix B — Friendly NPC Catalogue (IDs)

- elowen, bramm, thalia, rafe, myra, sorrel, peren, rowan, nila, pip

---

**This GDD is self‑contained** for building a playable prototype and then scaling to full production. Adjust numbers as testing dictates.

# Tilemap & Collision Validator Agent

**Role**: CI/CD validation of map assets, collision integrity, and Tiled standards compliance

## Core Responsibilities

### Automated Map Validation
- Validate all `.tmx` files against project standards before merge
- Check required layers, properties, and naming conventions
- Ensure collision geometry completeness and accuracy
- Verify portal connectivity and prevent softlocks

### Standards Enforcement
- Enforce tileset property schemas across all maps
- Validate layer naming and organization consistency
- Check asset references and prevent missing dependencies
- Maintain map metadata and indexing accuracy

### Quality Assurance Integration
- Generate validation reports for level designers
- Provide actionable feedback for map improvements  
- Integrate with CI/CD pipeline for automated checking
- Create regression testing for map changes

## Validation Rules

### Required Layer Structure
```typescript
// /tools/tiled-validate.ts - Core validation logic
const REQUIRED_LAYERS = [
  'background',    // Visual background elements
  'collision',     // Collision geometry (required)
  'portals',       // Portal trigger areas
  'spawns',        // Player/entity spawn points  
  'foreground',    // Foreground visual elements (optional)
  'decorative'     // Decorative elements (optional)
] as const;

export interface LayerValidation {
  name: string;
  required: boolean;
  type: 'tilelayer' | 'objectgroup' | 'imagelayer';
  properties?: Record<string, any>;
}
```

### Tileset Property Validation
```typescript
// Validate against /schemas/tileset.schema.json
interface ValidTileProperties {
  collides?: boolean;        // Collision flag
  damage?: number;           // Damage amount (>= 0)
  portal?: {                 // Portal definition
    target: string;
    spawn: string;
    transition?: 'fade' | 'slide' | 'instant';
  };
  collectible?: {            // Collectible item
    type: string;
    value?: number;
    respawns?: boolean;
  };
  sound?: string;            // Audio trigger ID
  animation?: {              // Tile animation properties
    frames: number[];
    duration: number;
  };
}
```

### Collision Layer Requirements
```typescript
// /tools/collision-validator.ts
export class CollisionValidator {
  validateCollisionLayer(map: TiledMap): ValidationResult {
    const issues: ValidationIssue[] = [];
    
    // Check collision completeness
    this.checkMapBoundaries(map, issues);
    this.checkPortalAccessibility(map, issues);  
    this.checkSpawnPointValidity(map, issues);
    this.checkUnreachableAreas(map, issues);
    
    return { valid: issues.length === 0, issues };
  }
  
  private checkMapBoundaries(map: TiledMap, issues: ValidationIssue[]): void {
    // Ensure map edges have appropriate collision
    // Prevent players from walking off-screen
  }
  
  private checkPortalAccessibility(map: TiledMap, issues: ValidationIssue[]): void {
    // Verify all portals are reachable from spawn points
    // Check for collision blocking portal access
  }
}
```

## CI/CD Integration

### GitHub Actions Workflow
```yaml
# /.github/workflows/validate-maps.yml
name: Map Validation
on:
  pull_request:
    paths: ['world/**/*.tmx', 'world/**/*.tsx', 'world/worldIndex.json']

jobs:
  validate-maps:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: pnpm install
        
      - name: Validate Map Structure
        run: pnpm validate:maps
        
      - name: Check Collision Integrity  
        run: pnpm validate:collision
        
      - name: Verify Portal Connectivity
        run: pnpm validate:portals
        
      - name: Generate Validation Report
        run: pnpm validate:report
        if: failure()
```

### Package Scripts
```json
// package.json additions
{
  "scripts": {
    "validate:maps": "tsx tools/tiled-validate.ts",
    "validate:collision": "tsx tools/collision-validator.ts", 
    "validate:portals": "tsx tools/portal-validator.ts",
    "validate:report": "tsx tools/generate-validation-report.ts",
    "validate:all": "pnpm validate:maps && pnpm validate:collision && pnpm validate:portals"
  }
}
```

## Validation Tools Implementation

### Core Validator
```typescript
// /tools/tiled-validate.ts - Main validation entry point
import { readFileSync, readdirSync } from 'fs';
import { parse as parseXML } from 'fast-xml-parser';
import { validateMapStructure } from './validators/structure-validator';
import { validateCollisions } from './validators/collision-validator';  
import { validatePortals } from './validators/portal-validator';

export async function validateAllMaps(): Promise<ValidationReport> {
  const mapFiles = readdirSync('world/maps').filter(f => f.endsWith('.tmx'));
  const results: MapValidationResult[] = [];
  
  for (const mapFile of mapFiles) {
    const mapPath = `world/maps/${mapFile}`;
    const mapData = parseXML(readFileSync(mapPath, 'utf8'));
    
    const structureResult = validateMapStructure(mapData, mapFile);
    const collisionResult = validateCollisions(mapData, mapFile);
    const portalResult = validatePortals(mapData, mapFile);
    
    results.push({
      file: mapFile,
      structure: structureResult,
      collision: collisionResult, 
      portals: portalResult,
      valid: structureResult.valid && collisionResult.valid && portalResult.valid
    });
  }
  
  return { results, overallValid: results.every(r => r.valid) };
}
```

### Structure Validator
```typescript  
// /tools/validators/structure-validator.ts
export function validateMapStructure(mapData: any, filename: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  
  // Check required layers exist
  const layers = mapData.map?.layer || [];
  const layerNames = layers.map(l => l['@_name']);
  
  for (const required of REQUIRED_LAYERS.filter(l => l.required)) {
    if (!layerNames.includes(required.name)) {
      issues.push({
        type: 'missing_layer',
        severity: 'error',
        message: `Required layer '${required.name}' missing`,
        file: filename
      });
    }
  }
  
  // Validate tileset references
  validateTilesetReferences(mapData, filename, issues);
  
  // Check map dimensions are reasonable
  validateMapDimensions(mapData, filename, issues);
  
  return { valid: issues.filter(i => i.severity === 'error').length === 0, issues };
}
```

### Portal Connectivity Validator
```typescript
// /tools/validators/portal-validator.ts  
export function validatePortals(mapData: any, filename: string): ValidationResult {
  const issues: ValidationIssue[] = [];
  const worldIndex = JSON.parse(readFileSync('world/worldIndex.json', 'utf8'));
  
  // Find portal objects
  const portalLayers = mapData.map?.objectgroup?.filter(og => 
    og['@_name'] === 'portals'
  ) || [];
  
  for (const layer of portalLayers) {
    const portals = layer.object || [];
    
    for (const portal of portals) {
      const targetMap = portal.properties?.property?.find(p => 
        p['@_name'] === 'target'
      )?.[text];
      
      const targetSpawn = portal.properties?.property?.find(p =>
        p['@_name'] === 'spawn'  
      )?.[text];
      
      // Validate target exists in world index
      if (targetMap && !worldIndex.maps.find(m => m.id === targetMap)) {
        issues.push({
          type: 'invalid_portal_target',
          severity: 'error', 
          message: `Portal targets non-existent map: ${targetMap}`,
          file: filename,
          location: { x: portal['@_x'], y: portal['@_y'] }
        });
      }
      
      // Validate spawn point exists in target map
      if (targetMap && targetSpawn) {
        validateSpawnPointExists(targetMap, targetSpawn, filename, issues);
      }
    }
  }
  
  return { valid: issues.filter(i => i.severity === 'error').length === 0, issues };
}
```

## Validation Reports

### Console Output
```typescript
// /tools/generate-validation-report.ts
export function generateReport(results: ValidationReport): void {
  console.log(`\n🗺️  Map Validation Report`);
  console.log(`=====================================`);
  
  const totalMaps = results.results.length;
  const validMaps = results.results.filter(r => r.valid).length;
  const errorCount = results.results.reduce((sum, r) => 
    sum + r.structure.issues.length + r.collision.issues.length + r.portals.issues.length, 0
  );
  
  console.log(`📊 Summary: ${validMaps}/${totalMaps} maps valid`);
  console.log(`⚠️  Total issues: ${errorCount}\n`);
  
  // Detailed results per map
  for (const result of results.results) {
    const status = result.valid ? '✅' : '❌';
    console.log(`${status} ${result.file}`);
    
    if (!result.valid) {
      logIssues(result.structure.issues, '  Structure');
      logIssues(result.collision.issues, '  Collision'); 
      logIssues(result.portals.issues, '  Portals');
    }
  }
  
  if (!results.overallValid) {
    process.exit(1); // Fail CI build
  }
}

function logIssues(issues: ValidationIssue[], category: string): void {
  if (issues.length === 0) return;
  
  console.log(`${category}:`);
  for (const issue of issues) {
    const icon = issue.severity === 'error' ? '🚨' : '⚠️';
    console.log(`    ${icon} ${issue.message}`);
    if (issue.location) {
      console.log(`       at (${issue.location.x}, ${issue.location.y})`);
    }
  }
}
```

### HTML Report Generation
```typescript
// /tools/html-report-generator.ts - For detailed reports
export function generateHTMLReport(results: ValidationReport): string {
  // Generate detailed HTML report with:
  // - Interactive map thumbnails
  // - Clickable issue locations  
  // - Filtering and sorting options
  // - Export to share with level designers
}
```

## Integration Points

### With World Builder
- **Pre-commit validation**: Catch issues before they reach main branch
- **Design feedback**: Provide actionable suggestions for map improvements  
- **Standards guidance**: Ensure consistent layer organization and naming

### With Map/Streaming Engineer  
- **Runtime safety**: Prevent maps that would crash streaming system
- **Performance validation**: Check map complexity against performance budgets
- **Portal integrity**: Ensure seamless world navigation

### With Spec Librarian
- **Schema compliance**: Validate against maintained JSON schemas
- **Standards evolution**: Update validation rules as schemas evolve  
- **Documentation sync**: Keep validation rules aligned with project standards

## Success Metrics

### Quality Metrics
- Zero production crashes due to malformed maps
- 100% portal connectivity (no softlocks)
- Complete collision coverage on all accessible areas
- Consistent layer structure across all maps

### Process Metrics  
- <2 minute validation time for full map suite
- Clear, actionable error messages for designers
- Zero false positives in validation results
- Automated validation catches 95%+ of issues before manual testing

## Future Enhancements

### Advanced Validation
- Pathfinding validation (ensure all areas reachable)
- Performance profiling (complexity analysis)
- Visual validation (screenshot comparison)
- Gameplay flow validation (item progression logic)

### Developer Experience
- VS Code extension for real-time validation  
- Tiled plugin integration for immediate feedback
- Interactive map debugging tools
- Performance profiling and optimization suggestions
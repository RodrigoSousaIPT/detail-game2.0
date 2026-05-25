# Detail Kings — 3D Car Detailing Tycoon

**Version:** 2.0.0 (Production Build)

A browser-based 3D car detailing simulation game built with Three.js. Clean cars, earn money, upgrade tools, and build your detailing empire!

## Features

### Core Gameplay
- **Realistic Cleaning Mechanics**: Use raycasting and UV mapping to clean car panels with various tools
- **7 Tool Categories**: Washing, Drying, Polishing, Interior, Wax, Wheels, and Glass
- **4-Tier Tool System**: Progress from basic tools to professional equipment
- **Dynamic Dirt System**: Procedurally generated dirt textures with accurate cleaning detection
- **Satisfaction System**: Customer satisfaction affects tips and ratings
- **Combo System**: Chain cleaning actions for bonus rewards

### Visual Features
- **3D Car Models**: Multiple vehicle types (Sedan, SUV, Pickup, Sports, Supercar, Classic, Motorcycle)
- **Dynamic Lighting**: Overhead lights that upgrade with shop level
- **Particle Effects**: Tool-specific particle systems for visual feedback
- **Screen Shake & Confetti**: Celebratory effects for achievements
- **Floating Money Display**: Visual feedback for earnings

### Progression System
- **4 Shop Tiers**: From Rusty Garage to Luxury Detailing Center
- **Reputation System**: Unlock new car types as you progress
- **Save/Load**: Automatic and manual save system with localStorage
- **Upgrade Panel**: Comprehensive tool and shop upgrade interface

### UI/UX
- **Responsive HUD**: Real-time stats display
- **Dirt Minimap**: Visual representation of dirty areas per panel
- **Progress Bar**: Track cleaning progress in real-time
- **Toolbar**: Quick tool switching with hotkeys (1-7)
- **Keyboard Controls**: TAB for upgrades, ESC to close, R to reset camera

## Technical Implementation

### Architecture
- **Strict Mode**: Enabled for better error catching
- **Configuration Object**: Centralized constants for easy tuning
- **State Management**: Immutable data patterns where possible
- **Error Handling**: Try-catch blocks with graceful degradation
- **Performance Optimization**: 
  - Delta time capping for consistent physics
  - Squared distance calculations (avoiding sqrt)
  - Efficient particle pooling
  - Debounced auto-save

### Code Quality
- **JSDoc Comments**: Type annotations for IDE support
- **Object.freeze()**: Prevents accidental mutation of constants
- **Input Validation**: All user inputs and loaded data validated
- **Null Checks**: Defensive programming throughout
- **Memory Management**: Proper disposal of Three.js resources

## Controls

| Action | Input |
|--------|-------|
| Clean | Left-click + drag |
| Orbit Camera | Right-click + drag |
| Zoom | Scroll wheel |
| Switch Tools | Number keys 1-7 |
| Open Upgrades | TAB |
| Close Panel | ESC |
| Reset Camera | R |

## Installation

1. Clone or download this repository
2. Open `index.html` in a modern web browser (Chrome, Firefox, Edge recommended)
3. No build step required - runs directly in browser

## Browser Requirements

- WebGL 2.0 support
- Modern browser (Chrome 80+, Firefox 75+, Safari 13+, Edge 80+)
- JavaScript enabled
- LocalStorage enabled (for save functionality)

## File Structure

```
/workspace
├── index.html      # Main HTML file with embedded CSS
├── js/
│   ├── data.js     # Game constants and configuration
│   └── game.js     # Core game engine and logic
├── README.md       # This file
└── prompt.txt      # Original project requirements
```

## Development Notes

### Performance Considerations
- Particle count limited to 200 for mobile compatibility
- Dirt sampling uses step value of 4 for balance between accuracy and speed
- Delta time capped at 0.05s to prevent physics jumps on frame drops
- Auto-save every 15 seconds to prevent data loss without impacting performance

### Save System
- Uses localStorage with JSON serialization
- Version tracking for future migration support
- QuotaExceededError handling for storage limits
- Data validation on load to prevent corruption

### Extensibility
- Tool categories easily extendable via TOOL_CATEGORIES object
- Car types can be added to CAR_TYPES array
- Shop tiers configurable in SHOP_TIERS array
- All tunable values centralized in CONFIG object

## License

This project is provided as-is for educational and entertainment purposes.

## Credits

Built with:
- [Three.js](https://threejs.org/) - 3D graphics library
- Vanilla JavaScript - No frameworks, pure performance
- HTML5 Canvas - For dynamic dirt textures
- CSS3 - Modern styling with backdrop-filter effects

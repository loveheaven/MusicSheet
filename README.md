# Music Sheet Reader

A cross-platform music sheet reader built with Tauri 2, supporting Android, iOS, macOS, and Windows. This application can read LilyPond format music files and display them with playback functionality.

## Features

- 📱 **Cross-platform**: Supports Android, iOS, macOS, and Windows
- 🎵 **LilyPond Support**: Parse and display LilyPond format music files
- 🎼 **Music Notation**: Visual music notation display using VexFlow
- 🔊 **Audio Playback**: Play music with real-time note highlighting
- 📁 **File Management**: Open and load LilyPond files from your device
- 🎨 **Modern UI**: Beautiful and responsive user interface

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later)
- [Rust](https://rustup.rs/) (latest stable version)
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Platform-specific requirements:

#### For Android development:
- [Android Studio](https://developer.android.com/studio)
- Android SDK and NDK
- Java Development Kit (JDK) 8 or later

#### For iOS development (macOS only):
- [Xcode](https://developer.apple.com/xcode/)
- iOS SDK

#### For Windows development:
- [Microsoft Visual Studio](https://visualstudio.microsoft.com/) with C++ build tools

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MusicSheet
```

2. Install dependencies:
```bash
npm install
```

3. Install Tauri CLI:
```bash
npm install -g @tauri-apps/cli@next
```

## Development

### Desktop Development

To run the application in development mode:

```bash
npm run tauri:dev
```

### Mobile Development

#### Android
1. Add Android platform:
```bash
tauri android init
```

2. Run on Android:
```bash
npm run tauri:android
```

#### iOS (macOS only)
1. Add iOS platform:
```bash
tauri ios init
```

2. Run on iOS:
```bash
npm run tauri:ios
```

## Building

### Desktop Build
```bash
npm run tauri:build
```

### Android Build
```bash
tauri android build
```

### iOS Build (macOS only)
```bash
tauri ios build
```

## Usage

1. **Loading Music**: 
   - Click "Open LilyPond File" to load a `.ly` or `.ily` file
   - Or click "Load Sample" to try the built-in example

2. **Viewing Music**: 
   - The music notation will be displayed in standard musical notation
   - Music information (title, composer, key, time signature) is shown above the notation

3. **Playing Music**:
   - Use the Play button to start playback
   - The current note will be highlighted during playback
   - Use Pause to pause playback or Stop to stop and reset

## LilyPond Format Support

The application supports basic LilyPond syntax including:

- Note names (c, d, e, f, g, a, b)
- Accidentals (sharps: `is`, flats: `es`)
- Octave markers (`'` for higher, `,` for lower)
- Duration values (1, 2, 4, 8, 16)
- Header information (title, composer)
- Key signatures (`\key c \major`)
- Time signatures (`\time 4/4`)

### Example LilyPond File

```lilypond
\version "2.24.0"

\header {
  title = "Simple Melody"
  composer = "Your Name"
}

\score {
  \new Staff {
    \clef treble
    \key c \major
    \time 4/4
    
    c'4 d' e' f' | g' a' b' c''2 |
  }
  \layout { }
  \midi { }
}
```

## Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Rust + Tauri 2
- **Music Notation**: VexFlow
- **Audio**: Tone.js
- **UI Components**: Lucide React (icons)

## Project Structure

```
MusicSheet/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── App.tsx            # Main application component
│   └── main.tsx           # Application entry point
├── src-tauri/             # Tauri backend
│   ├── src/               # Rust source code
│   ├── Cargo.toml         # Rust dependencies
│   └── tauri.conf.json    # Tauri configuration
├── package.json           # Node.js dependencies
└── README.md             # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Tauri](https://tauri.app/) - For the amazing cross-platform framework
- [VexFlow](https://vexflow.com/) - For music notation rendering
- [Tone.js](https://tonejs.github.io/) - For audio synthesis
- [LilyPond](https://lilypond.org/) - For the music notation format inspiration
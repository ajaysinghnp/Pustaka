# Pustaka - Realistic PDF Book Viewer

Pustaka (Indonesian for "library") is an open-source, cross-platform PDF viewer that provides a realistic book-like reading experience with page-flipping animations, sound effects, and responsive design.

## ✨ Features

- **Realistic Page Flipping**: Smooth, physics-based page turning animations
- **Cross-Platform**: Works on web, desktop (Electron), and mobile (Capacitor)
- **Responsive Design**: Adapts to different screen sizes and orientations
- **Two-Page Spread**: Automatically displays two pages in landscape mode
- **A4 Aspect Ratio**: Maintains proper document proportions
- **Sound Effects**: Realistic page flipping sounds
- **Touch & Mouse Support**: Intuitive interaction for all devices
- **Framework Agnostic**: Works with vanilla JS, React, Vue, and more
- **WebGL Powered**: Hardware-accelerated rendering for smooth performance

## 🚀 Quick Start

### Installation

```bash
npm install pustaka-pdf-viewer
```

### Basic Usage

#### Vanilla JavaScript

```html
<canvas id="pdf-viewer"></canvas>
<script type="module">
  import { PustakaCore } from 'pustaka-pdf-viewer';
  
  const canvas = document.getElementById('pdf-viewer');
  const Pustaka = new PustakaCore({
    canvas: canvas,
    pdfSource: 'path/to/document.pdf'
  });
  
  Pustaka.on('ready', ({ totalPages }) => {
    console.log(`PDF loaded with ${totalPages} pages`);
  });
</script>
```

#### React Component

```jsx
import { Pustaka } from 'pustaka-pdf-viewer/react';

function App() {
  return (
    <Pustaka
      src="/path/to/document.pdf"
      options={{
        hardCovers: true,
        soundFlip: '/sounds/page-flip.mp3',
        enableWebGL: true
      }}
      onPageChanged={(page) => console.log('Current page:', page)}
    />
  );
}
```

## 📖 API Reference

### Core Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `canvas` | HTMLCanvasElement | **Required** | The canvas element for rendering |
| `pdfSource` | string \| ArrayBuffer \| Uint8Array | - | PDF source (URL, ArrayBuffer, or Uint8Array) |
| `fileFetcher` | Function | Built-in fetcher | Custom file fetching implementation |
| `pageSpacing` | number | 10 | Space between pages in pixels |
| `enableWebGL` | boolean | true | Use WebGL for rendering (fallback to Canvas2D) |
| `hardCovers` | boolean | false | Show hard cover effects on first/last pages |
| `soundFlip` | string | - | Path to page flip sound effect |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `ready` | `{ totalPages: number }` | Fired when PDF is loaded and ready |
| `error` | `{ message: string, error: Error }` | Fired on loading or rendering errors |
| `pageChanged` | `{ currentPage: number }` | Fired when page navigation occurs |
| `pageLoaded` | `{ pageNumber: number, page: pustakaPage }` | Fired when a page is loaded |
| `renderComplete` | `{ frameTime: number }` | Fired after each render frame |
| `orientationChanged` | `{ orientation: 'landscape' \| 'portrait' }` | Fired when orientation changes |

### Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `loadDocument` | `source: string \| ArrayBuffer \| Uint8Array` | `Promise<void>` | Load a PDF document |
| `goToPage` | `pageNumber: number` | `Promise<void>` | Navigate to specific page |
| `nextPage` | - | `Promise<void>` | Go to next page |
| `previousPage` | - | `Promise<void>` | Go to previous page |
| `resize` | `width: number, height: number` | `void` | Resize the renderer |
| `dispose` | - | `void` | Clean up resources |

## 🛠️ Customization

### Custom File Fetcher

```javascript
const customFetcher = async (url) => {
  // Implement custom fetching logic
  const response = await fetch(url, {
    headers: { 'Authorization': 'Bearer token' }
  });
  return response.arrayBuffer();
};

const Pustaka = new PustakaCore({
  canvas: myCanvas,
  pdfSource: 'https://example.com/document.pdf',
  fileFetcher: customFetcher
});
```

### Custom Styling

```css
.pdf-viewer-container {
  max-width: 800px;
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  overflow: hidden;
}

.pdf-viewer-container canvas {
  width: 100%;
  height: auto;
}
```

## 🌐 Browser Support

| Browser | WebGL | Canvas2D | Touch Events |
|---------|-------|----------|-------------|
| Chrome | ✅ | ✅ | ✅ |
| Firefox | ✅ | ✅ | ✅ |
| Safari | ✅ | ✅ | ✅ |
| Edge | ✅ | ✅ | ✅ |
| Mobile Chrome | ✅ | ✅ | ✅ |
| Mobile Safari | ✅ | ✅ | ✅ |

## 🔧 Development

### Building from Source

```bash
# Clone the repository
git clone https://github.com/your-username/pustaka.git
cd pustaka

# Install dependencies
npm install

# Build the library
npm run build

# Start development server with examples
npm run dev
```

### Project Structure

```
src/
├── core/           # Core rendering engine
│   ├── PustakaCore.ts      # Main controller
│   ├── PustakaLoader.ts        # PDF parsing and loading
│   ├── WebGLRenderer.ts    # WebGL rendering implementation
│   ├── CanvasRenderer.ts   # Canvas2D fallback renderer
│   └── PustakaInteraction.ts  # User input handling
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── wrappers/       # Framework-specific wrappers
    ├── react/      # React component
    ├── vue/        # Vue component
    └── web/        # Web Component
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- PDF.js for PDF parsing capabilities
- WebGL community for rendering techniques
- Contributors and testers who help improve Pustaka

## 📞 Support

- 📖 [Documentation](https://github.com/your-username/pustaka/wiki)
- 🐛 [Report Issues](https://github.com/your-username/pustaka/issues)
- 💡 [Request Features](https://github.com/your-username/pustaka/discussions)
- ❓ [Q&A Discussions](https://github.com/your-username/pustaka/discussions)

---

Made with ❤️ for the open-source community

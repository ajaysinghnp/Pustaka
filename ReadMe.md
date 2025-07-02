# Pustaka

> A modern PDF reader library that simulates the natural feel of reading a physical book — with page flip animations, 3D effects, and sound.  
> Designed for the web and native platforms, built with TypeScript.

---

## Features

- Render PDF pages side-by-side like a real book
- Smooth page flip animation and 3D effects
- Supports page navigation (next/previous)
- Lightweight and framework-agnostic (usable in React, Vue, vanilla JS, etc.)
- Designed to be extensible with sound effects, touch support, and more
- Cross-platform support planned for Web, Windows, Mac, Linux, and Mobile

---

## Installation

```bash
npm install pustaka
```

## Usage

```ts
import { Pustaka } from 'pustaka';

// Get container element from DOM
const container = document.getElementById('bookContainer');

const pustaka = new Pustaka({
  container: container!,
  pdfUrl: 'path/to/your/file.pdf',
});

pustaka.init();
```

Include basic CSS for the book view:

```css
.pustaka-book {
  display: flex;
  justify-content: center;
  gap: 10px;
  perspective: 1500px;
}

.pustaka-page {
  transition: transform 0.6s;
  transform-origin: center;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

.pustaka-page.left:hover,
.pustaka-page.right:hover {
  transform: rotateY(-15deg);
}
```

## API

`new Pustaka(options: PustakaOptions)`

- `options.container` — The DOM element where the book will render
- `options.pdfUrl` — URL or path to the PDF file

### Methods

- `init(): Promise<void>`— Load PDF and render initial pages
- `next(): void` — Flip forward two pages
- `prev(): void` — Flip backward two pages

## Development

Clone the repo and install dependencies:

```bash
git clone https://github.com/yourusername/pustaka.git
cd pustaka
npm install
```

Run build:

```bash
npm run build
```

Run tests:

```bash
npm test
```

## Roadmap

- [ ] Add page flip sound effects
- [ ] Add touch/swipe support for mobile
- [ ] Add toolbar UI controls
- [ ] Realistic page curl animation with CSS3 or WebGL
- [ ] Native app wrappers (Electron, Tauri) for desktop
- [ ] Mobile app support (React Native / Flutter integration)

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check `issues page`.

## License

MIT © 2025 Ajay Singh

# Font Foundry Hub

**Font Foundry Hub** is a self-hosted font management platform designed for designers and developers who want complete control over their font library. Upload, preview, organize, and serve your custom fonts from a single, private interface.

## 🚀 Features

- **Private Self-Hosting**: Manage your font library locally with lightning-fast performance.
- **Smart Uploader**: Drag and drop support for TrueType (`.ttf`), OpenType (`.otf`), and Web Open Font Format (`.woff`, `.woff2`).
- **Live Interactive Previews**: Test fonts in real-time with custom text, adjustable sizes, and various weights/styles.
- **Code Snippet Generation**: Instantly get CSS `@font-face` imports, HTML links, or Base64-encoded strings for easy integration into your web projects.
- **Font Pairing Engine**: Get AI-inspired suggestions for header and body text combinations based on your font's category.
- **Detailed Metadata**: Track font authorship, descriptions, licenses, and categories.
- **Browser-Powered Storage**: All font data is securely stored in your browser's **IndexedDB**, ensuring privacy and offline availability.

## 🛠️ Tech Stack

- **Framework**: [React 18](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Data Management**: [TanStack Query](https://tanstack.com/query) & [IDB](https://github.com/jakearchibald/idb)
- **Routing**: [React Router 6](https://reactrouter.com/)

## 🏁 Getting Started

### Prerequisites

Ensure you have [Bun](https://bun.sh/) or [Node.js](https://nodejs.org/) installed.

### Installation

```sh
# Clone the repository
git clone <repository-url>
cd font-foundry-hub

# Install dependencies
bun install
# or
npm install
```

### Development

```sh
bun dev
# or
npm run dev
```

The application will be available at `http://localhost:5173`.

## 📦 Project Structure

- `src/components`: UI components (Heads, Grids, Uploaders, Modals).
- `src/pages`: Application views (Library, Font Details).
- `src/lib`: Database logic (IndexedDB) and font processing utilities.
- `src/hooks`: Custom React hooks for font state management and UI interactions.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

Created by **Oleg Mokhniuk**.

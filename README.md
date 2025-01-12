# RobCo Terminal Hacking Simulator

A faithful recreation of the Fallout series' terminal hacking minigame, built with Next.js, TypeScript, and Tailwind CSS.

![RobCo Terminal](/public/screenshot.png)

## Features

- 🎮 Authentic Fallout-style terminal hacking gameplay
- 💻 Retro CRT screen effects and animations
- 🎯 Word guessing with likeness indicators
- 🔍 Bracket matching for removing duds and replenishing attempts
- 📱 Responsive design (desktop-only for authentic experience)
- 🎨 Classic RobCo Industries UI styling
- ⌨️ Full keyboard navigation

## How to Play

1. Find and select the correct password from the displayed words
2. Each guess shows the number of matching characters in the correct positions
3. Use bracket pairs (e.g., `<>`, `[]`, `{}`, `()`) to:
   - Remove dud words
   - Replenish your attempts
4. You have 4 attempts to find the correct password

### Controls

- Arrow keys: Navigate cursor
- Enter: Select word/brackets
- Help button: View tutorial

## Getting Started

```bash
# Clone the repository
git clone https://github.com/ther0y/robco-term.git

# Navigate to project directory
cd robco-term

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:3000` to start hacking!

## Built With

- [Next.js 14](https://nextjs.org/) - React Framework
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Shadcn/ui](https://ui.shadcn.com/) - UI Components

## Contributing

Contributions are welcome! Feel free to submit issues and pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by the terminal hacking minigame from the Fallout series
- Built as a tribute to Bethesda's game design
- Special thanks to the Next.js and Tailwind CSS communities

---

_Note: This is a fan project and is not affiliated with Bethesda Softworks or the Fallout franchise._

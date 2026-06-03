# Code Genealogist - Frontend

> Track how your functions evolved across Git history with AI-powered insights.

![Code Genealogist](./src/assets/logo-horizontal.jpeg)

## 🚀 Live Demo

**[code-genealogist-ui.vercel.app](https://code-genealogist-ui.vercel.app)**

## 📋 Features

- **GitHub OAuth Integration** - Securely connect your GitHub account
- **Repository Browser** - Explore public and private repositories
- **Function Evolution Timeline** - Visualize how functions changed across commits
- **AI-Powered Insights** - Get explanations of what changed and why
- **Change Classification** - Automatic detection of bug fixes, refactors, features
- **Side-by-Side Comparison** - Compare code versions with detailed diffs
- **Analytics Dashboard** - Track patterns across function versions
- **Timeline Milestones** - Key changes highlighted with confidence scores

## 💻 Tech Stack

- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS
- **UI Components:** Lucide React Icons
- **Authentication:** GitHub OAuth 2.0
- **State Management:** React Hooks
- **API Client:** Fetch API

## 🛠️ Setup

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
git clone https://github.com/ananya24s/Code-genealogist-ui.git
cd Code-genealogist-ui
npm install
```

### Environment Variables

Create `.env`:documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration
### Development

```bash
npm run dev
```

Visit: `http://localhost:5173`

### Production Build

```bash
npm run build
```

## 📖 How to Use

1. **Login** - Click "Start Analyzing" and authenticate with GitHub
2. **Select Repository** - Choose a repo to analyze
3. **Enter Function Details** - Specify the file path and function name
4. **View Evolution** - See the timeline of changes
5. **Explore Changes** - Click on versions to see what changed
6. **Read AI Insights** - Understand why changes were made
7. **Compare Versions** - View side-by-side code comparison

## 🏗️ Project Structure
src/
├── App.jsx           # Main app component & results page
├── App.css           # App styling
├── Landing.jsx       # Landing page
├── Landing.css       # Landing styling
├── main.jsx          # Entry point
└── assets/           # Logos and images
## 🔗 API Integration

Backend API: `https://codegenealogist.onrender.com`

### Endpoints
- `POST /auth/callback` - GitHub OAuth token exchange
- `POST /analyze` - Analyze function evolution

## 🚀 Deployment

Deployed on **Vercel**:
```bash
git push origin master
```

Auto-deploys on push to master branch.

## 📄 License

MIT

## 👨‍💻 Author

**Ananya Singh** - SRM IST, B.Tech CSE (2nd Year)

---

Built with ❤️ for developers who want to understand their code history.

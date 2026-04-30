import { Project, Issue, ProjectIdea } from '../types';

export const mockProjects: Project[] = [
  {
    id: '1',
    name: 'cal.com',
    owner: 'calcom',
    description: 'Scheduling infrastructure for absolutely everyone. A flexible, open-source alternative to Calendly.',
    techStack: ['TypeScript', 'Next.js', 'Prisma', 'tRPC'],
    difficulty: 'Medium',
    activityStatus: 'Very Active',
    stars: 28400,
    forks: 6800,
    openIssues: 312,
    language: 'TypeScript',
    repoUrl: 'https://github.com/calcom/cal.com',
    topics: ['scheduling', 'calendar', 'saas'],
  },
  {
    id: '2',
    name: 'excalidraw',
    owner: 'excalidraw',
    description: 'Virtual whiteboard for sketching hand-drawn like diagrams. Collaborative and end-to-end encrypted.',
    techStack: ['TypeScript', 'React', 'Canvas API'],
    difficulty: 'Medium',
    activityStatus: 'Very Active',
    stars: 65200,
    forks: 5800,
    openIssues: 178,
    language: 'TypeScript',
    repoUrl: 'https://github.com/excalidraw/excalidraw',
    topics: ['drawing', 'collaboration', 'whiteboard'],
  },
  {
    id: '3',
    name: 'supabase',
    owner: 'supabase',
    description: 'The open source Firebase alternative. Build in a weekend, scale to millions.',
    techStack: ['TypeScript', 'PostgreSQL', 'Deno', 'Elixir'],
    difficulty: 'Hard',
    activityStatus: 'Very Active',
    stars: 62100,
    forks: 5900,
    openIssues: 487,
    language: 'TypeScript',
    repoUrl: 'https://github.com/supabase/supabase',
    topics: ['database', 'backend', 'firebase'],
  },
  {
    id: '4',
    name: 'shadcn-ui',
    owner: 'shadcn',
    description: 'Beautifully designed components built with Radix UI and Tailwind CSS. Not a component library.',
    techStack: ['TypeScript', 'React', 'Tailwind CSS', 'Radix UI'],
    difficulty: 'Easy',
    activityStatus: 'Active',
    stars: 51300,
    forks: 2900,
    openIssues: 89,
    language: 'TypeScript',
    repoUrl: 'https://github.com/shadcn-ui/ui',
    topics: ['ui', 'components', 'tailwind'],
  },
  {
    id: '5',
    name: 'formbricks',
    owner: 'formbricks',
    description: 'Open Source Survey Platform. The privacy-friendly Typeform alternative with a React SDK.',
    techStack: ['TypeScript', 'Next.js', 'Prisma', 'React'],
    difficulty: 'Easy',
    activityStatus: 'Active',
    stars: 4800,
    forks: 780,
    openIssues: 62,
    language: 'TypeScript',
    repoUrl: 'https://github.com/formbricks/formbricks',
    topics: ['surveys', 'forms', 'analytics'],
  },
  {
    id: '6',
    name: 'hoppscotch',
    owner: 'hoppscotch',
    description: 'Open source API development ecosystem. Lightweight, web-based, and developer-friendly.',
    techStack: ['TypeScript', 'Vue.js', 'Tailwind CSS', 'GraphQL'],
    difficulty: 'Medium',
    activityStatus: 'Active',
    stars: 60100,
    forks: 4100,
    openIssues: 223,
    language: 'TypeScript',
    repoUrl: 'https://github.com/hoppscotch/hoppscotch',
    topics: ['api', 'rest', 'graphql'],
  },
];

export const mockIssues: Issue[] = [
  {
    id: 'i1',
    projectId: '1',
    projectName: 'cal.com',
    title: 'Add keyboard shortcut to quickly navigate between days in calendar view',
    description: `## Summary

Currently, users must click the navigation arrows to move between days in the calendar view. This creates friction for power users who prefer keyboard-driven navigation.

## Expected Behavior

Users should be able to use arrow keys (← →) to navigate between days when focus is on the calendar component.

## Steps to Reproduce

1. Open any calendar view
2. Try pressing arrow keys to navigate
3. Nothing happens — only mouse clicks work

## Environment

- OS: macOS 13.4
- Browser: Chrome 114
- Version: latest main

## Additional Context

This was requested by multiple users in our community Discord. Similar behavior exists in Google Calendar. The implementation should be accessible and not break existing keyboard interactions.`,
    labels: ['enhancement', 'good first issue', 'UX'],
    difficulty: 'Easy',
    estimatedTime: '2–4 hours',
    confidenceLevel: 'High',
    aiExplanation: {
      whatIsThis: 'This issue asks you to add keyboard navigation (left/right arrow keys) to the calendar day view. Right now users can only click buttons to move between days, but power users want to use their keyboard instead.',
      whatIsExpected: 'You need to add a keyboard event listener to the calendar component that listens for ArrowLeft and ArrowRight key presses, then calls the existing navigation functions to move to the previous or next day.',
      whereToStart: 'Look for the main calendar view component, likely in packages/features/calendars/ or apps/web/components/. Find where the navigation arrows are rendered and the functions they call — then add a useEffect or onKeyDown handler that triggers those same functions.',
      filesToCheck: [
        'packages/features/calendars/weeklyview/index.tsx',
        'apps/web/components/booking/DatePicker.tsx',
        'packages/ui/components/form/DateRangePicker.tsx',
      ],
    },
    createdAt: '2024-03-12',
    commentCount: 7,
  },
  {
    id: 'i2',
    projectId: '2',
    projectName: 'excalidraw',
    title: 'Zoom to cursor position instead of canvas center when using scroll wheel',
    description: `## Feature Request

When zooming with the scroll wheel, the canvas zooms toward the center of the viewport. Many drawing tools (Figma, Miro) zoom toward the cursor position instead, which feels much more natural.

## Current Behavior

Scroll up/down to zoom → canvas zooms from center.

## Desired Behavior

Scroll up/down to zoom → canvas zooms from the current mouse cursor position.

## Why This Matters

This is a standard UX pattern in design tools. It lets you quickly zoom into a specific area without needing to manually pan afterward.`,
    labels: ['enhancement', 'UX', 'help wanted'],
    difficulty: 'Medium',
    estimatedTime: '4–8 hours',
    confidenceLevel: 'Medium',
    aiExplanation: {
      whatIsThis: 'This is a UX improvement request to make zooming feel more natural. Instead of always zooming toward the canvas center, the zoom should follow where your mouse cursor is — exactly like Figma or Miro does.',
      whatIsExpected: 'You need to modify the zoom handler to calculate the mouse position relative to the canvas, then adjust the scroll/pan offset after zooming so that the point under the cursor stays in the same screen position.',
      whereToStart: 'Find the wheel event handler in the main canvas component. The zoom logic likely lives in a utility or state file. You\'ll need to capture mouse coordinates during the wheel event and apply an offset correction based on the zoom delta.',
      filesToCheck: [
        'src/components/App.tsx',
        'src/scene/scroll.ts',
        'src/utils.ts',
        'src/actions/actionCanvas.ts',
      ],
    },
    createdAt: '2024-03-08',
    commentCount: 14,
  },
];

export const mockSavedProjects: Project[] = [mockProjects[0], mockProjects[1], mockProjects[3]];

export const mockProjectIdeas: ProjectIdea[] = [
  {
    id: 'idea1',
    title: 'Open Source PR Review Assistant',
    explanation: 'A CLI tool that uses an AI model to automatically summarize pull requests, highlight risky changes, and suggest improvements before you submit a review.',
    whyItFits: 'Based on your contributions to TypeScript projects and interest in developer tooling, this aligns with your skillset and fills a real gap in the OSS workflow.',
    difficulty: 'Medium',
    estimatedBuildTime: '1–2 weeks',
    techStack: ['TypeScript', 'Node.js', 'GitHub API', 'OpenAI API'],
    tags: ['CLI', 'AI', 'Dev Tools', 'GitHub'],
  },
  {
    id: 'idea2',
    title: 'Minimal Markdown Wiki for Teams',
    explanation: 'A self-hosted, file-based wiki that renders markdown files from a Git repo. No database required — just push markdown and the site updates.',
    whyItFits: 'You\'ve shown interest in documentation tools and Next.js projects. This is a scoped, achievable project with a clear use case.',
    difficulty: 'Easy',
    estimatedBuildTime: '3–5 days',
    techStack: ['Next.js', 'TypeScript', 'MDX', 'Tailwind CSS'],
    tags: ['Documentation', 'Next.js', 'Markdown', 'Self-hosted'],
  },
  {
    id: 'idea3',
    title: 'Local-First SQLite Dev Dashboard',
    explanation: 'A desktop-style web app that connects to a local SQLite database and provides a clean interface for browsing tables, running queries, and visualizing data.',
    whyItFits: 'Your recent activity around database tools and SQL issues suggests you\'d find this technically interesting and immediately useful in your own workflow.',
    difficulty: 'Medium',
    estimatedBuildTime: '1 week',
    techStack: ['React', 'TypeScript', 'SQLite', 'Vite'],
    tags: ['Database', 'Developer Tools', 'Local-first'],
  },
  {
    id: 'idea4',
    title: 'GitHub Activity Heatmap API',
    explanation: 'A simple public API that returns a user\'s GitHub contribution heatmap data in JSON format. Useful for embedding contribution graphs into personal portfolios.',
    whyItFits: 'Quick to build, publicly useful, and great for your portfolio. Involves GitHub API integration which you\'ve recently been exploring.',
    difficulty: 'Easy',
    estimatedBuildTime: '2–3 days',
    techStack: ['Node.js', 'TypeScript', 'GitHub API', 'Vercel'],
    tags: ['API', 'GitHub', 'Portfolio', 'Quick Build'],
  },
  {
    id: 'idea5',
    title: 'Async Code Review Request Tracker',
    explanation: 'A lightweight web app for engineering teams to track open code review requests across multiple repos, with status indicators and Slack notifications.',
    whyItFits: 'You\'ve been active in team-collaboration tools and have experience with Slack integrations. This solves a real pain point for distributed teams.',
    difficulty: 'Hard',
    estimatedBuildTime: '2–3 weeks',
    techStack: ['Next.js', 'TypeScript', 'Supabase', 'Slack API', 'GitHub API'],
    tags: ['Collaboration', 'Team Tools', 'Notifications', 'Full-stack'],
  },
];

export const formatStars = (stars: number): string => {
  if (stars >= 1000) return `${(stars / 1000).toFixed(1)}k`;
  return stars.toString();
};

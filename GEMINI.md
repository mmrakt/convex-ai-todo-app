# Gemini Project Information

This document provides essential information for the Gemini AI assistant to understand and work with this project.

## Project Overview

This is a full-stack AI-powered Todo application built with Convex and React. The application allows users to manage tasks, and leverage AI to decompose large tasks into smaller subtasks and perform research on specific topics.

### Key Features

- **Task Management:** Create, update, and delete tasks.
- **AI-Powered Task De-composition:** Automatically break down large tasks into smaller, manageable subtasks using an AI agent.
- **AI-Powered Research Agent:** Gather and summarize information on a given topic to assist with task completion.
- **User Authentication:** Secure user authentication using Convex Auth.

## Technologies

- **Frontend:**
    - React
    - Vite
    - TypeScript
    - Tailwind CSS
- **Backend:**
    - Convex (database, serverless functions, and authentication)
- **AI:**
    - OpenAI API / Anthropic API
    - `ai` package for Vercel AI SDK
- **Linting/Formatting:**
    - Biome
- **Package Manager:**
    - pnpm

## Project Structure

- `convex/`: Contains the Convex backend functions, including schema definitions, queries, mutations, and AI-related logic.
    - `convex/ai/`: Contains the core AI agents and their configurations.
        - `taskDecomposer.ts`: The agent responsible for breaking down tasks.
        - `researchAgent.ts`: The agent responsible for performing research.
    - `convex/schema.ts`: Defines the database schema for the application.
    - `convex/tasks.ts`: Contains the queries and mutations for managing tasks.
- `src/`: Contains the React frontend application code.
    - `src/components/`: Reusable React components for the UI.
    - `src/hooks/`: Custom React hooks, including `useAI.ts` for interacting with the AI backend.
- `public/`: Static assets for the web application.

## Commands

- **`pnpm dev`**: Starts the development server for both the frontend and backend.
- **`pnpm build`**: Builds the frontend application for production.
- **`pnpm lint`**: Checks the frontend code for linting errors using Biome.
- **`pnpm lint:fix`**: Fixes linting errors in the frontend code using Biome.
- **`pnpm format`**: Formats the frontend code using Biome.

## AI Setup

To use the AI features, you need to set up the following environment variables in a `.env.local` file:

- `OPENAI_API_KEY`: Your OpenAI API key.
- `ANTHROPIC_API_KEY`: (Optional) Your Anthropic API key.

Additionally, you need to set the `JWT_PRIVATE_KEY` using the `pnpm convex env set` command for authentication to work correctly.
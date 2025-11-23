# AI Product Spin Generator - AI Rules

This document outlines the core technologies and conventions used in this application to ensure consistency and maintainability.

## Tech Stack Overview

*   **Frontend Framework:** React with TypeScript for building dynamic user interfaces.
*   **Build Tool:** Vite for a fast development experience and optimized builds.
*   **Styling:** Tailwind CSS for all UI styling, providing a utility-first approach.
*   **AI Image Enhancement:** Google AI (Gemini 2.5 Flash Image model) via the `@google/genai` library.
*   **360° Video Generation:** FAL.ai API for creating rotating product videos.
*   **State Management:** React's built-in `useState` and `useEffect` hooks for local component state.
*   **Icons:** Custom SVG icons defined in `components/Icons.tsx` for a lightweight and consistent icon set.
*   **Optional Backend/Database:** Supabase for potential data storage and serverless functions (Edge Functions).
*   **API Interaction:** Standard `fetch` API for external service calls.

## Library Usage Rules

*   **React & TypeScript:** Always use React for UI components and TypeScript for type safety. New components should be created in their own files within `src/components/` or `src/pages/`.
*   **Tailwind CSS:** All styling must be done using Tailwind CSS utility classes. Avoid custom CSS files or other styling libraries.
*   **Google AI (`@google/genai`):** This library is dedicated to interacting with Google's AI models for tasks like image enhancement.
*   **FAL.ai (Direct API Calls):** The FAL.ai service is used for 360° video generation. Interactions should be handled via direct `fetch` requests as demonstrated in `services/falService.ts`.
*   **Supabase (`@supabase/supabase-js`):** If Supabase integration is enabled, use the `@supabase/supabase-js` client library for all database, authentication, and storage interactions.
*   **Icons (`components/Icons.tsx`):** Utilize the custom SVG icons provided in `src/components/Icons.tsx`. Do not introduce new icon libraries unless explicitly approved.
*   **No External UI Libraries (unless specified):** Prioritize building components with Tailwind CSS and React. Avoid adding heavy UI component libraries unless a specific need arises and is approved.
Create a development guide for a small web app called Pocket Queue.
The reader has used React before and needs code examples for the data types and persistence logic.

What we know:

- Use React 19, Vite 7, and TypeScript in strict mode.
- It is a local-only, single-page task board with no server, authentication, or synchronization.
- The columns are `backlog`, `doing`, and `done`.
- A task has `id`, `title`, `status`, `createdAt`, and `updatedAt`. The ID is a UUID, and the title is 1–80 characters.
- Users can add a task, edit its title, move it between columns, delete it, and filter by column.
- Moving tasks must be keyboard accessible and not depend only on dragging.
- Persist state in localStorage under `pocket-queue:v1`. Save after state changes and load at startup.
- If stored data is invalid JSON or does not have the required shape, start with an empty board and show an in-app warning. Do not overwrite the invalid value until the user next changes state.
- Centralize state updates in a reducer. Put localStorage access and validation in a separate module.
- Do not use an external drag-and-drop library.
- Use Vitest and React Testing Library to test the reducer, stored-data validation, and user flows for adding and moving a task.
- No other features are in scope for this version.


# Pocket Queue development guide

Pocket Queue is a local-only React task board. Keep the persisted model small, keep all task changes in one reducer, and treat browser storage as an unreliable boundary that must be validated before use.

Use React 19, Vite 7, and TypeScript strict mode:

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "strict": true
  }
}
```

The three columns are fixed. The only persisted UI preference is the active filter.

```ts
// src/types.ts
export const STATUSES = ["backlog", "doing", "done"] as const;

export type TaskStatus = (typeof STATUSES)[number];
export type TaskFilter = TaskStatus | "all";

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StoredBoard {
  tasks: Task[];
  filter: TaskFilter;
}

export interface BoardState extends StoredBoard {
  warning: string | null;
  hasLocalChanges: boolean;
}

export const emptyBoard = (): StoredBoard => ({
  tasks: [],
  filter: "all",
});

export function isValidTitle(value: string): boolean {
  const length = Array.from(value.trim()).length;
  return length >= 1 && length <= 80;
}

export function createTask(title: string): Task {
  const normalizedTitle = title.trim();

  if (!isValidTitle(normalizedTitle)) {
    throw new Error("A task title must contain 1–80 characters.");
  }

  const now = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    title: normalizedTitle,
    status: "backlog",
    createdAt: now,
    updatedAt: now,
  };
}
```

## Validate storage before loading it

Use a dedicated storage module. The persisted format is an object with `tasks` and `filter`; `warning` and `hasLocalChanges` are runtime-only state.

```ts
// src/storage.ts
import {
  emptyBoard,
  isValidTitle,
  STATUSES,
  type StoredBoard,
  type Task,
  type TaskFilter,
  type TaskStatus,
} from "./types";

export const STORAGE_KEY = "pocket-queue:v1";

export type LoadResult = {
  board: StoredBoard;
  warning: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStatus(value: unknown): value is TaskStatus {
  return typeof value === "string" &&
    (STATUSES as readonly string[]).includes(value);
}

function isFilter(value: unknown): value is TaskFilter {
  return value === "all" || isStatus(value);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function isTask(value: unknown): value is Task {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    UUID_PATTERN.test(value.id) &&
    typeof value.title === "string" &&
    isValidTitle(value.title) &&
    isStatus(value.status) &&
    isTimestamp(value.createdAt) &&
    isTimestamp(value.updatedAt)
  );
}

export function isStoredBoard(value: unknown): value is StoredBoard {
  return (
    isRecord(value) &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isTask) &&
    isFilter(value.filter)
  );
}

export function loadBoard(): LoadResult {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw === null) {
    return { board: emptyBoard(), warning: null };
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (isStoredBoard(parsed)) {
      return { board: parsed, warning: null };
    }
  } catch {
    // The same recovery applies to malformed JSON and invalid data.
  }

  return {
    board: emptyBoard(),
    warning:
      "Saved Pocket Queue data could not be loaded. Starting with an empty board.",
  };
}

export function saveBoard(board: StoredBoard): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
}
```

Do not call `saveBoard` during initial loading. If a value is malformed, `loadBoard` returns an empty board and a warning, but leaves the invalid localStorage value untouched. The first user change replaces it with valid data.

## Centralize changes in a reducer

Keep date creation and UUID generation outside the reducer so reducer tests remain deterministic.

```ts
// src/boardReducer.ts
import { isValidTitle, type BoardState, type Task, type TaskFilter, type TaskStatus } from "./types";

export type BoardAction =
  | { type: "add"; task: Task }
  | { type: "editTitle"; id: string; title: string; updatedAt: string }
  | { type: "move"; id: string; status: TaskStatus; updatedAt: string }
  | { type: "delete"; id: string }
  | { type: "setFilter"; filter: TaskFilter };

function changed(state: BoardState, tasks = state.tasks): BoardState {
  return {
    ...state,
    tasks,
    warning: null,
    hasLocalChanges: true,
  };
}

export function boardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  switch (action.type) {
    case "add":
      return changed(state, [...state.tasks, action.task]);

    case "editTitle": {
      const title = action.title.trim();

      if (!isValidTitle(title)) return state;

      return changed(
        state,
        state.tasks.map((task) =>
          task.id === action.id
            ? { ...task, title, updatedAt: action.updatedAt }
            : task,
        ),
      );
    }

    case "move":
      return changed(
        state,
        state.tasks.map((task) =>
          task.id === action.id && task.status !== action.status
            ? { ...task, status: action.status, updatedAt: action.updatedAt }
            : task,
        ),
      );

    case "delete":
      return changed(state, state.tasks.filter((task) => task.id !== action.id));

    case "setFilter":
      return action.filter === state.filter
        ? state
        : {
            ...state,
            filter: action.filter,
            warning: null,
            hasLocalChanges: true,
          };
  }
}
```

Initialize the reducer from storage and persist only after a user-triggered state change.

```tsx
// src/App.tsx
import { useEffect, useReducer } from "react";
import { boardReducer } from "./boardReducer";
import { loadBoard, saveBoard } from "./storage";

export function App() {
  const [state, dispatch] = useReducer(boardReducer, undefined, () => {
    const { board, warning } = loadBoard();

    return {
      ...board,
      warning,
      hasLocalChanges: false,
    };
  });

  useEffect(() => {
    if (!state.hasLocalChanges) return;

    saveBoard({
      tasks: state.tasks,
      filter: state.filter,
    });
  }, [state.tasks, state.filter, state.hasLocalChanges]);

  return (
    <>
      {state.warning && (
        <p role="alert">{state.warning}</p>
      )}

      {/* Add form, filter, and columns use state and dispatch. */}
    </>
  );
}
```

## Build the task interactions

The add form should validate the title before dispatching.

```tsx
function AddTaskForm({
  onAdd,
}: {
  onAdd: (title: string) => void;
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const title = new FormData(form).get("title");

        if (typeof title === "string" && isValidTitle(title)) {
          onAdd(title);
          form.reset();
        }
      }}
    >
      <label>
        New task
        <input
          name="title"
          minLength={1}
          maxLength={80}
          required
        />
      </label>
      <button type="submit">Add task</button>
    </form>
  );
}
```

Render the selected column or all columns from the filter:

```tsx
const visibleStatuses =
  state.filter === "all" ? STATUSES : [state.filter];

<select
  aria-label="Filter tasks by column"
  value={state.filter}
  onChange={(event) =>
    dispatch({
      type: "setFilter",
      filter: event.target.value as TaskFilter,
    })
  }
>
  <option value="all">All columns</option>
  <option value="backlog">Backlog</option>
  <option value="doing">Doing</option>
  <option value="done">Done</option>
</select>
```

Dragging is not required. Give every task explicit move buttons so keyboard users can Tab to the control and activate it with Enter or Space.

```tsx
// src/TaskCard.tsx
import { STATUSES, type Task, type TaskStatus } from "./types";

export function TaskCard({
  task,
  onMove,
}: {
  task: Task;
  onMove: (id: string, status: TaskStatus) => void;
}) {
  return (
    <article aria-label={`Task: ${task.title}`}>
      <p>{task.title}</p>

      {STATUSES.filter((status) => status !== task.status).map((status) => (
        <button
          key={status}
          type="button"
          onClick={() => onMove(task.id, status)}
        >
          Move to {status}
        </button>
      ))}
    </article>
  );
}
```

Dispatch movement with a timestamp at the event boundary:

```tsx
<TaskCard
  task={task}
  onMove={(id, status) =>
    dispatch({
      type: "move",
      id,
      status,
      updatedAt: new Date().toISOString(),
    })
  }
/>
```

Use the same approach for title editing. Render an input with `minLength`, `maxLength`, and a visible validation message; dispatch `editTitle` only when `isValidTitle` succeeds. Deleting dispatches `{ type: "delete", id }`.

## Test the contract

Install the test tools:

```sh
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Configure Vitest:

```ts
// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

```ts
// src/test/setup.ts
import "@testing-library/jest-dom/vitest";
```

Test reducer transitions with fixed timestamps.

```ts
// src/boardReducer.test.ts
import { describe, expect, it } from "vitest";
import { boardReducer } from "./boardReducer";
import type { BoardState, Task } from "./types";

const task: Task = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  title: "Write guide",
  status: "backlog",
  createdAt: "2026-07-12T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
};

const state: BoardState = {
  tasks: [task],
  filter: "all",
  warning: null,
  hasLocalChanges: false,
};

describe("boardReducer", () => {
  it("moves a task and updates its timestamp", () => {
    const result = boardReducer(state, {
      type: "move",
      id: task.id,
      status: "doing",
      updatedAt: "2026-07-12T01:00:00.000Z",
    });

    expect(result.tasks[0]).toMatchObject({
      status: "doing",
      updatedAt: "2026-07-12T01:00:00.000Z",
    });
    expect(result.hasLocalChanges).toBe(true);
  });
});
```

Test invalid stored data without relying on the UI.

```ts
// src/storage.test.ts
import { beforeEach, describe, expect, it } from "vitest";
import { loadBoard, STORAGE_KEY } from "./storage";

describe("loadBoard", () => {
  beforeEach(() => localStorage.clear());

  it("starts empty and warns when JSON is malformed", () => {
    localStorage.setItem(STORAGE_KEY, "{not valid JSON");

    const result = loadBoard();

    expect(result.board.tasks).toEqual([]);
    expect(result.warning).toMatch(/could not be loaded/i);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{not valid JSON");
  });

  it("rejects valid JSON with an invalid board shape", () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tasks: "nope" }));

    expect(loadBoard().warning).not.toBeNull();
  });
});
```

Finally, render the real board in a React Testing Library test. Add a task through its form, move it with its button, and assert that it appears in the destination column. This confirms the keyboard-accessible control path rather than any drag behavior.

```tsx
// src/App.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import { App } from "./App";

beforeEach(() => localStorage.clear());

it("adds a task and moves it to Doing", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.type(screen.getByLabelText(/new task/i), "Ship Pocket Queue");
  await user.click(screen.getByRole("button", { name: /add task/i }));

  await user.click(
    screen.getByRole("button", { name: /move to doing/i }),
  );

  expect(
    screen.getByRole("heading", { name: /doing/i }),
  ).toHaveTextContent("Ship Pocket Queue");
});
```

Keep this version limited to the specified board behavior: no server calls, accounts, syncing, external drag-and-drop packages, sorting, labels, or additional task fields.
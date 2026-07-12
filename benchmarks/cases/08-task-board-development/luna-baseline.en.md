I couldn’t save the guide because this workspace is read-only. I prepared the guide content, covering:

- React 19 + Vite 7 + strict TypeScript setup
- `Task`, `Column`, and reducer action types
- Pure reducer-based updates
- Versioned `localStorage` persistence under `pocket-queue:v1`
- Runtime validation for malformed JSON and invalid shapes
- Startup warnings without overwriting invalid storage
- Keyboard-accessible movement using native `<select>`
- Vitest and React Testing Library tests for reducer, persistence, adding, and moving tasks

The recommended persistence flow is:

```ts
type AppState = {
  tasks: Task[];
  filter: Column | 'all';
  warning: string | null;
  needsPersist: boolean;
};

function initializeState(): AppState {
  const result = loadBoard(window.localStorage);

  return {
    tasks: result.tasks,
    filter: 'all',
    warning: result.warning,
    needsPersist: false,
  };
}

const [state, dispatch] = useReducer(
  boardReducer,
  undefined,
  initializeState,
);

useEffect(() => {
  if (!state.needsPersist) return;
  saveBoard(state.tasks, window.localStorage);
}, [state.needsPersist, state.tasks]);
```

Invalid storage is read-only during initialization:

```ts
export function loadBoard(storage: Storage): LoadResult {
  const raw = storage.getItem('pocket-queue:v1');

  if (raw === null) return { tasks: [], warning: null };

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isStoredBoard(parsed)) {
      return {
        tasks: [],
        warning: 'Saved Pocket Queue data is invalid.',
      };
    }

    return { tasks: parsed.tasks, warning: null };
  } catch {
    return {
      tasks: [],
      warning: 'Saved Pocket Queue data could not be read.',
    };
  }
}
```

Task movement should use a native control rather than depend on dragging:

```tsx
<label>
  Move {task.title}
  <select
    value={task.status}
    aria-label={`Move ${task.title}`}
    onChange={(event) => {
      const status = event.target.value;

      if (isColumn(status)) {
        dispatch({
          type: 'task/move',
          taskId: task.id,
          status,
          updatedAt: new Date().toISOString(),
        });
      }
    }}
  >
    <option value="backlog">backlog</option>
    <option value="doing">doing</option>
    <option value="done">done</option>
  </select>
</label>
```

I also applied the React performance guidance by using lazy reducer initialization, keeping persistence isolated, and avoiding unnecessary persistence when only the filter changes.
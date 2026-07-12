# Pocket Queue 開発ガイド

React 19、Vite 7、TypeScript strict を前提にした、端末内完結型の1画面タスクボードです。

基本方針は次のとおりです。

```text
ユーザー操作
  ↓ dispatch(action)
reducer
  ↓ 新しいBoardState
React UI
  ↓ 状態変更後のみ
localStorage保存
```

`useReducer` の reducer は純粋関数にし、日時やUUIDはイベント側で生成します。React公式でも reducer は純粋であることが求められています。  
[React useReducer公式](https://react.dev/reference/react/useReducer)

## 推奨ファイル構成

```text
src/
  domain/
    task.ts
    boardReducer.ts
  storage/
    boardStorage.ts
  components/
    TaskComposer.tsx
    TaskCard.tsx
    BoardColumn.tsx
  App.tsx
  main.tsx
  test/
    setup.ts
    boardReducer.test.ts
    boardStorage.test.ts
    App.test.tsx
vitest.config.ts
```

- `domain`: タスクの型と状態更新
- `storage`: localStorage、JSON、検証
- `components`: 表示とユーザー操作
- `App`: reducerと画面状態の接続
- フィルター状態は保存せず、画面状態として管理する

## データ型

`src/domain/task.ts`

```ts
export const TASK_STATUSES = ["backlog", "doing", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export type Task = Readonly<{
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}>;

export type BoardState = Readonly<{
  tasks: readonly Task[];
}>;

export const EMPTY_BOARD: BoardState = {
  tasks: [],
};

export function normalizeTitle(input: string): string | null {
  const title = input.trim();
  const length = [...title].length;

  if (length < 1 || length > 80) {
    return null;
  }

  return title;
}

export function isValidTitle(value: unknown): value is string {
  return (
    typeof value === "string" &&
    normalizeTitle(value) === value
  );
}
```

`[...title].length` を使うことで、絵文字などのUnicodeコードポイントを1文字として数えます。

## reducer

`src/domain/boardReducer.ts`

```ts
import {
  BoardState,
  normalizeTitle,
  Task,
  TaskStatus,
} from "./task";

export type BoardAction =
  | {
      type: "task/added";
      id: string;
      title: string;
      now: string;
    }
  | {
      type: "task/renamed";
      id: string;
      title: string;
      now: string;
    }
  | {
      type: "task/moved";
      id: string;
      status: TaskStatus;
      now: string;
    }
  | {
      type: "task/deleted";
      id: string;
    };

function updateTask(
  state: BoardState,
  id: string,
  update: (task: Task) => Task,
): BoardState {
  let changed = false;

  const tasks = state.tasks.map((task) => {
    if (task.id !== id) {
      return task;
    }

    const nextTask = update(task);

    if (nextTask !== task) {
      changed = true;
    }

    return nextTask;
  });

  return changed ? { tasks } : state;
}

export function boardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  switch (action.type) {
    case "task/added": {
      const title = normalizeTitle(action.title);

      if (
        title === null ||
        state.tasks.some((task) => task.id === action.id)
      ) {
        return state;
      }

      const task: Task = {
        id: action.id,
        title,
        status: "backlog",
        createdAt: action.now,
        updatedAt: action.now,
      };

      return {
        tasks: [...state.tasks, task],
      };
    }

    case "task/renamed": {
      const title = normalizeTitle(action.title);

      if (title === null) {
        return state;
      }

      return updateTask(state, action.id, (task) => {
        if (task.title === title) {
          return task;
        }

        return {
          ...task,
          title,
          updatedAt: action.now,
        };
      });
    }

    case "task/moved":
      return updateTask(state, action.id, (task) => {
        if (task.status === action.status) {
          return task;
        }

        return {
          ...task,
          status: action.status,
          updatedAt: action.now,
        };
      });

    case "task/deleted": {
      const tasks = state.tasks.filter(
        (task) => task.id !== action.id,
      );

      return tasks.length === state.tasks.length
        ? state
        : { tasks };
    }

    default:
      return assertNever(action);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unknown action: ${JSON.stringify(value)}`);
}
```

日時をreducer内部で生成しないことが重要です。テスト時に時刻を固定でき、reducerの純粋性も保てます。

## localStorageの読み書きと検証

保存形式は次のようにします。

```json
{
  "version": 1,
  "tasks": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "仕様を書く",
      "status": "backlog",
      "createdAt": "2026-07-12T00:00:00.000Z",
      "updatedAt": "2026-07-12T00:00:00.000Z"
    }
  ]
}
```

`src/storage/boardStorage.ts`

```ts
import {
  BoardState,
  EMPTY_BOARD,
  isValidTitle,
  TASK_STATUSES,
  Task,
} from "../domain/task";

export const STORAGE_KEY = "pocket-queue:v1";

type ReadStorage = Pick<Storage, "getItem">;
type WriteStorage = Pick<Storage, "setItem">;

type PersistedBoard = {
  version: 1;
  tasks: Task[];
};

export type LoadResult = {
  board: BoardState;
  warning: boolean;
};

export type SaveResult =
  | { ok: true }
  | { ok: false; reason: "storage-unavailable" };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTaskStatus(value: unknown): value is Task["status"] {
  return (
    typeof value === "string" &&
    (TASK_STATUSES as readonly string[]).includes(value)
  );
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

function isIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const date = new Date(value);

  return (
    Number.isFinite(date.getTime()) &&
    date.toISOString() === value
  );
}

function isTask(value: unknown): value is Task {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isUuid(value.id) &&
    isValidTitle(value.title) &&
    isTaskStatus(value.status) &&
    isIsoTimestamp(value.createdAt) &&
    isIsoTimestamp(value.updatedAt)
  );
}

function isPersistedBoard(
  value: unknown,
): value is PersistedBoard {
  if (
    !isRecord(value) ||
    value.version !== 1 ||
    !Array.isArray(value.tasks)
  ) {
    return false;
  }

  const ids = new Set<string>();

  return value.tasks.every((task) => {
    if (!isTask(task) || ids.has(task.id)) {
      return false;
    }

    ids.add(task.id);
    return true;
  });
}

export function loadBoard(
  storage: ReadStorage = window.localStorage,
): LoadResult {
  try {
    const raw = storage.getItem(STORAGE_KEY);

    if (raw === null) {
      return {
        board: EMPTY_BOARD,
        warning: false,
      };
    }

    const parsed: unknown = JSON.parse(raw);

    if (!isPersistedBoard(parsed)) {
      return {
        board: EMPTY_BOARD,
        warning: true,
      };
    }

    return {
      board: {
        tasks: parsed.tasks,
      },
      warning: false,
    };
  } catch {
    return {
      board: EMPTY_BOARD,
      warning: true,
    };
  }
}

export function saveBoard(
  board: BoardState,
  storage: WriteStorage = window.localStorage,
): SaveResult {
  const payload: PersistedBoard = {
    version: 1,
    tasks: [...board.tasks],
  };

  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(payload));

    return { ok: true };
  } catch {
    return {
      ok: false,
      reason: "storage-unavailable",
    };
  }
}
```

`localStorage`の読み書きは、プライベートブラウジングや容量超過などで例外になる可能性があるため、必ず `try/catch` で囲みます。

壊れた値を読み込んだときに、起動直後の保存処理で即座に上書きしないよう注意してください。

## Appでの接続

```tsx
import {
  FormEvent,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  boardReducer,
} from "./domain/boardReducer";
import {
  normalizeTitle,
  TASK_STATUSES,
  TaskStatus,
} from "./domain/task";
import {
  loadBoard,
  saveBoard,
} from "./storage/boardStorage";

type Filter = "all" | TaskStatus;

export function App() {
  const [loaded] = useState(() => loadBoard());

  const [board, dispatch] = useReducer(
    boardReducer,
    loaded.board,
  );

  const initialBoardRef = useRef(loaded.board);

  const [filter, setFilter] = useState<Filter>("all");
  const [draftTitle, setDraftTitle] = useState("");
  const [notice, setNotice] = useState<string | null>(
    loaded.warning
      ? "保存データが壊れていたため、空のボードを表示しています。"
      : null,
  );

  useEffect(() => {
    // 初回読み込み時は保存しない。
    // これにより、壊れた値を次の変更まで保持できる。
    if (board === initialBoardRef.current) {
      return;
    }

    const result = saveBoard(board);

    setNotice(
      result.ok
        ? null
        : "保存できませんでした。ブラウザの保存領域を確認してください。",
    );
  }, [board]);

  function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (normalizeTitle(draftTitle) === null) {
      setNotice("タイトルは1〜80文字で入力してください。");
      return;
    }

    const now = new Date().toISOString();

    dispatch({
      type: "task/added",
      id: crypto.randomUUID(),
      title: draftTitle,
      now,
    });

    setDraftTitle("");
  }

  const visibleTasks =
    filter === "all"
      ? board.tasks
      : board.tasks.filter((task) => task.status === filter);

  return (
    <main>
      <h1>Pocket Queue</h1>

      {notice !== null && (
        <p role="alert">{notice}</p>
      )}

      <form onSubmit={handleAdd}>
        <label htmlFor="new-task">タスク</label>
        <input
          id="new-task"
          value={draftTitle}
          maxLength={80}
          onChange={(event) => setDraftTitle(event.target.value)}
        />
        <button type="submit">タスクを追加</button>
      </form>

      <label htmlFor="filter">表示する列</label>
      <select
        id="filter"
        value={filter}
        onChange={(event) =>
          setFilter(event.target.value as Filter)
        }
      >
        <option value="all">すべて</option>
        {TASK_STATUSES.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>

      {/* visibleTasksを列ごとに表示する */}
    </main>
  );
}
```

`useState(() => loadBoard())` によって、初期読み込み時だけlocalStorageを読みます。ReactのStrict Modeでは開発中に初期化処理が複数回呼ばれる場合があるため、初期化処理自体も副作用を持たせない設計にします。

## 列移動とアクセシビリティ

ドラッグ操作は補助機能にし、キーボード操作用に列選択UIを必ず用意します。

```tsx
<select
  aria-label={`「${task.title}」の列`}
  value={task.status}
  onChange={(event) => {
    dispatch({
      type: "task/moved",
      id: task.id,
      status: event.target.value as TaskStatus,
      now: new Date().toISOString(),
    });
  }}
>
  <option value="backlog">backlog</option>
  <option value="doing">doing</option>
  <option value="done">done</option>
</select>
```

ドラッグ＆ドロップはブラウザ標準APIだけで実装します。

```tsx
<article
  draggable
  onDragStart={(event) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", task.id);
  }}
>
  {task.title}
</article>
```

列側では、ドロップ可能にするため `onDragOver` で `preventDefault()` を呼びます。

```tsx
<section
  onDragOver={(event) => event.preventDefault()}
  onDrop={(event) => {
    event.preventDefault();

    const id = event.dataTransfer.getData("text/plain");

    dispatch({
      type: "task/moved",
      id,
      status,
      now: new Date().toISOString(),
    });
  }}
>
  ...
</section>
```

## Vitest設定

VitestはViteの設定や変換処理を共有できます。DOMテストには `jsdom` を使います。  
[Vitest公式](https://vitest.dev/guide/features)  
[React Testing Library公式](https://testing-library.com/docs/react-testing-library/intro/)

```bash
npm install -D vitest jsdom \
  @testing-library/react \
  @testing-library/dom \
  @testing-library/jest-dom \
  @testing-library/user-event
```

`vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.ts",
  },
});
```

`src/test/setup.ts`

```ts
import "@testing-library/jest-dom/vitest";
```

## reducerのテスト

```ts
import { describe, expect, it } from "vitest";
import { boardReducer } from "../domain/boardReducer";
import { BoardState } from "../domain/task";

const initialState: BoardState = {
  tasks: [],
};

describe("boardReducer", () => {
  it("タスクを追加できる", () => {
    const next = boardReducer(initialState, {
      type: "task/added",
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: "仕様を書く",
      now: "2026-07-12T00:00:00.000Z",
    });

    expect(next.tasks).toHaveLength(1);
    expect(next.tasks[0]).toMatchObject({
      title: "仕様を書く",
      status: "backlog",
      createdAt: "2026-07-12T00:00:00.000Z",
    });
  });

  it("列を移動するとupdatedAtを更新する", () => {
    const state: BoardState = {
      tasks: [
        {
          id: "550e8400-e29b-41d4-a716-446655440000",
          title: "仕様を書く",
          status: "backlog",
          createdAt: "2026-07-12T00:00:00.000Z",
          updatedAt: "2026-07-12T00:00:00.000Z",
        },
      ],
    };

    const next = boardReducer(state, {
      type: "task/moved",
      id: state.tasks[0].id,
      status: "doing",
      now: "2026-07-12T01:00:00.000Z",
    });

    expect(next.tasks[0].status).toBe("doing");
    expect(next.tasks[0].updatedAt).toBe(
      "2026-07-12T01:00:00.000Z",
    );
  });

  it("空タイトルは追加しない", () => {
    const next = boardReducer(initialState, {
      type: "task/added",
      id: "550e8400-e29b-41d4-a716-446655440000",
      title: " ",
      now: "2026-07-12T00:00:00.000Z",
    });

    expect(next).toBe(initialState);
  });
});
```

## 保存データ検証のテスト

```ts
import { beforeEach, describe, expect, it } from "vitest";
import {
  loadBoard,
  STORAGE_KEY,
} from "../storage/boardStorage";

describe("loadBoard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("JSONが壊れていれば空のボードと警告を返す", () => {
    localStorage.setItem(STORAGE_KEY, "{broken");

    expect(loadBoard(localStorage)).toEqual({
      board: { tasks: [] },
      warning: true,
    });
  });

  it("必要な形を満たさなければ警告を返す", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 1,
        tasks: [{ title: "" }],
      }),
    );

    expect(loadBoard(localStorage).warning).toBe(true);
    expect(loadBoard(localStorage).board.tasks).toHaveLength(0);
  });

  it("未保存なら警告なしの空ボードを返す", () => {
    expect(loadBoard(localStorage)).toEqual({
      board: { tasks: [] },
      warning: false,
    });
  });
});
```

## 利用者操作のテスト

```tsx
import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { App } from "../App";
import { STORAGE_KEY } from "../storage/boardStorage";

describe("Pocket Queue", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("利用者がタスクを追加できる", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(
      screen.getByLabelText("タスク"),
      "買い物をする",
    );
    await user.click(
      screen.getByRole("button", { name: "タスクを追加" }),
    );

    expect(
      screen.getByText("買い物をする"),
    ).toBeInTheDocument();

    await waitFor(() => {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "{}",
      );

      expect(saved.tasks[0].title).toBe("買い物をする");
    });
  });

  it("キーボード相当の操作で列を移動できる", async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(
      screen.getByLabelText("タスク"),
      "記事を書く",
    );
    await user.click(
      screen.getByRole("button", { name: "タスクを追加" }),
    );

    const statusSelect = screen.getByRole("combobox", {
      name: "「記事を書く」の列",
    });

    await user.selectOptions(statusSelect, "doing");

    expect(statusSelect).toHaveValue("doing");

    await waitFor(() => {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) ?? "{}",
      );

      expect(saved.tasks[0].status).toBe("doing");
    });
  });
});
```

なお、Vitestはテストコードを自動的に型チェックするものではないため、CIでは次も実行します。

```bash
npm run test
npx tsc --noEmit
npm run build
```

## 受け入れ条件

- タスク追加時、タイトルをtrimし、1〜80文字以外を拒否する
- UUIDは `crypto.randomUUID()` で生成する
- `createdAt` は追加時から変更しない
- タイトル編集、列移動では `updatedAt` を更新する
- 同じ列への移動では状態を変更しない
- 削除後も保存される
- フィルター変更だけでは保存しない
- 壊れたJSONや不正な形は空ボードに戻す
- 壊れた保存値を起動直後に上書きしない
- 次の状態変更後に正常なJSONで上書きする
- ドラッグなしでも列を移動できる
- `role="alert"` で保存データ異常を通知する
- reducer、保存データ検証、追加、列移動のテストがある

今回は、サーバー連携、認証、同期、通知機能、並び替え、複数画面、外部D&Dライブラリは対象外とします。
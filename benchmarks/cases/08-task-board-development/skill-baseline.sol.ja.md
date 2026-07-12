# Pocket Queue 開発ガイド

Pocket Queueは、端末内だけで完結する1画面のタスクボードです。タスクの状態はReactのreducerで管理し、永続化と保存データの検証は別モジュールに分離します。

対象範囲は、タスクの追加、タイトル編集、列移動、削除、列による絞り込みです。サーバー、認証、端末間同期などは実装しません。

## 構成

React 19、Vite 7、TypeScriptのstrictモードを使い、次のように責務を分けます。

```text
src/
├─ App.tsx
├─ domain/
│  ├─ task.ts
│  └─ boardReducer.ts
├─ storage/
│  └─ boardStorage.ts
└─ test/
   └─ setup.ts
```

- `task.ts`: データ型と共通の検証
- `boardReducer.ts`: タスクと絞り込み状態の更新
- `boardStorage.ts`: localStorageの読み書きと保存形式の検証
- `App.tsx`: 画面表示と利用者操作

`tsconfig`では、少なくとも`strict`を有効にします。

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

## データ型

日時は、`new Date().toISOString()`で生成したISO 8601形式の文字列として扱います。IDは`crypto.randomUUID()`で生成します。

```ts
// src/domain/task.ts
export const TASK_STATUSES = ["backlog", "doing", "done"] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export type TaskFilter = TaskStatus | "all";

export function isValidTitle(title: string): boolean {
  const length = Array.from(title).length;
  return length >= 1 && length <= 80;
}

export function createTask(title: string, now = new Date()): Task {
  if (!isValidTitle(title)) {
    throw new Error("タイトルは1～80文字で入力してください。");
  }

  const timestamp = now.toISOString();

  return {
    id: crypto.randomUUID(),
    title,
    status: "backlog",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}
```

画面では入力値を必要に応じて`trim()`してから`createTask`へ渡します。ただし、文字数の最終判定はHTML属性だけに任せず、`isValidTitle`でも行います。

## reducerによる状態更新

タスクの変更に加えて、列による絞り込みもreducerで管理します。`revision`は、保存対象のタスクが変更されたことを判定するための値です。絞り込みだけを変えた場合は増やしません。

更新時刻をactionに含めると、reducerが純粋になり、テストで時刻を固定できます。

```ts
// src/domain/boardReducer.ts
import type { Task, TaskFilter, TaskStatus } from "./task";
import { isValidTitle } from "./task";

export type BoardState = {
  tasks: Task[];
  filter: TaskFilter;
  revision: number;
  warning: string | null;
};

export type BoardAction =
  | { type: "task/added"; task: Task }
  | { type: "task/titleChanged"; id: string; title: string; updatedAt: string }
  | { type: "task/moved"; id: string; status: TaskStatus; updatedAt: string }
  | { type: "task/deleted"; id: string }
  | { type: "filter/changed"; filter: TaskFilter }
  | { type: "storage/saveFailed"; message: string };

export function createInitialState(
  tasks: Task[],
  warning: string | null,
): BoardState {
  return {
    tasks,
    filter: "all",
    revision: 0,
    warning,
  };
}

export function boardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  switch (action.type) {
    case "task/added":
      return changed(state, [...state.tasks, action.task]);

    case "task/titleChanged": {
      if (!isValidTitle(action.title)) {
        return state;
      }

      let found = false;
      const tasks = state.tasks.map((task) => {
        if (task.id !== action.id || task.title === action.title) {
          return task;
        }

        found = true;
        return {
          ...task,
          title: action.title,
          updatedAt: action.updatedAt,
        };
      });

      return found ? changed(state, tasks) : state;
    }

    case "task/moved": {
      let found = false;
      const tasks = state.tasks.map((task) => {
        if (task.id !== action.id || task.status === action.status) {
          return task;
        }

        found = true;
        return {
          ...task,
          status: action.status,
          updatedAt: action.updatedAt,
        };
      });

      return found ? changed(state, tasks) : state;
    }

    case "task/deleted": {
      const tasks = state.tasks.filter((task) => task.id !== action.id);
      return tasks.length === state.tasks.length
        ? state
        : changed(state, tasks);
    }

    case "filter/changed":
      return {
        ...state,
        filter: action.filter,
      };

    case "storage/saveFailed":
      return {
        ...state,
        warning: action.message,
      };
  }
}

function changed(state: BoardState, tasks: Task[]): BoardState {
  return {
    ...state,
    tasks,
    revision: state.revision + 1,
    warning: null,
  };
}
```

存在しないタスクへの操作や、同じ列への移動では状態を変えません。これにより、操作のたびに不要な保存が発生するのを防げます。

## 保存形式と検証

localStorageのキーは`pocket-queue:v1`です。保存値は次の形にします。

```json
{
  "tasks": []
}
```

`JSON.parse`の結果は`unknown`として扱い、必要なフィールドを一つずつ検証します。型アサーションだけで保存データを信頼してはいけません。

```ts
// src/storage/boardStorage.ts
import {
  TASK_STATUSES,
  isValidTitle,
  type Task,
  type TaskStatus,
} from "../domain/task";

export const STORAGE_KEY = "pocket-queue:v1";

type StoredBoard = {
  tasks: Task[];
};

export type LoadBoardResult = {
  tasks: Task[];
  warning: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function loadBoard(): LoadBoardResult {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw === null) {
    return {
      tasks: [],
      warning: null,
    };
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!isStoredBoard(parsed)) {
      return invalidDataResult();
    }

    return {
      tasks: parsed.tasks,
      warning: null,
    };
  } catch {
    return invalidDataResult();
  }
}

export function saveBoard(tasks: Task[]): string | null {
  try {
    const value: StoredBoard = { tasks };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    return null;
  } catch {
    return "タスクを端末に保存できませんでした。空き容量やブラウザーの設定を確認してください。";
  }
}

function invalidDataResult(): LoadBoardResult {
  return {
    tasks: [],
    warning:
      "保存されていたデータを読み込めなかったため、空のボードを表示しています。",
  };
}

function isStoredBoard(value: unknown): value is StoredBoard {
  return (
    isRecord(value) &&
    Array.isArray(value.tasks) &&
    value.tasks.every(isTask)
  );
}

function isTask(value: unknown): value is Task {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    UUID_PATTERN.test(value.id) &&
    typeof value.title === "string" &&
    isValidTitle(value.title) &&
    isTaskStatus(value.status) &&
    isIsoDate(value.createdAt) &&
    isIsoDate(value.updatedAt)
  );
}

function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === "string" &&
    TASK_STATUSES.some((status) => status === value)
  );
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
```

JSONが壊れている場合も、JSONとして読めても必要な形を満たさない場合も、`loadBoard`は空のタスク一覧と警告を返します。この時点ではlocalStorageを削除したり、空のデータで上書きしたりしません。

## 起動と保存の接続

起動時の読み込みは`useReducer`の初期化関数で一度だけ行います。タスクが変更されて`revision`が増えた後にだけ保存します。

```tsx
// src/App.tsx
import { useEffect, useReducer } from "react";
import {
  boardReducer,
  createInitialState,
  type BoardState,
} from "./domain/boardReducer";
import { createTask, type TaskStatus } from "./domain/task";
import { loadBoard, saveBoard } from "./storage/boardStorage";

function initializeBoard(): BoardState {
  const loaded = loadBoard();
  return createInitialState(loaded.tasks, loaded.warning);
}

export default function App() {
  const [state, dispatch] = useReducer(
    boardReducer,
    undefined,
    initializeBoard,
  );

  useEffect(() => {
    if (state.revision === 0) {
      return;
    }

    const error = saveBoard(state.tasks);

    if (error !== null) {
      dispatch({
        type: "storage/saveFailed",
        message: error,
      });
    }
  }, [state.revision, state.tasks]);

  function addTask(rawTitle: string) {
    const title = rawTitle.trim();

    try {
      dispatch({
        type: "task/added",
        task: createTask(title),
      });
    } catch {
      // 入力欄の近くに「タイトルは1～80文字」と表示する。
    }
  }

  function changeTitle(id: string, rawTitle: string) {
    dispatch({
      type: "task/titleChanged",
      id,
      title: rawTitle.trim(),
      updatedAt: new Date().toISOString(),
    });
  }

  function moveTask(id: string, status: TaskStatus) {
    dispatch({
      type: "task/moved",
      id,
      status,
      updatedAt: new Date().toISOString(),
    });
  }

  // JSXは後述の画面構成に沿って実装する。
  return <main>{/* ... */}</main>;
}
```

`revision === 0`では保存しないため、壊れた保存データを読み込んだ直後に空のボードで上書きすることはありません。利用者がタスクを追加、編集、移動、削除すると`revision`が増え、その時点で正常なデータが保存されます。

Reactの開発時Strict ModeではEffectが褣数回評価されることがありますが、この判定なら起動直後の上書きを防げます。

## 画面と操作

画面には次の要素を置きます。

- タスク追加フォーム
- `すべて`、`backlog`、`doing`、`done`の絞り込み
- 3列のタスクボード
- 読み込みまたは保存に失敗した場合の警告

タスクカードにはタイトル編集、削除、列移動の操作を用意します。ドラッグ操作を実装する場合も、同じ`task/moved` actionを使います。

外部ライブラリを使わないドラッグ操作には、HTMLのDrag and Drop APIを利用できます。ただし、ドラッグだけを唯一の移動方法にしてはいけません。各カードに、キーボードで操作できる移動用の`select`を置くと、移動先が明確になります。

```tsx
<label>
  移動先
  <select
    aria-label={`${task.title}の移動先`}
    value={task.status}
    onChange={(event) =>
      moveTask(task.id, event.target.value as TaskStatus)
    }
  >
    <option value="backlog">backlog</option>
    <option value="doing">doing</option>
    <option value="done">done</option>
  </select>
</label>
```

ドラッグ時もselect操作時も、最終的には次のactionへ統一します。

```ts
dispatch({
  type: "task/moved",
  id: taskId,
  status: destination,
  updatedAt: new Date().toISOString(),
});
```

絞り込みは表示対象だけを変え、タスクそのものは変更しません。

```ts
const visibleTasks =
  state.filter === "all"
    ? state.tasks
    : state.tasks.filter((task) => task.status === state.filter);
```

警告は画面上で認識できるようにします。

```tsx
{state.warning !== null && (
  <p role="alert">{state.warning}</p>
)}
```

## テスト設定

VitestではDOM環境として`jsdom`を使い、React Testing Libraryの拡張マッチャーを読み込みます。

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

### reducerのテスト

時刻とタスクを固定し、追加と列移動で状態が期待どおり変わることを確認します。

```ts
import { describe, expect, it } from "vitest";
import {
  boardReducer,
  createInitialState,
} from "./boardReducer";
import type { Task } from "./task";

const task: Task = {
  id: "123e4567-e89b-42d3-a456-426614174000",
  title: "最初のタスク",
  status: "backlog",
  createdAt: "2026-07-12T00:00:00.000Z",
  updatedAt: "2026-07-12T00:00:00.000Z",
};

describe("boardReducer", () => {
  it("タスクを追加する", () => {
    const initial = createInitialState([], null);

    const next = boardReducer(initial, {
      type: "task/added",
      task,
    });

    expect(next.tasks).toEqual([task]);
    expect(next.revision).toBe(1);
  });

  it("タスクを別の列へ移動する", () => {
    const initial = createInitialState([task], null);

    const next = boardReducer(initial, {
      type: "task/moved",
      id: task.id,
      status: "doing",
      updatedAt: "2026-07-12T01:00:00.000Z",
    });

    expect(next.tasks[0]).toMatchObject({
      status: "doing",
      updatedAt: "2026-07-12T01:00:00.000Z",
    });
    expect(next.revision).toBe(1);
  });
});
```

### 保存データ検証のテスト

JSONの破損と、必要な形を満たさないデータを分けて確認します。また、読み込み失敗だけでは元の値が上書きされないことも検証します。

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { loadBoard, STORAGE_KEY } from "./boardStorage";

describe("loadBoard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("壊れたJSONでは空のボードと警告を返す", () => {
    localStorage.setItem(STORAGE_KEY, "{broken");

    const result = loadBoard();

    expect(result.tasks).toEqual([]);
    expect(result.warning).not.toBeNull();
    expect(localStorage.getItem(STORAGE_KEY)).toBe("{broken");
  });

  it("必要な形を満たさないデータを拒否する", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        tasks: [
          {
            id: "not-a-uuid",
            title: "",
            status: "waiting",
          },
        ],
      }),
    );

    const result = loadBoard();

    expect(result.tasks).toEqual([]);
    expect(result.warning).not.toBeNull();
  });
});
```

### 利用者操作のテスト

画面の内部構造ではなく、利用者が見つけられるラベルと結果を使ってテストします。

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it } from "vitest";
import App from "./App";

beforeEach(() => {
  localStorage.clear();
});

it("タスクを追加し、キーボード操作でdoingへ移動できる", async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.type(
    screen.getByRole("textbox", { name: "タスク名" }),
    "保存処理を実装する",
  );
  await user.click(
    screen.getByRole("button", { name: "タスクを追加" }),
  );

  expect(
    screen.getByText("保存処理を実装する"),
  ).toBeInTheDocument();

  await user.selectOptions(
    screen.getByRole("combobox", {
      name: "保存処理を実装するの移動先",
    }),
    "doing",
  );

  expect(
    screen.getByRole("combobox", {
      name: "保存処理を実装するの移動先",
    }),
  ).toHaveValue("doing");
});
```

このテストを成立させるため、入力欄、追加ボタン、移動先selectには安定したアクセシブル名を付けます。ドラッグ操作とは別にselect操作をテストすることで、キーボードだけでも主要操作を完了できることを確認できます。

## 完了条件

実装完了時には、次の状態になっている必要があります。

- タスクを追加、編集、移動、削除できる
- `backlog`、`doing`、`done`で表示を絞り込める
- ドラッグを使わなくても列を移動できる
- タスク変更後に`pocket-queue:v1`へ保存される
- 再起動時に正常な保存データを復元できる
- 壊れた保存データでは空のボードと警告を表示する
- 壊れた値は、次のタスク変更まで上書きされない
- reducer、保存データ検証、追加と列移動の利用者操作をテストできる

これらを満たした時点でPocket Queueの対象範囲は完了です。サーバー連携、認証、同期、そのほかの機能は追加しません。
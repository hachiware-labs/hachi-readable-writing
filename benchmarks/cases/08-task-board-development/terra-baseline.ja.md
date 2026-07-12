# Pocket Queue 開発ガイド

Pocket Queue は、ブラウザ内だけで完結する3列のタスクボードです。状態の変更は reducer に集約し、`localStorage` の読み書き・保存データの検証は別モジュールへ分けます。これにより、画面操作と永続化の責務を混ぜずに実装できます。

## 構成

```text
src/
  domain/task.ts
  state/boardReducer.ts
  storage/boardStorage.ts
  App.tsx
  state/boardReducer.test.ts
  storage/boardStorage.test.ts
  App.test.tsx
```

フィルターは表示だけを変えるUI状態なので、タスク配列には保存しません。

## ドメイン型

`src/domain/task.ts`

```ts
export const taskStatuses = ['backlog', 'doing', 'done'] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export type Task = {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
};

export function normalizeTitle(value: string): string {
  return value.trim();
}

export function isValidTitle(value: string): boolean {
  const title = normalizeTitle(value);
  return title.length >= 1 && title.length <= 80;
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' &&
    (taskStatuses as readonly string[]).includes(value);
}
```

タスクを追加する画面側では、タイトルを正規化・検証してから UUID と時刻を付与します。

```ts
const title = normalizeTitle(inputTitle);

if (!isValidTitle(title)) {
  setError('タイトルは1〜80文字で入力してください。');
  return;
}

const now = new Date().toISOString();

commit({
  type: 'task/add',
  task: {
    id: crypto.randomUUID(),
    title,
    status: 'backlog',
    createdAt: now,
    updatedAt: now,
  },
});
```

`crypto.randomUUID()` を使うことで、サーバーなしでもブラウザ側で UUID を生成できます。

## reducer

`src/state/boardReducer.ts`

```ts
import {
  isValidTitle,
  normalizeTitle,
  type Task,
  type TaskStatus,
} from '../domain/task';

export type BoardState = {
  tasks: Task[];
  loadWarning: string | null;
};

export type BoardAction =
  | { type: 'task/add'; task: Task }
  | { type: 'task/rename'; id: string; title: string; at: string }
  | { type: 'task/move'; id: string; status: TaskStatus; at: string }
  | { type: 'task/delete'; id: string };

export function boardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  switch (action.type) {
    case 'task/add':
      return {
        tasks: [...state.tasks, action.task],
        loadWarning: null,
      };

    case 'task/rename': {
      const title = normalizeTitle(action.title);
      if (!isValidTitle(title)) return state;

      return updateTask(state, action.id, (task) => {
        if (task.title === title) return task;
        return { ...task, title, updatedAt: action.at };
      });
    }

    case 'task/move':
      return updateTask(state, action.id, (task) => {
        if (task.status === action.status) return task;
        return { ...task, status: action.status, updatedAt: action.at };
      });

    case 'task/delete': {
      const tasks = state.tasks.filter((task) => task.id !== action.id);
      return tasks.length === state.tasks.length
        ? state
        : { tasks, loadWarning: null };
    }
  }
}

function updateTask(
  state: BoardState,
  id: string,
  update: (task: Task) => Task,
): BoardState {
  let changed = false;

  const tasks = state.tasks.map((task) => {
    if (task.id !== id) return task;

    const next = update(task);
    changed ||= next !== task;
    return next;
  });

  return changed ? { tasks, loadWarning: null } : state;
}
```

reducer は `localStorage` に触れない純粋関数にします。時刻も reducer 内で生成せず、アクションに渡すとテストが安定します。

## 保存と検証

`src/storage/boardStorage.ts`

```ts
import {
  isTaskStatus,
  isValidTitle,
  normalizeTitle,
  type Task,
} from '../domain/task';

export const STORAGE_KEY = 'pocket-queue:v1';

export type LoadBoardResult = {
  tasks: Task[];
  warning: string | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const invalidDataWarning =
  '保存済みのデータを読み込めなかったため、空のボードを表示しています。次の変更で保存内容を置き換えます。';

export function loadBoard(): LoadBoardResult {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (raw === null) {
    return { tasks: [], warning: null };
  }

  try {
    const value: unknown = JSON.parse(raw);

    if (!isTaskArray(value)) {
      return { tasks: [], warning: invalidDataWarning };
    }

    return { tasks: value, warning: null };
  } catch {
    return { tasks: [], warning: invalidDataWarning };
  }
}

export function saveBoard(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function isTaskArray(value: unknown): value is Task[] {
  if (!Array.isArray(value)) return false;

  const ids = new Set<string>();

  return value.every((item) => {
    if (!isTask(item) || ids.has(item.id)) return false;
    ids.add(item.id);
    return true;
  });
}

function isTask(value: unknown): value is Task {
  if (typeof value !== 'object' || value === null) return false;

  const task = value as Record<string, unknown>;

  return (
    typeof task.id === 'string' &&
    UUID_PATTERN.test(task.id) &&
    typeof task.title === 'string' &&
    task.title === normalizeTitle(task.title) &&
    isValidTitle(task.title) &&
    isTaskStatus(task.status) &&
    isIsoDate(task.createdAt) &&
    isIsoDate(task.updatedAt)
  );
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;

  const time = new Date(value).valueOf();
  return !Number.isNaN(time) && new Date(time).toISOString() === value;
}
```

起動時は `loadBoard()` だけを呼び、空配列へ戻った直後には保存しません。したがって壊れた値は残り、利用者が追加・編集・移動・削除を行った時点で初めて正しい値に置き換わります。

## React との接続

保存を `useEffect` で常時監視すると、初回描画でも空配列を保存し、壊れた値をすぐ上書きしてしまいます。ユーザー操作ごとに reducer の次の状態を求めて保存する形にします。

```tsx
import { useCallback, useReducer, useRef } from 'react';
import { boardReducer, type BoardAction, type BoardState } from './state/boardReducer';
import { loadBoard, saveBoard } from './storage/boardStorage';

function initialBoardState(): BoardState {
  const loaded = loadBoard();
  return {
    tasks: loaded.tasks,
    loadWarning: loaded.warning,
  };
}

export default function App() {
  const [state, dispatchReact] = useReducer(
    boardReducer,
    undefined,
    initialBoardState,
  );
  const latestState = useRef(state);

  const commit = useCallback((action: BoardAction) => {
    const previous = latestState.current;
    const next = boardReducer(previous, action);

    if (next === previous) return;

    latestState.current = next;
    dispatchReact(action);
    saveBoard(next.tasks);
  }, []);

  return (
    <>
      {state.loadWarning && (
        <p role="alert">{state.loadWarning}</p>
      )}

      {/* 追加フォーム、フィルター、3列のボード */}
    </>
  );
}
```

`commit` の外で reducer を実行するのは、保存対象となる次の状態を取得するためです。reducer 自体は副作用を持たないため、React 19 の開発時チェックでも安全です。

## 操作UI

各カードには、ドラッグ操作に加えて列移動ボタンを置きます。これでポインタが使えない利用者も操作できます。

```tsx
<button
  type="button"
  onClick={() =>
    commit({
      type: 'task/move',
      id: task.id,
      status: 'doing',
      at: new Date().toISOString(),
    })
  }
  aria-label={`「${task.title}」をdoingへ移動`}
>
  doingへ移動
</button>
```

ドラッグ操作を加える場合は、標準の HTML Drag and Drop API だけで実装できます。ドラッグ開始時にタスクIDを `dataTransfer` へ入れ、列の `onDrop` で同じ `task/move` アクションを発行します。ドラッグは補助的な操作に留め、同じ移動をボタンから必ず実行できるようにします。

フィルターは `selectedStatus: TaskStatus | 'all'` のような画面ローカル状態で持ちます。

```ts
const visibleTasks = state.tasks.filter(
  (task) => selectedStatus === 'all' || task.status === selectedStatus,
);
```

## テスト

Vitest のテスト環境は `jsdom` を使います。Reducer と保存データの検証は画面を介さずに、利用者操作だけ React Testing Library で確認します。

`src/state/boardReducer.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { boardReducer } from './boardReducer';
import type { Task } from '../domain/task';

const task: Task = {
  id: '2d2c1d23-23e0-4dca-a452-cf93c3dd8e91',
  title: '仕様を確認する',
  status: 'backlog',
  createdAt: '2026-07-12T00:00:00.000Z',
  updatedAt: '2026-07-12T00:00:00.000Z',
};

describe('boardReducer', () => {
  it('列を移動すると status と updatedAt を更新する', () => {
    const next = boardReducer(
      { tasks: [task], loadWarning: null },
      {
        type: 'task/move',
        id: task.id,
        status: 'doing',
        at: '2026-07-12T01:00:00.000Z',
      },
    );

    expect(next.tasks[0]).toMatchObject({
      status: 'doing',
      updatedAt: '2026-07-12T01:00:00.000Z',
    });
  });
});
```

`src/storage/boardStorage.test.ts`

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { loadBoard, STORAGE_KEY } from './boardStorage';

describe('loadBoard', () => {
  beforeEach(() => localStorage.clear());

  it('壊れたJSONなら空のボードと警告を返す', () => {
    localStorage.setItem(STORAGE_KEY, '{broken');

    const result = loadBoard();

    expect(result.tasks).toEqual([]);
    expect(result.warning).toBeTruthy();
  });

  it('必要なフィールドが欠けているデータを拒否する', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ id: 'missing-fields' }]),
    );

    expect(loadBoard().warning).toBeTruthy();
  });
});
```

`src/App.test.tsx`

```tsx
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import App from './App';

it('タスクを追加してボタンでdoingへ移動できる', async () => {
  const user = userEvent.setup();
  render(<App />);

  await user.type(
    screen.getByLabelText('新しいタスク'),
    '仕様を確認する',
  );
  await user.click(screen.getByRole('button', { name: '追加' }));

  expect(screen.getByText('仕様を確認する')).toBeInTheDocument();

  await user.click(
    screen.getByRole('button', {
      name: '「仕様を確認する」をdoingへ移動',
    }),
  );

  const doingColumn = screen.getByRole('region', { name: 'doing' });
  expect(
    within(doingColumn).getByText('仕様を確認する'),
  ).toBeInTheDocument();
});
```

この構成なら、保存形式の破損、タイトル制約、列移動、キーボード操作可能な移動を、それぞれ独立して保守できます。
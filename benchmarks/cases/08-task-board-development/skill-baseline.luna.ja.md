# Pocket Queue 開発ガイド

## 1. 目的と対象範囲

Pocket Queueは、端末内だけで動作する1画面のタスクボードです。サーバー、認証、データ同期は実装しません。

タスクは次の3列で管理します。

- `backlog`: 未着手
- `doing`: 対応中
- `done`: 完了

今回実装する機能は、タスクの追加、タイトル編集、列の移動、削除、列による絞り込みです。ドラッグ操作は補助的に利用し、キーボードからも必ず列を移動できるようにします。

保存対象はタスクと現在の絞り込み条件です。保存先は `localStorage` の `pocket-queue:v1` とします。

## 2. ディレクトリ構成

状態管理、保存処理、画面表示を分離します。

```text
src/
├─ domain/
│  └─ task.ts
├─ state/
│  └─ boardReducer.ts
├─ storage/
│  └─ boardStorage.ts
├─ App.tsx
├─ main.tsx
└─ test/
   └─ setup.ts
```

- `domain/task.ts`: タスクと列の型、列の判定
- `state/boardReducer.ts`: 状態変更のルール
- `storage/boardStorage.ts`: `localStorage` の読み書きと保存データの検証
- `App.tsx`: 入力、表示、イベントの接続

## 3. データ型

日時は `Date#toISOString()` で生成したISO 8601形式の文字列として扱います。タイトルの長さは、絵文字などを考慮して `Array.from` で数えます。

```ts
// src/domain/task.ts

export const TASK_STATUSES = ['backlog', 'doing', 'done'] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];
export type TaskFilter = TaskStatus | 'all';

export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BoardState {
  tasks: Task[];
  filter: TaskFilter;
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return (
    typeof value === 'string' &&
    (TASK_STATUSES as readonly string[]).includes(value)
  );
}

export function isTaskFilter(value: unknown): value is TaskFilter {
  return value === 'all' || isTaskStatus(value);
}

export function normalizeTitle(value: string): string | null {
  const title = value.trim();
  const length = Array.from(title).length;

  if (length < 1 || length > 80) {
    return null;
  }

  return title;
}
```

`id` の生成は画面側で行います。

```ts
const task: Task = {
  id: crypto.randomUUID(),
  title: '仕様を確認する',
  status: 'backlog',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
```

## 4. reducerに状態更新を集約する

reducerには副作用を持たせません。UUIDの生成、現在時刻の取得、保存処理は画面や保存モジュール側で行い、reducerには値を渡します。

```ts
// src/state/boardReducer.ts

import type {
  BoardState,
  Task,
  TaskStatus,
  TaskFilter,
} from '../domain/task';
import { normalizeTitle } from '../domain/task';

export type BoardAction =
  | {
      type: 'ADD_TASK';
      task: Task;
    }
  | {
      type: 'EDIT_TITLE';
      id: string;
      title: string;
      updatedAt: string;
    }
  | {
      type: 'MOVE_TASK';
      id: string;
      status: TaskStatus;
      updatedAt: string;
    }
  | {
      type: 'DELETE_TASK';
      id: string;
    }
  | {
      type: 'SET_FILTER';
      filter: TaskFilter;
    };

export const initialBoardState: BoardState = {
  tasks: [],
  filter: 'all',
};

export function boardReducer(
  state: BoardState,
  action: BoardAction,
): BoardState {
  switch (action.type) {
    case 'ADD_TASK': {
      if (
        state.tasks.some((task) => task.id === action.task.id) ||
        normalizeTitle(action.task.title) === null
      ) {
        return state;
      }

      return {
        ...state,
        tasks: [...state.tasks, action.task],
      };
    }

    case 'EDIT_TITLE': {
      const title = normalizeTitle(action.title);

      if (title === null) {
        return state;
      }

      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.id
            ? {
                ...task,
                title,
                updatedAt: action.updatedAt,
              }
            : task,
        ),
      };
    }

    case 'MOVE_TASK': {
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.id && task.status !== action.status
            ? {
                ...task,
                status: action.status,
                updatedAt: action.updatedAt,
              }
            : task,
        ),
      };
    }

    case 'DELETE_TASK': {
      return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.id),
      };
    }

    case 'SET_FILTER': {
      return {
        ...state,
        filter: action.filter,
      };
    }

    default: {
      return state;
    }
  }
}
```

列を移動していない場合は、`updatedAt` を変更しません。これにより、実質的な変更だけが保存対象になります。

## 5. 保存データの形式と検証

`localStorage` には、バージョンを含むオブジェクトを保存します。

```json
{
  "version": 1,
  "filter": "all",
  "tasks": []
}
```

保存データを `unknown` として読み込み、検証を通過した後にだけアプリの状態へ変換します。

```ts
// src/storage/boardStorage.ts

import type {
  BoardState,
  Task,
} from '../domain/task';
import {
  isTaskFilter,
  isTaskStatus,
} from '../domain/task';
import { initialBoardState } from '../state/boardReducer';

export const STORAGE_KEY = 'pocket-queue:v1';

interface PersistedBoardV1 {
  version: 1;
  filter: BoardState['filter'];
  tasks: Task[];
}

export interface LoadBoardResult {
  state: BoardState;
  warning: string | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isIsoDate(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function isValidTitle(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const length = Array.from(value.trim()).length;
  return length >= 1 && length <= 80;
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
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
    isIsoDate(value.createdAt) &&
    isIsoDate(value.updatedAt)
  );
}

export function isPersistedBoard(
  value: unknown,
): value is PersistedBoardV1 {
  if (!isRecord(value) || value.version !== 1) {
    return false;
  }

  if (!isTaskFilter(value.filter) || !Array.isArray(value.tasks)) {
    return false;
  }

  if (!value.tasks.every(isTask)) {
    return false;
  }

  const ids = new Set<string>();

  for (const task of value.tasks) {
    if (ids.has(task.id)) {
      return false;
    }

    ids.add(task.id);
  }

  return true;
}

function emptyBoard(): BoardState {
  return {
    ...initialBoardState,
    tasks: [],
  };
}

export function loadBoard(
  storage: Pick<Storage, 'getItem'> = window.localStorage,
): LoadBoardResult {
  try {
    const raw = storage.getItem(STORAGE_KEY);

    if (raw === null) {
      return {
        state: emptyBoard(),
        warning: null,
      };
    }

    const parsed: unknown = JSON.parse(raw);

    if (!isPersistedBoard(parsed)) {
      return {
        state: emptyBoard(),
        warning:
          '保存データの形式が正しくないため、空のボードを表示しています。',
      };
    }

    return {
      state: {
        tasks: parsed.tasks,
        filter: parsed.filter,
      },
      warning: null,
    };
  } catch {
    return {
      state: emptyBoard(),
      warning:
        '保存データを読み込めないため、空のボードを表示しています。',
    };
  }
}

export function saveBoard(
  state: BoardState,
  storage: Pick<Storage, 'setItem'> = window.localStorage,
): void {
  const data: PersistedBoardV1 = {
    version: 1,
    filter: state.filter,
    tasks: state.tasks,
  };

  storage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function serializeBoard(state: BoardState): string {
  return JSON.stringify({
    version: 1,
    filter: state.filter,
    tasks: state.tasks,
  } satisfies PersistedBoardV1);
}
```

検証では次の条件を確認しています。

- `version` が `1`
- `filter` が `all` または3列のいずれか
- `tasks` が配列
- `id` がUUID
- `title` が1～80文字
- `status` が3列のいずれか
- `createdAt` と `updatedAt` が日時
- タスクのIDが重複していない

JSONの解析または検証に失敗した場合は空のボードを返します。読み込み直後には保存しないため、壊れた値が即座に上書きされることはありません。

## 6. 起動時の読み込みと変更後の保存

React Strict Modeの開発環境でも、初回読み込み直後に保存してしまわないようにします。読み込んだ直後の状態をスナップショットとして保持し、状態が変わったときだけ保存します。

```tsx
// src/App.tsx

import { useEffect, useReducer, useRef, useState } from 'react';
import {
  loadBoard,
  saveBoard,
  serializeBoard,
} from './storage/boardStorage';
import {
  boardReducer,
} from './state/boardReducer';
import type {
  TaskStatus,
} from './domain/task';

export default function App() {
  const [loaded] = useState(() => loadBoard());
  const [state, dispatch] = useReducer(boardReducer, loaded.state);
  const [warning, setWarning] = useState(loaded.warning);

  const initialSnapshot = useRef(serializeBoard(loaded.state));

  useEffect(() => {
    const currentSnapshot = serializeBoard(state);

    if (currentSnapshot === initialSnapshot.current) {
      return;
    }

    try {
      saveBoard(state);
    } catch {
      setWarning(
        'ボードを保存できませんでした。ストレージの空き容量やブラウザ設定を確認してください。',
      );
    }
  }, [state]);

  const moveTask = (id: string, status: TaskStatus) => {
    dispatch({
      type: 'MOVE_TASK',
      id,
      status,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <main>
      {warning !== null && (
        <div role="alert">
          {warning}
          <button type="button" onClick={() => setWarning(null)}>
            閉じる
          </button>
        </div>
      )}

      {/* タスク入力、絞り込み、列、タスクカードを配置する */}
    </main>
  );
}
```

この構成では、次のタイミングで保存されます。

- タスクの追加
- タイトル編集
- 列の移動
- タスクの削除
- 絞り込み条件の変更

警告を閉じるだけでは保存しません。壊れた値は、利用者が次にボードの状態を変更した時点で正常なJSONに置き換えられます。

## 7. タスクの追加と編集

追加時には、タイトルをトリミングしてから検証します。

```tsx
import { useState } from 'react';
import { normalizeTitle } from './domain/task';

function AddTaskForm({
  onAdd,
}: {
  onAdd: (title: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedTitle = normalizeTitle(title);

    if (normalizedTitle === null) {
      setError('タイトルは1～80文字で入力してください。');
      return;
    }

    onAdd(normalizedTitle);
    setTitle('');
    setError(null);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        タスク名
        <input
          aria-label="タスク名"
          value={title}
          maxLength={80}
          onChange={(event) => setTitle(event.currentTarget.value)}
        />
      </label>

      <button type="submit">タスクを追加</button>

      {error !== null && <p role="alert">{error}</p>}
    </form>
  );
}
```

`App` 側ではIDと日時を生成します。

```tsx
<AddTaskForm
  onAdd={(title) => {
    const now = new Date().toISOString();

    dispatch({
      type: 'ADD_TASK',
      task: {
        id: crypto.randomUUID(),
        title,
        status: 'backlog',
        createdAt: now,
        updatedAt: now,
      },
    });
  }}
/>
```

編集用の入力欄は、入力中の値をローカル stateで保持し、確定時に `EDIT_TITLE` をdispatchします。Enterキーで確定、Escapeキーでキャンセルできるようにすると、キーボード操作でも扱いやすくなります。

## 8. 列移動とキーボード操作

ネイティブの `select` をタスクカードに置くと、ドラッグ操作を使わずに列を移動できます。Tabキーでフォーカスし、矢印キーとEnterキーで操作できます。

```tsx
import type {
  Task,
  TaskStatus,
} from './domain/task';
import { isTaskStatus } from './domain/task';
import type { BoardAction } from './state/boardReducer';

function TaskCard({
  task,
  dispatch,
}: {
  task: Task;
  dispatch: React.Dispatch<BoardAction>;
}) {
  return (
    <article draggable>
      <h3>{task.title}</h3>

      <label>
        列
        <select
          aria-label={`${task.title}の列`}
          value={task.status}
          onChange={(event) => {
            const value = event.currentTarget.value;

            if (!isTaskStatus(value)) {
              return;
            }

            dispatch({
              type: 'MOVE_TASK',
              id: task.id,
              status: value,
              updatedAt: new Date().toISOString(),
            });
          }}
        >
          <option value="backlog">未着手</option>
          <option value="doing">対応中</option>
          <option value="done">完了</option>
        </select>
      </label>

      <button
        type="button"
        aria-label={`${task.title}を削除`}
        onClick={() => {
          dispatch({
            type: 'DELETE_TASK',
            id: task.id,
          });
        }}
      >
        削除
      </button>
    </article>
  );
}
```

ドラッグ操作を追加する場合は、ブラウザ標準のHTML Drag and Drop APIだけを使います。

```tsx
function draggableProps(task: Task) {
  return {
    draggable: true,
    onDragStart: (event: React.DragEvent<HTMLElement>) => {
      event.dataTransfer.setData('text/plain', task.id);
      event.dataTransfer.effectAllowed = 'move';
    },
  };
}

function dropProps(
  status: TaskStatus,
  moveTask: (id: string, status: TaskStatus) => void,
) {
  return {
    onDragOver: (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    },
    onDrop: (event: React.DragEvent<HTMLElement>) => {
      event.preventDefault();

      const id = event.dataTransfer.getData('text/plain');

      if (id !== '') {
        moveTask(id, status);
      }
    },
  };
}
```

ドラッグ対象には視覚的なフォーカス表示を用意し、移動先の列には適切な見出しを付けます。`select` による列移動を残すことで、ドラッグに対応していない利用者やキーボード利用者も同じ操作を実行できます。

## 9. 絞り込み

絞り込みは表示用の配列を作って行います。元の `tasks` 配列は変更しません。

```tsx
const visibleTasks =
  state.filter === 'all'
    ? state.tasks
    : state.tasks.filter((task) => task.status === state.filter);
```

列は固定順で描画します。

```tsx
const columns = [
  { status: 'backlog', label: '未着手' },
  { status: 'doing', label: '対応中' },
  { status: 'done', label: '完了' },
] as const;

return (
  <>
    {columns.map((column) => (
      <section key={column.status} aria-labelledby={`${column.status}-heading`}>
        <h2 id={`${column.status}-heading`}>{column.label}</h2>

        {visibleTasks
          .filter((task) => task.status === column.status)
          .map((task) => (
            <TaskCard key={task.id} task={task} dispatch={dispatch} />
          ))}
      </section>
    ))}
  </>
);
```

## 10. テスト設定

Vitestをjsdom環境で動かし、React Testing Libraryのマッチャーを読み込みます。

```ts
// vite.config.ts

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

```ts
// src/test/setup.ts

import '@testing-library/jest-dom/vitest';
```

`package.json` には、少なくとも次のスクリプトを用意します。

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

## 11. reducerのテスト

reducerには固定のIDと日時を渡すため、結果を安定して検証できます。

```ts
// src/state/boardReducer.test.ts

import { describe, expect, it } from 'vitest';
import {
  boardReducer,
  initialBoardState,
} from './boardReducer';

describe('boardReducer', () => {
  it('タスクを追加できる', () => {
    const next = boardReducer(initialBoardState, {
      type: 'ADD_TASK',
      task: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: '仕様を確認する',
        status: 'backlog',
        createdAt: '2026-07-12T00:00:00.000Z',
        updatedAt: '2026-07-12T00:00:00.000Z',
      },
    });

    expect(next.tasks).toHaveLength(1);
    expect(next.tasks[0].title).toBe('仕様を確認する');
    expect(next.tasks[0].status).toBe('backlog');
  });

  it('タスクを別の列へ移動し、updatedAtを更新する', () => {
    const state = {
      tasks: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          title: '仕様を確認する',
          status: 'backlog' as const,
          createdAt: '2026-07-12T00:00:00.000Z',
          updatedAt: '2026-07-12T00:00:00.000Z',
        },
      ],
      filter: 'all' as const,
    };

    const next = boardReducer(state, {
      type: 'MOVE_TASK',
      id: '550e8400-e29b-41d4-a716-446655440000',
      status: 'doing',
      updatedAt: '2026-07-12T01:00:00.000Z',
    });

    expect(next.tasks[0]).toMatchObject({
      status: 'doing',
      updatedAt: '2026-07-12T01:00:00.000Z',
    });
  });
});
```

## 12. 保存データ検証のテスト

JSONの破損と、JSONとしては正しいが必要な形を満たさないケースを分けて確認します。

```ts
// src/storage/boardStorage.test.ts

import { describe, expect, it, vi } from 'vitest';
import {
  isPersistedBoard,
  loadBoard,
} from './boardStorage';

describe('isPersistedBoard', () => {
  it('正しい保存データを受け入れる', () => {
    expect(
      isPersistedBoard({
        version: 1,
        filter: 'all',
        tasks: [],
      }),
    ).toBe(true);
  });

  it('不正なversionを拒否する', () => {
    expect(
      isPersistedBoard({
        version: 2,
        filter: 'all',
        tasks: [],
      }),
    ).toBe(false);
  });

  it('UUIDでないIDを拒否する', () => {
    expect(
      isPersistedBoard({
        version: 1,
        filter: 'all',
        tasks: [
          {
            id: 'invalid',
            title: 'タスク',
            status: 'backlog',
            createdAt: '2026-07-12T00:00:00.000Z',
            updatedAt: '2026-07-12T00:00:00.000Z',
          },
        ],
      }),
    ).toBe(false);
  });
});

describe('loadBoard', () => {
  it('壊れたJSONを空のボードとして読み込む', () => {
    const storage = {
      getItem: vi.fn().mockReturnValue('{'),
    };

    const result = loadBoard(storage);

    expect(result.state.tasks).toEqual([]);
    expect(result.state.filter).toBe('all');
    expect(result.warning).not.toBeNull();
  });
});
```

## 13. 利用者操作のテスト

React Testing Libraryでは、実装の関数ではなく、利用者が見たり操作したりする要素を通して確認します。

```tsx
// src/App.test.tsx

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Pocket Queue', () => {
  beforeEach(() => {
    localStorage.clear();

    vi.stubGlobal('crypto', {
      randomUUID: () => '550e8400-e29b-41d4-a716-446655440000',
    });
  });

  it('タスクを追加し、列をキーボード操作で変更できる', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.type(screen.getByLabelText('タスク名'), '仕様を確認する');
    await user.click(
      screen.getByRole('button', { name: 'タスクを追加' }),
    );

    const columnSelect = screen.getByRole('combobox', {
      name: '仕様を確認するの列',
    });

    await user.selectOptions(columnSelect, 'doing');

    expect(columnSelect).toHaveValue('doing');
    expect(screen.getByText('仕様を確認する')).toBeInTheDocument();
  });
});
```

このテストでは、タスクが追加できることと、ドラッグ操作を使わずに列を変更できることを同時に確認しています。

## 14. 実装時の確認事項

実装完了時には、次の動作を確認します。

- 起動時に `pocket-queue:v1` を読み込める
- 保存キーが存在しない場合は空のボードを表示する
- JSONが壊れている場合は空のボードと警告を表示する
- JSONの形が不正な場合も空のボードと警告を表示する
- 初回表示だけでは不正な保存値を上書きしない
- 次の状態変更時には正常な保存データへ置き換える
- タイトルが空、または81文字以上の場合は追加・編集できない
- タスクのIDがUUIDで生成される
- 列移動時だけ `updatedAt` が更新される
- ドラッグ操作なしでキーボードから列を移動できる
- reducer、保存データ検証、追加と列移動の利用者操作をVitestで確認できる

今回の対象は、端末内の1画面タスクボードとその保存・復元処理までです。サーバー同期、認証、共有、通知、履歴管理、並べ替え、複数画面対応は追加要件として扱います。
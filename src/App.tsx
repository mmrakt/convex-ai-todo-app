'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { Authenticated, Unauthenticated, useConvexAuth } from 'convex/react';
import { useState } from 'react';
import type { Id } from '../convex/_generated/dataModel';
import { Dashboard } from './components/Dashboard';
import { TaskForm } from './components/TaskForm';
import { TaskList } from './components/TaskList';
import { Button } from './components/ui';

type View = 'dashboard' | 'tasks' | 'create' | 'edit';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingTaskId, setEditingTaskId] = useState<Id<'tasks'> | undefined>();

  const handleEditTask = (taskId: Id<'tasks'>) => {
    setEditingTaskId(taskId);
    setCurrentView('edit');
  };

  const handleCreateTask = () => {
    setEditingTaskId(undefined);
    setCurrentView('create');
  };

  const handleTaskSuccess = () => {
    setCurrentView('tasks');
    setEditingTaskId(undefined);
  };

  const handleCancel = () => {
    setCurrentView('dashboard');
    setEditingTaskId(undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">AI Todo アプリ</h1>
              <nav className="hidden md:flex space-x-4">
                <NavButton
                  active={currentView === 'dashboard'}
                  onClick={() => setCurrentView('dashboard')}
                >
                  ダッシュボード
                </NavButton>
                <NavButton active={currentView === 'tasks'} onClick={() => setCurrentView('tasks')}>
                  タスク一覧
                </NavButton>
                <NavButton active={currentView === 'create'} onClick={handleCreateTask}>
                  新規作成
                </NavButton>
              </nav>
            </div>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main>
        <Authenticated>
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'tasks' && (
            <TaskList onEditTask={handleEditTask} onCreateTask={handleCreateTask} />
          )}
          {(currentView === 'create' || currentView === 'edit') && (
            <TaskForm
              taskId={editingTaskId}
              onSuccess={handleTaskSuccess}
              onCancel={handleCancel}
            />
          )}
        </Authenticated>
        <Unauthenticated>
          <SignInForm />
        </Unauthenticated>
      </main>
    </div>
  );
}

interface NavButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function NavButton({ active, onClick, children }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
          : 'text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
      }`}
    >
      {children}
    </button>
  );
}

function SignOutButton() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  return (
    <>
      {isAuthenticated && (
        <Button variant="secondary" size="sm" onClick={() => void signOut()}>
          ログアウト
        </Button>
      )}
    </>
  );
}

function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.target as HTMLFormElement);
      formData.set('flow', flow);
      await signIn('password', formData);
    } catch (error: any) {
      setError(error.message || 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-gray-100">
            AI Todo アプリ
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {flow === 'signIn' ? 'アカウントにサインイン' : '新しいアカウントを作成'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                メールアドレス
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                パスワード
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="パスワード"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
              <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          <div>
            <Button type="submit" isLoading={isLoading} className="w-full" size="lg">
              {flow === 'signIn' ? 'サインイン' : 'アカウント作成'}
            </Button>
          </div>

          <div className="text-center">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              onClick={() => setFlow(flow === 'signIn' ? 'signUp' : 'signIn')}
            >
              {flow === 'signIn'
                ? 'アカウントをお持ちでない方はこちら'
                : '既にアカウントをお持ちの方はこちら'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

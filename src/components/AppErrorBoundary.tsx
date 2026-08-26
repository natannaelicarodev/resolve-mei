import { Component } from 'react';
import type { ErrorInfo, PropsWithChildren, ReactNode } from 'react';

import { ErrorFallback } from './ErrorFallback';
import { logDevelopmentError } from '@/lib/errors';

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    logDevelopmentError('Unhandled render error', error, info.componentStack);
  }

  private readonly retry = (): void => {
    this.setState({ hasError: false });
  };

  override render(): ReactNode {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.retry} />;
    }

    return this.props.children;
  }
}

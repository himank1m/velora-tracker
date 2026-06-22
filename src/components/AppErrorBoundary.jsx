import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { recordHealthEvent } from '../lib/appHealth';

export default class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    recordHealthEvent({
      type: 'render-failure',
      message: error?.message || 'The interface could not be rendered.',
      context: { componentStack: info?.componentStack },
    });
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="fatal-error-page">
        <section className="fatal-error-card">
          <span><AlertTriangle size={26} /></span>
          <p className="eyebrow">Velora recovery</p>
          <h1>Something interrupted this screen</h1>
          <p>
            Your data has not been changed. Reload Velora Tracker to restore the
            workspace, or contact your administrator if the issue continues.
          </p>
          <button onClick={() => window.location.reload()}>
            <RefreshCw size={17} />
            Reload application
          </button>
        </section>
      </main>
    );
  }
}

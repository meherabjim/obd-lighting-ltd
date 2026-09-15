import { Component } from 'react';

/**
 * Without this, a single mistake anywhere renders a blank white page and there
 * is nothing to report. With it, the screen says what broke.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('Page error:', error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="crash">
        <div className="crash-card">
          <h1>Something on this page broke</h1>
          <p>The rest of the site still works — go back and try again. If it keeps
             happening, send this message on:</p>
          <pre>{String(this.state.error?.message || this.state.error)}</pre>
          <div className="crash-actions">
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Reload the page
            </button>
            <a className="btn btn-ghost" href="/">Back to home</a>
          </div>
        </div>
      </div>
    );
  }
}

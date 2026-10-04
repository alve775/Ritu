'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-heading">
      <div>
        <h1>Let’s try that again.</h1>
        <p>The planner could not display this screen. Your saved inputs are kept on this device.</p>
        <button className="button primary" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}

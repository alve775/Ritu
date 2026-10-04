import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">PAGE NOT FOUND</span>
        <h1>Let’s find your field.</h1>
        <p>This page doesn’t exist. Your saved farm is still available.</p>
        <Link className="button primary" href="/">
          Return to the planner →
        </Link>
      </div>
    </div>
  );
}

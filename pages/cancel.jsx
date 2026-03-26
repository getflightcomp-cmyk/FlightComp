import { useRouter } from 'next/router';

export default function Cancel() {
  const router = useRouter();

  return (
    <div className="error-screen">
      <div className="error-icon">↩️</div>
      <div className="error-title">Payment cancelled</div>
      <div className="error-sub">
        No charge was made. Your eligibility results are still saved —
        you can get your claim letter any time.
      </div>
      <button className="btn-retry" onClick={() => router.push('/')}>
        ← Back to my results
      </button>
    </div>
  );
}

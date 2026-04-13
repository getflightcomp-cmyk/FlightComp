import Head from 'next/head';
import Link from 'next/link';
import { blogPosts } from '../../lib/blogPosts';

export default function BlogIndex({ posts }) {
  return (
    <>
      <Head>
        <title>FlightComp Blog — Flight Compensation Guides & Tips</title>
        <meta name="description" content="Guides on EU261, UK261, Canada APPR, and Turkey SHY passenger rights. Learn how to claim flight compensation." />
      </Head>

      <div style={{ minHeight: '100dvh', background: 'var(--bg)', padding: '48px 16px 80px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>

          {/* Back */}
          <a href="/" style={{ color: 'var(--muted)', fontSize: 14, textDecoration: 'none', display: 'block', marginBottom: 32 }}>
            ← Back to FlightComp
          </a>

          {/* Header */}
          <h1 style={{ fontSize: 30, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
            Blog
          </h1>
          <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 40, lineHeight: 1.6 }}>
            Guides and tips on claiming flight compensation under EU261, UK261, Canada APPR, and Turkey SHY.
          </p>

          {/* Post list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {posts.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
                <article style={{
                  background: 'var(--surf2)', border: '1px solid var(--border)',
                  borderRadius: 12, padding: '24px 28px',
                  transition: 'border-color 0.15s',
                  cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'center' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      letterSpacing: '0.07em', color: 'var(--blue)',
                      background: 'rgba(59,130,246,.10)', borderRadius: 4,
                      padding: '2px 8px',
                    }}>
                      {post.category}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--dim)' }}>{post.readingTime}</span>
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px', lineHeight: 1.35 }}>
                    {post.title}
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, margin: '0 0 14px' }}>
                    {post.excerpt}
                  </p>
                  <div style={{ fontSize: 12, color: 'var(--dim)' }}>
                    {post.date} · {post.author}
                  </div>
                </article>
              </Link>
            ))}
          </div>

          {posts.length === 0 && (
            <p style={{ fontSize: 15, color: 'var(--muted)' }}>No posts yet. Check back soon.</p>
          )}

        </div>
      </div>
    </>
  );
}

export function getStaticProps() {
  const posts = blogPosts.map(({ slug, title, excerpt, date, author, category, readingTime }) => ({
    slug, title, excerpt, date, author, category, readingTime,
  }));
  return { props: { posts } };
}

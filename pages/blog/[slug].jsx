import Head from 'next/head';
import { blogPosts, getPostBySlug } from '../../lib/blogPosts';

// ── Minimal markdown renderer ─────────────────────────
// Supports: ## h2, ### h3, **bold**, - list items, blank lines = paragraph breaks
function renderMarkdown(md) {
  if (!md) return null;
  const blocks = md.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
  const elements = [];
  let listItems = [];

  function flushList(key) {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.75, marginBottom: 20, paddingLeft: 22 }}>
          {listItems.map((item, i) => (
            <li key={i} style={{ marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ul>
      );
      listItems = [];
    }
  }

  blocks.forEach((block, i) => {
    // Check if entire block is a list
    const lines = block.split('\n');
    const allList = lines.every(l => l.startsWith('- '));

    if (allList) {
      flushList(i);
      elements.push(
        <ul key={i} style={{ color: 'var(--muted)', fontSize: 15, lineHeight: 1.75, marginBottom: 20, paddingLeft: 22 }}>
          {lines.map((l, j) => (
            <li key={j} style={{ marginBottom: 4 }} dangerouslySetInnerHTML={{ __html: inlineFormat(l.slice(2)) }} />
          ))}
        </ul>
      );
    } else if (block.startsWith('### ')) {
      flushList(i);
      elements.push(
        <h3 key={i} style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginTop: 28, marginBottom: 8, lineHeight: 1.3 }}>
          {block.slice(4)}
        </h3>
      );
    } else if (block.startsWith('## ')) {
      flushList(i);
      elements.push(
        <h2 key={i} style={{ fontSize: 21, fontWeight: 700, color: 'var(--text)', marginTop: 36, marginBottom: 12, lineHeight: 1.3, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
          {block.slice(3)}
        </h2>
      );
    } else {
      flushList(i);
      elements.push(
        <p key={i} style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 20 }}
           dangerouslySetInnerHTML={{ __html: inlineFormat(block) }} />
      );
    }
  });

  return elements;
}

function inlineFormat(text) {
  // **bold** → <strong>
  return text.replace(/\*\*(.+?)\*\*/g, '<strong style="color:var(--text);font-weight:600">$1</strong>');
}
// ──────────────────────────────────────────────────────

export default function BlogPost({ post }) {
  if (!post) return null;

  const canonicalUrl = `https://getflightcomp.com/blog/${post.slug}`;

  return (
    <>
      <Head>
        <title>{post.title} | FlightComp</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.excerpt} />
        <link rel="canonical" href={canonicalUrl} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: post.title,
          description: post.excerpt,
          datePublished: post.date,
          author: { '@type': 'Organization', name: 'FlightComp' },
          publisher: { '@type': 'Organization', name: 'FlightComp', url: 'https://getflightcomp.com' },
        })}} />
      </Head>

      <div style={{ minHeight: '100dvh', background: 'var(--bg)', padding: '48px 16px 80px' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>

          {/* Back */}
          <a href="/blog" style={{ color: 'var(--muted)', fontSize: 14, textDecoration: 'none', display: 'block', marginBottom: 32 }}>
            ← Back to Blog
          </a>

          {/* Category + meta */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
              color: 'var(--blue)', background: 'rgba(59,130,246,.10)', borderRadius: 4, padding: '2px 8px',
            }}>
              {post.category}
            </span>
            <span style={{ fontSize: 12, color: 'var(--dim)' }}>{post.readingTime}</span>
            <span style={{ fontSize: 12, color: 'var(--dim)' }}>·</span>
            <span style={{ fontSize: 12, color: 'var(--dim)' }}>{post.date}</span>
          </div>

          {/* Title */}
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 16, lineHeight: 1.25 }}>
            {post.title}
          </h1>

          {/* Excerpt */}
          <p style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 32, borderBottom: '1px solid var(--border)', paddingBottom: 28 }}>
            {post.excerpt}
          </p>

          {/* Body */}
          <div>
            {renderMarkdown(post.content)}
          </div>

          {/* CTA */}
          <div style={{
            marginTop: 48, background: 'var(--surf2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '28px 28px',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--dim)', marginBottom: 10 }}>
              Check your eligibility
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 10, lineHeight: 1.3 }}>
              Find out in 2 minutes if you can claim
            </h3>
            <p style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 20 }}>
              Free eligibility check — no signup required. If you qualify, get your Flight Compensation Kit for $19 or let us handle everything for 25% (no win, no fee).
            </p>
            <a
              href="/"
              style={{
                display: 'inline-block', padding: '12px 24px',
                background: 'var(--blue)', color: '#fff',
                borderRadius: 'var(--rbtn)', fontSize: 15, fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Check my flight →
            </a>
          </div>

          {/* Footer nav */}
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <a href="/blog" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>← All posts</a>
            <a href="/" style={{ fontSize: 13, color: 'var(--muted)', textDecoration: 'none' }}>FlightComp →</a>
          </div>

        </div>
      </div>
    </>
  );
}

export function getStaticPaths() {
  const paths = blogPosts.map(p => ({ params: { slug: p.slug } }));
  return { paths, fallback: false };
}

export function getStaticProps({ params }) {
  const post = getPostBySlug(params.slug);
  if (!post) return { notFound: true };
  return { props: { post } };
}

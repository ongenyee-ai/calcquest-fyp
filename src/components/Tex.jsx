import katex from 'katex';
import 'katex/dist/katex.min.css';

/** Renders a LaTeX string with KaTeX. Bad LaTeX shows as red text, not a crash. */
export default function Tex({ tex, display = false, className = '' }) {
  const html = katex.renderToString(tex ?? '', { displayMode: display, throwOnError: false });
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

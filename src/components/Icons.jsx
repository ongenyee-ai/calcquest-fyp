/**
 * Pixel-art icons, drawn from small text bitmaps so they stay crisp at any
 * size and need no image files or icon library.
 *
 *   X = main colour (CSS `color` of the icon)
 *   o = highlight
 *   # = outline
 *   . = transparent
 */

const BITMAPS = {
  heart: [
    '.###...###.',
    '#XXX#.#XXX#',
    '#XooX#XXXX#',
    '#XoXXXXXXX#',
    '#XXXXXXXXX#',
    '.#XXXXXXX#.',
    '..#XXXXX#..',
    '...#XXX#...',
    '....#X#....',
    '.....#.....',
  ],
  star: [
    '.....#.....',
    '....#X#....',
    '....#X#....',
    '...#XXX#...',
    '####XoX####',
    '#XXXXoXXXX#',
    '.#XXXXXXX#.',
    '..#XXXXX#..',
    '..#XX#XX#..',
    '.#XX#.#XX#.',
    '.###...###.',
  ],
  flame: [
    '....#....',
    '...#X#...',
    '...#XX#..',
    '..#XXX#..',
    '.#XXXXX#.',
    '.#XXoXX#.',
    '#XXoooXX#',
    '#XXoooXX#',
    '#XXXoXXX#',
    '.#XXXXX#.',
    '..#####..',
  ],
  bolt: [
    '....####',
    '...#XX#.',
    '..#XX#..',
    '.#XX#...',
    '#XXXXXX#',
    '.####XX#',
    '...#XX#.',
    '..#XX#..',
    '.#X#....',
    '.##.....',
  ],
  lock: [
    '...###...',
    '..#...#..',
    '.#.....#.',
    '.#.....#.',
    '#########',
    '#XXXXXXX#',
    '#XXX#XXX#',
    '#XXX#XXX#',
    '#XXXXXXX#',
    '#########',
  ],
  bulb: [
    '..#####..',
    '.#XXXXX#.',
    '#XXooXXX#',
    '#XoXXXXX#',
    '#XXXXXXX#',
    '.#XXXXX#.',
    '..#XXX#..',
    '..#####..',
    '..#...#..',
    '...###...',
  ],
  check: [
    '.......##',
    '......#X#',
    '.....#X#.',
    '##..#X#..',
    '#X##X#...',
    '.#XX#....',
    '..##.....',
  ],
  arrowLeft: [
    '...#.....',
    '..##.....',
    '.#X######',
    '#XXXXXXX#',
    '.#X######',
    '..##.....',
    '...#.....',
  ],
};

function PixelIcon({ name, className = '', size }) {
  const rows = BITMAPS[name];
  const h = rows.length;
  const w = rows.at(0).length;
  const rects = [];
  rows.forEach((row, y) => {
    // Merge runs of the same character into one rect per run.
    let x = 0;
    while (x < w) {
      const ch = row.at(x);
      let end = x + 1;
      while (end < w && row.at(end) === ch) end++;
      if (ch !== '.') {
        const fill = ch === '#' ? 'var(--px-outline)' : ch === 'o' ? 'var(--px-shine)' : 'currentColor';
        rects.push(<rect key={`${x}-${y}`} x={x} y={y} width={end - x} height={1} fill={fill} />);
      }
      x = end;
    }
  });
  const style = size ? { width: size, height: (size * h) / w } : undefined;
  return (
    <svg
      className={`icon px-icon ${className}`}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      style={style}
      aria-hidden="true"
    >
      {rects}
    </svg>
  );
}

export const Heart = ({ filled = true }) => <PixelIcon name="heart" className={`heart ${filled ? 'is-full' : 'is-empty'}`} />;
export const Star = ({ filled = true, size }) => <PixelIcon name="star" size={size} className={`star ${filled ? 'is-full' : 'is-empty'}`} />;
export const Flame = () => <PixelIcon name="flame" className="flame" />;
export const Bolt = () => <PixelIcon name="bolt" className="bolt" />;
export const Lock = () => <PixelIcon name="lock" className="lock" />;
export const Bulb = () => <PixelIcon name="bulb" className="bulb" />;
export const Check = () => <PixelIcon name="check" className="check" />;
export const ArrowLeft = () => <PixelIcon name="arrowLeft" className="arrow" />;

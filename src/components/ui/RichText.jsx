import { Fragment } from 'react';

export function RichText({ value = '' }) {
  return value.split('\n').map((line, lineIndex) => (
    <Fragment key={`${lineIndex}-${line}`}>
      {line.split(/(\*[^*]+\*)/g).map((part, partIndex) => (
        part.startsWith('*') && part.endsWith('*') && part.length > 2
          ? <em key={partIndex}>{part.slice(1, -1)}</em>
          : <Fragment key={partIndex}>{part}</Fragment>
      ))}
      {lineIndex < value.split('\n').length - 1 ? <br /> : null}
    </Fragment>
  ));
}

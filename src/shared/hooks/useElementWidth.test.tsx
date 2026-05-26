/**
 * @vitest-environment happy-dom
 */
import { act, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useElementWidth } from './useElementWidth';

describe('useElementWidth', () => {
  let container: HTMLDivElement;
  let root: Root;
  let resizeCallback: ResizeObserverCallback | undefined;
  let observedElement: Element | undefined;

  beforeEach(() => {
    resizeCallback = undefined;
    observedElement = undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallback = callback;
        }
        observe(element: Element) {
          observedElement = element;
        }
        disconnect = vi.fn();
      },
    );
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it('returns undefined before ResizeObserver reports a width', () => {
    let width: number | undefined;

    function Probe() {
      const ref = useRef<HTMLDivElement>(null);
      width = useElementWidth(ref);
      return <div ref={ref} />;
    }

    act(() => {
      root.render(<Probe />);
    });

    expect(width).toBeUndefined();
    expect(observedElement).toBeDefined();
  });

  it('updates width when ResizeObserver fires', () => {
    const widths: Array<number | undefined> = [];

    function Probe() {
      const ref = useRef<HTMLDivElement>(null);
      const width = useElementWidth(ref);
      widths.push(width);
      return <div ref={ref} />;
    }

    act(() => {
      root.render(<Probe />);
    });

    act(() => {
      resizeCallback?.(
        [{ contentRect: { width: 240 } as DOMRectReadOnly } as ResizeObserverEntry],
        {} as ResizeObserver,
      );
    });

    expect(widths.at(-1)).toBe(240);
  });
});

import { useEffect, useRef } from 'react';
import echarts, { type ECOption } from './echarts-setup';

interface EChartsWrapperProps {
  option: ECOption;
  style?: React.CSSProperties;
}

export default function EChartsWrapper({ option, style }: EChartsWrapperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<ReturnType<typeof echarts.init> | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    instanceRef.current = echarts.init(containerRef.current, undefined, { renderer: 'svg' });

    const ro = new ResizeObserver(() => {
      instanceRef.current?.resize({ animation: { duration: 200 } });
    });
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      instanceRef.current?.dispose();
      instanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!instanceRef.current || !option) return;
    instanceRef.current.setOption(option, { notMerge: true });
  }, [option]);

  return <div ref={containerRef} style={{ width: '100%', height: '350px', ...style }} />;
}

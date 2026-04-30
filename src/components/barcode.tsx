"use client";

import * as React from "react";
import dynamic from "next/dynamic";

const ReactBarcode = dynamic(() => import("react-barcode"), {
  ssr: false,
  loading: () => (
    <div className="h-12 w-32 animate-pulse rounded bg-secondary" />
  ),
});

type BarcodeProps = {
  value: string;
  height?: number;
  width?: number;
  fontSize?: number;
  displayValue?: boolean;
  background?: string;
  lineColor?: string;
  format?: string;
  margin?: number;
};

export function Barcode({
  value,
  height = 40,
  width = 1.4,
  fontSize = 12,
  displayValue = true,
  background = "transparent",
  lineColor = "currentColor",
  format,
  margin = 0,
}: BarcodeProps) {
  if (!value) return null;
  return (
    <ReactBarcode
      value={value}
      height={height}
      width={width}
      fontSize={fontSize}
      displayValue={displayValue}
      background={background}
      lineColor={lineColor}
      format={format as never}
      margin={margin}
    />
  );
}

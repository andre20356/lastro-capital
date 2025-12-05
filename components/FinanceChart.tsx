import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Line, Rect, Text as SvgText, Defs, LinearGradient, Stop } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { Spacing, BorderRadius } from "@/constants/theme";

interface ChartDataPoint {
  label: string;
  borrowed: number;
  earned: number;
  overdue: number;
}

interface FinanceChartProps {
  data: ChartDataPoint[];
  theme: any;
}

export function FinanceChart({ data, theme }: FinanceChartProps) {
  const chartWidth = 300;
  const chartHeight = 200;
  const padding = 30;
  const innerWidth = chartWidth - padding * 2;
  const innerHeight = chartHeight - padding * 2;

  // Find max value for scaling, ensure it's not 0
  let maxValue = Math.max(
    ...data.flatMap((d) => [d.borrowed, d.earned, d.overdue])
  );
  
  // If maxValue is 0 or NaN, set a default value
  if (maxValue <= 0 || isNaN(maxValue)) {
    maxValue = 1;
  }

  // Calculate candlestick values
  const getCandleData = (index: number) => {
    const point = data[index];
    const open = point.borrowed;
    const close = point.earned;
    const low = point.overdue;
    const high = Math.max(open, close);
    
    return {
      open: isNaN(open) ? 0 : open,
      close: isNaN(close) ? 0 : close,
      low: isNaN(low) ? 0 : low,
      high: isNaN(high) ? 0 : high,
    };
  };

  const candleWidth = innerWidth / (data.length * 1.5);

  return (
    <View style={styles.container}>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#51CF66" }]} />
          <ThemedText style={[styles.legendText, { color: theme.secondaryText }]}>
            Receita
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#FF6B6B" }]} />
          <ThemedText style={[styles.legendText, { color: theme.secondaryText }]}>
            Emprestado
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#FFB400" }]} />
          <ThemedText style={[styles.legendText, { color: theme.secondaryText }]}>
            Atraso
          </ThemedText>
        </View>
      </View>

      <Svg width={chartWidth} height={chartHeight} style={styles.chart}>
        <Defs>
          <LinearGradient id="gridGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor={theme.tertiaryText} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={theme.tertiaryText} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <Line
            key={`hline-${i}`}
            x1={padding}
            y1={padding + (i * innerHeight) / 4}
            x2={chartWidth - padding}
            y2={padding + (i * innerHeight) / 4}
            stroke={theme.tertiaryText}
            strokeWidth="0.5"
            opacity="0.3"
          />
        ))}

        {/* X axis */}
        <Line
          x1={padding}
          y1={chartHeight - padding}
          x2={chartWidth - padding}
          y2={chartHeight - padding}
          stroke={theme.secondaryText}
          strokeWidth="1"
        />

        {/* Y axis */}
        <Line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={chartHeight - padding}
          stroke={theme.secondaryText}
          strokeWidth="1"
        />

        {/* Candlesticks */}
        {data.map((_, index) => {
          const cande = getCandleData(index);
          const x = padding + (index / (data.length - 1 || 1)) * innerWidth;
          
          // Calculate Y positions
          const highY = chartHeight - padding - (cande.high / maxValue) * innerHeight;
          const lowY = chartHeight - padding - (cande.low / maxValue) * innerHeight;
          const openY = chartHeight - padding - (cande.open / maxValue) * innerHeight;
          const closeY = chartHeight - padding - (cande.close / maxValue) * innerHeight;

          // Determine color based on close vs open
          const isGreen = cande.close >= cande.open;
          const bodyColor = isGreen ? "#51CF66" : "#FF6B6B";
          const wickColor = isGreen ? "#51CF66" : "#FF6B6B";

          // Body positions
          const bodyTop = Math.min(openY, closeY);
          const bodyBottom = Math.max(openY, closeY);
          const bodyHeight = Math.max(bodyBottom - bodyTop, 2);

          return (
            <g key={`candle-${index}`}>
              {/* Wick (high-low line) */}
              <Line
                x1={x}
                y1={highY}
                x2={x}
                y2={lowY}
                stroke={wickColor}
                strokeWidth="1"
                opacity="0.6"
              />

              {/* Body */}
              <Rect
                x={x - candleWidth / 2}
                y={bodyTop}
                width={candleWidth}
                height={bodyHeight}
                fill={bodyColor}
                stroke={bodyColor}
                strokeWidth="0.5"
                opacity="0.8"
              />
            </g>
          );
        })}

        {/* X axis labels */}
        {data.map((point, index) => {
          const x = padding + (index / (data.length - 1 || 1)) * innerWidth;
          return (
            <SvgText
              key={`label-${index}`}
              x={x}
              y={chartHeight - padding + 15}
              textAnchor="middle"
              fontSize="11"
              fill={theme.tertiaryText}
            >
              {point.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: Spacing.lg,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.lg,
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
  },
  chart: {
    alignSelf: "center",
  },
});

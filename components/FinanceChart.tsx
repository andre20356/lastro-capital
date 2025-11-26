import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Polyline, Circle, Text as SvgText, Line, Defs, LinearGradient, Stop, Polygon } from "react-native-svg";
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

  // Find max value for scaling
  const maxValue = Math.max(
    ...data.flatMap((d) => [d.borrowed, d.earned, d.overdue])
  );

  // Generate points for polylines
  const generatePoints = (values: number[]) => {
    return values
      .map((value, index) => {
        const x = padding + (index / (values.length - 1 || 1)) * innerWidth;
        const y = chartHeight - padding - (value / maxValue) * innerHeight;
        return `${x},${y}`;
      })
      .join(" ");
  };

  const borrowedPoints = generatePoints(data.map((d) => d.borrowed));
  const earnedPoints = generatePoints(data.map((d) => d.earned));
  const overduePoints = generatePoints(data.map((d) => d.overdue));

  return (
    <View style={styles.container}>
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#FF6B6B" }]} />
          <ThemedText style={[styles.legendText, { color: theme.secondaryText }]}>
            Emprestado
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#51CF66" }]} />
          <ThemedText style={[styles.legendText, { color: theme.secondaryText }]}>
            Rendimentos
          </ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#FF922B" }]} />
          <ThemedText style={[styles.legendText, { color: theme.secondaryText }]}>
            Negativados
          </ThemedText>
        </View>
      </View>

      <Svg width={chartWidth} height={chartHeight} style={styles.chart}>
        <Defs>
          <LinearGradient id="borrowedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FF6B6B" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#FF6B6B" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="earnedGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#51CF66" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#51CF66" stopOpacity="0" />
          </LinearGradient>
          <LinearGradient id="overdueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#FF922B" stopOpacity="0.3" />
            <Stop offset="100%" stopColor="#FF922B" stopOpacity="0" />
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

        {/* Earned area */}
        <Polyline
          points={earnedPoints}
          fill="none"
          stroke="#51CF66"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Overdue area */}
        <Polyline
          points={overduePoints}
          fill="none"
          stroke="#FF922B"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Borrowed area */}
        <Polyline
          points={borrowedPoints}
          fill="none"
          stroke="#FF6B6B"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points for borrowed */}
        {data.map((_, index) => {
          const x = padding + (index / (data.length - 1 || 1)) * innerWidth;
          const y =
            chartHeight - padding - (data[index].borrowed / maxValue) * innerHeight;
          return (
            <Circle
              key={`borrowed-point-${index}`}
              cx={x}
              cy={y}
              r="3"
              fill="#FF6B6B"
              stroke="#fff"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Data points for earned */}
        {data.map((_, index) => {
          const x = padding + (index / (data.length - 1 || 1)) * innerWidth;
          const y =
            chartHeight - padding - (data[index].earned / maxValue) * innerHeight;
          return (
            <Circle
              key={`earned-point-${index}`}
              cx={x}
              cy={y}
              r="3"
              fill="#51CF66"
              stroke="#fff"
              strokeWidth="1.5"
            />
          );
        })}

        {/* Data points for overdue */}
        {data.map((_, index) => {
          const x = padding + (index / (data.length - 1 || 1)) * innerWidth;
          const y =
            chartHeight - padding - (data[index].overdue / maxValue) * innerHeight;
          return (
            <Circle
              key={`overdue-point-${index}`}
              cx={x}
              cy={y}
              r="3"
              fill="#FF922B"
              stroke="#fff"
              strokeWidth="1.5"
            />
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

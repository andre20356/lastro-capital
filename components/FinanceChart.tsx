import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { G, Path, Text as SvgText } from "react-native-svg";
import { ThemedText } from "@/components/ThemedText";
import { Spacing } from "@/constants/theme";

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

function formatCurrency(value: number): string {
  if (isNaN(value) || value === undefined || value === null) {
    return "R$ 0,00";
  }
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function FinanceChart({ data, theme }: FinanceChartProps) {
  const chartSize = 200;
  const radius = 70;
  const centerX = chartSize / 2;
  const centerY = chartSize / 2;

  const latestData = data[data.length - 1] || { borrowed: 0, earned: 0, overdue: 0 };
  
  const borrowed = isNaN(latestData.borrowed) ? 0 : latestData.borrowed;
  const earned = isNaN(latestData.earned) ? 0 : latestData.earned;
  const overdue = isNaN(latestData.overdue) ? 0 : latestData.overdue;
  
  const total = borrowed + earned + overdue;

  const slices = [
    { value: borrowed, color: "#FF6B6B", label: "Emprestado" },
    { value: earned, color: "#51CF66", label: "Rendimentos" },
    { value: overdue, color: "#FF922B", label: "Negativados" },
  ];

  const createArcPath = (startAngle: number, endAngle: number, r: number) => {
    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);
    
    const x1 = centerX + r * Math.cos(startRad);
    const y1 = centerY + r * Math.sin(startRad);
    const x2 = centerX + r * Math.cos(endRad);
    const y2 = centerY + r * Math.sin(endRad);
    
    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
    
    return `M ${centerX} ${centerY} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
  };

  let currentAngle = 0;
  const paths = slices.map((slice, index) => {
    if (total === 0 || slice.value === 0) {
      return null;
    }
    
    const sliceAngle = (slice.value / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;
    currentAngle = endAngle;
    
    const path = createArcPath(startAngle, endAngle, radius);
    
    return (
      <Path
        key={index}
        d={path}
        fill={slice.color}
        stroke="#fff"
        strokeWidth="2"
      />
    );
  });

  const hasData = total > 0;

  return (
    <View style={styles.container}>
      <View style={styles.legendContainer}>
        {slices.map((slice, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: slice.color }]} />
            <ThemedText style={[styles.legendText, { color: theme.secondaryText }]}>
              {slice.label}
            </ThemedText>
          </View>
        ))}
      </View>

      <View style={styles.chartContainer}>
        <Svg width={chartSize} height={chartSize} style={styles.chart}>
          <G>
            {hasData ? (
              paths
            ) : (
              <Path
                d={createArcPath(0, 359.99, radius)}
                fill={theme.backgroundSecondary}
                stroke={theme.cardBorder}
                strokeWidth="1"
              />
            )}
          </G>
        </Svg>

        <View style={styles.valuesContainer}>
          {slices.map((slice, index) => {
            const percentage = total > 0 ? ((slice.value / total) * 100).toFixed(0) : "0";
            return (
              <View key={index} style={styles.valueRow}>
                <View style={[styles.valueIndicator, { backgroundColor: slice.color }]} />
                <ThemedText style={[styles.valueLabel, { color: theme.secondaryText }]}>
                  {slice.label}:
                </ThemedText>
                <ThemedText style={[styles.valueAmount, { color: slice.color }]}>
                  {formatCurrency(slice.value)}
                </ThemedText>
                <ThemedText style={[styles.valuePercentage, { color: theme.tertiaryText }]}>
                  ({percentage}%)
                </ThemedText>
              </View>
            );
          })}
        </View>
      </View>
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
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
  },
  chartContainer: {
    alignItems: "center",
  },
  chart: {
    alignSelf: "center",
  },
  valuesContainer: {
    marginTop: Spacing.lg,
    width: "100%",
    paddingHorizontal: Spacing.md,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  valueIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  valueLabel: {
    fontSize: 12,
    flex: 1,
  },
  valueAmount: {
    fontSize: 13,
    fontWeight: "600",
  },
  valuePercentage: {
    fontSize: 11,
    marginLeft: Spacing.xs,
  },
});

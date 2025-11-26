import React from "react";
import { StyleSheet, View } from "react-native";
import { ScreenScrollView } from "@/components/ScreenScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/useTheme";

export default function AboutScreen() {
  const { theme } = useTheme();

  const aboutText = `Sobre Nós – Lastro Capital

A Lastro Capital é um aplicativo desenvolvido para facilitar e modernizar o gerenciamento de cobranças. Criado para empreendedores, autônomos e empresas que precisam organizar seus recebimentos com praticidade, o app oferece uma solução completa para controle financeiro, acompanhamento de pagamentos e otimização do processo de cobrança.

Nosso objetivo é tornar a gestão de cobranças simples, eficiente e transparente. Através de uma interface intuitiva, o usuário consegue registrar clientes, criar cobranças, acompanhar valores pendentes, receber alertas automáticos e manter todo o fluxo financeiro organizado em um só lugar.

A Lastro Capital foi construída com foco em agilidade, segurança e precisão das informações, permitindo que cada usuário tenha controle total sobre suas movimentações financeiras e decisões de cobrança. Queremos ajudar você a reduzir atrasos, melhorar o fluxo de caixa e aumentar sua eficiência no dia a dia.

Aqui, tecnologia e gestão trabalham juntas para trazer mais profissionalismo, organização e resultados para o seu negócio.`;

  return (
    <ThemedView style={styles.container}>
      <ScreenScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.backgroundDefault, borderColor: theme.cardBorder },
          ]}
        >
          <ThemedText style={styles.title}>Sobre Nós</ThemedText>
          <ThemedText style={[styles.text, { color: theme.secondaryText }]}>
            {aboutText}
          </ThemedText>
        </View>
      </ScreenScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: Spacing.lg,
  },
  text: {
    fontSize: 16,
    lineHeight: 26,
  },
});

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { backgroundColor: "#F7FAFC", color: "#0A0F1A", padding: 32, fontSize: 10 },
  header: { backgroundColor: "#0A0F1A", borderRadius: 12, color: "#FFFFFF", padding: 20, marginBottom: 20 },
  brand: { fontSize: 9, textTransform: "uppercase", letterSpacing: 3, color: "#00C9A7", marginBottom: 6 },
  title: { fontSize: 20, fontWeight: 700, marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#8EA3B8" },
  section: { backgroundColor: "#FFFFFF", borderRadius: 10, padding: 16, marginBottom: 14 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginBottom: 10, color: "#0A0F1A" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "#EDF2F7" },
  label: { color: "#5B7087", flex: 1 },
  value: { fontWeight: 700, textAlign: "right" },
  valueGreen: { fontWeight: 700, color: "#00C9A7", textAlign: "right" },
  valueRed: { fontWeight: 700, color: "#FF6B6B", textAlign: "right" },
  tableHeader: { flexDirection: "row", backgroundColor: "#F0F4F8", padding: "6 8", borderRadius: 6, marginBottom: 4 },
  tableRow: { flexDirection: "row", padding: "5 8", borderBottomWidth: 1, borderBottomColor: "#EDF2F7" },
  col1: { flex: 1.5 },
  col2: { flex: 1 },
  col3: { flex: 1 },
  col4: { flex: 1.5 },
  col5: { flex: 1.5 },
  col6: { flex: 1 },
  footer: { marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#D9E2EC", color: "#5B7087", fontSize: 9, textAlign: "center" }
});

interface ReportData {
  date: string;
  summary: {
    totalTransactions: number;
    buyCount: number;
    sellCount: number;
    totalXafIn: number;
    totalXafOut: number;
    netXaf: number;
    totalMargin: number;
    manualIn: number;
    manualOut: number;
    caisseNet: number;
  };
  byCurrency: Array<{
    code: string; name: string;
    buyCount: number; sellCount: number;
    buyVolumeFx: number; sellVolumeFx: number;
    xafIn: number; xafOut: number; margin: number;
  }>;
  transactions: Array<{
    receiptNumber: string | null; type: string;
    currencyCode: string; amountGiven: number;
    amountReceived: number; rateUsed: number;
    clientName: string; agentName: string; createdAt: string;
  }>;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(n) + " XAF";

const fmtFx = (n: number, code: string) =>
  new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 2 }).format(n) + " " + code;

export function DailyReportDocument({ data }: { data: ReportData }) {
  const dateLabel = new Date(data.date).toLocaleDateString("fr-FR", {
    weekday: "long", year: "numeric", month: "long", day: "numeric"
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* En-tête */}
        <View style={styles.header}>
          <Text style={styles.brand}>ForexFlow Pro</Text>
          <Text style={styles.title}>Rapport de Clôture Journalière</Text>
          <Text style={styles.subtitle}>{dateLabel}</Text>
        </View>

        {/* Résumé */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Résumé de la journée</Text>
          {[
            ["Transactions totales", String(data.summary.totalTransactions)],
            ["Achats (BUY)", String(data.summary.buyCount)],
            ["Ventes (SELL)", String(data.summary.sellCount)],
            ["Entrées XAF (ventes)", fmt(data.summary.totalXafIn)],
            ["Sorties XAF (achats)", fmt(data.summary.totalXafOut)],
            ["Net XAF transactions", fmt(data.summary.netXaf)],
            ["Marge estimée", fmt(data.summary.totalMargin)],
            ["Mouvements manuels IN", fmt(data.summary.manualIn)],
            ["Mouvements manuels OUT", fmt(data.summary.manualOut)],
            ["Solde net de caisse", fmt(data.summary.caisseNet)]
          ].map(([label, value]) => (
            <View key={label} style={styles.row}>
              <Text style={styles.label}>{label}</Text>
              <Text style={styles.value}>{value}</Text>
            </View>
          ))}
        </View>

        {/* Par devise */}
        {data.byCurrency.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Détail par devise</Text>
            {data.byCurrency.map((curr) => (
              <View key={curr.code} style={{ marginBottom: 10 }}>
                <Text style={{ fontWeight: 700, marginBottom: 4 }}>{curr.code} — {curr.name}</Text>
                {[
                  ["Achats (FX reçu)", fmtFx(curr.buyVolumeFx, curr.code), "green"],
                  ["Ventes (FX donné)", fmtFx(curr.sellVolumeFx, curr.code), "red"],
                  ["XAF reçus (ventes)", fmt(curr.xafIn), "green"],
                  ["XAF donnés (achats)", fmt(curr.xafOut), "red"],
                  ["Marge estimée", fmt(curr.margin), "neutral"]
                ].map(([label, value, color]) => (
                  <View key={label} style={styles.row}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={color === "green" ? styles.valueGreen : color === "red" ? styles.valueRed : styles.value}>{value}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}

        {/* Liste des transactions */}
        {data.transactions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transactions du jour ({data.transactions.length})</Text>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Réf.</Text>
              <Text style={styles.col2}>Type</Text>
              <Text style={styles.col3}>Devise</Text>
              <Text style={styles.col4}>Donné</Text>
              <Text style={styles.col5}>Reçu</Text>
              <Text style={styles.col6}>Client</Text>
            </View>
            {data.transactions.map((tx, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.col1}>{tx.receiptNumber ?? "—"}</Text>
                <Text style={styles.col2}>{tx.type}</Text>
                <Text style={styles.col3}>{tx.currencyCode}</Text>
                <Text style={styles.col4}>{tx.amountGiven.toFixed(2)}</Text>
                <Text style={styles.col5}>{tx.amountReceived.toFixed(2)}</Text>
                <Text style={styles.col6}>{tx.clientName}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>
          ForexFlow Pro • Rapport généré le {new Date().toLocaleString("fr-FR")} • Document officiel de clôture
        </Text>
      </Page>
    </Document>
  );
}

import React from "react";
import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#F7FAFC",
    color: "#0A0F1A",
    padding: 20,
    fontSize: 9.5,
    fontFamily: "Helvetica"
  },
  header: {
    backgroundColor: "#0A0F1A",
    borderRadius: 12,
    color: "#FFFFFF",
    padding: 14,
    marginBottom: 12
  },
  brand: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 2,
    color: "#7DEDDC",
    marginBottom: 4
  },
  title: {
    fontSize: 18,
    fontWeight: 700
  },
  subtitle: {
    fontSize: 8.5,
    color: "#9CA3AF",
    marginTop: 2
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    marginBottom: 8,
    color: "#0A0F1A",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 5
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5
  },
  label: {
    color: "#5B7087"
  },
  value: {
    fontWeight: 700
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: "#0A0F1A"
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: "#0A0F1A"
  },
  totalValue: {
    fontSize: 13,
    fontWeight: 700,
    color: "#0A0F1A"
  },
  footer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#D9E2EC",
    color: "#5B7087",
    fontSize: 8
  },
  stampBox: {
    backgroundColor: "#F1F5F9",
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#00C9A7"
  }
});

export function SupplierInvoiceDocument({
  invoice,
  qrCodeDataUrl
}: {
  invoice: {
    invoiceNumber: string;
    date: string;
    supplierName: string;
    supplierContact?: string | null;
    currencyCode: string;
    currencyName: string;
    amount: number;
    unitPrice: number;
    totalCostXaf: number;
    receivedAmount?: number;
    note?: string | null;
    agentName: string;
  };
  qrCodeDataUrl?: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>ForexFlow Pro</Text>
          <Text style={styles.title}>Facture Fournisseur</Text>
          <Text style={styles.subtitle}>Achat de devises auprès d&apos;un fournisseur.</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>Facture</Text>
            <MiniRow label="N°" value={invoice.invoiceNumber} />
            <MiniRow label="Date" value={invoice.date} />
            <MiniRow label="Agent" value={invoice.agentName} />
          </View>

          <View style={[styles.section, { flex: 1 }]}>
            <Text style={styles.sectionTitle}>Fournisseur</Text>
            <MiniRow label="Nom" value={invoice.supplierName} />
            <MiniRow label="Contact" value={invoice.supplierContact ?? "-"} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achat</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
            <CompactItem label="Devise" value={`${invoice.currencyCode} - ${invoice.currencyName}`} />
            <CompactItem label="Quantité commandée" value={`${invoice.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${invoice.currencyCode}`} />
            <CompactItem label="Quantité reçue" value={`${(invoice.receivedAmount ?? invoice.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} ${invoice.currencyCode}`} />
            <CompactItem label="Prix unitaire" value={`${invoice.unitPrice.toFixed(4)} XAF / ${invoice.currencyCode}`} />
            <CompactItem label="Coût total" value={`${invoice.totalCostXaf.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} XAF`} />
            <CompactItem label="Note" value={invoice.note ?? "-"} />
          </View>
          {invoice.receivedAmount && invoice.receivedAmount !== invoice.amount && (
            <View style={[styles.stampBox, { marginTop: 6 }]}>
              <Text style={{ fontSize: 9, fontWeight: 700, color: "#B91C1C" }}>
                Écart fournisseur: {(invoice.amount - invoice.receivedAmount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {invoice.currencyCode}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.section, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
          <View style={{ maxWidth: 300 }}>
            <Text style={{ fontSize: 11, fontWeight: 700, marginBottom: 4 }}>Vérification</Text>
            <Text style={{ color: "#5B7087", lineHeight: 1.35, fontSize: 8.5 }}>
              QR de contrôle pour authentifier la facture.
            </Text>
          </View>
          {qrCodeDataUrl && <Image src={qrCodeDataUrl} style={{ width: 72, height: 72 }} />}
        </View>

        <View style={styles.stampBox}>
          <Text style={{ fontSize: 9, fontWeight: 700, color: "#059669", marginBottom: 2 }}>ACHAT CONFIRMÉ</Text>
          <Text style={{ fontSize: 8.5, color: "#64748B", lineHeight: 1.35 }}>
            Stock mis à jour et dette fournisseur calculée automatiquement.
          </Text>
        </View>

        <Text style={styles.footer}>
          ForexFlow Pro - Operations tresorerie - Douala, Cameroun
        </Text>
      </Page>
    </Document>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function CompactItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ width: "50%", paddingRight: 8, marginBottom: 6 }}>
      <Text style={{ fontSize: 7.5, color: "#5B7087", marginBottom: 2, textTransform: "uppercase" }}>{label}</Text>
      <Text style={{ fontSize: 9.2, fontWeight: 700, color: "#0A0F1A", lineHeight: 1.25 }}>{value}</Text>
    </View>
  );
}

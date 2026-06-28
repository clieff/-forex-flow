import React from "react";
import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#F7FAFC",
    color: "#0A0F1A",
    padding: 32,
    fontSize: 11,
    fontFamily: "Helvetica"
  },
  header: {
    backgroundColor: "#0A0F1A",
    borderRadius: 18,
    color: "#FFFFFF",
    padding: 20,
    marginBottom: 24
  },
  brand: {
    fontSize: 10,
    textTransform: "uppercase",
    letterSpacing: 3,
    color: "#7DEDDC",
    marginBottom: 8
  },
  title: {
    fontSize: 24,
    fontWeight: 700
  },
  subtitle: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 4
  },
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 12,
    color: "#0A0F1A",
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 8
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10
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
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#0A0F1A"
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0A0F1A"
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0A0F1A"
  },
  footer: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#D9E2EC",
    color: "#5B7087"
  },
  stampBox: {
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
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
          <Text style={styles.subtitle}>Document officiel d&apos;achat de devises aupres d&apos;un fournisseur.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations de la facture</Text>
          <View style={styles.row}>
            <Text style={styles.label}>N\u00B0 Facture</Text>
            <Text style={styles.value}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{invoice.date}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Traite par</Text>
            <Text style={styles.value}>{invoice.agentName}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations du fournisseur</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nom</Text>
            <Text style={styles.value}>{invoice.supplierName}</Text>
          </View>
          {invoice.supplierContact && (
            <View style={styles.row}>
              <Text style={styles.label}>Contact</Text>
              <Text style={styles.value}>{invoice.supplierContact}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details de l&apos;achat</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Devise</Text>
            <Text style={styles.value}>{invoice.currencyCode} - {invoice.currencyName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Montant commande</Text>
            <Text style={styles.value}>{invoice.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {invoice.currencyCode}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Montant recu</Text>
            <Text style={[styles.value, { color: invoice.receivedAmount && invoice.receivedAmount !== invoice.amount ? "#DC2626" : undefined }]}>
              {(invoice.receivedAmount ?? invoice.amount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {invoice.currencyCode}
            </Text>
          </View>
          {invoice.receivedAmount && invoice.receivedAmount !== invoice.amount && (
            <View style={styles.row}>
              <Text style={styles.label}>Ecart (dette fournisseur)</Text>
              <Text style={[styles.value, { color: "#DC2626" }]}>
                {(invoice.amount - invoice.receivedAmount).toLocaleString("fr-FR", { minimumFractionDigits: 2 })} {invoice.currencyCode}
              </Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Prix unitaire</Text>
            <Text style={styles.value}>{invoice.unitPrice.toFixed(4)} XAF / {invoice.currencyCode}</Text>
          </View>
          {invoice.note && (
            <View style={styles.row}>
              <Text style={styles.label}>Note / Reference</Text>
              <Text style={{ flex: 1, textAlign: "right", fontWeight: 500 }}>{invoice.note}</Text>
            </View>
          )}

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Cout total (XAF)</Text>
            <Text style={styles.totalValue}>{invoice.totalCostXaf.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} XAF</Text>
          </View>
        </View>

        <View style={[styles.section, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
          <View style={{ maxWidth: 340 }}>
            <Text style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Verification</Text>
            <Text style={{ color: "#5B7087", lineHeight: 1.6 }}>
              Ce document atteste de l&apos;achat de devises effectue aupres du fournisseur mentionne. Scannez le QR code pour verifier l&apos;authenticite.
            </Text>
          </View>
          {qrCodeDataUrl && <Image src={qrCodeDataUrl} style={{ width: 88, height: 88 }} />}
        </View>

        <View style={styles.stampBox}>
          <Text style={{ fontSize: 11, fontWeight: 700, color: "#059669", marginBottom: 4 }}>CONFIRMATION D&apos;ACHAT</Text>
          <Text style={{ fontSize: 10, color: "#64748B", lineHeight: 1.5 }}>
            Cette facture confirme la transaction d&apos;achat de devises. Le stock a ete mis a jour et la dette fournisseur calculee automatiquement.
          </Text>
        </View>

        <Text style={styles.footer}>
          ForexFlow Pro - Operations tresorerie - Douala, Cameroun
        </Text>
      </Page>
    </Document>
  );
}

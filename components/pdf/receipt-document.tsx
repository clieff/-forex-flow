import React from "react";
import { Document, Page, StyleSheet, Text, View, Image } from "@react-pdf/renderer";
import type { Currency, Transaction, User, Client } from "@prisma/client";

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#F7FAFC",
    color: "#0A0F1A",
    padding: 32,
    fontSize: 11
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
  section: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18
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
  footer: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#D9E2EC",
    color: "#5B7087"
  }
});

export function ReceiptDocument({
  transaction,
  qrCodeDataUrl
}: {
  transaction: Transaction & { 
    currency: Currency; 
    createdBy: User;
    client?: Client | null;
  };
  qrCodeDataUrl?: string;
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>ForexFlow Pro</Text>
          <Text style={styles.title}>Transaction Receipt</Text>
          <Text>Desk-level FX proof generated instantly.</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>N° Reçu</Text>
            <Text style={styles.value}>{transaction.receiptNumber ?? transaction.id.slice(0, 8)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>N° Agrément</Text>
            <Text style={styles.value}>EN-ATTENTE-DE-CONFIGURATION</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>{new Date(transaction.createdAt).toLocaleString("fr-FR")}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Client</Text>
            <Text style={styles.value}>{transaction.client?.name || transaction.clientName || "Walk-in"}</Text>
          </View>
          {transaction.client?.contact && (
            <View style={styles.row}>
              <Text style={styles.label}>Client Contact</Text>
              <Text style={styles.value}>{transaction.client.contact}</Text>
            </View>
          )}
          <View style={styles.row}>
            <Text style={styles.label}>Type</Text>
            <Text style={styles.value}>{transaction.type === "BUY" ? "ACHAT" : "VENTE"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Currency</Text>
            <Text style={styles.value}>{transaction.currency.code}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount Given</Text>
            <Text style={styles.value}>{Number(transaction.amountGiven).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Amount Received</Text>
            <Text style={styles.value}>{Number(transaction.amountReceived).toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Rate Used</Text>
            <Text style={styles.value}>{Number(transaction.rateUsed).toFixed(2)} XAF</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Processed By</Text>
            <Text style={styles.value}>{transaction.createdBy.name}</Text>
          </View>
        </View>

        <View style={[styles.section, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
          <View style={{ maxWidth: 340 }}>
            <Text style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Verification stamp</Text>
            <Text style={{ color: "#5B7087", lineHeight: 1.6 }}>
              Merci pour votre confiance. Ce document atteste de la transaction et peut etre archive par l'equipe finance.
              Scannez le QR code pour verifier l'authenticite.
            </Text>
          </View>
          {qrCodeDataUrl && <Image src={qrCodeDataUrl} style={{ width: 88, height: 88 }} />}
        </View>

        <Text style={styles.footer}>
          ForexFlow Pro • Internal treasury operations • Merci pour votre confiance
        </Text>
      </Page>
    </Document>
  );
}

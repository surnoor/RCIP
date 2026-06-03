import React from 'react';
import { Document, Page, Text, View, StyleSheet, renderToStream } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { 
    flexDirection: 'column', 
    padding: 40,
    fontFamily: 'Helvetica',
  },
  section: { 
    marginBottom: 10, 
  },
  text: { 
    fontSize: 11,
    lineHeight: 1.5,
    color: '#333333'
  }
});

const ResumeDocument = ({ content }: { content: string }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        {/* MVP: Simply rendering the text. For a full app, we would parse the markdown into react-pdf primitives. */}
        <Text style={styles.text}>{content}</Text>
      </View>
    </Page>
  </Document>
);

export async function generatePdfStream(markdownContent: string) {
  return await renderToStream(<ResumeDocument content={markdownContent} />);
}

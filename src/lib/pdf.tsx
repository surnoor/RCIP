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

export async function generatePdfBuffer(markdownContent: string): Promise<Buffer> {
  const stream = await renderToStream(<ResumeDocument content={markdownContent} />);
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

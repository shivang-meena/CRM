// // apps/client/src/invoices/InvoiceSignature.tsx
// import React from 'react';
// import { Image, Platform, StyleSheet, Text, View } from 'react-native';

// export default function InvoiceSignature({
//   signature,
//   name,
//   color = '#56627C',
// }: {
//   signature?: string;
//   name?: string;
//   color?: string;
// }) {
//   return (
//     <View style={styles.container}>
//       {signature ? (
//         Platform.OS === 'web' ? (
//           React.createElement('img', {
//             src: signature,
//             alt: 'Authorized signature',
//             width: 150,
//             height: 70,
//             style: { objectFit: 'contain', objectPosition: 'left center' },
//           })
//         ) : (
//           <Image
//             source={{ uri: signature }}
//             accessibilityLabel="Authorized signature"
//             resizeMode="contain"
//             style={styles.image}
//           />
//         )
//       ) : name ? (
//         <Text style={[styles.name, { color }]}>{name}</Text>
//       ) : null}
//       <Text style={[styles.caption, { color }]}>Authorized Signatory</Text>
//     </View>
//   );
// }
// const styles = StyleSheet.create({
//   container: { gap: 6, alignItems: 'flex-start', marginTop: 10 },
//   image: { width: 150, height: 70 },
//   name: { fontSize: 20, fontStyle: 'italic' },
//   caption: { fontSize: 11 },
// });



import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
 
export default function InvoiceSignature({
  signature,
  name,
  color = '#56627C',
}: {
  signature?: string;
  name?: string;
  color?: string;
}) {
  return (
    <View style={styles.container}>
      {signature ? (
        Platform.OS === 'web' ? (
          React.createElement('img', {
            src: signature,
            alt: 'Authorized signature',
            width: 150,
            height: 70,
            style: { objectFit: 'contain', objectPosition: 'left center' },
          })
        ) : (
          <Image
            source={{ uri: signature }}
            accessibilityLabel="Authorized signature"
            resizeMode="contain"
            style={styles.image}
          />
        )
      ) : name ? (
        <Text style={[styles.name, { color }]}>{name}</Text>
      ) : null}
      <Text style={[styles.caption, { color }]}>Authorized Signatory</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { gap: 6, alignItems: 'flex-start', marginTop: 10 },
  image: { width: 150, height: 70 },
  name: { fontSize: 20, fontStyle: 'italic' },
  caption: { fontSize: 11 },
});
 
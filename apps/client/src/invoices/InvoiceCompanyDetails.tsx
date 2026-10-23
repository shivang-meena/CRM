// // apps/client/src/invoices/InvoiceCompanyDetails.tsx
// import React from 'react';
// import { Image, Platform, StyleSheet, Text, View } from 'react-native';
// import type { InvoiceCompanyProfile } from '@/types/companyProfile';

// export default function InvoiceCompanyDetails({
//   profile,
// }: {
//   profile: InvoiceCompanyProfile;
// }) {
//   const location = [profile.city, profile.state, profile.country]
//     .filter(Boolean)
//     .join(', ');
//   const phone = [profile.dialCode, profile.contactNumber]
//     .filter(Boolean)
//     .join(' ');
//   const textColor = { color: profile.fontColor };

//   return (
//     <View style={styles.container}>
//       {profile.logo ? (
//         Platform.OS === 'web' ? (
//           React.createElement('img', {
//             src: profile.logo,
//             alt: `${profile.companyName} logo`,
//             width: 150,
//             height: 90,
//             style: {
//               objectFit: 'contain',
//               objectPosition: 'left center',
//               marginBottom: 8,
//             },
//           })
//         ) : (
//           <Image
//             source={{ uri: profile.logo }}
//             accessibilityLabel={`${profile.companyName} logo`}
//             style={styles.logo}
//             resizeMode="contain"
//           />
//         )
//       ) : null}
//       <Text style={[styles.name, { color: profile.themeColor }]}>
//         {profile.companyName}
//       </Text>
//       {profile.address ? (
//         <Text style={[styles.detail, textColor]}>{profile.address}</Text>
//       ) : null}
//       {location ? (
//         <Text style={[styles.detail, textColor]}>{location}</Text>
//       ) : null}
//       {phone ? (
//         <Text style={[styles.detail, textColor]}>Phone: {phone}</Text>
//       ) : null}
//       {profile.email ? (
//         <Text style={[styles.detail, textColor]}>Email: {profile.email}</Text>
//       ) : null}
//       {profile.gstNumber ? (
//         <Text style={[styles.detail, textColor]}>
//           GSTIN: {profile.gstNumber}
//         </Text>
//       ) : null}
//       {profile.businessCategory ? (
//         <Text style={[styles.detail, textColor]}>
//           {profile.businessCategory}
//         </Text>
//       ) : null}
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: { gap: 3, alignItems: 'flex-start' },
//   logo: { width: 150, height: 90, marginBottom: 8 },
//   name: { fontSize: 16, fontWeight: '800', marginBottom: 3 },
//   detail: { fontSize: 12, lineHeight: 18 },
// });

import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';
import type { InvoiceCompanyProfile } from '@/types/companyProfile';
 
export default function InvoiceCompanyDetails({
  profile,
}: {
  profile: InvoiceCompanyProfile;
}) {
  const location = [profile.city, profile.state, profile.country]
    .filter(Boolean)
    .join(', ');
  const phone = [profile.dialCode, profile.contactNumber]
    .filter(Boolean)
    .join(' ');
  const textColor = { color: profile.fontColor };
 
  return (
    <View style={styles.container}>
      {profile.logo ? (
        Platform.OS === 'web' ? (
          React.createElement('img', {
            src: profile.logo,
            alt: `${profile.companyName} logo`,
            width: 150,
            height: 90,
            style: {
              objectFit: 'contain',
              objectPosition: 'left center',
              marginBottom: 10,
            },
          })
        ) : (
          <Image
            source={{ uri: profile.logo }}
            accessibilityLabel={`${profile.companyName} logo`}
            style={styles.logo}
            resizeMode="contain"
          />
        )
      ) : null}
      <Text style={[styles.name, { color: profile.themeColor }]}>
        {profile.companyName}
      </Text>
      {profile.address ? (
        <Text style={[styles.detail, textColor]}>{profile.address}</Text>
      ) : null}
      {location ? (
        <Text style={[styles.detail, textColor]}>{location}</Text>
      ) : null}
      {phone ? (
        <Text style={[styles.detail, textColor]}>Phone: {phone}</Text>
      ) : null}
      {profile.email ? (
        <Text style={[styles.detail, textColor]}>Email: {profile.email}</Text>
      ) : null}
      {profile.gstNumber ? (
        <Text style={[styles.detail, textColor]}>
          GSTIN: {profile.gstNumber}
        </Text>
      ) : null}
      {profile.businessCategory ? (
        <Text style={[styles.detail, textColor, styles.category]}>
          {profile.businessCategory}
        </Text>
      ) : null}
    </View>
  );
}
 
// redesign: slightly larger company name, tighter tracking, calmer category line
const styles = StyleSheet.create({
  container: { gap: 3, alignItems: 'flex-start' },
  logo: { width: 150, height: 90, marginBottom: 10 },
  name: { fontSize: 18, fontWeight: '800', marginBottom: 4, letterSpacing: -0.3 },
  detail: { fontSize: 12.5, lineHeight: 19 },
  category: { opacity: 0.8, marginTop: 2 },
});
 
 
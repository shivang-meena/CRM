// // apps/client/src/invoices/invoiceBranding.ts
// import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
// import type { InvoiceCompanyProfile } from '@/types/companyProfile';

// export function invoiceBranding<
//   T extends Record<string, ViewStyle | TextStyle | ImageStyle>,
// >(base: T, profile?: InvoiceCompanyProfile | null): T {
//   if (!profile) return base;
//   const { themeColor, fontColor } = profile;
//   const channels = [1, 3, 5].map((offset) =>
//     parseInt(themeColor.slice(offset, offset + 2), 16),
//   );
//   const headerText =
//     channels[0] * 0.299 + channels[1] * 0.587 + channels[2] * 0.114 > 160
//       ? '#111827'
//       : '#FFFFFF';

//   return Object.fromEntries(
//     Object.entries(base).map(([name, style]) => [
//       name,
//       {
//         ...style,
//         ...('color' in style
//           ? {
//               color:
//                 name === 'itemTh'
//                   ? headerText
//                   : name.startsWith('grandTotal')
//                     ? themeColor
//                     : fontColor,
//             }
//           : {}),
//         ...(name === 'itemTableHeader' ||
//         name === 'divider' ||
//         name === 'docDivider'
//           ? { backgroundColor: themeColor }
//           : {}),
//       },
//     ]),
//   ) as T;
// }

import type { ImageStyle, TextStyle, ViewStyle } from 'react-native';
import type { InvoiceCompanyProfile } from '@/types/companyProfile';
 
export function invoiceBranding<
  T extends Record<string, ViewStyle | TextStyle | ImageStyle>,
>(base: T, profile?: InvoiceCompanyProfile | null): T {
  if (!profile) return base;
  const { themeColor, fontColor } = profile;
  const channels = [1, 3, 5].map((offset) =>
    parseInt(themeColor.slice(offset, offset + 2), 16),
  );
  const headerText =
    channels[0] * 0.299 + channels[1] * 0.587 + channels[2] * 0.114 > 160
      ? '#111827'
      : '#FFFFFF';
 
  return Object.fromEntries(
    Object.entries(base).map(([name, style]) => [
      name,
      {
        ...style,
        ...('color' in style
          ? {
              color:
                name === 'itemTh'
                  ? headerText
                  : name.startsWith('grandTotal')
                    ? themeColor
                    : fontColor,
            }
          : {}),
        ...(name === 'itemTableHeader' ||
        name === 'divider' ||
        name === 'docDivider'
          ? { backgroundColor: themeColor }
          : {}),
      },
    ]),
  ) as T;
}
 
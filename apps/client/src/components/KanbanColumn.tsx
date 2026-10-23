// // apps/client/src/components/KanbanColumn.tsx
// import React, { useEffect, useRef, useState } from 'react';
// import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import { colors } from '@/theme/colors';
// import { Lead, LeadStatus } from '@/types/lead';
// import { formatINR } from '@/utils/format';
// import { useLeadDnd } from '@/context/LeadDndContext';
// import LeadCard from './LeadCard';

// type Props = {
//   title: string;
//   statusKey: LeadStatus;
//   leads: Lead[];
//   maxHeight: number;
//   onOpen: (lead: Lead) => void;
//   onMenu: (lead: Lead) => void;
// };

// export default function KanbanColumn({ title, statusKey, leads, maxHeight, onOpen, onMenu }: Props) {
//   const dnd = useLeadDnd();
//   const [isOver, setIsOver] = useState(false);
//   const dragCounter = useRef(0);

//   useEffect(() => {
//     if (!dnd?.draggingLeadId) {
//       dragCounter.current = 0;
//       setIsOver(false);
//     }
//   }, [dnd?.draggingLeadId]);

//   const handleDragEnter = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     dragCounter.current += 1;
//     if (dragCounter.current === 1) {
//       setIsOver(true);
//     }
//   };

//   const handleDragLeave = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     dragCounter.current -= 1;
//     if (dragCounter.current <= 0) {
//       dragCounter.current = 0;
//       setIsOver(false);
//     }
//   };

//   const handleDragOver = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     e.dataTransfer.dropEffect = 'move';
//   };

//   const handleDrop = (e: React.DragEvent) => {
//     e.preventDefault();
//     e.stopPropagation();
//     dragCounter.current = 0;
//     setIsOver(false);
//     const leadId = e.dataTransfer?.getData('text/plain') || dnd?.draggingLeadId;
//     if (leadId) {
//       dnd?.dropLead(leadId, statusKey);
//     }
//   };

//   const total = leads.reduce((sum, l) => sum + l.estimatedAmount, 0);

//   const columnContent = (
//     <View style={[styles.col, isOver && styles.colOver]}>
//       <View style={[styles.head, isOver && styles.headOver]}>
//         <Text style={styles.title}>{title}</Text>
//         <View style={styles.pill}>
//           <Text style={styles.pillText}>{formatINR(total)}</Text>
//         </View>
//         <View style={{ flex: 1 }} />
//         <View style={[styles.count, isOver && styles.countOver]}>
//           <Text style={styles.countText}>{leads.length}</Text>
//         </View>
//       </View>
//       <ScrollView
//         style={{ maxHeight }}
//         contentContainerStyle={[
//           styles.list,
//           { minHeight: Math.min(maxHeight, 260) },
//           isOver && styles.listOver,
//         ]}
//       >
//         {leads.length === 0 ? (
//           <View style={[styles.emptyBox, isOver && styles.emptyBoxOver]}>
//             <Ionicons
//               name={isOver ? 'arrow-down-circle' : 'layers-outline'}
//               size={24}
//               color={isOver ? colors.primary : colors.muted}
//             />
//             <Text style={[styles.empty, isOver && styles.emptyOver]}>
//               {isOver ? `Drop lead here for ${title}` : 'No leads'}
//             </Text>
//           </View>
//         ) : (
//           <>
//             {leads.map((l) => (
//               <LeadCard key={l.id} lead={l} onOpen={() => onOpen(l)} onMenu={() => onMenu(l)} />
//             ))}
//             {isOver && (
//               <View style={styles.dropZonePlaceholder}>
//                 <Ionicons name="arrow-down-circle-outline" size={18} color={colors.primary} />
//                 <Text style={styles.dropZonePlaceholderText}>Drop to move to {title}</Text>
//               </View>
//             )}
//           </>
//         )}
//       </ScrollView>
//     </View>
//   );

//   if (Platform.OS === 'web') {
//     return (
//       <div
//         onDragEnter={handleDragEnter}
//         onDragLeave={handleDragLeave}
//         onDragOver={handleDragOver}
//         onDrop={handleDrop}
//         style={{
//           display: 'flex',
//           flexDirection: 'column',
//           height: '100%',
//         }}
//       >
//         {columnContent}
//       </div>
//     );
//   }

//   return columnContent;
// }

// const styles = StyleSheet.create({
//   col: {
//     width: 300,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: 'transparent',
//     transition: 'all 0.15s ease',
//   } as any,
//   colOver: {
//     borderColor: colors.primary,
//     backgroundColor: colors.primarySoft,
//   },
//   head: {
//     flexDirection: 'row', alignItems: 'center', gap: 8,
//     backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border,
//     borderBottomWidth: 3, borderBottomColor: colors.primary,
//     borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
//   },
//   headOver: {
//     backgroundColor: colors.primarySoft,
//     borderBottomColor: colors.primary,
//   },
//   title: { fontSize: 14, fontWeight: '800', color: colors.text },
//   pill: { backgroundColor: colors.primarySoft, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
//   pillText: { fontSize: 11, fontWeight: '700', color: colors.primaryText },
//   count: {
//     minWidth: 24, height: 24, borderRadius: 4, paddingHorizontal: 6,
//     backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
//   },
//   countOver: {
//     transform: [{ scale: 1.1 }],
//   },
//   countText: { fontSize: 12, fontWeight: '800', color: colors.white },
//   list: { paddingTop: 10, gap: 10 },
//   listOver: {
//     backgroundColor: colors.primarySoft,
//     borderRadius: 8,
//     padding: 6,
//   },
//   emptyBox: {
//     paddingVertical: 36,
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: 'transparent',
//   },
//   emptyBoxOver: {
//     backgroundColor: colors.primarySoft,
//     borderColor: colors.primary,
//     borderStyle: 'dashed',
//   },
//   empty: { textAlign: 'center', color: colors.muted, fontSize: 13, fontWeight: '500' },
//   emptyOver: { color: colors.primaryText, fontWeight: '700' },
//   dropZonePlaceholder: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     gap: 8,
//     paddingVertical: 12,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     borderWidth: 2,
//     borderColor: colors.primary,
//     borderStyle: 'dashed',
//     backgroundColor: colors.primarySoft,
//   },
//   dropZonePlaceholderText: {
//     fontSize: 12,
//     fontWeight: '700',
//     color: colors.primaryText,
//   },
// });


// apps/client/src/components/KanbanColumn.tsx
import React, { useEffect, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { Lead, LeadStatus } from '@/types/lead';
import { formatINR } from '@/utils/format';
import { useLeadDnd } from '@/context/LeadDndContext';
import LeadCard from './LeadCard';

type Props = {
  title: string;
  statusKey: LeadStatus;
  leads: Lead[];
  maxHeight: number;
  onOpen: (lead: Lead) => void;
  onMenu: (lead: Lead) => void;
};

// Approximate height of the column header + vertical padding, so the whole column
// (header + list) stays within `maxHeight` instead of the list alone.
const HEADER_HEIGHT = 56;
const COLUMN_PADDING = 10;

export default function KanbanColumn({ title, statusKey, leads, maxHeight, onOpen, onMenu }: Props) {
  const dnd = useLeadDnd();
  const [isOver, setIsOver] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (!dnd?.draggingLeadId) {
      dragCounter.current = 0;
      setIsOver(false);
    }
  }, [dnd?.draggingLeadId]);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) {
      setIsOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsOver(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsOver(false);
    const leadId = e.dataTransfer?.getData('text/plain') || dnd?.draggingLeadId;
    if (leadId) {
      dnd?.dropLead(leadId, statusKey);
    }
  };

  const total = leads.reduce((sum, l) => sum + (Number(l.estimatedAmount) || 0), 0);
  const listMaxHeight = Math.max(maxHeight - HEADER_HEIGHT - COLUMN_PADDING * 2, 160);

  const columnContent = (
    <View style={[styles.col, isOver && styles.colOver]}>
      <View style={styles.head}>
        <View style={styles.headTop}>
          <View style={styles.titleWrap}>
            <View style={[styles.dot, isOver && styles.dotOver]} />
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          </View>
          <View
            accessibilityLabel={`${leads.length} leads`}
            style={[styles.count, isOver && styles.countOver]}
          >
            <Text style={styles.countText}>{leads.length}</Text>
          </View>
        </View>
        <Text style={styles.total}>
          {formatINR(total)} <Text style={styles.totalLabel}>total value</Text>
        </Text>
      </View>

      <ScrollView
        style={{ maxHeight: listMaxHeight }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.list,
          { minHeight: Math.min(listMaxHeight, 220) },
        ]}
      >
        {leads.length === 0 ? (
          <View style={[styles.emptyBox, isOver && styles.emptyBoxOver]}>
            <Ionicons
              name={isOver ? 'arrow-down-circle' : 'layers-outline'}
              size={24}
              color={isOver ? colors.primary : colors.muted}
            />
            <Text style={[styles.empty, isOver && styles.emptyOver]}>
              {isOver ? `Drop lead here for ${title}` : 'No leads'}
            </Text>
          </View>
        ) : (
          <>
            {leads.map((l) => (
              <LeadCard key={l.id} lead={l} onOpen={() => onOpen(l)} onMenu={() => onMenu(l)} />
            ))}
            {isOver && (
              <View style={styles.dropZonePlaceholder}>
                <Ionicons name="arrow-down-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.dropZonePlaceholderText}>Drop to move to {title}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );

  if (Platform.OS === 'web') {
    return (
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {columnContent}
      </div>
    );
  }

  return columnContent;
}

const styles = StyleSheet.create({
  col: {
    width: 300,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: COLUMN_PADDING,
    backgroundColor: '#EEF3FA',
    transition: 'all 0.15s ease',
  } as any,
  colOver: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },

  head: { paddingHorizontal: 4, paddingBottom: 10, gap: 2 },
  headTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  titleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  dotOver: { transform: [{ scale: 1.3 }] },
  title: { flexShrink: 1, fontSize: 14, fontWeight: '800', color: colors.text },
  count: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countOver: { transform: [{ scale: 1.1 }] },
  countText: { fontSize: 12, fontWeight: '800', color: colors.white },
  total: { fontSize: 12, fontWeight: '700', color: colors.primaryText, marginLeft: 16 },
  totalLabel: { fontWeight: '500', color: colors.muted },

  list: { gap: 10 },

  emptyBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyBoxOver: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  empty: { textAlign: 'center', color: colors.muted, fontSize: 13, fontWeight: '500' },
  emptyOver: { color: colors.primaryText, fontWeight: '700' },
  dropZonePlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    backgroundColor: colors.primarySoft,
  },
  dropZonePlaceholderText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primaryText,
  },
});
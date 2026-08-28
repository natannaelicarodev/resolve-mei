import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { radii, spacing } from '@/theme';
import { Card } from './Card';
import { Text } from './Text';

export interface FormSectionProps extends PropsWithChildren {
  title: string;
  description?: string;
  icon?: ReactNode;
  testID?: string;
  compact?: boolean;
}

export function FormSection({
  children,
  title,
  description,
  icon,
  testID,
  compact = false,
}: FormSectionProps) {
  return (
    <Card
      style={[styles.section, compact && styles.sectionCompact]}
      testID={testID}
    >
      <View style={styles.header}>
        {icon}
        <View style={styles.copy}>
          <Text variant="cardTitle">{title}</Text>
          {description ? (
            <Text color="textSecondary" variant="caption">
              {description}
            </Text>
          ) : null}
        </View>
      </View>
      {children}
    </Card>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.md },
  sectionCompact: {
    borderRadius: radii.medium,
    gap: spacing.sm,
    padding: spacing.md,
  },
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  copy: { flex: 1, gap: spacing.xs, minWidth: 0 },
});

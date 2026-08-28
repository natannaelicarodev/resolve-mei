import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';
import { Card } from './Card';
import { Text } from './Text';

export interface FormSectionProps extends PropsWithChildren {
  title: string;
  description?: string;
  icon?: ReactNode;
  testID?: string;
}

export function FormSection({
  children,
  title,
  description,
  icon,
  testID,
}: FormSectionProps) {
  return (
    <Card style={styles.section} testID={testID}>
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
  header: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  copy: { flex: 1, gap: spacing.xs, minWidth: 0 },
});

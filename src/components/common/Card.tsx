import { View, ViewProps, StyleSheet, Pressable, PressableProps } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '@/theme';

interface CardProps extends ViewProps {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof spacing;
}

interface PressableCardProps extends Omit<PressableProps, 'style'> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: keyof typeof spacing;
  style?: ViewProps['style'];
}

export function Card({
  variant = 'default',
  padding = 4,
  style,
  children,
  ...props
}: CardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return [styles.elevated, shadows.md];
      case 'outlined':
        return styles.outlined;
      default:
        return [styles.default, shadows.sm];
    }
  };

  return (
    <View
      style={[
        styles.base,
        getVariantStyle(),
        { padding: spacing[padding] },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export function PressableCard({
  variant = 'default',
  padding = 4,
  style,
  children,
  ...props
}: PressableCardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return [styles.elevated, shadows.md];
      case 'outlined':
        return styles.outlined;
      default:
        return [styles.default, shadows.sm];
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        getVariantStyle(),
        { padding: spacing[padding] },
        pressed && styles.pressed,
        style,
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    backgroundColor: colors.surface.light,
  },
  default: {
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  elevated: {
    borderWidth: 0,
  },
  outlined: {
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  pressed: {
    opacity: 0.9,
    backgroundColor: colors.gray[50],
  },
});

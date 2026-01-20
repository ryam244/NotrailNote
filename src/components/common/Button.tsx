import {
  Pressable,
  PressableProps,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { colors, borderRadius, shadows, spacing, typography } from '@/theme';
import { Text } from './Text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const sizeStyles = {
  sm: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    fontSize: typography.fontSize.sm,
  },
  md: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    fontSize: typography.fontSize.body,
  },
  lg: {
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[6],
    fontSize: typography.fontSize.md,
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  children,
  leftIcon,
  rightIcon,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getBackgroundColor = (pressed: boolean) => {
    if (isDisabled) return colors.gray[200];

    switch (variant) {
      case 'primary':
        return pressed ? colors.primaryHover : colors.primary;
      case 'secondary':
        return pressed ? colors.gray[200] : colors.gray[100];
      case 'outline':
      case 'ghost':
        return pressed ? colors.primaryLight : colors.transparent;
      default:
        return colors.primary;
    }
  };

  const getTextColor = () => {
    if (isDisabled) return colors.gray[400];

    switch (variant) {
      case 'primary':
        return colors.text.inverse;
      case 'secondary':
        return colors.text.primary;
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return colors.text.inverse;
    }
  };

  const getBorderStyle = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 1,
        borderColor: isDisabled ? colors.gray[300] : colors.primary,
      };
    }
    return {};
  };

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: getBackgroundColor(pressed),
          paddingVertical: sizeStyles[size].paddingVertical,
          paddingHorizontal: sizeStyles[size].paddingHorizontal,
        },
        getBorderStyle(),
        variant === 'primary' && !isDisabled && shadows.primary,
        style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={getTextColor()} />
        ) : (
          <>
            {leftIcon && <View style={styles.iconLeft}>{leftIcon}</View>}
            <Text
              variant="bodyBold"
              style={[
                { color: getTextColor(), fontSize: sizeStyles[size].fontSize },
              ]}
            >
              {children}
            </Text>
            {rightIcon && <View style={styles.iconRight}>{rightIcon}</View>}
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing[2],
  },
  iconRight: {
    marginLeft: spacing[2],
  },
});

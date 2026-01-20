import { Pressable, PressableProps, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, borderRadius, spacing, icons } from '@/theme';

type IconButtonVariant = 'default' | 'primary' | 'ghost';
type IconButtonSize = 'sm' | 'md' | 'lg';

interface IconButtonProps extends Omit<PressableProps, 'children'> {
  name: keyof typeof Feather.glyphMap;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  color?: string;
}

const sizeMap: Record<IconButtonSize, { container: number; icon: number }> = {
  sm: { container: 32, icon: icons.size.sm },
  md: { container: 40, icon: icons.size.md },
  lg: { container: 48, icon: icons.size.lg },
};

export function IconButton({
  name,
  variant = 'default',
  size = 'md',
  color,
  disabled,
  style,
  ...props
}: IconButtonProps) {
  const getBackgroundColor = (pressed: boolean) => {
    if (disabled) return colors.transparent;

    switch (variant) {
      case 'primary':
        return pressed ? colors.primaryHover : colors.primary;
      case 'ghost':
        return pressed ? colors.gray[100] : colors.transparent;
      default:
        return pressed ? colors.gray[200] : colors.gray[100];
    }
  };

  const getIconColor = () => {
    if (color) return color;
    if (disabled) return colors.gray[300];

    switch (variant) {
      case 'primary':
        return colors.text.inverse;
      default:
        return colors.text.secondary;
    }
  };

  const dimensions = sizeMap[size];

  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          width: dimensions.container,
          height: dimensions.container,
          backgroundColor: getBackgroundColor(pressed),
        },
        style,
      ]}
      {...props}
    >
      <Feather
        name={name}
        size={dimensions.icon}
        color={getIconColor()}
        strokeWidth={icons.strokeWidth}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

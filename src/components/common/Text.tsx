import { Text as RNText, TextProps as RNTextProps, StyleSheet } from 'react-native';
import { colors, typography } from '@/theme';

type TextVariant = 'h1' | 'h2' | 'h3' | 'body' | 'bodyBold' | 'caption' | 'small' | 'micro';
type TextColor = 'primary' | 'secondary' | 'muted' | 'inverse' | 'brand' | 'error' | 'success';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: TextColor;
  children: React.ReactNode;
}

const colorMap: Record<TextColor, string> = {
  primary: colors.text.primary,
  secondary: colors.text.secondary,
  muted: colors.text.muted,
  inverse: colors.text.inverse,
  brand: colors.primary,
  error: colors.error,
  success: colors.success,
};

export function Text({
  variant = 'body',
  color = 'primary',
  style,
  children,
  ...props
}: TextProps) {
  const presetStyle = typography.presets[variant];

  return (
    <RNText
      style={[
        styles.base,
        {
          fontSize: presetStyle.fontSize,
          fontWeight: presetStyle.fontWeight,
          lineHeight: presetStyle.fontSize * presetStyle.lineHeight,
          letterSpacing: presetStyle.letterSpacing,
          color: colorMap[color],
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: typography.fontFamily.system,
  },
});

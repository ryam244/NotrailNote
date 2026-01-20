import { useState } from 'react';
import {
  TextInput,
  TextInputProps,
  View,
  StyleSheet,
  Pressable,
} from 'react-native';
import { colors, borderRadius, spacing, typography } from '@/theme';
import { Text } from './Text';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.primary;
    return colors.border.light;
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="caption" color="secondary" style={styles.label}>
          {label}
        </Text>
      )}
      <View
        style={[
          styles.inputContainer,
          { borderColor: getBorderColor() },
          isFocused && styles.focused,
          error && styles.errorBorder,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.text.muted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} style={styles.rightIcon}>
            {rightIcon}
          </Pressable>
        )}
      </View>
      {error && (
        <Text variant="small" color="error" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    marginBottom: spacing[1],
    marginLeft: spacing[1],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface.light,
    paddingHorizontal: spacing[3],
    minHeight: 48,
  },
  focused: {
    borderWidth: 2,
    paddingHorizontal: spacing[3] - 1,
  },
  errorBorder: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.body,
    color: colors.text.primary,
    paddingVertical: spacing[3],
  },
  leftIcon: {
    marginRight: spacing[2],
  },
  rightIcon: {
    marginLeft: spacing[2],
    padding: spacing[1],
  },
  error: {
    marginTop: spacing[1],
    marginLeft: spacing[1],
  },
});

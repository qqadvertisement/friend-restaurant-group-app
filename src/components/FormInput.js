import React from 'react';
import {
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { authStyles } from '../styles/authStyles';

export default function FormInput({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  showToggle = false,
  isVisible = false,
  onToggleVisibility,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  textContentType,
  returnKeyType = 'next',
}) {
  return (
    <View style={authStyles.inputGroup}>
      <Text style={authStyles.label}>{label}</Text>
      <View style={[authStyles.inputWrap, error ? authStyles.inputWrapError : null]}>
        <TextInput
          style={authStyles.input}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isVisible}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoComplete={autoComplete}
          textContentType={textContentType}
          placeholderTextColor="#9b8774"
          returnKeyType={returnKeyType}
        />
        {showToggle ? (
          <Pressable
            onPress={onToggleVisibility}
            style={authStyles.visibilityButton}
            accessibilityRole="button"
            accessibilityLabel={isVisible ? `Hide ${label}` : `Show ${label}`}
          >
            <Text style={authStyles.visibilityText}>{isVisible ? 'Hide' : 'Show'}</Text>
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={authStyles.errorText}>{error}</Text> : null}
    </View>
  );
}

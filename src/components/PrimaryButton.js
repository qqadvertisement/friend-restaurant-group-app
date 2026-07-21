import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
} from 'react-native';
import { authStyles } from '../styles/authStyles';

export default function PrimaryButton({ title, loading = false, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        authStyles.primaryButton,
        pressed && !loading ? authStyles.primaryButtonPressed : null,
        loading ? authStyles.primaryButtonLoading : null,
      ]}
      accessibilityRole="button"
    >
      {loading ? (
        <ActivityIndicator color="#fff8ef" />
      ) : (
        <Text style={authStyles.primaryButtonText}>{title}</Text>
      )}
    </Pressable>
  );
}

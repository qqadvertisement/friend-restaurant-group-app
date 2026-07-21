import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import {
  isSupabaseConfigured,
  supabase,
  supabaseConfigError,
} from '../lib/supabaseClient';
import { authStyles } from '../styles/authStyles';
import { isValidEmail } from '../utils/validation';

export default function SignUpScreen({ onAccountCreated, onShowLogin }) {
  const [accountName, setAccountName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  const validate = () => {
    const nextErrors = {};

    if (!accountName.trim()) {
      nextErrors.accountName = 'Enter an account name.';
    }

    if (!email.trim()) {
      nextErrors.email = 'Enter your email address.';
    } else if (!isValidEmail(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Create a password.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Confirm your password.';
    } else if (confirmPassword !== password) {
      nextErrors.confirmPassword = 'Passwords must match.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleCreateAccount = async () => {
    setMessage('');

    if (!validate()) {
      return;
    }

    if (!isSupabaseConfigured) {
      setMessageType('error');
      setMessage(supabaseConfigError);
      return;
    }

    setLoading(true);

    const trimmedAccountName = accountName.trim();
    const trimmedEmail = email.trim();

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: trimmedEmail,
      password,
      options: {
        data: {
          account_name: trimmedAccountName,
        },
      },
    });

    if (signUpError) {
      setLoading(false);
      setMessageType('error');
      setMessage(signUpError.message);
      return;
    }

    const newUser = signUpData.user;

    const { error: profileError } = await supabase.from('profiles').insert({
      id: newUser.id,
      account_name: trimmedAccountName,
      email: trimmedEmail,
      role: 'customer',
    });

    if (profileError) {
      setLoading(false);
      setMessageType('error');
      setMessage(
        'Account was created but the profile could not be saved. Please contact support.'
      );
      return;
    }

    if (signUpData.session) {
      await supabase.auth.signOut();
    }

    setLoading(false);
    onAccountCreated();
  };

  return (
    <KeyboardAvoidingView
      style={authStyles.keyboardShell}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={authStyles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={authStyles.brandBlockCompact}>
          <View style={authStyles.logoMark}>
            <Text style={authStyles.logoText}>FR</Text>
          </View>
          <Text style={authStyles.appName}>Friend Restaurant Group</Text>
        </View>

        <View style={authStyles.formCard}>
          <Text style={authStyles.screenTitle}>Create Account</Text>

          <FormInput
            label="Account Name"
            value={accountName}
            onChangeText={setAccountName}
            error={errors.accountName}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
          />

          <FormInput
            label="Email Address"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
          />

          <FormInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
            showToggle
            isVisible={showPasswords}
            onToggleVisibility={() => setShowPasswords((current) => !current)}
            autoComplete="new-password"
            textContentType="newPassword"
          />

          <FormInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            error={errors.confirmPassword}
            secureTextEntry
            showToggle
            isVisible={showPasswords}
            onToggleVisibility={() => setShowPasswords((current) => !current)}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="done"
          />

          <PrimaryButton
            title="Create Account"
            loading={loading}
            onPress={handleCreateAccount}
          />

          {message ? (
            <Text
              style={
                messageType === 'error'
                  ? authStyles.errorMessageText
                  : authStyles.successText
              }
            >
              {message}
            </Text>
          ) : null}

          <View style={authStyles.switchRow}>
            <Text style={authStyles.switchText}>Already have an account? </Text>
            <Pressable onPress={onShowLogin} accessibilityRole="button">
              <Text style={authStyles.switchLink}>Log In</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

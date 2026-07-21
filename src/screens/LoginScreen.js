import React, { useEffect, useState } from 'react';
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
import { isValidRole } from '../utils/roles';

export default function LoginScreen({ initialMessage = '', onShowSignUp, onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
      setMessageType('success');
    }
  }, [initialMessage]);

  const validate = () => {
    const nextErrors = {};
    const emailValue = email.trim();

    if (!emailValue) {
      nextErrors.email = 'Enter your email address.';
    } else if (!isValidEmail(emailValue)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (!password) {
      nextErrors.password = 'Enter your password.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
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

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setLoading(false);
      setMessageType('error');
      setMessage(
        'This account does not exist or the password is incorrect. Please create an account.'
      );
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('account_name, email, role')
      .eq('id', authData.user.id)
      .maybeSingle();

    setLoading(false);

    if (profileError) {
      console.error('Failed to load profile:', profileError);
      setMessageType('error');
      setMessage('Something went wrong loading your account. Please try again.');
      return;
    }

    if (!profile) {
      setMessageType('error');
      setMessage('Your account profile could not be found.');
      return;
    }

    if (!isValidRole(profile.role)) {
      setMessageType('error');
      setMessage('Your account role could not be verified. Please contact support.');
      return;
    }

    onLoginSuccess(profile);
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
        <View style={authStyles.brandBlock}>
          <View style={authStyles.logoMark}>
            <Text style={authStyles.logoText}>FR</Text>
          </View>
          <Text style={authStyles.appName}>Friend Restaurant Group</Text>
          <Text style={authStyles.subtitle}>Welcome back to your table.</Text>
        </View>

        <View style={authStyles.formCard}>
          <Text style={authStyles.screenTitle}>Log In</Text>

          <FormInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            autoComplete="email"
            textContentType="username"
            keyboardType="email-address"
          />

          <FormInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            secureTextEntry
            showToggle
            isVisible={showPassword}
            onToggleVisibility={() => setShowPassword((current) => !current)}
            autoComplete="password"
            textContentType="password"
            returnKeyType="done"
          />

          <PrimaryButton title="Log In" loading={loading} onPress={handleLogin} />

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
            <Text style={authStyles.switchText}>Don't have an account? </Text>
            <Pressable onPress={onShowSignUp} accessibilityRole="button">
              <Text style={authStyles.switchLink}>Sign Up</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

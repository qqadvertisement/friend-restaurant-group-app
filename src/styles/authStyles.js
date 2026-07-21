import { StyleSheet } from 'react-native';

export const colors = {
  cream: '#fff8ef',
  linen: '#f6eadb',
  ink: '#2c2118',
  muted: '#7c6755',
  herb: '#3d6b4f',
  herbDark: '#2c513b',
  tomato: '#b94735',
  saffron: '#e3a53c',
  white: '#ffffff',
};

export const authStyles = StyleSheet.create({
  appShell: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  keyboardShell: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 28,
  },
  brandBlock: {
    alignItems: 'center',
    marginBottom: 30,
  },
  brandBlockCompact: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoMark: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.herb,
    borderWidth: 4,
    borderColor: colors.saffron,
    marginBottom: 14,
  },
  logoText: {
    color: colors.cream,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0,
  },
  appName: {
    color: colors.ink,
    fontSize: 27,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 22,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 22,
    elevation: 4,
  },
  screenTitle: {
    color: colors.ink,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    letterSpacing: 0,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  inputWrap: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#dfcfc0',
    borderRadius: 16,
    backgroundColor: '#fffdf9',
    paddingHorizontal: 14,
  },
  inputWrapError: {
    borderColor: colors.tomato,
  },
  input: {
    flex: 1,
    color: colors.ink,
    fontSize: 16,
    minHeight: 52,
    paddingVertical: 12,
  },
  visibilityButton: {
    justifyContent: 'center',
    minHeight: 44,
    paddingLeft: 12,
  },
  visibilityText: {
    color: colors.herb,
    fontSize: 14,
    fontWeight: '800',
  },
  errorText: {
    color: colors.tomato,
    fontSize: 13,
    marginTop: 7,
  },
  primaryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.herb,
    marginTop: 4,
  },
  primaryButtonPressed: {
    backgroundColor: colors.herbDark,
  },
  primaryButtonLoading: {
    opacity: 0.82,
  },
  primaryButtonText: {
    color: colors.cream,
    fontSize: 16,
    fontWeight: '800',
  },
  successText: {
    color: colors.herbDark,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
  errorMessageText: {
    color: colors.tomato,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 14,
    textAlign: 'center',
  },
  switchRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 22,
  },
  switchText: {
    color: colors.muted,
    fontSize: 15,
  },
  switchLink: {
    color: colors.tomato,
    fontSize: 15,
    fontWeight: '800',
  },
});

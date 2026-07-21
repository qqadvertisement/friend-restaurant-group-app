import React, { useEffect, useState } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import AdminHomeScreen from './src/screens/AdminHomeScreen';
import EmployeeHomeScreen from './src/screens/EmployeeHomeScreen';
import CustomerHomeScreen from './src/screens/CustomerHomeScreen';
import { supabase } from './src/lib/supabaseClient';
import { authStyles } from './src/styles/authStyles';
import { isValidRole } from './src/utils/roles';

export default function App() {
  const [screen, setScreen] = useState('login');
  const [loginNotice, setLoginNotice] = useState('');
  const [profile, setProfile] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      if (!supabase) {
        setCheckingSession(false);
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        setCheckingSession(false);
        return;
      }

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('account_name, email, role')
        .eq('id', user.id)
        .maybeSingle();

      if (existingProfile && isValidRole(existingProfile.role)) {
        setProfile(existingProfile);
        setScreen(existingProfile.role);
      }

      setCheckingSession(false);
    };

    restoreSession();
  }, []);

  const showLogin = (notice = '') => {
    setProfile(null);
    setLoginNotice(notice);
    setScreen('login');
  };

  const showSignUp = () => {
    setLoginNotice('');
    setScreen('signup');
  };

  const handleLoginSuccess = (loadedProfile) => {
    setProfile(loadedProfile);
    setScreen(loadedProfile.role);
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    showLogin();
  };

  if (checkingSession) {
    return <SafeAreaView style={authStyles.appShell} />;
  }

  return (
    <SafeAreaView style={authStyles.appShell}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff8ef" />
      {screen === 'login' && (
        <LoginScreen
          initialMessage={loginNotice}
          onShowSignUp={showSignUp}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      {screen === 'signup' && (
        <SignUpScreen
          onShowLogin={() => showLogin()}
          onAccountCreated={() => showLogin('Account created successfully. Please log in.')}
        />
      )}
      {screen === 'admin' && (
        <AdminHomeScreen accountName={profile?.account_name} onLogout={handleLogout} />
      )}
      {screen === 'employee' && (
        <EmployeeHomeScreen accountName={profile?.account_name} onLogout={handleLogout} />
      )}
      {screen === 'customer' && (
        <CustomerHomeScreen accountName={profile?.account_name} onLogout={handleLogout} />
      )}
    </SafeAreaView>
  );
}

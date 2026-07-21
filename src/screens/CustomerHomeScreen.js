import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../lib/supabaseClient';
import { authStyles } from '../styles/authStyles';

const RESTAURANTS = [
  { id: 'ramen', label: 'Ramen' },
  { id: 'sushi', label: 'Sushi' },
  { id: 'thai', label: 'Thai Food' },
];

export default function CustomerHomeScreen({ accountName, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [pointBalance, setPointBalance] = useState(null);
  const [pointBalanceFailed, setPointBalanceFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadPointBalance = async () => {
      if (!supabase) {
        return;
      }

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData.session?.user;

      if (!user) {
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('point_balance')
        .eq('id', user.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error || !profile) {
        if (error) {
          console.error('Failed to load point balance:', error);
        }
        setPointBalanceFailed(true);
        return;
      }

      setPointBalance(profile.point_balance ?? 0);
    };

    loadPointBalance();

    return () => {
      isMounted = false;
    };
  }, []);

  const pointBalanceText = pointBalanceFailed
    ? 'Unable to load point balance.'
    : pointBalance === null
    ? 'Loading point balance...'
    : `Current Point Balance: ${pointBalance}`;

  const handleSelectRestaurant = (restaurant) => {
    setDropdownOpen(false);
    setSelectedRestaurant(restaurant);
  };

  const handleBack = () => {
    setSelectedRestaurant(null);
  };

  if (selectedRestaurant) {
    return (
      <ScrollView contentContainerStyle={authStyles.scrollContent}>
        <View style={authStyles.formCard}>
          <Text style={authStyles.screenTitle}>
            Here is the {selectedRestaurant.label} restaurant page.
          </Text>
          <PrimaryButton title="Back" onPress={handleBack} />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent}>
      <View style={authStyles.formCard}>
        <Text style={authStyles.screenTitle}>Welcome, {accountName}</Text>

        <Text style={authStyles.successText}>{pointBalanceText}</Text>

        <Text style={authStyles.label}>Restaurant</Text>
        <Pressable
          style={authStyles.inputWrap}
          onPress={() => setDropdownOpen((current) => !current)}
          accessibilityRole="button"
        >
          <Text style={authStyles.input}>Select a restaurant</Text>
        </Pressable>

        {dropdownOpen
          ? RESTAURANTS.map((restaurant) => (
              <Pressable
                key={restaurant.id}
                onPress={() => handleSelectRestaurant(restaurant)}
                accessibilityRole="button"
                style={authStyles.inputWrap}
              >
                <Text style={authStyles.input}>{restaurant.label}</Text>
              </Pressable>
            ))
          : null}

        <PrimaryButton title="Logout" onPress={onLogout} />
      </View>
    </ScrollView>
  );
}

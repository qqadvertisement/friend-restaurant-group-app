import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../lib/supabaseClient';
import { authStyles } from '../styles/authStyles';
import RestaurantHomeScreen from './RestaurantHomeScreen';
import RestaurantMenuScreen from './RestaurantMenuScreen';
import RestaurantNewsScreen from './RestaurantNewsScreen';
import RestaurantRewardsScreen from './RestaurantRewardsScreen';

export default function CustomerHomeScreen({ accountName, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(true);
  const [restaurantsFailed, setRestaurantsFailed] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantPage, setRestaurantPage] = useState(null);
  const [showRedeemHistory, setShowRedeemHistory] = useState(false);
  const [redeemHistory, setRedeemHistory] = useState([]);
  const [redeemHistoryLoading, setRedeemHistoryLoading] = useState(false);
  const [redeemHistoryFailed, setRedeemHistoryFailed] = useState(false);
  const [pointBalance, setPointBalance] = useState(null);
  const [pointBalanceFailed, setPointBalanceFailed] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadRestaurants = async () => {
      setRestaurantsLoading(true);
      setRestaurantsFailed(false);

      if (!supabase) {
        if (isMounted) {
          setRestaurantsLoading(false);
          setRestaurantsFailed(true);
        }
        return;
      }

      const { data, error } = await supabase
        .from('restaurants')
        .select('id, name')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (!isMounted) {
        return;
      }

      setRestaurantsLoading(false);

      if (error) {
        console.error('Failed to load restaurants:', error);
        setRestaurantsFailed(true);
        return;
      }

      setRestaurants(data ?? []);
    };

    loadRestaurants();

    return () => {
      isMounted = false;
    };
  }, []);

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

  useEffect(() => {
    if (!showRedeemHistory) {
      return;
    }

    let isMounted = true;

    const loadRedeemHistory = async () => {
      setRedeemHistoryLoading(true);
      setRedeemHistoryFailed(false);

      if (!supabase) {
        if (isMounted) {
          setRedeemHistoryLoading(false);
          setRedeemHistoryFailed(true);
        }
        return;
      }

      const { data, error } = await supabase
        .from('redeemhistory')
        .select(
          'id, restaurant_id, restaurant, item_name, points_spent, balance_after, redeemed_at'
        )
        .order('redeemed_at', { ascending: false });

      if (!isMounted) {
        return;
      }

      setRedeemHistoryLoading(false);

      if (error) {
        console.error('Failed to load redeem history:', error);
        setRedeemHistoryFailed(true);
        return;
      }

      setRedeemHistory(data ?? []);
    };

    loadRedeemHistory();

    return () => {
      isMounted = false;
    };
  }, [showRedeemHistory]);

  const pointBalanceText = pointBalanceFailed
    ? 'Unable to load point balance.'
    : pointBalance === null
    ? 'Loading point balance...'
    : `Current Point Balance: ${pointBalance}`;

  const handleSelectRestaurant = (restaurant) => {
    setDropdownOpen(false);
    setRestaurantPage(null);
    setSelectedRestaurant(restaurant);
  };

  const handleBack = () => {
    if (showRedeemHistory) {
      setShowRedeemHistory(false);
      return;
    }

    if (restaurantPage) {
      setRestaurantPage(null);
      return;
    }

    setSelectedRestaurant(null);
  };

  const formatRedeemedAt = (redeemedAt) => new Date(redeemedAt).toLocaleString();

  if (showRedeemHistory) {
    return (
      <ScrollView contentContainerStyle={authStyles.scrollContent}>
        <View style={authStyles.formCard}>
          <Text style={authStyles.screenTitle}>Redeem History</Text>
          {redeemHistoryLoading ? (
            <Text style={authStyles.successText}>Loading redeem history...</Text>
          ) : redeemHistoryFailed ? (
            <Text style={authStyles.errorMessageText}>Unable to load redeem history.</Text>
          ) : redeemHistory.length === 0 ? (
            <Text style={authStyles.successText}>No redeem history yet.</Text>
          ) : (
            redeemHistory.map((entry) => (
              <View key={entry.id} style={authStyles.inputWrap}>
                <View>
                  <Text style={authStyles.label}>{entry.restaurant}</Text>
                  <Text style={authStyles.successText}>{entry.item_name}</Text>
                  <Text style={authStyles.successText}>Points spent: {entry.points_spent}</Text>
                  <Text style={authStyles.successText}>Balance after: {entry.balance_after}</Text>
                  <Text style={authStyles.successText}>
                    Redeemed: {formatRedeemedAt(entry.redeemed_at)}
                  </Text>
                </View>
              </View>
            ))
          )}
          <PrimaryButton title="Back" onPress={handleBack} />
        </View>
      </ScrollView>
    );
  }

  if (selectedRestaurant && restaurantPage === 'menu') {
    return (
      <RestaurantMenuScreen
        restaurantId={selectedRestaurant.id}
        restaurantName={selectedRestaurant.name}
        onBack={handleBack}
      />
    );
  }

  if (selectedRestaurant && restaurantPage === 'redeem') {
    return (
      <RestaurantRewardsScreen
        restaurantId={selectedRestaurant.id}
        restaurantName={selectedRestaurant.name}
        onPointBalanceChange={setPointBalance}
        onBack={handleBack}
      />
    );
  }

  if (selectedRestaurant && restaurantPage === 'news') {
    return (
      <RestaurantNewsScreen
        restaurantId={selectedRestaurant.id}
        restaurantName={selectedRestaurant.name}
        onBack={handleBack}
      />
    );
  }

  if (selectedRestaurant) {
    return (
      <RestaurantHomeScreen
        restaurantId={selectedRestaurant.id}
        restaurantName={selectedRestaurant.name}
        onOpenMenu={() => setRestaurantPage('menu')}
        onOpenRewards={() => setRestaurantPage('redeem')}
        onOpenNews={() => setRestaurantPage('news')}
        onBack={handleBack}
      />
    );
  }

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent}>
      <View style={authStyles.formCard}>
        <Text style={authStyles.screenTitle}>Welcome, {accountName}</Text>

        <Text style={authStyles.successText}>{pointBalanceText}</Text>

        <PrimaryButton title="Redeem History" onPress={() => setShowRedeemHistory(true)} />

        <Text style={authStyles.label}>Restaurant</Text>
        {restaurantsLoading ? (
          <Text style={authStyles.successText}>Loading restaurants...</Text>
        ) : restaurantsFailed ? (
          <Text style={authStyles.errorMessageText}>Unable to load restaurants.</Text>
        ) : restaurants.length === 0 ? (
          <Text style={authStyles.successText}>No active restaurants are available.</Text>
        ) : (
          <>
            <Pressable
              style={authStyles.inputWrap}
              onPress={() => setDropdownOpen((current) => !current)}
              accessibilityRole="button"
            >
              <Text style={authStyles.input}>Select a restaurant</Text>
            </Pressable>

            {dropdownOpen
              ? restaurants.map((restaurant) => (
                  <Pressable
                    key={restaurant.id}
                    onPress={() => handleSelectRestaurant(restaurant)}
                    accessibilityRole="button"
                    style={authStyles.inputWrap}
                  >
                    <Text style={authStyles.input}>{restaurant.name}</Text>
                  </Pressable>
                ))
              : null}
          </>
        )}

        <PrimaryButton title="Logout" onPress={onLogout} />
      </View>
    </ScrollView>
  );
}

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

const RAMEN_PAGES = {
  menu: {
    title: 'Ramen Menu',
    message: 'Here is the Ramen menu page.',
  },
  news: {
    title: 'Ramen Restaurant News',
    message: 'Here is the Ramen news page.',
  },
};

export default function CustomerHomeScreen({ accountName, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [ramenPage, setRamenPage] = useState(null);
  const [ramenRewards, setRamenRewards] = useState([]);
  const [ramenRewardsLoading, setRamenRewardsLoading] = useState(false);
  const [ramenRewardsFailed, setRamenRewardsFailed] = useState(false);
  const [redeemingRewardId, setRedeemingRewardId] = useState(null);
  const [redeemMessage, setRedeemMessage] = useState('');
  const [showRedeemHistory, setShowRedeemHistory] = useState(false);
  const [redeemHistory, setRedeemHistory] = useState([]);
  const [redeemHistoryLoading, setRedeemHistoryLoading] = useState(false);
  const [redeemHistoryFailed, setRedeemHistoryFailed] = useState(false);
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

  useEffect(() => {
    if (ramenPage !== 'redeem') {
      return;
    }

    let isMounted = true;

    const loadRamenRewards = async () => {
      setRamenRewardsLoading(true);
      setRamenRewardsFailed(false);

      if (!supabase) {
        if (isMounted) {
          setRamenRewardsLoading(false);
          setRamenRewardsFailed(true);
        }
        return;
      }

      const { data, error } = await supabase
        .from('rewards')
        .select('id, item_name, points_required')
        .eq('restaurant', 'Ramen')
        .eq('is_active', true);

      if (!isMounted) {
        return;
      }

      setRamenRewardsLoading(false);

      if (error) {
        console.error('Failed to load Ramen rewards:', error);
        setRamenRewardsFailed(true);
        return;
      }

      setRamenRewards(data ?? []);
    };

    loadRamenRewards();

    return () => {
      isMounted = false;
    };
  }, [ramenPage]);

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
        .select('id, restaurant, item_name, points_spent, balance_after, redeemed_at')
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
    setSelectedRestaurant(restaurant);
  };

  const handleBack = () => {
    if (showRedeemHistory) {
      setShowRedeemHistory(false);
      return;
    }

    if (ramenPage) {
      setRamenPage(null);
      return;
    }

    setSelectedRestaurant(null);
  };

  const formatRedeemedAt = (redeemedAt) => new Date(redeemedAt).toLocaleString();

  const handleOpenRamenRedeem = () => {
    setRedeemMessage('');
    setRamenPage('redeem');
  };

  const handleRedeem = async (reward) => {
    if (redeemingRewardId || !supabase) {
      return;
    }

    setRedeemingRewardId(reward.id);
    setRedeemMessage('');

    try {
      const { data, error } = await supabase.rpc('redeem_reward', {
        p_reward_id: reward.id,
      });

      if (error) {
        console.error('Failed to redeem reward:', error);
        setRedeemMessage('Unable to redeem reward. Please try again.');
        return;
      }

      if (data?.success === true) {
        setPointBalance(data.new_balance);
        setRedeemMessage(`Redeem ${reward.item_name} success`);
        return;
      }

      const failureMessage = data?.message || 'Unable to redeem reward. Please try again.';
      setRedeemMessage(
        /insufficient|not (?:have )?enough/i.test(failureMessage)
          ? "Redeem fail. You don't have enough points."
          : failureMessage
      );
    } catch (error) {
      console.error('Failed to redeem reward:', error);
      setRedeemMessage('Unable to redeem reward. Please try again.');
    } finally {
      setRedeemingRewardId(null);
    }
  };

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

  if (ramenPage === 'redeem') {
    return (
      <ScrollView contentContainerStyle={authStyles.scrollContent}>
        <View style={authStyles.formCard}>
          <Text style={authStyles.screenTitle}>Ramen Redeem</Text>
          {ramenRewardsLoading ? (
            <Text style={authStyles.successText}>Loading rewards...</Text>
          ) : ramenRewardsFailed ? (
            <Text style={authStyles.errorMessageText}>Unable to load rewards.</Text>
          ) : ramenRewards.length === 0 ? (
            <Text style={authStyles.successText}>No Ramen rewards available.</Text>
          ) : (
            ramenRewards.map((reward) => (
              <View key={reward.id} style={authStyles.inputWrap}>
                <View>
                  <Text style={authStyles.label}>{reward.item_name}</Text>
                  <Text style={authStyles.successText}>{reward.points_required} points</Text>
                  <PrimaryButton
                    title="Redeem"
                    loading={redeemingRewardId === reward.id}
                    onPress={() => handleRedeem(reward)}
                  />
                </View>
              </View>
            ))
          )}
          {redeemMessage ? <Text style={authStyles.successText}>{redeemMessage}</Text> : null}
          <PrimaryButton title="Back" onPress={handleBack} />
          <PrimaryButton title="Logout" onPress={onLogout} />
        </View>
      </ScrollView>
    );
  }

  if (ramenPage) {
    return (
      <ScrollView contentContainerStyle={authStyles.scrollContent}>
        <View style={authStyles.formCard}>
          <Text style={authStyles.screenTitle}>{RAMEN_PAGES[ramenPage].title}</Text>
          <Text style={authStyles.successText}>{RAMEN_PAGES[ramenPage].message}</Text>
          <PrimaryButton title="Back" onPress={handleBack} />
        </View>
      </ScrollView>
    );
  }

  if (selectedRestaurant?.id === 'ramen') {
    return (
      <ScrollView contentContainerStyle={authStyles.scrollContent}>
        <View style={authStyles.formCard}>
          <Text style={authStyles.screenTitle}>Ramen</Text>
          <PrimaryButton title="View Menu" onPress={() => setRamenPage('menu')} />
          <PrimaryButton title="Redeem" onPress={handleOpenRamenRedeem} />
          <PrimaryButton title="Restaurant News" onPress={() => setRamenPage('news')} />
          <PrimaryButton title="Back" onPress={handleBack} />
          <PrimaryButton title="Logout" onPress={onLogout} />
        </View>
      </ScrollView>
    );
  }

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

        <PrimaryButton title="Redeem History" onPress={() => setShowRedeemHistory(true)} />

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

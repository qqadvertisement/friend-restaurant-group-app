import React, { useEffect, useState } from 'react';
import { Image, ScrollView, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { supabase } from '../lib/supabaseClient';
import { authStyles } from '../styles/authStyles';

const REWARD_IMAGES_BUCKET = 'reward-images';

function RewardImage({ imageUrl, itemName }) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <View
        style={authStyles.rewardImagePlaceholder}
        accessibilityLabel={`${itemName} reward image unavailable`}
      >
        <Text style={authStyles.rewardImagePlaceholderText}>Image unavailable</Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={authStyles.rewardImage}
      resizeMode="contain"
      onError={() => setFailed(true)}
      accessibilityLabel={`${itemName} reward`}
    />
  );
}

export default function RestaurantRewardsScreen({
  restaurantId,
  restaurantName,
  onPointBalanceChange,
  onBack,
}) {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [redeemingRewardId, setRedeemingRewardId] = useState(null);
  const [redeemMessage, setRedeemMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadRewards = async () => {
      setLoading(true);
      setFailed(false);
      setRewards([]);

      if (!supabase || restaurantId == null) {
        if (isMounted) {
          setLoading(false);
          setFailed(true);
        }
        return;
      }

      const { data, error } = await supabase
        .from('rewards')
        .select('id, restaurant_id, item_name, points_required, image_path, is_active')
        .eq('restaurant_id', restaurantId)
        .eq('is_active', true);

      if (!isMounted) {
        return;
      }

      setLoading(false);

      if (error) {
        console.error(`Failed to load rewards for ${restaurantName}:`, error);
        setFailed(true);
        return;
      }

      const rewardsWithImageUrls = (data ?? []).map((reward) => {
        if (!reward.image_path) {
          return { ...reward, imageUrl: null };
        }

        const { data: publicUrlData } = supabase.storage
          .from(REWARD_IMAGES_BUCKET)
          .getPublicUrl(reward.image_path);

        return {
          ...reward,
          imageUrl: publicUrlData?.publicUrl ?? null,
        };
      });

      setRewards(rewardsWithImageUrls);
    };

    loadRewards();

    return () => {
      isMounted = false;
    };
  }, [restaurantId, restaurantName]);

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
        onPointBalanceChange(data.new_balance);
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

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent}>
      <View style={authStyles.formCard}>
        <Text style={authStyles.screenTitle}>{restaurantName} Redeem</Text>

        {loading ? (
          <Text style={authStyles.successText}>Loading rewards...</Text>
        ) : failed ? (
          <Text style={authStyles.errorMessageText}>Unable to load rewards.</Text>
        ) : rewards.length === 0 ? (
          <Text style={authStyles.successText}>
            No rewards are available for {restaurantName}.
          </Text>
        ) : (
          rewards.map((reward) => (
            <View key={reward.id} style={authStyles.rewardCard}>
              <View style={authStyles.rewardImageArea}>
                <RewardImage imageUrl={reward.imageUrl} itemName={reward.item_name} />
              </View>
              <View style={authStyles.rewardCardContent}>
                <Text style={authStyles.rewardItemName}>{reward.item_name}</Text>
                <Text style={authStyles.rewardPoints}>{reward.points_required} points</Text>
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
        <PrimaryButton title="Back" onPress={onBack} />
      </View>
    </ScrollView>
  );
}

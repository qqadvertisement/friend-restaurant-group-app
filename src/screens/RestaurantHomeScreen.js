import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { authStyles } from '../styles/authStyles';

export default function RestaurantHomeScreen({
  restaurantId,
  restaurantName,
  onOpenMenu,
  onOpenRewards,
  onOpenNews,
  onBack,
}) {
  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent}>
      <View style={authStyles.formCard} testID={`restaurant-${restaurantId}-home`}>
        <Text style={authStyles.screenTitle}>{restaurantName}</Text>
        <PrimaryButton title="View Menu" onPress={onOpenMenu} />
        <PrimaryButton title="Redeem" onPress={onOpenRewards} />
        <PrimaryButton title="Restaurant News" onPress={onOpenNews} />
        <PrimaryButton title="Back" onPress={onBack} />
      </View>
    </ScrollView>
  );
}

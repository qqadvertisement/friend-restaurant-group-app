import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import { authStyles } from '../styles/authStyles';

export default function EmployeeHomeScreen({ accountName, onLogout }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState('');

  const handleSearch = () => {
    setSearchResult('Customer search is not connected yet.');
  };

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent}>
      <View style={authStyles.formCard}>
        <Text style={authStyles.screenTitle}>Welcome, {accountName}</Text>

        <Text style={authStyles.label}>Restaurant</Text>
        <Text style={authStyles.successText}>Not selected</Text>

        <FormInput
          label="Search Customer Account"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />

        <PrimaryButton title="Search" onPress={handleSearch} />

        {searchResult ? <Text style={authStyles.successText}>{searchResult}</Text> : null}

        <PrimaryButton title="Logout" onPress={onLogout} />
      </View>
    </ScrollView>
  );
}

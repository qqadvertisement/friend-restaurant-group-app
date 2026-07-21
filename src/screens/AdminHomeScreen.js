import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import PrimaryButton from '../components/PrimaryButton';
import { authStyles } from '../styles/authStyles';

const PANEL_MESSAGES = {
  customers: 'Manage Customers is not available yet.',
  employees: 'Manage Employees is not available yet.',
  analysis: 'App Analysis Report is not available yet.',
};

export default function AdminHomeScreen({ accountName, onLogout }) {
  const [activePanel, setActivePanel] = useState(null);

  return (
    <ScrollView contentContainerStyle={authStyles.scrollContent}>
      <View style={authStyles.formCard}>
        <Text style={authStyles.screenTitle}>Welcome, {accountName}</Text>

        <PrimaryButton title="Manage Customers" onPress={() => setActivePanel('customers')} />
        <PrimaryButton title="Manage Employees" onPress={() => setActivePanel('employees')} />
        <PrimaryButton title="App Analysis Report" onPress={() => setActivePanel('analysis')} />

        {activePanel ? (
          <Text style={authStyles.successText}>{PANEL_MESSAGES[activePanel]}</Text>
        ) : null}

        <PrimaryButton title="Logout" onPress={onLogout} />
      </View>
    </ScrollView>
  );
}

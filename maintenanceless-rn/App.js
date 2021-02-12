import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { StyleSheet, Text, SafeAreaView } from 'react-native';
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { library } from "@fortawesome/fontawesome-svg-core";
import { faHammer } from "@fortawesome/free-solid-svg-icons";

import Header from './components/Header';
import LoginForm from './components/LoginForm'

library.add(faHammer);

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <Header title="Maintenanceless" icon="hammer" iconSize={40} />
      <LoginForm />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

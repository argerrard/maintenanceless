import React from "react";
import { View, Text } from "react-native";
import { useSelector } from 'react-redux';

import { selectEmail, selectToken } from '../../slices/authSlice';

const HomeScreen = () => {
  const email = useSelector(selectEmail);
  const token = useSelector(selectToken);
  return (
    <View>
      <Text>{email}</Text>
      <Text>{token}</Text>
    </View>
  );
};

export default HomeScreen;
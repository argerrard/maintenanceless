import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesomeIcon } from '@fortawesome/react-native-fontawesome'


const Header = ({ title, icon, iconSize }) => {
  return (
    <View style={styles.headerContainer}>
      <FontAwesomeIcon style={styles.icon} icon={icon} size={iconSize} />
      <Text style={styles.text}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    marginRight: 15
  },
  text: {
    fontSize: 32,
    flex: 0
  }
});


export default Header;
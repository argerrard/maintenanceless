import React, { useState } from "react";
import { SafeAreaView, View, Text, TextInput, StyleSheet, Button } from "react-native";
import { useDispatch } from 'react-redux';
import { StackActions } from "@react-navigation/native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { Formik } from "formik";
import axios from "axios";

import Header from "../../components/Header";
import { API_URL } from "@env";
import { login } from '../../slices/authSlice';

const LoginScreen = ({ navigation }) => {
  const [errorMessage, setErrorMessage] = useState("");
  const dispatch = useDispatch();

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Maintenanceless" icon="hammer" iconSize={40} />
      <Formik
        initialValues={{
          email: "",
          password: ""
        }}
        onSubmit={async values => {
          try {
            const result = await axios.post(API_URL + "/auth/login", {
              email: values.email,
              password: values.password
            });
            setErrorMessage('');
            dispatch(login(values.email, result.data.token));
            navigation.dispatch(
              StackActions.replace("Home")
            );
          } catch (err) {
            if (err?.response?.data?.error) {
              setErrorMessage(err.response.data.error);
            } else {
              setErrorMessage("There was a problem signing you in.");
            }
          }
        }}
      >
        {({ handleChange, handleBlur, handleSubmit, values }) => (
          <View style={styles.formContainer}>
            <TextInput
              style={styles.inputField}
              autoCapitalize="none"
              onChangeText={handleChange("email")}
              value={values.email}
            />
            <TextInput
              style={styles.inputField}
              autoCapitalize="none"
              onChangeText={handleChange("password")}
              value={values.password}
            />
            <Button onPress={handleSubmit} title="Log In" />
            <Text>{errorMessage}</Text>
          </View>
        )}
      </Formik>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  formContainer: {
    width: "80%",
    marginTop: 10
  },
  inputField: {
    borderColor: "black",
    borderWidth: 1,
    borderStyle: "solid",
    height: 30,
    fontSize: 20,
    marginTop: 15
  }
});

export default LoginScreen;
